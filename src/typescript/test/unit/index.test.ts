import { describe, it, expect } from 'vitest'
import { WorkGenerator, NANO_ACCOUNT_PRIVATE_KEY_PROPERTY } from '@x402nano/typescript-common'
import {
  calculateBalanceAfterSend,
  validateNanoRpcUrl,
  validateNanoWorkGenerationUrl,
  validateNanoAccountPrivateKey,
  validateCustomWorkGenerator,
  Helper,
} from '../../index'
import {
  ERROR_CONFIG,
  ERROR_BLOCK_GENERATION,
  ERROR_NANO_WORK_GENERATION,
  ERROR_NANO_RPC_CONNECTION,
  ERROR_INSUFFICIENT_NANO_BALANCE,
} from '../../common'

const SAMPLE_NANO_ACCOUNT_PRIVATE_KEY =
  'D9E8DABBE4D0C34408C6662CBAD2152C091568BDC6A0A0C07DB188B8C00DCC83'
const SAMPLE_NANO_ACCOUNT_PRIVATE_KEY_2 =
  '614D9DEBE870D30EFCABF74927E688FD2C3261486B7BAA8E10E3D642E4F5EDBC'

const SAMPLE_NANO_RPC_URL = 'https://sample-nano-rpc-url'
const SAMPLE_NANO_RPC_URL_2 = 'https://sample-nano-rpc-url-two'

const SAMPLE_NANO_WORK_GENERATION_URL = 'https://sample-nano-work-generation-url'
const SAMPLE_NANO_WORK_GENERATION_URL_2 = 'https://sample-nano-work-generation-url-two'

const ONE_NANO_TO_RAW = '1000000000000000000000000000000'

describe('helper', () => {
  describe('calculateBalanceAfterSend', () => {
    it('returns correct balance value (large raw unit amounts)', () => {
      const result = calculateBalanceAfterSend({
        currentBalance: '2000000000000000000000000000000',
        amountToSend: ONE_NANO_TO_RAW,
      })
      expect(result).toBe(ONE_NANO_TO_RAW)
    })

    it('returns correct balance value (small raw unit amounts)', () => {
      const result = calculateBalanceAfterSend({
        currentBalance: '50',
        amountToSend: '30',
      })
      expect(result).toBe('20')
    })

    it('throws an error on insufficient balance', () => {
      expect(() =>
        calculateBalanceAfterSend({
          currentBalance: ONE_NANO_TO_RAW,
          amountToSend: '2000000000000000000000000000000',
        }),
      ).toThrowError(ERROR_INSUFFICIENT_NANO_BALANCE)
    })
  })

  describe('validateNanoRpcUrl', () => {
    it('should allow a valid URL', () => {
      expect(
        validateNanoRpcUrl('https://test.com:8080?test=a_parameter&test2=a_parameter2'),
      ).toBeUndefined()
    })

    it('throw an error on invalid URL', () => {
      expect(() => validateNanoRpcUrl('an_invalid_url')).toThrowError(ERROR_CONFIG)
    })

    it('throw an error if URL is not set', () => {
      expect(() => validateNanoRpcUrl(null, true)).toThrowError(ERROR_CONFIG)
    })
  })

  describe('validateNanoWorkGenerationUrl', () => {
    it('should allow a valid URL', () => {
      expect(
        validateNanoWorkGenerationUrl('http://test.com:8080?test=a_parameter&test2=a_parameter2'),
      ).toBeUndefined()
    })

    it('throw an error on invalid URL', () => {
      expect(() => validateNanoWorkGenerationUrl('an_invalid_url')).toThrowError(ERROR_CONFIG)
    })

    it('throw an error if URL is not set', () => {
      expect(() => validateNanoWorkGenerationUrl(null, true)).toThrowError(ERROR_CONFIG)
    })
  })

  describe('validateNanoAccountPrivateKey', () => {
    it('should allow a valid Nano private key format', () => {
      expect(validateNanoAccountPrivateKey(SAMPLE_NANO_ACCOUNT_PRIVATE_KEY)).toBeUndefined()
    })

    it('throw an error if Nano private key format is invalid', () => {
      expect(() => validateNanoAccountPrivateKey('an_invalid_nano_private_key')).toThrowError(
        ERROR_CONFIG,
      )
    })

    it('throw an error if Nano private key is not set', () => {
      expect(() => validateNanoAccountPrivateKey(null, true)).toThrowError(ERROR_CONFIG)
    })
  })

  describe('validateCustomWorkGenerator', () => {
    it('should allow a valid custom work generation function', () => {
      let exampleHashToGenerateWorkFor =
        'D1C14068F8AD4F6D2EB48CC4232AFD76E2AC13CEB7F021AD0FCA2339394CE5A7'
      let exampleWorkGenerated = 'baeb18003600c19c'
      let mockWorkGenerator: WorkGenerator = async function (exampleHashToGenerateWorkFor) {
        return exampleWorkGenerated
      }
      expect(validateCustomWorkGenerator(mockWorkGenerator)).toBeUndefined()
    })

    it('throw an error if custom work generation function is invalid', () => {
      expect(() => validateCustomWorkGenerator('should_be_a_function' as any)).toThrowError(
        ERROR_NANO_WORK_GENERATION,
      )
    })
  })

  describe('config', () => {
    const sampleConfig = {
      [NANO_ACCOUNT_PRIVATE_KEY_PROPERTY]: SAMPLE_NANO_ACCOUNT_PRIVATE_KEY,
      NANO_RPC_URL: SAMPLE_NANO_RPC_URL,
      NANO_WORK_GENERATION_URL: SAMPLE_NANO_WORK_GENERATION_URL,
    }

    const helperWithConfig = new Helper(sampleConfig)

    it('should have config values set correctly', () => {
      const nanoPrivateKey = 'NANO_ACCOUNT_PRIVATE_KEY' as const
      const { [nanoPrivateKey]: nanoPrivateKey_, ...configWithoutPrivateKey } = sampleConfig

      expect(helperWithConfig.getConfig()).toStrictEqual(configWithoutPrivateKey)
    })

    const helperWithoutConfig = new Helper()

    it('should set Nano RPC URL', () => {
      helperWithoutConfig.setNanoRpcUrl(SAMPLE_NANO_RPC_URL_2)
      expect(helperWithoutConfig.getConfig().NANO_RPC_URL).toBe(SAMPLE_NANO_RPC_URL_2)
    })

    it('should set Nano Work Generation URL', () => {
      helperWithoutConfig.setNanoWorkGenerationUrl(SAMPLE_NANO_WORK_GENERATION_URL_2)
      expect(helperWithoutConfig.getConfig().NANO_WORK_GENERATION_URL).toBe(
        SAMPLE_NANO_WORK_GENERATION_URL_2,
      )
    })

    helperWithoutConfig.setNanoAccountPrivateKey(SAMPLE_NANO_ACCOUNT_PRIVATE_KEY)

    it('should not allow overwriting of Nano account private key', () => {
      expect(() =>
        helperWithoutConfig.setNanoAccountPrivateKey(SAMPLE_NANO_ACCOUNT_PRIVATE_KEY_2),
      ).toThrowError(ERROR_CONFIG)
    })

    it('should allow setting of different Nano account private key after first clearing old key', () => {
      helperWithoutConfig.clearNanoAccountPrivateKey()

      expect(
        helperWithoutConfig.setNanoAccountPrivateKey(SAMPLE_NANO_ACCOUNT_PRIVATE_KEY_2),
      ).toBeUndefined()
    })
  })
})
