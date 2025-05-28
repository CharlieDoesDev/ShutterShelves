// start.js
const fs            = require("fs");
const crypto        = require("crypto");
const readlineSync  = require("readline-sync");
const path          = require("path");

// 1) Prompt hidden
const password = readlineSync.question("Decrypt password: ", {
  hideEchoBack: true
}).trim();

// 2) Read blob
const blob = fs.readFileSync(path.resolve(__dirname, "config.env.enc"));
// 3) Extract salt, nonce, ciphertext
const salt = blob.slice(0, 16);
const nonce= blob.slice(16, 28);
const ct   = blob.slice(28);

// 4) Derive key (must match Python)
const key = crypto.pbkdf2Sync(
  password, salt, 200_000, 32, "sha256"
);

// 5) Decrypt with AES-GCM
let envPlain;
try {
  envPlain = crypto
    .createDecipheriv("aes-256-gcm", key, nonce)
    .setAuthTag(ct.slice(-16))  // last 16B is tag
    .update(ct.slice(0, -16), null, "utf8")
    + crypto.createDecipheriv("aes-256-gcm", key, nonce)
      .final("utf8");
} catch (e) {
  console.error("❌ Decryption failed—bad password or data corrupted.");
  process.exit(1);
}

// 6) Parse lines into process.env
envPlain.split(/\r?\n/)
  .filter(line => line && !line.startsWith("#"))
  .forEach(line => {
    let [k,v] = line.split("=",2);
    process.env[k.trim()] = v.trim();
  });

// 7) Finally, hand off to your real server entrypoint:
require("./server.js");
