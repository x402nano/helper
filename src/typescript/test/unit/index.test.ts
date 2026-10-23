import { describe, it, expect, vi } from 'vitest'
import { WorkGenerator, NANO_ACCOUNT_PRIVATE_KEY_PROPERTY } from '@x402nano/typescript-common'
import {
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

  describe('generateSendBlock guards', () => {
    it('throws ERROR_BLOCK_GENERATION before block_info or PoW when account has no frontier', async () => {
      const helper = new Helper({
        [NANO_ACCOUNT_PRIVATE_KEY_PROPERTY]: SAMPLE_NANO_ACCOUNT_PRIVATE_KEY,
        NANO_RPC_URL: SAMPLE_NANO_RPC_URL,
        NANO_WORK_GENERATION_URL: SAMPLE_NANO_WORK_GENERATION_URL,
      })
      const workSpy = vi.fn().mockResolvedValue('baeb18003600c19c')
      helper.setCustomWorkGenerator(workSpy)
      vi.spyOn(helper, 'getAccountInfo').mockResolvedValue({
        frontier: '',
        balance: ONE_NANO_TO_RAW,
      } as any)

      await expect(
        helper.generateSendBlock({
          amount: ONE_NANO_TO_RAW,
          payTo: 'nano_1h56yw7cb3mb1ojkcfsjbryg68r4436suedtbwsoz9jwwd4stgzr744ft7es',
        }),
      ).rejects.toThrowError(ERROR_BLOCK_GENERATION)
      expect(workSpy).not.toHaveBeenCalled()
    })

    it('throws ERROR_INSUFFICIENT_NANO_BALANCE before PoW when account balance is less than amount', async () => {
      const helper = new Helper({
        [NANO_ACCOUNT_PRIVATE_KEY_PROPERTY]: SAMPLE_NANO_ACCOUNT_PRIVATE_KEY,
        NANO_RPC_URL: SAMPLE_NANO_RPC_URL,
        NANO_WORK_GENERATION_URL: SAMPLE_NANO_WORK_GENERATION_URL,
      })
      const workSpy = vi.fn().mockResolvedValue('baeb18003600c19c')
      helper.setCustomWorkGenerator(workSpy)
      vi.spyOn(helper, 'getAccountInfo').mockResolvedValue({
        frontier: '8AEF920ABA234F23259B018F4AF945E849477A8171C5116FAF45736817D838A4',
        balance: '100',
      } as any)

      await expect(
        helper.generateSendBlock({
          amount: ONE_NANO_TO_RAW,
          payTo: 'nano_1h56yw7cb3mb1ojkcfsjbryg68r4436suedtbwsoz9jwwd4stgzr744ft7es',
        }),
      ).rejects.toThrowError(ERROR_INSUFFICIENT_NANO_BALANCE)
      expect(workSpy).not.toHaveBeenCalled()
    })
  })
})
