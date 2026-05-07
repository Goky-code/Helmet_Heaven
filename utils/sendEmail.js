import nodemailer from "nodemailer";


export const sendEmail = async (email,subject, otp) => {

  
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS 
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email, 
            subject: subject,
           text: `${otp}`
           
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: " + info.response); 
    } catch (error) {
        console.error("Email send failed: ", error); 
    }
};
export default sendEmail;