import createTransporter from "../config/email.js";

const sendEmail = async (options) => {
  const transporter = createTransporter();

  const message = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Email could not be sent");
  }
};

export const sendPasswordResetEmail = async (email, newPassword) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Your password has been reset successfully. Here is your new temporary password:</p>
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <code style="font-size: 18px; font-weight: bold; color: #e74c3c;">${newPassword}</code>
      </div>
      <p>Please login with this password and change it immediately for security reasons.</p>
      <p style="color: #666; font-size: 12px;">If you didn't request this reset, please contact support immediately.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Your New Password - Anime Stream",
    text: `Your new password is: ${newPassword}. Please change it after login.`,
    html,
  });
};

export const sendPasswordChangedEmail = async (email) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Changed Successfully</h2>
      <p>Your password has been changed successfully.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Password Changed - Anime Stream",
    text: "Your password has been changed successfully.",
    html,
  });
};

export default sendEmail;
