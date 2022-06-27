import { getSupportedChain, supportedChains } from '..'
import Moralis from 'moralis/node'

interface INFTMetadata {
  token_address: string
  name: string
  symbol: string
  contract_type: string
  synced_at?: string
}

const getNFTMetadata = async (
  address: string,
  chain: string
): Promise<INFTMetadata> => {
  let nftMetadata: INFTMetadata
  if (supportedChains.indexOf(chain) === -1) {
    // tslint:disable-next-line:no-console
    console.log(
      `${chain} is not currently supported. The valid chains are ${supportedChains}`
    )
    return nftMetadata
  }

  // tslint:disable-next-line:no-console
  console.log(
    `Using Moralis API to get NFT metadata for the address '${address}'`
  )

  if (address.replace(/\s/g, '') === '') {
    // tslint:disable-next-line:no-console
    console.log(`Address: '${address}' is empty`)
    return nftMetadata
  }

  const options = {
    address,
    chain: getSupportedChain(chain),
  }
  nftMetadata = await Moralis.Web3API.token.getNFTMetadata(options)
  return nftMetadata
}

const getNFTOwners = async (address: string, chain: string) => {
  if (supportedChains.indexOf(chain) === -1) {
    // tslint:disable-next-line:no-console
    console.log(
      `${chain} is not currently supported. The valid chains are ${supportedChains}`
    )
    return []
  }

  // tslint:disable-next-line:no-console
  console.log(
    `Using Moralis API to retrieve NFT assets for the address '${address}' on the '${chain}' network`
  )

  if (address.replace(/\s/g, '') === '') {
    // tslint:disable-next-line:no-console
    console.log(`Address: '${address}' is empty`)
    return []
  }

  let cursor = null
  let owners: any[] = []
  do {
    const response: any = await Moralis.Web3API.token.getNFTOwners({
      address,
      chain: getSupportedChain(chain),
      limit: 100,
      cursor,
    })
    // tslint:disable-next-line:no-console
    console.log(
      `'${address}': Retrieved page ${response.page} of ${Math.ceil(
        response.total / response.page_size
      )}, ${response.total} total`
    )
    owners = owners.concat(
      response.result.map((asset: any) => {
        if (typeof asset === 'object') {
          const name = `${asset.name} #${asset.token_id}`
          let imageUrl = ''
          const metadata = JSON.parse(asset.metadata)
          if (metadata !== null) {
            imageUrl = metadata.image
          }
          return {
            name,
            image_url: imageUrl,
            owner: asset.owner_of,
            last_sale: asset.last_sale,
          }
        }
      })
    )
    cursor = response.cursor
    await new Promise((f) => setTimeout(f, 1000))
  } while (cursor !== '' && cursor != null)

  // tslint:disable-next-line:no-console
  console.log(`Total NFTs for the address '${address}': ${owners.length}`)

  return owners
}

export default { getNFTMetadata, getNFTOwners }
