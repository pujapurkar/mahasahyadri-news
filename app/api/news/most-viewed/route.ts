import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { toMarathiDigits } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'mr';
    const db = await getDB();
    const result = await db.request().query(`
      SELECT TOP 5 Id, Title, ISNULL(ViewCount, 0) AS ViewCount, PublishDate
      FROM NewsArticles
     WHERE ISNULL(ViewCount, 0) > 0
AND PublishDate <= DATEADD(MINUTE, 330, GETUTCDATE())
      ORDER BY ViewCount DESC, PublishDate DESC
    `);

    const data = result.recordset.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      SubTitle:
       lang === 'mr'
    ? toMarathiDigits(r.ViewCount.toString()) + ' वेळा पाहिले'
    : `Viewed ${r.ViewCount} times`,
      Url: `/news/${r.Id}`,
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}