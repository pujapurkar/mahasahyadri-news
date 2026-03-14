import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ status: 'ERR', message: 'All fields required' });
    }

    // Send email to admin (NO DATABASE)
    try {
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
        from: `"महासह्याद्री Feedback" <${process.env.FROM_EMAIL}>`,
        to: process.env.FEEDBACK_EMAIL || 'mahasahyadri.press@gmail.com',
        replyTo: email, // User ka email - reply directly user ko jayega
        subject: '📝 New Feedback - महासह्याद्री',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0; font-size: 24px;">📝 नवीन फीडबॅक</h2>
            </div>
            <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="margin: 10px 0;"><strong>नाव:</strong> ${name}</p>
              <p style="margin: 10px 0;"><strong>ईमेल:</strong> <a href="mailto:${email}" style="color: #27A4F3;">${email}</a></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>संदेश:</strong></p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #27A4F3;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 20px; text-align: right;">
                📅 Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
            </div>
          </div>
        `,
      });

      return NextResponse.json({ status: 'OK', message: 'Feedback submitted successfully' });
    } catch (emailErr: any) {
      console.error('Email send error:', emailErr);
      return NextResponse.json({ status: 'ERR', message: 'Failed to send email: ' + emailErr.message });
    }
  } catch (e: any) {
    console.error('Feedback error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}