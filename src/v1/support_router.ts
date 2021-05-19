import express from "express";
import { returnSuccess, sendMail } from "./commom";

const supportRouter = express.Router();

supportRouter.post("/send_email", async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info("Executing: /v1/support_router/send_email");

  // tslint:disable-next-line:no-console
  console.info(`entry: ${JSON.stringify(req.body)}`);
  const { subject, userinfo, description, attachments } = req.body;

  const html = `<p>${JSON.stringify(userinfo)}</p>
  <p>${description}</p>`;

  await sendMail(
    process.env.EMAIL_CONTACT,
    subject,
    process.env.EMAIL_CONTACT,
    "",
    html,
    attachments
  );

  returnSuccess(res, {});
});


supportRouter.post("/github/:owner/:repos/issues", async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info("Executing: /v1/support_router/github/issues");

  const postData: any = {
    method: 'GET',
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': 'Basic ' + Buffer.from(`${process.env.GITHUB_API_USER}:${process.env.GITHUB_API_TOKEN}`).toString('base64')
    }
  };

  const fetchResponse = await fetch(`https://api.github.com/repos/${req.params.owner}/${req.params.repos}/issues`, postData);
  const response = await fetchResponse.json();

  returnSuccess(res, response);
});

export default supportRouter;
