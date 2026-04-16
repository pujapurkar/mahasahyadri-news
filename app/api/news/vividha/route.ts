import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'mr';
  const result = await db.request().query(`
  SELECT TOP 5 
    NA.Id, 
    NA.Title, 
    NA.PublishDate
  FROM NewsArticles NA
  LEFT JOIN Categories C ON NA.CategoryId = C.CategoryId
  WHERE C.CategoryName = N'विविध'
  AND NA.PublishDate <= DATEADD(MINUTE, 330, GETUTCDATE())
  ORDER BY NA.PublishDate DESC
`);

    const data = result.recordset.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      SubTitle: new Date(r.PublishDate).toLocaleDateString('mr-IN'),
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    console.error('Vividha error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}