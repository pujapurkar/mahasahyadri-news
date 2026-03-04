import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { truncateText } from '@/lib/utils';

export async function GET() {
  try {
    const db = await getDB();
    const result = await db.request().query(`
      SELECT TOP 3 Id, Title, Content, PublishDate
      FROM NewsArticles
      WHERE CategoryId = 5
      ORDER BY PublishDate DESC
    `);

    const data = result.recordset.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      SubTitle: truncateText(r.Content, 40),
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}