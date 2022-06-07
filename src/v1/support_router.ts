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

supportRouter.get('/version', async (req, res) => {
  const response = {
    latestVersion: '1.26.0',
    releaseNotes: [
      'Updated private spaces to have all the same features as community spaces such as being able to post and to link various social media sites to the space',
      'Updated space pages to be more mobile responsive',
      'Added search feature to Explore > Spaces, Connections and Spaces pages so users can now search for any people or any spaces within Profile',
      'Updated profile templates on profile manager page',
      'Fixed a bug whereby Connections page was crashing upon searching for spaces',
      'Added home tab to private spaces so owners and members of private spaces can create new discussion posts and followers can comment on these posts. This is the same feature that was already available to NFT collection spaces a while ago',
      'Added Cryptohoodieman and Maskhuman to NFT collection spaces',
      'Integrated new design for Referral page under Activities > Referrals',
    ],
    videoUpdateUrl: 'https://www.youtube.com/watch?v=1LlMPXi-7J4',
  }
  returnSuccess(res, response)
})

export default supportRouter
