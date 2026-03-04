import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { truncateText } from '@/lib/utils';

export async function GET() {
  try {
    const db = await getDB();
    const result = await db.request().query(`
      SELECT TOP 3 NA.Id, NA.Title, NA.Content, NA.PublishDate
      FROM NewsArticles NA
      INNER JOIN Categories C ON NA.CategoryId = C.CategoryId
      WHERE C.CategoryName = N'विविध'
      ORDER BY NA.PublishDate DESC
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