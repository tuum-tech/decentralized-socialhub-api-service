interface INFTMetadata {
  isVerified: boolean
  categories: object
  collectionName: string
  description: string
  email?: string
  erc721Address?: string
  logoImageHash: string
  coverImageHash: string
  owner: string
  siteUrl: string
  status: boolean
  twitterHandle?: string
  isInternal: boolean
  isOwnerble: boolean
  isAppropriate: boolean
}

const getNFTMetadata = async (address: string): Promise<INFTMetadata> => {
  let nftMetadata: INFTMetadata

  // tslint:disable-next-line:no-console
  console.log(
    `Using Elacity API to get NFT metadata for the address '${address}'`
  )

  if (address.replace(/\s/g, '') === '') {
    // tslint:disable-next-line:no-console
    console.log(`Address: '${address}' is empty`)
    return nftMetadata
  }

  const elacityAPIUrl = 'https://ela.city/api/collection/getCollectionInfo'
  const result = await fetch(elacityAPIUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contractAddress: address,
    }),
  })

  const { status, statusText } = result

  if (status === 200 && statusText === 'OK') {
    const dataJson = await result.json()
    if (dataJson.status === 'success') {
      nftMetadata = dataJson.data
    }
  } else {
    // tslint:disable-next-line:no-console
    console.log(`Error retrieving NFT metadata for address '${address}'`)
  }
  return nftMetadata
}

const getNFTAssets = async (address: string, isCollection: boolean = false) => {
  // tslint:disable-next-line:no-console
  console.log(
    `Using Elacity API to retrieve NFT assets for the address '${address}' on the 'ESC' network`
  )

  let assets: any = []

  if (address.replace(/\s/g, '') === '') {
    // tslint:disable-next-line:no-console
    console.log(`Address: '${address}' is empty`)
    return assets
  }

  const nftMetadata = await getNFTMetadata(address)
  if (nftMetadata && nftMetadata.erc721Address) {
    const elacityAPIUrl = 'https://ela.city/api/nftitems/fetchTokens'
    let body = JSON.stringify({
      type: 'single',
      sortby: 'createdAt$desc',
      address,
    })
    if (isCollection === true) {
      body = JSON.stringify({
        type: 'single',
        sortby: 'createdAt$desc',
        collectionAddresses: [address],
      })
    }
    const result = await fetch(elacityAPIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const { status, statusText } = result

    if (status === 200 && statusText === 'OK') {
      const data = await result.json()
      if (data.status === 'success') {
        assets = data.data.tokens.map((asset: any) => ({
          ...asset,
          name: asset.name,
          image_url: asset.imageURL,
          owner: asset.owner?.address,
          last_sale: asset.price
            ? {
                price: asset.price,
                token: 'ELA',
              }
            : null,
        }))
      }
    } else {
      // tslint:disable-next-line:no-console
      console.log(`Error retrieving NFT assets for address '${address}'`)
    }
  }

  // tslint:disable-next-line:no-console
  console.log(`Total NFTs for the address '${address}': ${assets.length}`)

  return assets
}

export default { getNFTMetadata, getNFTAssets }
