import * as z from "zod"
import { createSendBlock, StateBlock } from "nano-sdk/blocks"
import { deriveAccountFromPrivateKey } from "nano-sdk/crypto"
import {
  AccountString,
  HashString,
  RawAmountString,
  SubtypeString,
} from "nano-sdk/types"
import { Nano } from 'nano-sdk'
import {
  // Types
  NanoSendBlock,
  GenerateSendBlockParams,
  WorkGenerationHookContext,
  NanoRpcCallParams,
  WorkGenerateParams,
  NanoRpcCallJsonResponse,
  NanoRpcCallWorkGenerateResponse,
  GetAccountInfoParams,
  ProcessBlockParams,
  ProcessBlockSuccess,
  GetAccountParams,
  HelperConfig,
  AccountInfoSuccess,
  HelperClass,
  WorkGenerator,
  BeforeWorkGenerationHook,
  AfterWorkGenerationHook,
  // Zod Schemas
  HEX_64,
  URL,
  WORK_GENERATOR,
  // Constants
  SEND_BLOCK_WORK_THRESHOLD,
  NANO_ACCOUNT_PRIVATE_KEY_PROPERTY,
} from '@x402nano/typescript-common'
import {
  ERROR_CONFIG,
  ERROR_BLOCK_GENERATION,
  ERROR_NANO_WORK_GENERATION,
  ERROR_NANO_RPC_CONNECTION,
} from './common'

/**
 * One second in milliseconds.
 */
const ONE_SECOND: number = 1000

/**
 * One minute in milliseconds.
 */
const ONE_MINUTE: number = 60 * ONE_SECOND

/**
 * Legacy Nano address prefix.
 */
const XRB_PREFIX: string = 'xrb_'

/**
 * Current Nano address prefix.
 */
const NANO_PREFIX: string = 'nano_'


/**
 * Schema for successful block information response from Nano node.
 */
const BLOCK_INFO_SUCCESS = z.object({
  block_account: AccountString(),
  amount: RawAmountString(),
  balance: RawAmountString(),
  height: z.ZodString,
  local_timestamp: z.ZodString,
  successor: HashString(),
  confirmed: z.union([z.literal("true"), z.literal("false")]),
  contents: StateBlock(),
  subtype: SubtypeString(),
})
/**
 * Type representing successful block information response from Nano node.
 */
type BlockInfoSuccess = z.infer<typeof BLOCK_INFO_SUCCESS>

/**
 * Makes an RPC call to a Nano node.
 *
 * @param url - The Nano RPC endpoint URL
 * @param action - The Nano RPC action to perform
 * @param params - The Nano RPC request parameters to accompany the action
 * @param timeout - Request timeout in milliseconds
 * @param isGeneratingWork - Is this Nano RPC call for work generation?
 * @returns Promise resolving to the JSON response
 * @throws Error if the request fails or returns an error
 */
