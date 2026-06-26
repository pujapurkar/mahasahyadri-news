import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseGallery } from '@/lib/utils';

// English → Marathi translate
async function translateToMarathi(text: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    const translated = data[0]
      ?.map((item: any) => item[0])
      .filter(Boolean)
      .join('');
    return translated || text;
  } catch {
    return text;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('q') || '';
    const lang = searchParams.get('lang') || 'mr';

    if (!keyword.trim()) {
      return NextResponse.json({ status: 'OK', data: [] });
    }

    // English language mein search → Marathi mein bhi search karo
    let marathiKeyword = keyword;
    if (lang === 'en') {
      marathiKeyword = await translateToMarathi(keyword);
    }

    const result = await query(`
      SELECT 
        NA."Id", NA."Title", NA."Content", NA."Author",
        NA."PublishDate", NA."Gallery",
        C."CategoryName", C."NameMr", C."NameEn"
      FROM "NewsArticles" NA
      LEFT JOIN "Categories" C ON NA."CategoryId" = C."CategoryId"
      WHERE NA."PublishDate" <= NOW()
      AND (
        NA."Title" ILIKE $1
        OR NA."Content" ILIKE $1
        OR NA."Author" ILIKE $1
        OR C."CategoryName" ILIKE $1
        OR C."NameEn" ILIKE $1
        OR C."NameMr" ILIKE $1
        OR NA."Title" ILIKE $2
        OR NA."Content" ILIKE $2
        OR C."NameMr" ILIKE $2
      )
      ORDER BY NA."PublishDate" DESC
      LIMIT 20
    `, [`%${keyword}%`, `%${marathiKeyword}%`]);

    const data = result.rows.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      Content: r.Content,
      Category: r.CategoryName || 'विविध',
      Author: r.Author,
      PublishDate: r.PublishDate,
      Gallery: parseGallery(r.Gallery),
      CommentCount: 0,
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}