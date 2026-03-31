import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';
import { parseGallery, getRelativeTime, truncateText } from '@/lib/utils';

export async function GET() {
  try {
    const db = await getDB();
    
    // Try to get today's news first
    let result = await db.request().query(`
      SELECT TOP 7 
        NA.Id, NA.Title, NA.Content, NA.PublishDate,
        C.CategoryName, NA.Author, NA.Gallery
      FROM NewsArticles NA
      LEFT JOIN Categories C ON NA.CategoryId = C.CategoryId
     WHERE NA.PublishDate <= GETDATE()
    AND CAST(NA.PublishDate AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY NA.PublishDate DESC
    `);

    // If no news today, get from last available date
    if (result.recordset.length === 0) {
      result = await db.request().query(`
        SELECT TOP 7 
          NA.Id, NA.Title, NA.Content, NA.PublishDate,
          C.CategoryName, NA.Author, NA.Gallery
        FROM NewsArticles NA
        LEFT JOIN Categories C ON NA.CategoryId = C.CategoryId
        WHERE CAST(NA.PublishDate AS DATE) = (
          SELECT MAX(CAST(PublishDate AS DATE)) FROM NewsArticles
        )
        ORDER BY NA.PublishDate DESC
      `);
    }

    const data = result.recordset.map((r: any) => {
      const gallery = parseGallery(r.Gallery);
      return {
        Id: r.Id,
        Title: r.Title,
        Excerpt: truncateText(r.Content, 150),
        Category: r.CategoryName || 'विविध',
        Author: r.Author,
        TimeAgo: getRelativeTime(r.PublishDate),
        HeroImage: gallery[0] || '/images/no-image.jpg',
      };
    });

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}