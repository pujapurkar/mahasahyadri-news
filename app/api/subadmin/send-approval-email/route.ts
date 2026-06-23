import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { query } from '@/lib/db'; // ✅ pool नाही, query वापरा

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    // ✅ query function वापरतो
    const result = await query(
      'SELECT "Username", "Email" FROM "SubAdminRequests" WHERE "Id" = $1',
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ status: 'ERROR', message: 'User not found' });
    }

    const { Username, Email } = result.rows[0];
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/subadmin/login`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD, // ✅ नवीन App Password
      },
    });

   await transporter.sendMail({
  from: `"MahaSahyadri Admin" <${process.env.SMTP_USER}>`,
  to: Email,
  subject: '✅ Sub Admin Request Approved - MahaSahyadri',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; 
                margin: 0 auto; padding: 30px; 
                border: 1px solid #e0e0e0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1e88e5;">🏔️ MahaSahyadri</h2>
      </div>
      <div style="background: #eaf3de; border-radius: 8px; 
                  padding: 20px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px;">✅</div>
        <h3 style="color: #3B6D11; margin: 8px 0;">Request Approved!</h3>
      </div>

      <p>Hello <strong>${Username}</strong>,</p>
      <br/>
      <p>Admin has <strong>Approved</strong> your Sub Admin Request.</p>
      <p>You can now login using the button below:</p>
      <br/>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${loginUrl}"
          style="background: linear-gradient(135deg, #1e88e5, #42a5f5); 
                 color: white; padding: 14px 36px; border-radius: 8px; 
                 text-decoration: none; font-weight: 600; font-size: 15px;
                 display: inline-block;">
          🔗 Sub Admin Login
        </a>
      </div>

      <p style="color: #888; font-size: 13px; text-align: center;">
        Or copy this URL: 
        <a href="${loginUrl}" style="color: #1e88e5;">${loginUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        MahaSahyadri | mahasahyadri.press@gmail.com
      </p>
    </div>
  `,
});
    return NextResponse.json({ status: 'OK' });

  } catch (err) {
    console.error('Email error:', err);
    return NextResponse.json({ status: 'ERROR', message: String(err) });
  }
}