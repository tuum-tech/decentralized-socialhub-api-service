import { getSupportedChain, supportedChains } from '..'
import Moralis from 'moralis/node'

const getNFTs = async (address: string, chain: string) => {
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

  let nfts: any = []
  if (address.replace(/\s/g, '') === '') {
    // tslint:disable-next-line:no-console
    console.log(`Address: '${address}' is empty`)
    return nfts
  }

  let cursor = null
  do {
    const response: any = await Moralis.Web3API.account.getNFTs({
      address,
      chain: getSupportedChain(chain),
      limit: 100,
      cursor,
    })
    nfts = nfts.concat(
      response.result.map((asset: any) => {
        if (typeof asset === 'object') {
          const name = `${asset.name} #${asset.token_id}`
          let imageUrl = ''
          const metadata = JSON.parse(asset.metadata)
          if (metadata !== null) {
            imageUrl = metadata.image
          }
          return {
            ...asset,
            name,
            image_url: imageUrl,
            owner: asset.owner_of,
          }
        }
      })
    )
    cursor = response.cursor
    await new Promise((f) => setTimeout(f, 1000))
  } while (cursor !== '' && cursor != null)

  return nfts
}

export default { getNFTs }
