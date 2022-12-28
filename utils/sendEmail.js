const nodemailer = require("nodemailer");

// exports.mailTransport = () =>
//     nodemailer.createTransport({
//         host: "smtp.mailtrap.io",
//         port: 2525,
//         auth: {
//             user: process.env.SMS_USER,
//             pass: process.env.SMS_PASS,
//         },
//     });


const mailTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use TLS
    auth: {
        user: process.env.SMS_USER,
        pass: process.env.SMS_PASS,
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
    },
});

mailTransport.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
    }
});

module.exports = { mailTransport }

