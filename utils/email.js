const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');


module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.from = `Beny <${process.env.EMAIL_FROM}>`;
        this.firstname = user.name.split(' ')[0];
        this.url = url;        
    }
    
    newTransport() {
        if (process.env.NODE_ENV === 'production') {  
                // Sendgrid
                  // 用不到
            return 1;
            // // 註冊失敗先跳過
            // return nodemailer.createTransport({
            //     service: 'SendGrid',
            //     auth: {
            //     user: process.env.SENDGRID_USERNAME,
            //     pass: process.env.SENDGRID_PASSWORD
            //     }
            // });
        }
        return nodemailer.createTransport({
            //service : 'Gmail',
            host:process.env.EMAIL_HOST,
            port:process.env.EMAIL_PORT,
            auth:{
                user:process.env.EMAIL_USER,
                pass:process.env.EMAIL_PASSWORD,
            }
        });        
    }   
    
    async send(template, subject){
        // 1) PUG html template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`,
            {
                firstname: this.firstname,
                url: this.url,
                subject: subject
            }
        )
        
        // 2) define email options
        const mailOptions ={
            from: this.from,
            to: this.to,
            subject: subject,
            html: html,
            text: htmlToText.fromString(html),
        }        
        
        await this.newTransport().sendMail(mailOptions);
    }
    
    async sendWelcome(){
        await this.send('Welcome', 'Welcome to the Natours Family');
    }
    
    async sendPasswordReset(){
        console.log('sendPasswordReset');
        await this.send('passwordReset', 'Your password reset token (only for 10 minutes)');
    }
}

//舊的
// const sendmail = async options =>{
//     // 1) Create a transporter
//     console.log(process.env.EMAIL_HOST)
//     console.log(process.env.EMAIL_PORT)
//     console.log(process.env.EMAIL_USER)
//     console.log(process.env.EMAIL_PASSWORD)
//     const transporter = nodemailer.createTransport({
//         //service : 'Gmail',
//         host:process.env.EMAIL_HOST,
//         port:process.env.EMAIL_PORT,
//         auth:{
//             user:process.env.EMAIL_USER,
//             pass:process.env.EMAIL_PASSWORD,
//         }
//     });
//     console.log(options.email)
//     console.log(options.subject)
//     console.log(options.message)
//     // 2) Defend the email options
//     const mailOptions ={
//         from: 'beny beny@beny.io',
//         to: options.email,
//         subject: options.subject,
//         text:options.message,          
//     }
    
//     // 3) Actually send the email
//     const mes = await transporter.sendMail(mailOptions);
//     console.log(mes);
// }

// module.exports = sendmail;