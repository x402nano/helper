import { AccountString } from 'nano-sdk/types';
import { HelperClass, GetAccountInfoParams, AccountInfoSuccess, GenerateSendBlockParams, NanoSendBlock, ProcessBlockParams, ProcessBlockSuccess, WorkGenerator, BeforeWorkGenerationHook, AfterWorkGenerationHook, HelperConfig } from '@x402nano/typescript-common';

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
 * Ensure that a Nano account has a "nano_" prefix, not the legacy "xrb_" prefix
 *
 * @param nanoAccount - The Nano account to check
 * @returns Nano account with a "nano_" prefix
 */
declare function ensureNanoPrefix(nanoAccount: AccountString): AccountString;
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

export { Helper, ensureNanoPrefix, validateCustomWorkGenerator, validateNanoAccountPrivateKey, validateNanoRpcUrl, validateNanoWorkGenerationUrl };
