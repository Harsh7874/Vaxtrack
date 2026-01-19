import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

// Create transporter once
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Gmail App Password
  },
});


transporter.verify((err, success) => {
  if (err) {
    console.log("SMTP CONNECTION ERROR:", err);
  } else {
    console.log("SMTP SERVER READY");
  }
});

export async function sendEmail({ to, subject, html }) {
  try {
    const mailOptions = {
      from: `HealthCare System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (error) {
    console.log("Email Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export  function vaccinationEmailTemplate({ name, vaccine, downloadUrl }) {

  return `
  <div style="font-family: Arial; max-width:600px; margin:auto">

    <h2>Vaccination Completed ✅</h2>

    <p>Dear <b>${name}</b>,</p>

    <p>
      Your vaccination for <b>${vaccine}</b> has been successfully completed.
      You can download your official certificate using the button below.
    </p>

    <a href="${downloadUrl}"
       style="
         background:#0b5ed7;
         color:white;
         padding:12px 18px;
         text-decoration:none;
         border-radius:6px;
         display:inline-block;
         margin:10px 0;
       ">
       Download Certificate
    </a>

    <p style="font-size:13px;color:gray">
      If button doesn't work, copy this link:<br/>
      ${downloadUrl}
    </p>

    <hr/>

    <p>Regards,<br/>HealthCare Team</p>

  </div>
  `;
}

