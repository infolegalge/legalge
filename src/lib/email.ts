import nodemailer from 'nodemailer';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
  // Check if email configuration is available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    console.log('=== EMAIL NOT SENT (EMAIL NOT CONFIGURED) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('Timestamp:', new Date().toISOString());
    console.log('=============================================');
    throw new Error('Email service not configured. Please contact the administrator.');
  }

  // Create a transporter using Yahoo SMTP
  const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version if not provided
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log the email to console as fallback
    console.log('=== EMAIL NOT SENT (EMAIL FAILED) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Error:', error);
    console.log('=====================================');
    
    throw new Error('Failed to send email');
  }
}

export async function sendContactEmail(data: ContactFormData): Promise<void> {
  // Check if email configuration is available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    console.log('=== CONTACT FORM SUBMISSION (EMAIL NOT CONFIGURED) ===');
    console.log('Name:', data.name);
    console.log('Email:', data.email);
    console.log('Message:', data.message);
    console.log('Timestamp:', new Date().toISOString());
    console.log('==================================================');
    throw new Error('Email service not configured. Please contact the administrator.');
  }

  // Create a transporter using Yahoo SMTP
  const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
      user: process.env.EMAIL_USER, // Your Yahoo address
      pass: process.env.EMAIL_PASS, // Your Yahoo password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'legalgeinbox@yahoo.com',
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

  try {
    await transporter.sendMail(mailOptions);
    console.log('Contact form email sent successfully');
  } catch (error) {
    console.error('Error sending contact form email:', error);
    
    // Log the submission to console as fallback
    console.log('=== CONTACT FORM SUBMISSION (EMAIL FAILED) ===');
    console.log('Name:', data.name);
    console.log('Email:', data.email);
    console.log('Message:', data.message);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Error:', error);
    console.log('===============================================');
    
    throw new Error('Failed to send email');
  }
}
