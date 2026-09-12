var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/typescript/index.ts
import * as z from "zod";
import { createSendBlock, StateBlock } from "nano-sdk/blocks";
import { deriveAccountFromPrivateKey } from "nano-sdk/crypto";
import {
  AccountString,
  HashString,
  RawAmountString,
  SubtypeString
} from "nano-sdk/types";
import { Nano } from "nano-sdk";
import {
  HEX_64,
  URL,
  WORK_GENERATOR,
  SEND_BLOCK_WORK_THRESHOLD,
  NANO_ACCOUNT_PRIVATE_KEY_PROPERTY
} from "@x402nano/typescript-common";

// src/typescript/common.ts
var ERROR_CONFIG = "error_config";
var ERROR_BLOCK_GENERATION = "error_block_generation";
var ERROR_NANO_WORK_GENERATION = "error_nano_work_generation";
var ERROR_NANO_RPC_CONNECTION = "error_nano_rpc_connection";

// src/typescript/index.ts
var ONE_SECOND = 1e3;
var ONE_MINUTE = 60 * ONE_SECOND;
var XRB_PREFIX = "xrb_";
var NANO_PREFIX = "nano_";
var BLOCK_INFO_SUCCESS = z.object({
  block_account: AccountString(),
  amount: RawAmountString(),
  balance: RawAmountString(),
  height: z.ZodString,
  local_timestamp: z.ZodString,
  successor: HashString(),
  confirmed: z.union([z.literal("true"), z.literal("false")]),
  contents: StateBlock(),
  subtype: SubtypeString()
});
async function nanoRpcCall({
  url,
  action,
  params,
  timeout = ONE_MINUTE,
  isGeneratingWork = false
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ action, ...params })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.error) throw new Error(`[${ERROR_NANO_RPC_CONNECTION}]: ${json.error}`);
    return json;
  } catch (error) {
    throw new Error(
      `[${isGeneratingWork ? ERROR_NANO_WORK_GENERATION : ERROR_NANO_RPC_CONNECTION}] Could not connect to ${isGeneratingWork ? "Nano Work Generation URL" : "Nano RPC URL"}`
    );
  } finally {
    clearTimeout(timer);
  }
}
async function workGenerate({
  config,
  hash,
  threshold = SEND_BLOCK_WORK_THRESHOLD,
  workGenerator
}) {
  let work;
  if (workGenerator) {
    try {
      work = await workGenerator(hash);
    } catch (error) {
      throw new Error(
        `[${ERROR_NANO_WORK_GENERATION}] Error during custom work generation 
Cause: ${error.message}`
      );
    }
  } else {
    try {
      let workGenerationUrl = config.NANO_WORK_GENERATION_URL ?? config.NANO_RPC_URL;
      var workGenerateResponse = await nanoRpcCall({
        url: workGenerationUrl,
        action: "work_generate",
        params: { hash },
        timeout: 5 * ONE_MINUTE,
        isGeneratingWork: true
      });
      work = workGenerateResponse.work;
    } catch (error) {
      throw new Error(
        `[${ERROR_NANO_WORK_GENERATION}] Error during work generation 
Cause: ${error.message}`
      );
    }
  }
  let isWorkValid = Nano.Crypto.verifyWork({
    hash,
    work,
    threshold
  });
  if (isWorkValid) {
    return work;
  } else {
    throw new Error(`[${ERROR_NANO_WORK_GENERATION}] Generated work is not valid`);
  }
}
function getAccount({ config }) {
  return deriveAccountFromPrivateKey({ privateKey: config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY] });
}
function validateNanoRpcUrl(url, bypassNullCheck = false) {
  if (!bypassNullCheck && !url) {
    throw new Error(`[${ERROR_CONFIG}] NANO_RPC_URL is not set`);
  }
  if (!URL.safeParse(url).success) {
    throw new Error(`[${ERROR_CONFIG}] NANO_RPC_URL is not a valid URL`);
  }
}
function validateNanoWorkGenerationUrl(url, bypassNullCheck = false) {
  if (!bypassNullCheck && !url) {
    throw new Error(`[${ERROR_CONFIG}] NANO_WORK_GENERATION_URL is not set`);
  }
  if (!URL.safeParse(url).success) {
    throw new Error(`[${ERROR_CONFIG}] NANO_WORK_GENERATION_URL is not a valid URL`);
  }
}
function validateNanoAccountPrivateKey(privateKey, bypassNullCheck = false) {
  if (!bypassNullCheck && !privateKey) {
    throw new Error(`[${ERROR_CONFIG}] ${NANO_ACCOUNT_PRIVATE_KEY_PROPERTY} is not set`);
  }
  if (!HEX_64.safeParse(privateKey).success) {
    throw new Error(
      `[${ERROR_CONFIG}] ${NANO_ACCOUNT_PRIVATE_KEY_PROPERTY} is not of a valid format (should be 64 hexadecimal characters)`
    );
  }
}
function validateCustomWorkGenerator(workGenerator) {
  if (!WORK_GENERATOR.safeParse(workGenerator).success) {
    throw new Error(`[${ERROR_NANO_WORK_GENERATION}] Custom work generator is not valid`);
  }
}
function ensureNanoPrefix(nanoAccount) {
  return nanoAccount.replace(XRB_PREFIX, NANO_PREFIX);
}
var Helper = class {
  /**
   * Creates a new Helper instance.
   *
   * @param config - Optional configuration object
   */
  constructor(config) {
    /**
     * Configuration for the helper instance.
     */
    __publicField(this, "config", {});
    __publicField(this, "beforeWorkGenerationHooks", []);
    __publicField(this, "afterWorkGenerationHooks", []);
    __publicField(this, "workGenerator");
    if (config) {
      this.config = config;
      this.config.NANO_WORK_GENERATION_URL = config.NANO_WORK_GENERATION_URL ?? config.NANO_RPC_URL;
    }
  }
  /**
   * Retrieves account information from the Nano node.
   *
   * @param account - The account address to query
   * @returns Promise resolving to account info (frontier, balance, representative, etc.)
   * @throws Error if RPC URL is invalid or request fails
   */
  async getAccountInfo({ account }) {
    validateNanoRpcUrl(this.config.NANO_RPC_URL);
    return await nanoRpcCall({
      url: this.config.NANO_RPC_URL,
      action: "account_info",
      params: {
        account,
        representative: "true"
      }
    });
  }
  /**
   * Generates a signed Nano send block for a payment transaction.
   *
   * @param params - Parameters including amount and destination address (payTo)
   * @returns Promise resolving to the generated send block
   * @throws Error if configuration is invalid, account is unopened, or balance is insufficient
   */
  async generateSendBlock(params) {
    validateNanoRpcUrl(this.config.NANO_RPC_URL);
    validateNanoAccountPrivateKey(this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY]);
    validateNanoWorkGenerationUrl(this.config.NANO_WORK_GENERATION_URL);
    let sourceAccount = getAccount({ config: this.config });
    let sourceAccountInfo = await this.getAccountInfo({
      account: sourceAccount
    });
    let sourceAccountFrontierBlockInfo = await nanoRpcCall({
      url: this.config.NANO_RPC_URL,
      action: "block_info",
      params: {
        hash: sourceAccountInfo.frontier,
        json_block: "true"
      }
    });
    if (!sourceAccountInfo.frontier) {
      throw new Error(
        `[${ERROR_BLOCK_GENERATION}] Source account has no frontier (unopened account)`
      );
    }
    const context = {
      representative: sourceAccountInfo.representative,
      balance: sourceAccountInfo.balance,
      link: params.payTo,
      previous: sourceAccountInfo.frontier
    };
    for (const beforeWorkGenerationHook of this.beforeWorkGenerationHooks) {
      await beforeWorkGenerationHook(context);
    }
    let work = await workGenerate({
      config: this.config,
      hash: sourceAccountInfo.frontier,
      workGenerator: this.workGenerator
    });
    for (const afterWorkGenerationHook of this.afterWorkGenerationHooks) {
      await afterWorkGenerationHook(Object.assign(context, { work }));
    }
    if (!work) {
      throw new Error(
        `[${ERROR_NANO_WORK_GENERATION}] No work generated during creation of Nano send block`
      );
    }
    let block;
    if ("contents" in sourceAccountFrontierBlockInfo) {
      block = createSendBlock({
        amount: params.amount,
        destination: params.payTo,
        frontierBlock: sourceAccountFrontierBlockInfo.contents,
        privateKey: this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY],
        representative: sourceAccountFrontierBlockInfo.contents.representative
      });
    }
    block.work = work;
    block.account = ensureNanoPrefix(block.account);
    block.link_as_account = ensureNanoPrefix(block.link_as_account);
    return block;
  }
  /**
   * Submits a block to the Nano network for processing.
   *
   * @param block - The block to process
   * @returns Promise resolving to the processing result containing transaction hash
   * @throws Error if RPC call fails
   */
  async processBlock({ block }) {
    validateNanoRpcUrl(this.config.NANO_RPC_URL);
    return await nanoRpcCall({
      url: this.config.NANO_RPC_URL,
      action: "process",
      params: {
        json_block: "true",
        subtype: "send",
        block
      }
    });
  }
  /**
   * Sets the Nano RPC URL for API calls.
   *
   * @param url - The new RPC URL
   * @throws Error if the URL is invalid
   */
  setNanoRpcUrl(url) {
    validateNanoRpcUrl(url, true);
    this.config.NANO_RPC_URL = url;
    this.config.NANO_WORK_GENERATION_URL = this.config.NANO_WORK_GENERATION_URL ?? this.config.NANO_RPC_URL;
  }
  /**
   * Sets the Nano work generation URL.
   *
   * @param url - The new work generation URL
   * @throws Error if the URL is invalid
   */
  setNanoWorkGenerationUrl(url) {
    validateNanoWorkGenerationUrl(url, true);
    this.config.NANO_WORK_GENERATION_URL = url;
  }
  /**
   * Sets the Nano account private key to use during block generation.
   *
   * @param privateKey - The private key in 64-character hex format
   * @throws Error if the private key format is invalid or if private key has previously been set
   */
  setNanoAccountPrivateKey(privateKey) {
    validateNanoAccountPrivateKey(privateKey, true);
    if (this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY]) {
      throw new Error(
        `[${ERROR_CONFIG}] Nano account private key already set. Manually clear with clearNanoAccountPrivateKey() first.`
      );
    }
    this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY] = privateKey;
  }
  /**
   * Clears the stored Nano account private key.
   */
  clearNanoAccountPrivateKey() {
    this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY] = void 0;
  }
  /**
   * Sets a custom work generator.
   *
   * @param workGenerator - Work generator function
   * @throws Error if the work generation function is not valid
   */
  setCustomWorkGenerator(workGenerator) {
    validateCustomWorkGenerator(workGenerator);
    this.workGenerator = workGenerator;
  }
  /**
   * Sets a hook that will be called before work generation takes place.
   *
   * @param hook - Hook function that will be called
   * @returns The current Helper class instance
   * @throws Error if the hook function itself throws an Error
   */
  onBeforeWorkGeneration(hook) {
    this.beforeWorkGenerationHooks.push(hook);
    return this;
  }
  /**
   * Sets a hook that will be called after work generation takes place.
   *
   * @param hook - Hook function that will be called
   * @returns The current Helper class instance
   * @throws Error if the hook function itself throws an Error
   */
  onAfterWorkGeneration(hook) {
    this.afterWorkGenerationHooks.push(hook);
    return this;
  }
  /**
   * Returns the current configuration values.
   *
   * @returns Current configuration values
   */
  getConfig() {
    const nanoPrivateKey = "NANO_ACCOUNT_PRIVATE_KEY";
    const { [nanoPrivateKey]: nanoPrivateKey_, ...configWithoutPrivateKey } = this.config;
    return configWithoutPrivateKey;
  }
};
export {
  Helper,
  ensureNanoPrefix,
  validateCustomWorkGenerator,
  validateNanoAccountPrivateKey,
  validateNanoRpcUrl,
  validateNanoWorkGenerationUrl
};
//# sourceMappingURL=index.mjs.map