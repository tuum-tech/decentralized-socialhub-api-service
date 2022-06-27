import BigNumber from 'bignumber.js'

interface INFTMetadata {
  stats: object
  success: boolean
}

const supportedChains = ['ethereum', 'eth', 'mainnet']

const getNFTMetadata = async (
  address: string,
  chain: string,
  collectionSlug: string
): Promise<INFTMetadata> => {
  const nftMetadata: INFTMetadata = {
    success: false,
    stats: {},
  }
  if (supportedChains.indexOf(chain) === -1) {
    // tslint:disable-next-line:no-console
    console.log(
      `${chain} is not currently supported. The valid chains are ${supportedChains}`
    )
    return nftMetadata
  }

  // tslint:disable-next-line:no-console
  console.log(
    `Using Opensea API to get NFT metadata for the address '${address}' and slug ${collectionSlug}`
  )

  if (address.replace(/\s/g, '') === '') {
    // tslint:disable-next-line:no-console
    console.log(`Address: '${address}' is empty`)
    return nftMetadata
  }

  const openseaAPIUrl = `https://api.opensea.io/api/v1/collection/${collectionSlug}/stats`
  const result = await fetch(openseaAPIUrl, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-API-Key': process.env.OPENSEA_API_KEY,
    },
  })
  const { status, statusText } = result

  if (status === 200 && statusText === 'OK') {
    const data = await result.json()
    if (data) {
      if (data.stats) {
        nftMetadata.stats = data.assets
        nftMetadata.success = true
      }
    }
  }
  return nftMetadata
}

const getNFTOwners = async (
  address: string,
  chain: string,
  collectionSlug: string
) => {
  if (supportedChains.indexOf(chain) === -1) {
    // tslint:disable-next-line:no-console
    console.log(
      `${chain} is not currently supported. The valid chains are ${supportedChains}`
    )
    return []
  }

  // tslint:disable-next-line:no-console
  console.log(
    `Using Opensea API to retrieve NFT assets for the address '${address}' on the '${chain}' network`
  )

  if (address.replace(/\s/g, '') === '') {
    // tslint:disable-next-line:no-console
    console.log(`Address: '${address}' is empty`)
    return []
  }

  let assets: any[] = []

  const nftMetadata = await getNFTMetadata(
    address,
    chain.toLowerCase(),
    collectionSlug
  )
  if (nftMetadata && nftMetadata.success === true) {
    let cursor = ''
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    try {
      do {
        const openseaAPIUrl = `https://api.opensea.io/api/v1/assets?collection_slug=${collectionSlug}&cursor=${cursor}&limit=50`
        const result = await fetch(openseaAPIUrl, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'X-API-Key': process.env.OPENSEA_API_KEY,
          },
        })

        const { status, statusText } = result

        if (status === 200 && statusText === 'OK') {
          const data = await result.json()
          // tslint:disable-next-line:no-console
          console.log(`'${address}': Retrieved one page`)

          cursor = data.next
          assets = assets.concat(
            data.assets.map((asset: any) => {
              const { name, image_url, owner, creator, last_sale } = asset
              return {
                name,
                image_url,
                owner:
                  owner.address === zeroAddress
                    ? creator.address
                    : owner.address,
                last_sale: last_sale
                  ? {
                      token: last_sale.payment_token.symbol,
                      price: new BigNumber(last_sale.total_price)
                        .dividedBy(
                          new BigNumber(10).pow(
                            last_sale.payment_token.decimals
                          )
                        )
                        .toNumber(),
                    }
                  : null,
              }
            })
          )
        } else {
          cursor = ''
        }
      } while (cursor !== '')
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.log(`Error retrieving NFT assets for address '${address}'`)
    }
  }

  // tslint:disable-next-line:no-console
  console.log(
    `Total NFTs for the address '${address}' and slug '${collectionSlug}': ${assets.length}`
  )
  return assets
}

export default { getNFTMetadata, getNFTOwners }
