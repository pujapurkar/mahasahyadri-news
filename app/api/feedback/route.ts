import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ status: 'ERR', message: 'All fields are required' });
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.FEEDBACK_EMAIL!,
      subject: `New Feedback from ${name}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return NextResponse.json({ status: 'OK', message: 'Feedback sent successfully' });
  } catch (e: any) {
    console.error('Feedback Error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}