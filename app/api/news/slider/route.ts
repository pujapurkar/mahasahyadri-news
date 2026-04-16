import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { parseGallery, getRelativeTime, truncateText } from '@/lib/utils';

export async function GET() {
  try {
    const db = await getDB();

    // Get latest 7 news that are already published (PublishDate <= now)
    let result = await db.request().query(`
      SELECT TOP 7 
        NA.Id, NA.Title, NA.Content, NA.PublishDate,
        C.CategoryName, NA.Author, NA.Gallery
      FROM NewsArticles NA
      LEFT JOIN Categories C ON NA.CategoryId = C.CategoryId
      WHERE NA.PublishDate <= DATEADD(MINUTE, 330, GETUTCDATE())
      ORDER BY NA.PublishDate DESC
    `);

    const data = result.recordset.map((r: any) => {
      const gallery = parseGallery(r.Gallery);
      return {
        Id: r.Id,
        Title: r.Title,
        Excerpt: truncateText(r.Content, 150),
        Category: r.CategoryName || 'विविध',
        Author: r.Author,
        TimeAgo: getRelativeTime(r.PublishDate, 'mr'),
        HeroImage: gallery[0] || '/images/no-image.jpg',
      };
    });

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}