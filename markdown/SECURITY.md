# Frontend Security Architecture

## Overview
This project implements a "Zero-Server" security architecture designed to protect static assets without a backend. It uses a combination of AES-256-GCM encryption, key splitting (Secret Sharing), and WebAssembly obfuscation.

## Architecture

### 1. Build Process
- **Tooling**: Vite + Rollup
- **Obfuscation**: `javascript-obfuscator` applies control flow flattening and string array encryption.
- **Encryption**: `scripts/encrypt-assets.mjs` encrypts the `index.html` entry point.

### 2. Encryption Scheme
- **Algorithm**: AES-256-GCM (Authenticated Encryption).
- **Key Generation**: A random 32-byte key is generated at build time.
- **Key Splitting**: The key ($K$) is split into 3 parts ($A, B, C$) using XOR:
  $$ C = K \oplus A \oplus B $$
  - **Part A**: Injected into CSS Custom Properties (`--k-part-a`).
  - **Part B**: Hidden in the trailing bytes of `assets/key-carrier.png` (Steganography).
  - **Part C**: Served via a Service Worker (`sw.js`) constant.

### 3. Runtime Decryption
The `security-loader.js`:
1.  Extracts Part A from CSS.
2.  Fetches Part B from the image file.
3.  Requests Part C from the Service Worker via MessageChannel.
4.  Recombines the key: $K = A \oplus B \oplus C$.
5.  Decrypts the payload using Web Crypto API.
6.  Replaces the document content with the decrypted HTML.

### 4. Anti-Debugging
- **Debugger Trap**: Recursive debugger calls.
- **Console**: Cleared periodically.
- **DevTools Detection**: Monitors window dimension changes and time drift.

## Build & Deploy
```bash
# Install dependencies
npm install

# Build (Produce dist/)
npm run build

# Verify
npm run test:e2e
```

## Security Matrix
| Attack Vector | Defense | Effectiveness |
|---------------|---------|---------------|
| Static Analysis | Obfuscation + WASM | High |
| Network Sniffing | TLS + Encrypted Payload | Medium (Key parts are separate) |
| DevTools Inspection | Anti-Debug Script | Medium |
| XSS | CSP + Safe DOM APIs | High |
