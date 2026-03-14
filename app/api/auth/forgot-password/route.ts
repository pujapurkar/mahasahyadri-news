import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { step, email, otp, newPassword } = await req.json();

    const db = await getDB();

    // Step 1: Send OTP
    if (step === '1') {
      if (!email) {
        return NextResponse.json({ status: 'ERR', message: 'Email required' });
      }

      const result = await db
        .request()
        .input('email', sql.NVarChar, email)
        .query('SELECT AdminId, FullName FROM AdminUsers WHERE Email = @email');

      if (!result.recordset.length) {
        return NextResponse.json({ status: 'ERR', message: 'Email not found' });
      }

      const user = result.recordset[0];
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      // Store OTP in database
      await db
        .request()
        .input('userId', sql.Int, user.AdminId)
        .input('otp', sql.NVarChar, otpCode)
        .input('expiry', sql.DateTime, expiry)
        .query(`
          IF EXISTS (SELECT 1 FROM PasswordResetOTP WHERE UserId = @userId)
            UPDATE PasswordResetOTP SET OTP = @otp, ExpiryTime = @expiry WHERE UserId = @userId
          ELSE
            INSERT INTO PasswordResetOTP (UserId, OTP, ExpiryTime) VALUES (@userId, @otp, @expiry)
        `);

      // Send OTP email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      // Send OTP to user
      await transporter.sendMail({
        from: `"महासह्याद्री Admin" <${process.env.FROM_EMAIL}>`,
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

      // Send notification to admin (rudan.kapade@gmail.com)
      try {
        await transporter.sendMail({
          from: `"महासह्याद्री System" <${process.env.FROM_EMAIL}>`,
          to: process.env.ADMIN_EMAIL || 'rudan.kapade@gmail.com',
          subject: '🔐 Password Reset Request Alert',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ff9800;">🔐 Password Reset Request</h2>
              <p><strong>User:</strong> ${user.FullName || 'N/A'}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>OTP Generated:</strong> ${otpCode}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              <p><strong>Valid Until:</strong> ${expiry.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">This is an automated alert from महासह्याद्री Admin System.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Admin notification error:', emailErr);
        // Continue even if admin email fails
      }

      return NextResponse.json({ status: 'OK', message: 'OTP sent to your email' });
    }

    // Step 2: Verify OTP
    if (step === '2') {
      if (!email || !otp) {
        return NextResponse.json({ status: 'ERR', message: 'Email and OTP required' });
      }

      const result = await db
        .request()
        .input('email', sql.NVarChar, email)
        .query('SELECT AdminId FROM AdminUsers WHERE Email = @email');

      if (!result.recordset.length) {
        return NextResponse.json({ status: 'ERR', message: 'Email not found' });
      }

      const userId = result.recordset[0].AdminId;

      const otpResult = await db
        .request()
        .input('userId', sql.Int, userId)
        .input('otp', sql.NVarChar, otp)
        .query('SELECT * FROM PasswordResetOTP WHERE UserId = @userId AND OTP = @otp AND ExpiryTime > GETDATE()');

      if (!otpResult.recordset.length) {
        return NextResponse.json({ status: 'ERR', message: 'Invalid or expired OTP' });
      }

      return NextResponse.json({ status: 'OK', message: 'OTP verified' });
    }

    // Step 3: Reset Password
    if (step === '3') {
      if (!email || !otp || !newPassword) {
        return NextResponse.json({ status: 'ERR', message: 'All fields required' });
      }

      const result = await db
        .request()
        .input('email', sql.NVarChar, email)
        .query('SELECT AdminId FROM AdminUsers WHERE Email = @email');

      if (!result.recordset.length) {
        return NextResponse.json({ status: 'ERR', message: 'Email not found' });
      }

      const userId = result.recordset[0].AdminId;

      // Verify OTP again
      const otpResult = await db
        .request()
        .input('userId', sql.Int, userId)
        .input('otp', sql.NVarChar, otp)
        .query('SELECT * FROM PasswordResetOTP WHERE UserId = @userId AND OTP = @otp AND ExpiryTime > GETDATE()');

      if (!otpResult.recordset.length) {
        return NextResponse.json({ status: 'ERR', message: 'Invalid or expired OTP' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db
        .request()
        .input('userId', sql.Int, userId)
        .input('password', sql.NVarChar, hashedPassword)
        .query('UPDATE AdminUsers SET PasswordHash = @password WHERE AdminId = @userId');

      // Delete used OTP
      await db
        .request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM PasswordResetOTP WHERE UserId = @userId');

      return NextResponse.json({ status: 'OK', message: 'Password reset successful' });
    }

    return NextResponse.json({ status: 'ERR', message: 'Invalid step' });
  } catch (e: any) {
    console.error('Forgot password error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}