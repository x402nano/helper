# @x402nano/helper

[![x402](https://img.shields.io/badge/protocol-x402-0066ff?style=flat-square)](https://www.x402.org)
[![Nano](https://img.shields.io/badge/crypto-Nano-4fc0d0?style=flat-square&logo=nano)](https://nano.org)

Helper module for Nano x402 Clients, Resource Servers and Facilitators

Used by scheme implementations on `nano:*` family, e.g. `exact`.

## Features

- Generate, sign and prepare Nano send blocks
- Proof-of-Work (PoW) generation via RPC or custom generator
- Account info retrieval (RPC `account_info`)
- Block publishing (RPC `process`)
- Balance calculation & insufficient funds protection
- Configurable RPC & Proof-of-Work generation endpoints
- Before/after Proof-of-Work generation hooks (for logging, etc...)
- Clean error handling with descriptive codes

## Installation

> **TypeScript**

```bash
npm install @x402nano/helper
```

## Example Usage

> **TypeScript**

```ts
// ** Usage of Helper module within a Facilitator that supports the exact scheme on nano:* family **

import { x402Facilitator } from '@x402/core/facilitator'
import { ExactNanoScheme } from '@x402nano/exact/facilitator'
import { Helper } from '@x402nano/helper' // Helper

// Create x402 core Facilitator instance
const facilitator = new x402Facilitator()

// Create instance of Helper module and configure with Nano RPC endpoint
const helper = new Helper({
  NANO_RPC_URL: 'https://example-nano-rpc-endpoint.com/rpc',
})

// Pass Helper module instance into scheme instance.
// Scheme code can now access the Nano network through use
// of the configured Helper module instance.
const exactNanoScheme = new ExactNanoScheme(helper)

// Register the scheme loaded with Helper module instance into the Facilitator instance
facilitator.register('nano:mainnet', exactNanoScheme)
```

💡 Detailed examples of usage can be viewed in the [`/examples/` folder for the x402nano exact scheme](https://github.com/x402nano/exact/src/typescript/examples).

## API

| Method                                  | Description                                                                             |
| :-------------------------------------- | :-------------------------------------------------------------------------------------- |
| `generateSendBlock({ payTo, amount })`  | Generates Nano send blocks (including Proof-of-Work generation)                         |
| `getAccountInfo({ account })`           | Calls `account_info` RPC                                                                |
| `processBlock({ block })`               | Publishes block via `process` RPC                                                       |
| `setNanoRpcUrl(url)`                    | Set Nano RPC endpoint                                                                   |
| `setNanoAccountPrivateKey(privateKey)`  | Sets the Nano account private key to use during block generation.                       |
| `clearNanoAccountPrivateKey()`          | Clear Nano account private key (security / session cleanup)                             |
| `setNanoWorkGenerationUrl(url)`         | Change Proof-of-Work generation endpoint                                                |
| `setCustomWorkGenerator(workGenerator)` | Set a custom Proof-of-Work generator                                                    |
| `onBeforeWorkGeneration(hook)`          | Register hook called before Proof-of-Work generation starts                             |
| `onAfterWorkGeneration(hook)`           | Register hook called after Proof-of-Work generation finishes                            |
| `getConfig()`                           | Returns the current configuration for Helper instance (minus NANO_ACCOUNT_PRIVATE_KEY). |

## Configuration

> **TypeScript**

Pass configuration values directly to the constructor:

```ts
const helper = new Helper({
  NANO_RPC_URL: 'https://...'                   // Required
  NANO_WORK_GENERATION_URL: 'https://...'       // Optional, defaults to NANO_RPC_URL
  NANO_ACCOUNT_PRIVATE_KEY: 'FEEDFACE1234...'   // Required if using generateSendBlock
})
```

Or you can use the following setters:

```ts
const helper = new Helper()

helper.setNanoRpcUrl('https://example-nano-rpc-endpoint.com/rpc')
helper.setNanoWorkGenerationUrl('https://example-nano-work-generation-endpoint.com/rpc')
helper.setNanoAccountPrivateKey('FEEDFACE1234...')
```

The `setCustomWorkGenerator` setter takes a function as a parameter. This function must accept as a parameter the `hash` you wish to generate Proof-of-Work for, and must return the `work` computed.

```ts
helper.setCustomWorkGenerator(function (hash: string): string {
  const work = // ...perform work generation using "hash" parameter here...
  return work
})
```

## Error Codes

Errors include one of the following codes, as well as more descriptive debugging information.

| Error                             | Description                                 |
| :-------------------------------- | :------------------------------------------ |
| `error_config`                    | Incorrect configuration value               |
| `error_block_generation`          | Error during block generation               |
| `error_nano_rpc_connection`       | Error during Nano RPC communication         |
| `error_nano_work_generation`      | Error during Proof-of-Work generation       |
| `error_insufficient_nano_balance` | Insufficient balance to create a send block |

## Project Structure

> **TypeScript**

```
helper/src/typescript/
├── index.ts                 # Main code for Helper
└── common.ts                # Shared constants used by Helper code and tests

helper/src/typescript/test
└── index.test.ts            # Test script (run with `npm run test`)
```

## Development

> **TypeScript**

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test
```

## Contributing

We welcome developers to submit implementations of the `Helper` module in other languages e.g. Python, Go, etc...

Join the [x402 Nano Discord](https://discord.gg/s22QDgc3eJ) for coordination and discussion!

## Security Notes 🚨

- This is new software and hasn't yet been deployed heavily in production environments yet. Please test with small amounts of Nano only! The authors and contributors shall not be held liable for any use of this software's functionality, intentional or unintentional, that leads to an undesired lose of funds.
- **Never commit private keys** to version control
- Consider calling `clearNanoAccountPrivateKey` to clear private key in long-running processes

## Related Projects

- [@x402nano/exact](https://github.com/x402nano/exact) – Implementation of `exact` scheme for fixed-amount Nano (XNO) payments over x402 protocol
- [x402.org](https://www.x402.org) – Official x402 protocol website
- [nano.org](https://nano.org) – Official Nano website

## License

MIT
