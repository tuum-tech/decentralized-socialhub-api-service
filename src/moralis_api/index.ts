import Moralis from 'moralis/node'

export const supportedChains = [
  'eth',
  'ethereum',
  'mainnet',
  'bsc',
  'binance',
  'binance smart chain',
  'matic',
  'polygon',
  'avalance',
  'fantom',
  'cronos',
]

export function getSupportedChain(chain: string): any {
  let result: any
  switch (chain.toLowerCase()) {
    case 'eth':
    case 'ethereum':
    case 'mainnet': {
      result = '0x1'
      break
    }
    case 'bsc':
    case 'binance':
    case 'binance smart chain': {
      result = '0x38'
      break
    }
    case 'matic':
    case 'polygon': {
      result = '0x89'
      break
    }
    case 'avalanche': {
      result = '0xa86a'
      break
    }
    case 'fantom': {
      result = '0xfa'
      break
    }
    case 'cronos': {
      result = '0x19'
      break
    }
    default: {
      result = '0x1'
    }
  }
  return result
}

export async function initializeMoralis() {
  // tslint:disable-next-line:no-console
  console.log('Initializing Moralis')
  try {
    /* Moralis init code */
    const serverUrl = process.env.MORALIS_SERVER_URL
    const appId = process.env.MORALIS_APP_ID
    const masterKey = process.env.MORALIS_MASTER_KEY

    await Moralis.start({ serverUrl, appId, masterKey })

    // tslint:disable-next-line:no-console
    console.log('Finished initializing Moralis')
  } catch (err: any) {
    // tslint:disable-next-line:no-console
    console.info('Error while initializing Moralis: ', err)
  }
}
