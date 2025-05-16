#!/usr/bin/env bash
set -euo pipefail

# Decrypts the encrypted env file into .env.production
# Expects DECRYPT_PASSPHRASE to be defined in the environment

if [[ -z "${DECRYPT_PASSPHRASE:-}" ]]; then
  echo "ERROR: DECRYPT_PASSPHRASE is not set" >&2
  exit 1
fi

# Make sure the secrets file exists
if [[ ! -f "secrets/env.production.enc" ]]; then
  echo "ERROR: secrets/env.production.enc not found" >&2
  exit 1
fi

# Decrypt with AES-256-CBC using PBKDF2
openssl enc -pbkdf2 -salt \
  -in secrets/env.production.enc \
  -out .env.production \
  -pass pass:"${DECRYPT_PASSPHRASE}"

echo ".env.production has been created."