async function nanoRpcCall({
  url,
  action,
  params,
  timeout = ONE_MINUTE,
  isGeneratingWork = false,
}: NanoRpcCallParams): Promise<NanoRpcCallJsonResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ action, ...params }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    const json = (await res.json()) as NanoRpcCallJsonResponse
    if (json.error) throw new Error(`[${ERROR_NANO_RPC_CONNECTION}]: ${json.error}`)
    return json
  } catch (error) {
    throw new Error(
      `[${isGeneratingWork ? ERROR_NANO_WORK_GENERATION : ERROR_NANO_RPC_CONNECTION}] Could not connect to ${isGeneratingWork ? 'Nano Work Generation URL' : 'Nano RPC URL'}`,
    )
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Generates Proof-of-Work for a given block hash.
 *
 * @param config - Helper configuration containing RPC URLs
 * @param hash - The hash to generate work for
 * @param threshold - Work difficulty threshold
 * @param workGenerator - Work generation function
 * @returns Promise resolving to the generated work
 * @throws Error if work generation fails or generated work is invalid
 */
async function workGenerate({
  config,
  hash,
  threshold = SEND_BLOCK_WORK_THRESHOLD,
  workGenerator,
}: WorkGenerateParams): Promise<string> {
  let work: string

  if (workGenerator) {
    try {
      work = await workGenerator(hash)
    } catch (error) {
      throw new Error(
        `[${ERROR_NANO_WORK_GENERATION}] Error during custom work generation \nCause: ${error.message}`,
      )
    }
  } else {
    try {
      let workGenerationUrl = config.NANO_WORK_GENERATION_URL ?? config.NANO_RPC_URL

      var workGenerateResponse = (await nanoRpcCall({
        url: workGenerationUrl,
        action: 'work_generate',
        params: { hash },
        timeout: 5 * ONE_MINUTE,
        isGeneratingWork: true,
      })) as NanoRpcCallWorkGenerateResponse

      work = workGenerateResponse.work
    } catch (error) {
      throw new Error(
        `[${ERROR_NANO_WORK_GENERATION}] Error during work generation \nCause: ${error.message}`,
      )
    }
  }

  let isWorkValid: boolean = Nano.Crypto.verifyWork({
    hash,
    work,
    threshold,
  })

  if (isWorkValid) {
    return work
  } else {
    throw new Error(`[${ERROR_NANO_WORK_GENERATION}] Generated work is not valid`)
  }
}

/**
 * Derives the account address from the configured private key.
 *
 * @param config - Helper configuration containing private key
 * @returns The derived Nano account address
 */
function getAccount({ config }: GetAccountParams) {
  return deriveAccountFromPrivateKey({ privateKey: config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY] })
}

/**
 * Validates the Nano RPC URL configuration.
 *
 * @param url - The RPC URL to validate (checks URL format only, doesn't resolve URL)
 * @param bypassNullCheck - Whether to skip null/undefined check
 * @throws Error if URL is invalid or empty (unless bypassNullCheck is true)
 */
export function validateNanoRpcUrl(url: string, bypassNullCheck: boolean = false) {
  if (!bypassNullCheck && !url) {
    throw new Error(`[${ERROR_CONFIG}] NANO_RPC_URL is not set`)
  }

  if (!URL.safeParse(url).success) {
    throw new Error(`[${ERROR_CONFIG}] NANO_RPC_URL is not a valid URL`)
  }
}

/**
 * Validates the Nano work generation URL configuration.
 *
 * @param url - The work generation URL to validate (checks URL format only, doesn't resolve URL)
 * @param bypassNullCheck - Whether to skip null/undefined check
 * @throws Error if URL is invalid or empty (unless bypassNullCheck is true)
 */
export function validateNanoWorkGenerationUrl(url: string, bypassNullCheck: boolean = false) {
  if (!bypassNullCheck && !url) {
    throw new Error(`[${ERROR_CONFIG}] NANO_WORK_GENERATION_URL is not set`)
  }

  if (!URL.safeParse(url).success) {
    throw new Error(`[${ERROR_CONFIG}] NANO_WORK_GENERATION_URL is not a valid URL`)
  }
}

/**
 * Validates the Nano account private key configuration.
 *
 * @param privateKey - The private key to validate (checks format only, not if account exists on Nano network)
 * @param bypassNullCheck - Whether to skip null/undefined check
 * @throws Error if private key is invalid or empty (unless bypassNullCheck is true)
 */
export function validateNanoAccountPrivateKey(
  privateKey: string,
  bypassNullCheck: boolean = false,
) {
  if (!bypassNullCheck && !privateKey) {
    throw new Error(`[${ERROR_CONFIG}] ${NANO_ACCOUNT_PRIVATE_KEY_PROPERTY} is not set`)
  }

  if (!HEX_64.safeParse(privateKey).success) {
    throw new Error(
      `[${ERROR_CONFIG}] ${NANO_ACCOUNT_PRIVATE_KEY_PROPERTY} is not of a valid format (should be 64 hexadecimal characters)`,
    )
  }
}

/**
 * Validates the custom work generation function.
 *
 * @param workGenerator - Work generation function
 * @throws Error if the work generation function is invalid
 */
export function validateCustomWorkGenerator(workGenerator: WorkGenerator) {
  if (!WORK_GENERATOR.safeParse(workGenerator).success) {
    throw new Error(`[${ERROR_NANO_WORK_GENERATION}] Custom work generator is not valid`)
  }
}

