import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ status: 'ERROR', message: 'ID required' });

    // DB मधून user चा email व username घे
    const result = await query(
      'SELECT "Username", "Email" FROM "SubAdminRequests" WHERE "Id" = $1',
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ status: 'ERROR', message: 'User not found' });
    }

    const { Username, Email } = result.rows[0];

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
      from: `"MahaSahyadri Admin" <${process.env.SMTP_USER}>`,
      to: Email,
      subject: 'Your Sub Admin Registration Request - Rejected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px;
                    margin: 0 auto; padding: 30px;
                    border: 1px solid #e0e0e0; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #1e88e5;">🏔️ MahaSahyadri</h2>
          </div>
          <div style="background: #fff3f3; border-radius: 8px;
                      padding: 20px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px;">❌</div>
            <h3 style="color: #c0392b; margin: 8px 0;">Request Rejected</h3>
          </div>

          <p>नमस्कार <strong>${Username}</strong>,</p>
          <br/>
          <p style="color: #555; line-height: 1.7;">
            आपला Sub Admin नोंदणीचा विनंती अर्ज
            <strong style="color:#c0392b;">नामंजूर (Rejected)</strong> करण्यात आला आहे.
          </p>
          <p style="color: #555; line-height: 1.7;">
            Dear <strong>${Username}</strong>, your Sub Admin registration request has been
            <strong style="color:#c0392b;">rejected</strong> by the Admin.
          </p>

          <div style="background:#fff3f3; border-left:4px solid #e74c3c;
                      padding:12px 16px; border-radius:6px; margin: 16px 0;">
            <p style="margin:0; font-size:13px; color:#c0392b;">
              जर आपल्याला काही प्रश्न असतील तर कृपया Admin शी संपर्क साधा.<br/>
              If you have any questions, please contact the Admin.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            MahaSahyadri | mahasahyadri.press@gmail.com
          </p>
        </div>
      `,
    });

    return NextResponse.json({ status: 'OK', message: 'Rejection email sent' });
  } catch (err: any) {
    console.error('Rejection email error:', err);
    return NextResponse.json({ status: 'ERROR', message: err.message });
  }
}