import nodemailer from 'nodemailer';
import type { TransportOptions } from 'nodemailer';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

const SMTP_HOST = process.env.EMAIL_HOST ?? 'smtp.zoho.eu';
const SMTP_PORT = Number(process.env.EMAIL_PORT ?? 465);
const SMTP_SECURE = (process.env.EMAIL_SECURE ?? 'true').toLowerCase() !== 'false';
const DEFAULT_INBOX = process.env.CONTACT_INBOX ?? 'contact@legal.ge';
const FROM_ADDRESS = process.env.EMAIL_USER;

function ensureCredentials() {
  if (!FROM_ADDRESS || !process.env.EMAIL_PASS) {
    throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
  }
}

function createTransporter() {
  ensureCredentials();

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: FROM_ADDRESS,
      pass: process.env.EMAIL_PASS,
    },
  } as TransportOptions);
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM_ADDRESS!,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    console.log('=== EMAIL NOT SENT ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Error:', error);
    console.log('======================');
    throw error instanceof Error ? error : new Error('Failed to send email');
  }
}

export async function sendContactEmail(data: ContactFormData): Promise<void> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: FROM_ADDRESS!,
      to: DEFAULT_INBOX,
      subject: `New Contact Form Submission from ${data.name}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Contact Details</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
          <h3 style="color: #495057; margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${data.message}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px; font-size: 12px; color: #6c757d;">
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> LLC Legal Sandbox Georgia Contact Form</p>
        </div>
      </div>
    `,
      text: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}

Message:
${data.message}

Submitted: ${new Date().toLocaleString()}
From: LLC Legal Sandbox Georgia Contact Form
    `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Contact form email sent successfully to', DEFAULT_INBOX);
  } catch (error) {
    console.error('Error sending contact form email:', error);
    console.log('=== CONTACT FORM SUBMISSION (EMAIL NOT SENT) ===');
    console.log('Name:', data.name);
    console.log('Email:', data.email);
    console.log('Message:', data.message);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Error:', error);
    console.log('==============================================');
    throw error instanceof Error ? error : new Error('Failed to send email');
  }
}