/**
 * Ensure that a Nano account has a "nano_" prefix, not the legacy "xrb_" prefix
 *
 * @param nanoAccount - The Nano account to check
 * @returns Nano account with a "nano_" prefix
 */
export function ensureNanoPrefix(nanoAccount: AccountString): AccountString {
  return nanoAccount.replace(XRB_PREFIX, NANO_PREFIX)
}

// ---------------------------------------------------

/**
 * Helper class for interacting with the Nano network.
 *
 * Provides utility methods for accessing Nano account information, block creation,
 * and Nano RPC communication required for x402 protocol operations.
 */
export class Helper implements HelperClass {
  /**
   * Configuration for the helper instance.
   */
  private config: HelperConfig = {}

  private beforeWorkGenerationHooks: BeforeWorkGenerationHook[] = []
  private afterWorkGenerationHooks: AfterWorkGenerationHook[] = []
  private workGenerator: WorkGenerator

  /**
   * Creates a new Helper instance.
   *
   * @param config - Optional configuration object
   */
  constructor(config?) {
    if (config) {
      this.config = config
      this.config.NANO_WORK_GENERATION_URL = config.NANO_WORK_GENERATION_URL ?? config.NANO_RPC_URL
    }
  }

  /**
   * Retrieves account information from the Nano node.
   *
   * @param account - The account address to query
   * @returns Promise resolving to account info (frontier, balance, representative, etc.)
   * @throws Error if RPC URL is invalid or request fails
   */
  async getAccountInfo({ account }: GetAccountInfoParams): Promise<AccountInfoSuccess> {
    validateNanoRpcUrl(this.config.NANO_RPC_URL)

    return (await nanoRpcCall({
      url: this.config.NANO_RPC_URL,
      action: 'account_info',
      params: {
        account,
        representative: 'true',
      },
    })) as AccountInfoSuccess
  }

  /**
   * Generates a signed Nano send block for a payment transaction.
   *
   * @param params - Parameters including amount and destination address (payTo)
   * @returns Promise resolving to the generated send block
   * @throws Error if configuration is invalid, account is unopened, or balance is insufficient
   */
  async generateSendBlock(params: GenerateSendBlockParams): Promise<NanoSendBlock> {
    validateNanoRpcUrl(this.config.NANO_RPC_URL)
    validateNanoAccountPrivateKey(this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY])
    validateNanoWorkGenerationUrl(this.config.NANO_WORK_GENERATION_URL)

    let sourceAccount = getAccount({ config: this.config })
    let sourceAccountInfo = (await this.getAccountInfo({
      account: sourceAccount,
    })) as AccountInfoSuccess

    // Get information about the frontier block
    let sourceAccountFrontierBlockInfo = (await nanoRpcCall({
      url: this.config.NANO_RPC_URL,
      action: 'block_info',
      params: {
        hash: sourceAccountInfo.frontier,
        json_block: "true",
      },
    })) as BlockInfoSuccess

    if (!sourceAccountInfo.frontier) {
      throw new Error(
        `[${ERROR_BLOCK_GENERATION}] Source account has no frontier (unopened account)`,
      )
    }

    const context: WorkGenerationHookContext = {
      representative: sourceAccountInfo.representative,
      balance: sourceAccountInfo.balance,
      link: params.payTo,
      previous: sourceAccountInfo.frontier,
    }    

    // Execute beforeWorkGenerationHooks hooks
    for (const beforeWorkGenerationHook of this.beforeWorkGenerationHooks) {
      await (beforeWorkGenerationHook as BeforeWorkGenerationHook)(context)
    }

    let work = await workGenerate({
      config: this.config,
      hash: sourceAccountInfo.frontier,
      workGenerator: this.workGenerator,
    })

    // Execute afterWorkGenerationHooks hooks
    for (const afterWorkGenerationHook of this.afterWorkGenerationHooks) {
      await (afterWorkGenerationHook as AfterWorkGenerationHook)(Object.assign(context, { work }))
    }

    if (!work) {
      throw new Error(
        `[${ERROR_NANO_WORK_GENERATION}] No work generated during creation of Nano send block`,
      )
    }

