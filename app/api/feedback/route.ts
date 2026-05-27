import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({
        status: 'ERR',
        message: 'All fields are required'
      });
    }

    // Gmail transporter
    const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.FEEDBACK_EMAIL,
      pass: process.env.FEEDBACK_EMAIL_PASSWORD,
    },
  });

    // Send email
    await transporter.sendMail({
    from: process.env.FEEDBACK_EMAIL,
    to: process.env.FEEDBACK_EMAIL,
    subject: `New Feedback from ${name}`,
    html: `
      <h2>New Feedback Received</h2>

      <p><strong>Name:</strong> ${name}</p>

      <p><strong>Email:</strong> ${email}</p>

      <p><strong>Message:</strong></p>

      <p>${message}</p>
    `,
  });
    return NextResponse.json({
      status: 'OK',
      message: 'Feedback sent successfully',
    });

  } catch (e: any) {

    console.error('Feedback Error:', e);

    return NextResponse.json({
      status: 'ERR',
      message: e.message,
    });
  }
}