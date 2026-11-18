# Migrating from `@x402nano/helper` to `@x402nano/exact`

As `@x402nano/helper` is deprecated, you can follow this guide to migrate your code to work fully with `@x402nano/exact` in future.

### Step 1

Remove `@x402nano/helper` from your `package.json` dependencies.

```bash
npm uninstall --save @x402nano/helper
```

### Step 2

Update `@x402nano/exact` to the latest version.

```bash
npm install @x402nano/exact@latest
```

### Step 3

Remove references to `@x402nano/helper` in your code.

```js
import { Helper } from '@x402nano/helper'; // <-- REMOVE THIS
```

### Step 4

Make the relevant imports from `@x402nano/exact` (see [usage examples](https://github.com/x402nano/exact/tree/main/src/typescript/examples) for `@x402nano/exact` for more detail).

For a **`Client`**:
```js
import { ExactNanoClientScheme, createClientNanoSigner, fromHelperConfig } from "@x402nano/exact";
```

For a **`Facilitator`**:
```js
import { ExactNanoFacilitatorScheme, createFacilitatorNanoSigner, fromHelperConfig } from "@x402nano/exact";
```

### Step 5

When using `createClientNanoSigner` or `createFacilitatorNanoSigner` you can provide your existing (now deprecated) `Helper` configuration object to the `fromHelperConfig` conversion function. This will convert it into the `Signer` configuration object shape before creating the `Signer` class instance.

For a **`Client`** (example implementation, yours may vary slightly):
```js
const signer = new createClientNanoSigner(fromHelperConfig({
  NANO_ACCOUNT_PRIVATE_KEY: process.env.CLIENT_NANO_ACCOUNT_PRIVATE_KEY,
  NANO_RPC_URL: process.env.NANO_RPC_URL,  
  NANO_WORK_GENERATION_URL: process.env.NANO_WORK_GENERATION_URL
}));
```

For a **`Facilitator`** (example implementation, yours may vary slightly):
```js
const signer = new createFacilitatorNanoSigner(fromHelperConfig({
  NANO_ACCOUNT_PRIVATE_KEY: process.env.CLIENT_NANO_ACCOUNT_PRIVATE_KEY,
  NANO_RPC_URL: process.env.NANO_RPC_URL,  
  NANO_WORK_GENERATION_URL: process.env.NANO_WORK_GENERATION_URL
}));
```

### Recommendation

It is recommended to follow the [@x402nano/exact usage examples](https://github.com/x402nano/exact/tree/main/src/typescript/examples) to learn how to fully port your code over to `@x402nano/exact` without relying on the `fromHelperConfig` conversion function. This will better future-proof your code.