    let block
    if ("contents" in sourceAccountFrontierBlockInfo) {
      block = createSendBlock({
        amount: params.amount,
        destination: params.payTo,
        frontierBlock: sourceAccountFrontierBlockInfo.contents,
        privateKey: this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY],
        representative: sourceAccountFrontierBlockInfo.contents.representative,
      })
    }

    block!.work = work

    block!.account = ensureNanoPrefix(block!.account)
    block!.link_as_account = ensureNanoPrefix(block!.link_as_account)

    return block!
  }

  /**
   * Submits a block to the Nano network for processing.
   *
   * @param block - The block to process
   * @returns Promise resolving to the processing result containing transaction hash
   * @throws Error if RPC call fails
   */
  async processBlock({ block }: ProcessBlockParams): Promise<ProcessBlockSuccess> {
    validateNanoRpcUrl(this.config.NANO_RPC_URL)

    return (await nanoRpcCall({
      url: this.config.NANO_RPC_URL,
      action: 'process',
      params: {
        json_block: 'true',
        subtype: 'send',
        block,
      },
    })) as ProcessBlockSuccess
  }

  /**
   * Sets the Nano RPC URL for API calls.
   *
   * @param url - The new RPC URL
   * @throws Error if the URL is invalid
   */
  setNanoRpcUrl(url: string) {
    validateNanoRpcUrl(url, true)

    this.config.NANO_RPC_URL = url
    this.config.NANO_WORK_GENERATION_URL =
      this.config.NANO_WORK_GENERATION_URL ?? this.config.NANO_RPC_URL
  }

  /**
   * Sets the Nano work generation URL.
   *
   * @param url - The new work generation URL
   * @throws Error if the URL is invalid
   */
  setNanoWorkGenerationUrl(url: string) {
    validateNanoWorkGenerationUrl(url, true)

    this.config.NANO_WORK_GENERATION_URL = url
  }

  /**
   * Sets the Nano account private key to use during block generation.
   *
   * @param privateKey - The private key in 64-character hex format
   * @throws Error if the private key format is invalid or if private key has previously been set
   */
  setNanoAccountPrivateKey(privateKey: string) {
    validateNanoAccountPrivateKey(privateKey, true)

    if (this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY]) {
      throw new Error(
        `[${ERROR_CONFIG}] Nano account private key already set. Manually clear with clearNanoAccountPrivateKey() first.`,
      )
    }

    this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY] = privateKey
  }

  /**
   * Clears the stored Nano account private key.
   */
  clearNanoAccountPrivateKey() {
    this.config[NANO_ACCOUNT_PRIVATE_KEY_PROPERTY] = undefined
  }

  /**
   * Sets a custom work generator.
   *
   * @param workGenerator - Work generator function
   * @throws Error if the work generation function is not valid
   */
  setCustomWorkGenerator(workGenerator: WorkGenerator) {
    validateCustomWorkGenerator(workGenerator)

    this.workGenerator = workGenerator
  }

  /**
   * Sets a hook that will be called before work generation takes place.
   *
   * @param hook - Hook function that will be called
   * @returns The current Helper class instance
   * @throws Error if the hook function itself throws an Error
   */
  onBeforeWorkGeneration(hook: BeforeWorkGenerationHook): HelperClass {
    this.beforeWorkGenerationHooks.push(hook)
    return this
  }

  /**
   * Sets a hook that will be called after work generation takes place.
   *
   * @param hook - Hook function that will be called
   * @returns The current Helper class instance
   * @throws Error if the hook function itself throws an Error
   */
  onAfterWorkGeneration(hook: AfterWorkGenerationHook): HelperClass {
    this.afterWorkGenerationHooks.push(hook)
    return this
  }

  /**
   * Returns the current configuration values.
   *
   * @returns Current configuration values
   */
  getConfig(): HelperConfig {
    const nanoPrivateKey = 'NANO_ACCOUNT_PRIVATE_KEY' as const
    const { [nanoPrivateKey]: nanoPrivateKey_, ...configWithoutPrivateKey } = this.config

    return configWithoutPrivateKey
  }
}
