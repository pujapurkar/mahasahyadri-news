import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { step, email, otp, newPassword } = await req.json();

    // Step 1: Send OTP
    if (step === '1') {
      if (!email) {
        return NextResponse.json({ status: 'ERR', message: 'Email required' });
      }

      const result = await query(
        'SELECT "AdminId", "FullName" FROM "AdminUsers" WHERE "Email" = $1',
        [email]
      );

      if (!result.rows.length) {
        return NextResponse.json({ status: 'ERR', message: 'Email not found' });
      }

      const user = result.rows[0];
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      // Upsert OTP
      await query(
        `INSERT INTO "PasswordResetOTP" ("UserId", "OTP", "ExpiryTime")
         VALUES ($1, $2, $3)
         ON CONFLICT ("UserId")
         DO UPDATE SET "OTP" = $2, "ExpiryTime" = $3`,
        [user.AdminId, otpCode, expiry]
      );

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
        from: `"महासह्याद्री Admin" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Password Reset OTP - महासह्याद्री',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #27A4F3;">Password Reset Request</h2>
            <p>Hello ${user.FullName || 'Admin'},</p>
            <p>Your OTP for password reset is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #27A4F3; border-radius: 8px; margin: 20px 0;">
              ${otpCode}
            </div>
            <p>This OTP is valid for 10 minutes.</p>
            <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      });

      try {
        await transporter.sendMail({
          from: `"महासह्याद्री System" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || 'rudan.kapade@gmail.com',
          subject: '🔐 Password Reset Request Alert',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ff9800;">🔐 Password Reset Request</h2>
              <p><strong>User:</strong> ${user.FullName || 'N/A'}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              <p><strong>Valid Until:</strong> ${expiry.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Admin notification error:', emailErr);
      }

      return NextResponse.json({ status: 'OK', message: 'OTP sent to your email' });
    }

    // Step 2: Verify OTP
    if (step === '2') {
      if (!email || !otp) {
        return NextResponse.json({ status: 'ERR', message: 'Email and OTP required' });
      }

      const result = await query(
        'SELECT "AdminId" FROM "AdminUsers" WHERE "Email" = $1',
        [email]
      );

      if (!result.rows.length) {
        return NextResponse.json({ status: 'ERR', message: 'Email not found' });
      }

      const userId = result.rows[0].AdminId;

      const otpResult = await query(
        `SELECT * FROM "PasswordResetOTP" 
         WHERE "UserId" = $1 AND "OTP" = $2 AND "ExpiryTime" > NOW()`,
        [userId, otp]
      );

      if (!otpResult.rows.length) {
        return NextResponse.json({ status: 'ERR', message: 'Invalid or expired OTP' });
      }

      return NextResponse.json({ status: 'OK', message: 'OTP verified' });
    }

    // Step 3: Reset Password
    if (step === '3') {
      if (!email || !otp || !newPassword) {
        return NextResponse.json({ status: 'ERR', message: 'All fields required' });
      }

      const result = await query(
        'SELECT "AdminId" FROM "AdminUsers" WHERE "Email" = $1',
        [email]
      );

      if (!result.rows.length) {
        return NextResponse.json({ status: 'ERR', message: 'Email not found' });
      }

      const userId = result.rows[0].AdminId;

      const otpResult = await query(
        `SELECT * FROM "PasswordResetOTP" 
         WHERE "UserId" = $1 AND "OTP" = $2 AND "ExpiryTime" > NOW()`,
        [userId, otp]
      );

      if (!otpResult.rows.length) {
        return NextResponse.json({ status: 'ERR', message: 'Invalid or expired OTP' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await query(
        'UPDATE "AdminUsers" SET "PasswordHash" = $1 WHERE "AdminId" = $2',
        [hashedPassword, userId]
      );

      await query(
        'DELETE FROM "PasswordResetOTP" WHERE "UserId" = $1',
        [userId]
      );

      return NextResponse.json({ status: 'OK', message: 'Password reset successful' });
    }

    return NextResponse.json({ status: 'ERR', message: 'Invalid step' });
  } catch (e: any) {
    console.error('Forgot password error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}