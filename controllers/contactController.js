import Contact from "../models/Contact.js";
import { STATUS_CODES } from "../constants/statusCodes.js";
import logger from "../utils/logger.js";
import axios from "axios";
import nodemailer from "nodemailer";
import sendEmail from "../utils/sendEmail.js";

// Helper function to send email via either Google Apps Script or Nodemailer SMTP
const sendMailHelper = async (to, subject, text, html) => {
  // Option A: Use existing sendEmail (Google Apps Script) utility if configured
  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      await sendEmail({ to, subject, text, html });
      logger.info("Email sent successfully via Google Apps Script", {
        to: to.replace(/(.{2}).+(@.+)/, "$1***$2"),
        subject,
      });
      return true;
    } catch (err) {
      logger.error("Google Apps Script email failed, falling back to SMTP if configured", {
        message: err.message,
      });
    }
  }

  // Option B: Fall back to Nodemailer SMTP credentials if defined
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"OtakuStreams Support" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      logger.info("Email sent successfully via Nodemailer SMTP", {
        to: to.replace(/(.{2}).+(@.+)/, "$1***$2"),
        subject,
      });
      return true;
    } catch (err) {
      logger.error("Nodemailer SMTP email failed", { message: err.message });
    }
  }

  return false;
};

// Helper function to dispatch alerts asynchronously
const dispatchAlerts = async (submission) => {
  const { name, email, subject, message } = submission;

  // 1. Send Discord Webhook Alert
  if (process.env.DISCORD_CONTACT_WEBHOOK) {
    try {
      await axios.post(process.env.DISCORD_CONTACT_WEBHOOK, {
        embeds: [
          {
            title: `📩 New Support Inquiry: ${subject.toUpperCase()}`,
            color: 15548997, // Red/purple accent color
            fields: [
              { name: "From", value: `${name} (${email})`, inline: true },
              { name: "Category", value: subject, inline: true },
              { name: "Message", value: message },
            ],
            timestamp: new Date(),
          },
        ],
      });
      logger.info("Discord webhook alert sent for contact form submission");
    } catch (err) {
      logger.error("Failed to post message to Discord webhook", { message: err.message });
    }
  }

  // 2. Send Admin & Developer Notification Email
  const adminEmail = process.env.CONTACT_EMAIL || "jawahar@otakustreams.com";
  const developerEmail = process.env.DEVELOPER_EMAIL;

  const adminSubject = `📩 New Support Inquiry [${subject.toUpperCase()}]: from ${name}`;
  const adminHtml = `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        <!-- Header banner -->
        <tr>
          <td style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 0.5px;">OtakuStreams</h1>
            <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">New Support Ticket Received</p>
          </td>
        </tr>
        <!-- Main content -->
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #1a202c; margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">Hello Admin/Developer,</h2>
            <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 30px 0;">A new contact form submission has been received. Here are the details:</p>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #edf2f7; border-left: 4px solid #4a5568; margin-bottom: 30px;">
              <tr>
                <td style="padding: 20px;">
                  <p style="color: #718096; margin: 0 0 5px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
                  <p style="color: #2d3748; margin: 0 0 15px 0; font-size: 14px; font-weight: 600;">${name} (&lt;${email}&gt;)</p>

                  <p style="color: #718096; margin: 0 0 5px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Category</p>
                  <p style="color: #2d3748; margin: 0 0 15px 0; font-size: 14px; font-weight: 600;">${subject.toUpperCase()}</p>
                  
                  <p style="color: #718096; margin: 0 0 5px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
                  <p style="color: #2d3748; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-line;">${message}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #edf2f7;">
            <p style="color: #a0aec0; margin: 0; font-size: 11px;">OtakuStreams Notification Engine</p>
          </td>
        </tr>
      </table>
    </div>
  `;
  const adminText = `New Support Inquiry from ${name} (${email}): ${message}`;

  // Send to Admin
  await sendMailHelper(adminEmail, adminSubject, adminText, adminHtml);

  // Send to Developer (if configured)
  if (developerEmail) {
    const devSubject = `🛠️ [Dev Alert] New Submission [${subject.toUpperCase()}]: from ${name}`;
    const devHtml = `
      <div style="background-color: #0f172a; padding: 40px 20px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25); border: 1px solid #334155;">
          <!-- Header banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-bottom: 2px solid #3b82f6;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">&lt;OtakuStreams /&gt;</h1>
              <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Developer Alert: Contact Submit</p>
            </td>
          </tr>
          <!-- Main content -->
          <tr>
            <td style="padding: 30px; color: #cbd5e1;">
              <h2 style="color: #f8fafc; margin: 0 0 15px 0; font-size: 18px; font-weight: 700; border-bottom: 1px solid #334155; padding-bottom: 10px;">[System Notification]</h2>
              <p style="color: #94a3b8; line-height: 1.5; font-size: 14px; margin: 0 0 25px 0;">A new contact form document has been instantiated in the database. Details follow:</p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px; font-size: 13px; line-height: 1.6;">
                    <span style="color: #64748b;">// METADATA</span><br>
                    <strong style="color: #3b82f6;">Document ID:</strong> <span style="color: #e2e8f0;">${submission._id}</span><br>
                    <strong style="color: #3b82f6;">Timestamp:</strong> <span style="color: #e2e8f0;">${submission.createdAt || new Date().toISOString()}</span><br>
                    <strong style="color: #3b82f6;">Environment:</strong> <span style="color: #e2e8f0;">${process.env.NODE_ENV || 'production'}</span><br><br>
                    
                    <span style="color: #64748b;">// PAYLOAD</span><br>
                    <strong style="color: #3b82f6;">Sender Name:</strong> <span style="color: #e2e8f0;">${name}</span><br>
                    <strong style="color: #3b82f6;">Sender Email:</strong> <span style="color: #e2e8f0;">${email}</span><br>
                    <strong style="color: #3b82f6;">Category:</strong> <span style="color: #e2e8f0;">${subject.toUpperCase()}</span><br><br>
                    
                    <span style="color: #64748b;">// USER MESSAGE</span><br>
                    <div style="background-color: #1e293b; padding: 15px; border-radius: 6px; border: 1px solid #334155; color: #cbd5e1; margin-top: 5px; white-space: pre-line;">
                      ${message}
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; line-height: 1.5; font-size: 12px; margin: 0;">* This is an automated diagnostic alert generated by the OtakuStreams Express backend service.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; margin: 0; font-size: 11px;">OtakuStreams DevEngine v1.0.0</p>
            </td>
          </tr>
        </table>
      </div>
    `;
    const devText = `[Dev Alert] New Submission [${subject.toUpperCase()}]\nID: ${submission._id}\nTimestamp: ${submission.createdAt || new Date().toISOString()}\nFrom: ${name} (${email})\nMessage:\n${message}`;

    await sendMailHelper(developerEmail, devSubject, devText, devHtml);
  }


  // 3. Send User Acknowledgment Email
  const emailTemplates = {
    general: {
      subject: "We have received your inquiry - OtakuStreams Support",
      title: "General Inquiry Received",
      description: "Thank you for contacting OtakuStreams. We have received your general inquiry and our support team will review it. We appreciate you taking the time to write to us and will get back to you as soon as possible.",
    },
    bug: {
      subject: "Bug Report Received - OtakuStreams Support",
      title: "Bug Report Received",
      description: "Thank you for reporting a technical issue on OtakuStreams. We appreciate your help in making our platform better. Our development team has received your bug report and will investigate the issue. We may contact you if we need any additional details.",
    },
    business: {
      subject: "Business Inquiry Received - OtakuStreams Partnerships",
      title: "Business Inquiry Received",
      description: "Thank you for reaching out regarding business opportunities with OtakuStreams. We have received your proposal/inquiry and it has been forwarded to our partnerships team. We will review the details and get in touch with you shortly if there is a mutual fit.",
    },
    dmca: {
      subject: "DMCA / Copyright Notice Received - OtakuStreams Legal",
      title: "DMCA / Copyright Notice Received",
      description: "This email confirms that we have received your DMCA / Copyright compliance notification. We take intellectual property rights very seriously. Our legal compliance team is reviewing your notice and will address it promptly in accordance with applicable copyright laws.",
    },
    other: {
      subject: "Contact Inquiry Received - OtakuStreams Support",
      title: "Support Inquiry Received",
      description: "Thank you for reaching out to OtakuStreams support. We have received your inquiry and our team will review the details. We will get back to you as soon as possible.",
    },
  };

  const template = emailTemplates[subject] || emailTemplates.general;

  const userSubject = template.subject;
  const userHtml = `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        <!-- Header banner -->
        <tr>
          <td style="background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 0.5px;">OtakuStreams</h1>
            <p style="color: #e0dffc; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Support & Inquiries</p>
          </td>
        </tr>
        <!-- Main content -->
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #1a202c; margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">Hi ${name},</h2>
            <h3 style="color: #6c5ce7; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${template.title}</h3>
            <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 30px 0;">${template.description}</p>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #edf2f7; border-left: 4px solid #6c5ce7; margin-bottom: 30px;">
              <tr>
                <td style="padding: 20px;">
                  <p style="color: #718096; margin: 0 0 5px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Category</p>
                  <p style="color: #2d3748; margin: 0 0 15px 0; font-size: 14px; font-weight: 600;">${subject.toUpperCase()}</p>
                  
                  <p style="color: #718096; margin: 0 0 5px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Your Message</p>
                  <p style="color: #2d3748; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-line; font-style: italic;">"${message}"</p>
                </td>
              </tr>
            </table>
            
            <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 10px 0;">If you need to add any details, simply reply to this email directly.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #edf2f7;">
            <p style="color: #718096; margin: 0 0 8px 0; font-size: 13px;">Thank you for using OtakuStreams.</p>
            <p style="color: #a0aec0; margin: 0; font-size: 11px;">&copy; 2026 OtakuStreams. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;
  const userText = `Hi ${name},\n\n${template.title}\n\n${template.description}\n\nSubmitted Inquiry Details:\nCategory: ${subject.toUpperCase()}\nMessage:\n${message}\n\nBest regards,\nThe OtakuStreams Team`;

  await sendMailHelper(email, userSubject, userText, userHtml);
};


// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const contactMessage = await Contact.create({
      name,
      email,
      subject,
      message,
    });

    logger.info("Contact form submitted successfully", {
      contactId: contactMessage._id,
      email: email.replace(/(.{2}).+(@.+)/, "$1***$2"),
    });

    // Send notifications asynchronously
    dispatchAlerts(contactMessage);

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "Your message has been received successfully!",
      data: contactMessage,
    });
  } catch (error) {
    logger.error("Error saving contact message", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: "Internal server error. Failed to save message.",
    });
  }
};
