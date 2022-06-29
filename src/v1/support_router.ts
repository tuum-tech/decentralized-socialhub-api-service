import express from 'express'
import { returnSuccess, sendMail } from './common'

const supportRouter = express.Router()

supportRouter.post('/send_email', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/support_router/send_email')

  // tslint:disable-next-line:no-console
  console.info(`entry: ${JSON.stringify(req.body)}`)
  const { subject, userinfo, description, attachments } = req.body

  const html = `<p>${JSON.stringify(userinfo)}</p>
  <p>${description}</p>`

  await sendMail(
    process.env.EMAIL_CONTACT,
    subject,
    process.env.EMAIL_CONTACT,
    '',
    html,
    attachments
  )

  returnSuccess(res, {})
})

supportRouter.get('/github/:owner/:repos/issues', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/support_router/github/issues')

  const postData: any = {
    method: 'GET',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(
          `${process.env.GITHUB_API_USER}:${process.env.GITHUB_API_TOKEN}`
        ).toString('base64'),
    },
  }

  const fetchAllUrls = async (pages: number[]) => {
    try {
      const data = await Promise.all(
        pages.map((page) =>
          fetch(
            `https://api.github.com/repos/${req.params.owner}/${req.params.repos}/issues?accept=application/vnd.github.v3+json&state=all&per_page=100&page=${page}`,
            postData
          ).then((r) => r.json())
        )
      )
      return data
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error(
        'Error while executing: /v1/support_router/github/issues: ',
        error
      )
      return []
    }
  }

  const response = [].concat(...(await fetchAllUrls([1, 2, 3, 4, 5])))

  returnSuccess(res, response)
})

supportRouter.get(
  '/github/:owner/:repos/issues/:issueId/comments',
  async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info('Executing: /v1/support_router/github/issues')

    const postData: any = {
      method: 'GET',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization:
          'Basic ' +
          Buffer.from(
            `${process.env.GITHUB_API_USER}:${process.env.GITHUB_API_TOKEN}`
          ).toString('base64'),
      },
    }

    const fetchResponse = await fetch(
      `https://api.github.com/repos/${req.params.owner}/${req.params.repos}/issues/${req.params.issueId}/comments`,
      postData
    )
    const response = await fetchResponse.json()

    returnSuccess(res, response)
  }
)

supportRouter.get('/version/releaseNotes', async (req, res) => {
  const version = req.query.version
  // TODO connect DB and get data by version

  const response = {
    latestVersion: version === 'latest' ? '1.27.0' : version,
    releaseNotes: [
      'New onboarding and tutorial design integration with the removal of login with mnemonics(will only have Essentials login from now on). This is a major update that includes changes to the entirety of the logging mechanism of Profile with regards to Signing in using Essentials, Recover account using mnemonics and Creating a new user. This eliminates a security risk posed by previous method of logging in using mnemonics as this means even the browser does not store any sensitive data from now on',
      'Updated Explore > People page to only show users that have finished the new onboarding tutorial. We recommend everyone using Profile to login to Profile to complete the new onboarding process so you can be seen on Explore > People page',
      'Updated the "Request Community Space" feature by validating smart contract address and automated the creation of new NFT collection spaces',
      'Disabled the upload of avatar and cover image until the new onboarding tutorial is completed by the user',
      'Disabled verification requests until the new onboarding tutorial is completed by the user',
      'Now displaying a placeholder for NFTs on both Dashboard > NFTs and NFT collection spaces if the image url stored on the blockchain cannot be retrieved',
      'Improved error handling so the user gets informed anytime there is any error executing scripts on user hive node',
      'Fixed a bug on Connections page where the mututal follow page would sometimes not display any users',
      'Fixed a bug whereby the NFTs were not displaying correctly on Dashboard > NFTs',
      'Fixed a bug whereby the Follow and Unfollow was not working properly from public profiles',
      'Updated Profile API service to use Moralis SDK rather than Moralis REST API',
    ],
    videoUpdateUrl: 'https://www.youtube.com/embed/1LlMPXi-7J4',
  }
  returnSuccess(res, response)
})

/*
v1.26.3
      'Added a new feature on dashboard where users can view their NFTs for Elastos Smart Contract Chain and Ethereum',
      'Fixed a bug whereby /support-forum page was not displaying any github issues',
      'Removed all the Save buttons from Profile manager page and improved the UI to make interacting with different sections very intuitive. Data is saved automatically now',
      'Updated layout of settings page to make it mobile friendly',
      'Updated activities page to make it mobile friendly',

v1.26.2
      'Updated the way "Request Community Space" feature works. Users can now request any NFT collection community spaces to be added with just the smart contract address and we support 3 chains - Elastos, Ethereum and Polygon. NFT Collection spaces can be automatically added now with this new update',
      'Added the ability to change the category of private spaces. The new categories are: Personal Group, Creator, Business, DAO, Personal NFT Group, Other',
      'Updated the Profile API service to get the total number of users on Profile more efficiently and quickly: https://profile-api.tuum.tech/public_stats_router/get_new_users_by_date/all',
      'Users now get notified whenever there is a new Profile release with the release notes. Users will need to relogin each time there is a new update to Profile to resolve any issues they may encounter with the new release',
      'Optimized the Profile code to login much faster than before as we are now executing several items in parallel. We will continue to optimize the Profile code in the future',
      'Updated Connections page to make it mobile friendly',
      'Updated Activities page to make it mobile friendly'
v1.26.1:
      'Added social links and posts feature to private spaces and Welcome to Profile space(previously, these features only worked for NFT Collection spaces)',
      'Created a generic tooling library to store stuff like Logger, CacheManager, ConfigurationManager, Base64/SHA256, FileSystem, HttpClient, etc. This removes the duplicated code we have in different projects also introduces standards in some basic elements. The code is open source at https://github.com/tuum-tech/Elastos.Common.JS.Tools',
      'Added a new feature to Profile whereby upon new release of the webapp, the user will get notified of the new release including detailed release notes and a small video to explain that update. We will start to utilize this method to let users know of all the new updates that come to Profile from now on',
      'Updated space pages to be more mobile responsive',
      'Added search feature to Explore > Spaces, Connections and Spaces pages so users can now search for any people or any spaces within Profile',
      'Updated profile templates on profile manager page',
      'Fixed a bug whereby Connections page was crashing upon searching for spaces',
      'Added home tab to private spaces so owners and members of private spaces can create new discussion posts and followers can comment on these posts. This is the same feature that was already available to NFT collection spaces a while ago',
      'Added Cryptohoodieman and Maskhuman to NFT collection spaces',
      'Integrated new design for Referral page under Activities > Referrals'
*/

export default supportRouter
