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

supportRouter.get(
  '/version/releaseNotes',
  async (req, res) => {
    const version = req.query.version
    // TODO connect DB and get data by version
    const response = {
      latestVersion: version === 'latest' ? '1.5.11' : version, // TODO
      releaseNotes: [
        'NFT Introduced: Now showcase your NFTs under your profile.',
        'Automatically select a portion of your image as you hover over it and click. Saves time while making complex edits and delivers faster results.',
        'Import playable Lottie animations right into your prototype for lifelike motion',
        'Fine-tune the size and quality of your images with enhanced export controls.',
        'Runs natively on Apple Silicon devices. Experience faster load times, smoother navigation, and quick rendering.'
      ],
      videoUpdateUrl: 'https://www.youtube.com/embed/tgbNymZ7vqY'
    }
    returnSuccess(res, response)
  }
)

export default supportRouter
