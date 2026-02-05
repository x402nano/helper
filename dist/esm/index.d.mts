import * as z from 'zod';

/**
 * Validates a string that contains only digits (non-negative integer).
 */
declare const STRING_INT: z.ZodString
/**
 * Validates a 64-character hexadecimal string (e.g., block hash, public key).
 */
declare const HEX_64: z.ZodString
/**
 * Validates a Nano account address (supports both 'nano_' and 'xrb_' prefixes).
 */
declare const NANO_ACCOUNT: z.ZodString
/**
 * Schema for successful account information response from Nano node.
 */
declare const ACCOUNT_INFO_SUCCESS: z.ZodObject<
  {
    frontier: z.ZodString
    open_block: z.ZodString
    representative_block: z.ZodString
    representative: z.ZodString
    balance: z.ZodString
    modified_timestamp: z.ZodString
    block_count: z.ZodString
    account_version: z.ZodOptional<z.ZodString>
    confirmation_height: z.ZodString
    confirmation_height_frontier: z.ZodString
  },
  z.core.$strip
>
/**
 * Configuration schema for the x402 Nano Helper class.
 */
declare const HELPER_CONFIG: z.ZodObject<
  {
    NANO_RPC_URL: z.ZodOptional<z.ZodURL>
    NANO_WORK_GENERATION_URL: z.ZodOptional<z.ZodURL>
    NANO_ACCOUNT_PRIVATE_KEY: z.ZodOptional<z.ZodString>
  },
  z.core.$strip
>
/**
 * Schema for successful Nano block processing response.
 */
declare const PROCESS_BLOCK_SUCCESS: z.ZodObject<
  {
    hash: z.ZodString
  },
  z.core.$strip
>
/**
 * Schema for a Nano send block (state block type).
 */
declare const NANO_SEND_BLOCK: z.ZodObject<
  {
    type: z.ZodLiteral<'state'>
    account: z.ZodString
    previous: z.ZodString
    representative: z.ZodString
    balance: z.ZodString
    link: z.ZodString
    link_as_account: z.ZodOptional<z.ZodString>
    work: z.ZodString
    signature: z.ZodString
  },
  z.core.$strict
>

/**
 * Type representing a string integer value.
 */
type StringInt = z.infer<typeof STRING_INT>
/**
 * Type representing a 64-character hexadecimal string.
 */
type Hex64 = z.infer<typeof HEX_64>
/**
 * Type representing a Nano send block structure.
 */
type NanoSendBlock = z.infer<typeof NANO_SEND_BLOCK>
/**
 * Type representing successful account information response from Nano node.
 */
type AccountInfoSuccess = z.infer<typeof ACCOUNT_INFO_SUCCESS>
/**
 * Type representing successful block processing response.
 */
type ProcessBlockSuccess = z.infer<typeof PROCESS_BLOCK_SUCCESS>
/**
 * Type representing a valid Nano account address.
 */
type NanoAccount = z.infer<typeof NANO_ACCOUNT>
/**
 * Type representing a Nano amount as a string integer.
 */
type NanoAmount = z.infer<typeof STRING_INT>
/**
 * Parameters for generating a Nano send block.
 */
type GenerateSendBlockParams = {
  payTo: NanoAccount
  amount: NanoAmount
}
/**
 * Parameters for getting Nano account information.
 */
type GetAccountInfoParams = {
  account: NanoAccount
}
/**
 * Parameters for processing a Nano block.
 */
type ProcessBlockParams = {
  block: NanoSendBlock
}
/**
 * Type representing function passed to custom work generator.
 */
type WorkGenerator = (hash: Hex64) => Promise<string>
/**
 * Type representing "before work generation" hook.
 */
type BeforeWorkGenerationHook = (context: WorkGenerationHookContext) => Promise<void>
/**
 * Type representing "after work generation" hook.
 */
type AfterWorkGenerationHook = (context: WorkGenerationHookContext) => Promise<void>
/**
 * Type representing function passed to "work generation" hooks.
 */
type WorkGenerationHookContext = {
  representative: NanoAccount
  balance: StringInt
  link: Hex64
  previous: Hex64
  work?: string
}
/**
 * Parameters for calculating Nano balance after a send operation.
 */
