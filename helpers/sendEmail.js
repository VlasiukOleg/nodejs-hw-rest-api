const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const dotenv = require('dotenv');
dotenv.config();

const {MAILGUN_API_KEY} = process.env;

const mg = mailgun.client({username: 'ikslprint@gmail.com', key: MAILGUN_API_KEY});




const sendEmail = async data => {
    mg.messages.create('sandboxe3ab5d04f5e84fa58b9963b80f0683a6.mailgun.org', {
        from: "Excited User <ikslprint@gmail.com>",
        to: [data.to],
        subject: "Verify your email",
        text: "Verify Email",
        html: data.html
    })
    .then(msg => console.log('Success-', msg)) // logs response data
    .catch(err => console.log(err)); // logs any error
}


module.exports = sendEmail;