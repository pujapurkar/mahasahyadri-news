import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { toMarathiDigits } from '@/lib/utils';

export async function GET() {
  try {
    const db = await getDB();
    const result = await db.request().query(`
      SELECT TOP 5 Id, Title, ISNULL(ViewCount, 0) AS ViewCount, PublishDate
      FROM NewsArticles
      WHERE ISNULL(ViewCount, 0) > 0
      ORDER BY ViewCount DESC, PublishDate DESC
    `);

    const data = result.recordset.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      SubTitle: toMarathiDigits(r.ViewCount.toString()) + ' वेळा पाहिले',
      Url: `/news/${r.Id}`,
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}