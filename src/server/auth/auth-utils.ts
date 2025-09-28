import bcrypt from 'bcryptjs';
import prisma from '@/server/db/prisma';
import { verifyEmailCode } from '@/server/email/verification';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export async function registerUser(data: RegisterData): Promise<{ success: boolean; message: string }> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user with automatic verification
    await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name || '',
        role: data.email === 'infolegalge@gmail.com' ? 'SUPER_ADMIN' : 'SUBSCRIBER',
        emailVerified: new Date() // Auto-verify immediately
      }
    });

    return { 
      success: true, 
      message: 'Registration successful! You can now sign in.' 
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed. Please try again.' };
  }
}

export async function verifyUserEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
  try {
    const isValid = await verifyEmailCode(email, code);
    
    if (!isValid) {
      return { success: false, message: 'Invalid or expired verification code' };
    }

    // Update user email verification status
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    });

    return { success: true, message: 'Email verified successfully!' };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, message: 'Email verification failed. Please try again.' };
  }
}

type PublicUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: 'SUBSCRIBER' | 'SPECIALIST' | 'COMPANY' | 'SUPER_ADMIN';
  companySlug: string | null;
  lawyerSlug: string | null;
  emailVerified: Date | null;
};

export async function loginUser(data: LoginData): Promise<{ success: boolean; message: string; user?: PublicUser }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user || !user.password) {
      return { success: false, message: 'Invalid email or password' };
    }

    const isValidPassword = await verifyPassword(data.password, user.password);
    
    if (!isValidPassword) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Email verification is no longer required

    // Remove password from response
  const { password, ...userWithoutPassword } = user as PublicUser & { password?: string | null };

    return { 
      success: true, 
      message: 'Login successful!',
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed. Please try again.' };
  }
}

