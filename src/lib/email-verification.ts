import prisma from './prisma';
import { sendEmail } from './email';

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createEmailVerification(email: string): Promise<string> {
  const code = generateVerificationCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing verification for this email
  await prisma.emailVerification.deleteMany({
    where: { email }
  });

  // Create new verification
  await prisma.emailVerification.create({
    data: {
      email,
      code,
      expires,
      verified: false
    }
  });

  // Send verification email
  await sendVerificationEmail(email, code);

  return code;
}

export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  const verification = await prisma.emailVerification.findUnique({
    where: { email }
  });

  if (!verification) {
    return false;
  }

  if (verification.expires < new Date()) {
    // Code expired
    await prisma.emailVerification.delete({
      where: { email }
    });
    return false;
  }

  if (verification.code !== code) {
    return false;
  }

  // Mark as verified
  await prisma.emailVerification.update({
    where: { email },
    data: { verified: true }
  });

  return true;
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const subject = 'Verify your email - Legal-Ge';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Thank you for registering with Legal-Ge!</p>
      <p>Please use the following 6-digit code to verify your email address:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
      </div>
      <p style="color: #666;">This code will expire in 10 minutes.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
      <hr style="margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">Legal-Ge Team</p>
    </div>
  `;

  try {
    await sendEmail(email, subject, html);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function cleanupExpiredVerifications(): Promise<void> {
  await prisma.emailVerification.deleteMany({
    where: {
      expires: {
        lt: new Date()
      }
    }
  });
}