type CalculateBalanceAfterSendParams = {
  currentBalance: StringInt
  amountToSend: StringInt
}
/**
 * Type representing Helper used by x402 clients to create and process Nano blocks and get Nano account information
 */
type HelperClass = {
  /**
   * Generates a signed Nano send block for a payment transaction.
   *
   * @param params - Parameters including amount and destination address (payTo)
   * @returns Promise resolving to the generated send block
   * @throws Error if configuration is invalid, account is unopened, or balance is insufficient
   */
  generateSendBlock(data: { payTo: NanoAccount; amount: StringInt }): Promise<NanoSendBlock>
  /**
   * Submits a block to the Nano network for processing.
   *
   * @param block - The block to process
   * @returns Promise resolving to the processing result containing transaction hash
   * @throws Error if RPC call fails
   */
  processBlock(data: { block: NanoSendBlock }): Promise<ProcessBlockSuccess>
  /**
   * Retrieves account information from the Nano node.
   *
   * @param account - The account address to query
   * @returns Promise resolving to account info (frontier, balance, representative, etc.)
   * @throws Error if RPC URL is invalid or request fails
   */
  getAccountInfo(data: { account: NanoAccount }): Promise<AccountInfoSuccess>
  /**
   * Sets the Nano RPC URL for API calls.
   *
   * @param url - The new RPC URL
   * @throws Error if the URL is invalid
   */
  setNanoRpcUrl(url: string): any
  /**
   * Sets the Nano work generation URL.
   *
   * @param url - The new work generation URL
   * @throws Error if the URL is invalid
   */
  setNanoWorkGenerationUrl(url: string): any
  /**
   * Sets the Nano account private key to use during block generation.
   *
   * @param privateKey - The private key in 64-character hex format
   * @throws Error if the private key format is invalid or if private key has previously been set
   */
  setNanoAccountPrivateKey(privateKey: string): any
  /**
   * Clears the stored Nano account private key.
   */
  clearNanoAccountPrivateKey(): any
  /**
   * Sets a custom work generator.
   *
   * @param workGenerator - Work generation function
   * @throws Error if the work generator function is not valid
   */
  setCustomWorkGenerator(workGenerator: WorkGenerator): any
  /**
   * Sets a hook that will be called before work generation takes place.
   *
   * @param hook - Hook function that will be called
   * @returns The current Helper class instance
   * @throws Error if the hook function itself throws an Error
   */
  onBeforeWorkGeneration(hook: BeforeWorkGenerationHook): HelperClass
  /**
   * Sets a hook that will be called after work generation takes place.
   *
   * @param hook - Hook function that will be called
   * @returns The current Helper class instance
   * @throws Error if the hook function itself throws an Error
   */
  onAfterWorkGeneration(hook: AfterWorkGenerationHook): HelperClass
  /**
   * Returns the current configuration values.
   *
   * @returns Current configuration values
   */
  getConfig(): HelperConfig
}
/**
 * Configuration type for the Nano Helper class.
 */
type HelperConfig = z.infer<typeof HELPER_CONFIG>

/**
 * Calculates the eventual Nano balance after a send operation.
 *
 * @param currentBalance - The current account balance in raw units
 * @param amountToSend - The amount to send in raw units
 * @returns The resulting balance in raw units after the transaction as a string
 */
declare function calculateBalanceAfterSend({ currentBalance, amountToSend, }: CalculateBalanceAfterSendParams): string;
/**
 * Validates the Nano RPC URL configuration.
 *
 * @param url - The RPC URL to validate (checks URL format only, doesn't resolve URL)
 * @param bypassNullCheck - Whether to skip null/undefined check
 * @throws Error if URL is invalid or empty (unless bypassNullCheck is true)
 */
declare function validateNanoRpcUrl(url: string, bypassNullCheck?: boolean): void;
/**
 * Validates the Nano work generation URL configuration.
 *
 * @param url - The work generation URL to validate (checks URL format only, doesn't resolve URL)
 * @param bypassNullCheck - Whether to skip null/undefined check
 * @throws Error if URL is invalid or empty (unless bypassNullCheck is true)
 */
