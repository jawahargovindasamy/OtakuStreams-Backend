import axios from "axios";
import logger from "../utils/logger.js";

const sendEmail = async (options) => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    logger.error("RESEND_API_KEY is not defined in environment variables");
    throw new Error("Email service is not configured properly");
  }

  const message = {
    from: process.env.EMAIL_FROM, // Note: For Resend, this must be a verified domain
    to: [options.to],
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const res = await axios.post("https://api.resend.com/emails", message, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    logger.info("Email sent successfully via Resend", {
      to: options.to?.replace(/(.{2}).+(@.+)/, "$1***$2"), // mask email
      subject: options.subject,
      id: res.data?.id,
    });
    return true;
  } catch (error) {
    logger.error("Email sending failed", {
      to: options.to?.replace(/(.{2}).+(@.+)/, "$1***$2"),
      subject: options.subject,
      message: error.response?.data?.message || error.message,
    });
    const err = new Error("Email could not be sent");
    err.statusCode = 500;
    throw err;
  }
};

export const sendPasswordResetEmail = async (email, newPassword) => {
  logger.info("Password reset email triggered", {
    email: email?.replace(/(.{2}).+(@.+)/, "$1***$2"),
  });
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
  logger.info("Password changed confirmation email triggered", {
    email: email?.replace(/(.{2}).+(@.+)/, "$1***$2"),
  });
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

export const sendWelcomeEmail = async (email, username) => {
  logger.info("Welcome email triggered", {
    email: email?.replace(/(.{2}).+(@.+)/, "$1***$2"),
  });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6C5CE7; margin: 0;">OtakuStreams</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #333; margin-top: 0;">Welcome to the club, ${username}! 🎉</h2>
        <p style="color: #555; line-height: 1.6; font-size: 16px;">We are absolutely thrilled to have you join the OtakuStreams community! Your anime journey is about to get a whole lot better.</p>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px;">Here is what you can do right now to get started:</p>
        <ul style="color: #555; line-height: 1.6; font-size: 16px; padding-left: 20px;">
          <li style="margin-bottom: 10px;"><strong>Build Your Watchlist:</strong> Keep track of everything you're watching, completed, or planning to watch.</li>
          <li style="margin-bottom: 10px;"><strong>Never Miss an Episode:</strong> We will automatically notify you the moment a new episode of your favorite anime airs!</li>
          <li style="margin-bottom: 10px;"><strong>Continue Watching:</strong> We'll save your exact playback timestamp so you can jump right back into the action.</li>
        </ul>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px; margin-top: 25px;">Grab your snacks, get comfortable, and enjoy the show!</p>
        <p style="color: #555; line-height: 1.6; font-size: 16px;">— The OtakuStreams Team 💖</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `🎉 Welcome to OtakuStreams, ${username}! Your Anime Journey Starts Here ✨`,
    text: `Welcome to OtakuStreams, ${username}! We are thrilled to have you join our community.`,
    html,
  });
};

export default sendEmail;
