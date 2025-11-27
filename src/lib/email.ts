import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendBoardInvite(
    toEmail: string,
    boardTitle: string,
    boardId: string,
    inviterName: string
) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/boards/${boardId}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject: `You've been invited to colaborate on "${boardTitle}"`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">You've been invited to colaborate!</h2>
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> has invited you to colaborate on the board <strong>"${boardTitle}"</strong> on Trellify.</p>
        <p>Click the button below to view the board:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Board</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${inviteLink}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Happy colaborating!</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
    
}