declare function validateNanoWorkGenerationUrl(url: string, bypassNullCheck?: boolean): void;
/**
 * Validates the Nano account private key configuration.
 *
 * @param privateKey - The private key to validate (checks format only, not if account exists on Nano network)
 * @param bypassNullCheck - Whether to skip null/undefined check
 * @throws Error if private key is invalid or empty (unless bypassNullCheck is true)
 */
declare function validateNanoAccountPrivateKey(privateKey: string, bypassNullCheck?: boolean): void;
/**
 * Validates the custom work generation function.
 *
 * @param workGenerator - Work generation function
 * @throws Error if the work generation function is invalid
 */
declare function validateCustomWorkGenerator(workGenerator: WorkGenerator): void;
/**
 * Helper class for interacting with the Nano network.
 *
 * Provides utility methods for accessing Nano account information, block creation,
 * and Nano RPC communication required for x402 protocol operations.
 */
declare class Helper implements HelperClass {
    /**
     * Configuration for the helper instance.
     */
    private config;
    private beforeWorkGenerationHooks;
    private afterWorkGenerationHooks;
    private workGenerator;
    /**
     * Creates a new Helper instance.
     *
     * @param config - Optional configuration object
     */
    constructor(config?: any);
    /**
     * Retrieves account information from the Nano node.
     *
     * @param account - The account address to query
     * @returns Promise resolving to account info (frontier, balance, representative, etc.)
     * @throws Error if RPC URL is invalid or request fails
     */
    getAccountInfo({ account }: GetAccountInfoParams): Promise<AccountInfoSuccess>;
    /**
     * Generates a signed Nano send block for a payment transaction.
     *
     * @param params - Parameters including amount and destination address (payTo)
     * @returns Promise resolving to the generated send block
     * @throws Error if configuration is invalid, account is unopened, or balance is insufficient
     */
    generateSendBlock(params: GenerateSendBlockParams): Promise<NanoSendBlock>;
    /**
     * Submits a block to the Nano network for processing.
     *
     * @param block - The block to process
     * @returns Promise resolving to the processing result containing transaction hash
     * @throws Error if RPC call fails
     */
    processBlock({ block }: ProcessBlockParams): Promise<ProcessBlockSuccess>;
    /**
     * Sets the Nano RPC URL for API calls.
     *
     * @param url - The new RPC URL
     * @throws Error if the URL is invalid
     */
    setNanoRpcUrl(url: string): void;
    /**
     * Sets the Nano work generation URL.
     *
     * @param url - The new work generation URL
     * @throws Error if the URL is invalid
     */
    setNanoWorkGenerationUrl(url: string): void;
    /**
     * Sets the Nano account private key to use during block generation.
     *
     * @param privateKey - The private key in 64-character hex format
     * @throws Error if the private key format is invalid or if private key has previously been set
     */
    setNanoAccountPrivateKey(privateKey: string): void;
    /**
     * Clears the stored Nano account private key.
     */
    clearNanoAccountPrivateKey(): void;
    /**
     * Sets a custom work generator.
     *
     * @param workGenerator - Work generator function
     * @throws Error if the work generation function is not valid
     */
    setCustomWorkGenerator(workGenerator: WorkGenerator): void;
    /**
     * Sets a hook that will be called before work generation takes place.
     *
     * @param hook - Hook function that will be called
     * @returns The current Helper class instance
     * @throws Error if the hook function itself throws an Error
     */
    onBeforeWorkGeneration(hook: BeforeWorkGenerationHook): HelperClass;
    /**
     * Sets a hook that will be called after work generation takes place.
     *
     * @param hook - Hook function that will be called
     * @returns The current Helper class instance
     * @throws Error if the hook function itself throws an Error
     */
    onAfterWorkGeneration(hook: AfterWorkGenerationHook): HelperClass;
    /**
     * Returns the current configuration values.
     *
     * @returns Current configuration values
     */
    getConfig(): HelperConfig;
}

export { Helper, calculateBalanceAfterSend, validateCustomWorkGenerator, validateNanoAccountPrivateKey, validateNanoRpcUrl, validateNanoWorkGenerationUrl };
