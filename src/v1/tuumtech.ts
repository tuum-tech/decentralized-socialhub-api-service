import express from 'express';
import { returnSuccess, sendMail } from './commom';

const tuumtech = express.Router();

tuumtech.post('/contact', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/tuumtech/contact");

    // tslint:disable-next-line:no-console
    console.info(`entry: ${JSON.stringify(req.body)}`);
    const { subject, from, description } = req.body;

    const text = description;
    const html = description;

    await sendMail(from, `[Contact] ${subject}`, process.env.EMAIL_SUPPORT, text, html);

    returnSuccess(res, {});
});

tuumtech.post('/support', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/tuumtech/support");

    // tslint:disable-next-line:no-console
    console.info(`entry: ${JSON.stringify(req.body)}`);
    const { subject,feedback_type,from,comments,attachments} = req.body;

    const text = `${feedback_type} : ${comments}`;

    const html = `<h3>${feedback_type} :</h3><p>${comments}</p>`;

    await sendMail(from, `[${feedback_type}] ${subject}`, process.env.EMAIL_SUPPORT, text, html);

    returnSuccess(res, {});
});


export default tuumtech;