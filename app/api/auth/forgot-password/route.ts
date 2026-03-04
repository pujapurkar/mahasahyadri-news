import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { generateOTP, maskEmail } from '@/lib/utils';

// In-memory OTP storage (production mein Redis use karo)
const otpStore = new Map<string, { otp: string; expiry: number }>();

export async function POST(req: Request) {
  try {
    const { action, email, otp, newPassword } = await req.json();

    // Action 1: Send OTP
    if (action === 'sendOTP') {
      if (!email?.trim()) {
        return NextResponse.json({ status: 'ERR', message: 'Email is required' });
      }

      const db = await getDB();
      const result = await db
        .request()
        .input('email', sql.NVarChar, email)
        .query('SELECT Email FROM AdminUsers WHERE Email = @email');

      if (result.recordset.length === 0) {
        return NextResponse.json({ status: 'ERR', message: 'Email not found in admin records' });
      }

      // Generate OTP
      const generatedOTP = generateOTP();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set(email, { otp: generatedOTP, expiry });

      // Send email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"महासह्याद्री Admin" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Password Reset OTP - महासह्याद्री',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#1e88e5 0%,#64b5f6 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
              <h1 style="color:white;margin:0;font-size:28px;">🔐 Password Reset</h1>
            </div>
            <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
              <p style="font-size:16px;color:#333;">Your OTP for password reset is:</p>
              <div style="background:white;border:2px dashed #1e88e5;padding:20px;text-align:center;margin:20px 0;border-radius:8px;">
                <span style="font-size:36px;font-weight:bold;color:#1e88e5;letter-spacing:8px;">${generatedOTP}</span>
              </div>
              <p style="color:#666;font-size:14px;">This OTP is valid for <strong>10 minutes</strong>.</p>
              <p style="color:#666;font-size:14px;">If you didn't request this, please ignore this email.</p>
            </div>
          </div>
        `,
      });

      return NextResponse.json({
        status: 'OK',
        message: `OTP sent successfully to ${maskEmail(email)}. Please check your email.`,
      });
    }

    // Action 2: Verify OTP
    if (action === 'verifyOTP') {
      if (!email || !otp) {
        return NextResponse.json({ status: 'ERR', message: 'Email and OTP are required' });
      }

      const stored = otpStore.get(email);
      if (!stored) {
        return NextResponse.json({ status: 'ERR', message: 'OTP not found or expired' });
      }

      if (Date.now() > stored.expiry) {
        otpStore.delete(email);
        return NextResponse.json({ status: 'ERR', message: 'OTP expired. Please request a new one.' });
      }

      if (stored.otp !== otp.trim()) {
        return NextResponse.json({ status: 'ERR', message: 'Invalid OTP. Please try again.' });
      }

      return NextResponse.json({ status: 'OK', message: 'OTP verified successfully!' });
    }

    // Action 3: Reset Password
    if (action === 'resetPassword') {
      if (!email || !newPassword) {
        return NextResponse.json({ status: 'ERR', message: 'Email and new password are required' });
      }

      const stored = otpStore.get(email);
      if (!stored) {
        return NextResponse.json({ status: 'ERR', message: 'Session expired. Please start over.' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update database
      const db = await getDB();
      await db
        .request()
        .input('email', sql.NVarChar, email)
        .input('password', sql.NVarChar, hashedPassword)
        .query('UPDATE AdminUsers SET PasswordHash = @password WHERE Email = @email');

      // Clear OTP
      otpStore.delete(email);

      return NextResponse.json({
        status: 'OK',
        message: 'Password reset successfully! Redirecting to login...',
      });
    }

    return NextResponse.json({ status: 'ERR', message: 'Invalid action' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({
      status: 'ERR',
      message: 'Server error: ' + error.message,
    });
  }
}