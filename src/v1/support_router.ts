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

export default supportRouter;
