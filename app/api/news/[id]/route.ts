import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseGallery } from '@/lib/utils';

// GET - Fetch single news by ID (and increment view count)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const url = new URL(req.url);
    const isAdminView = url.searchParams.get('admin') === '1';

    // Increment view count ONLY for user side
    if (!isAdminView) {
      await query(
        'UPDATE "NewsArticles" SET "ViewCount" = "ViewCount" + 1 WHERE "Id" = $1',
        [parseInt(id)]
      );
    }

    // Get news details
    const result = await query(`
      SELECT 
        SELECT 
      NA."Id",
      NA."Title",
      NA."Content",
      NA."Author",
      NA."PublishDate",
      NA."Gallery",
      NA."ViewCount",
      NA."CategoryId",
      NA."IsHero",
      NA."BreakingEndDate",
      C."CategoryName"
      FROM "NewsArticles" NA
      LEFT JOIN "Categories" C ON NA."CategoryId" = C."CategoryId"
      WHERE NA."Id" = $1
    `, [parseInt(id)]);

    if (!result.rows.length) {
      return NextResponse.json({ status: 'ERR', message: 'News not found' });
    }

    const newsItem = result.rows[0];
    const data = {
    Id: newsItem.Id,
    Title: newsItem.Title,
    Content: newsItem.Content,
    Author: newsItem.Author,
    PublishDate: newsItem.PublishDate,
    CategoryId: newsItem.CategoryId,
    IsHero: newsItem.IsHero || false,
    BreakingEndDate: newsItem.BreakingEndDate || null,
    CategoryName: newsItem.CategoryName,
    Gallery: parseGallery(newsItem.Gallery),
    ViewCount: newsItem.ViewCount || 0,
  };

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    console.error('GET news by ID error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}

// DELETE - Delete news by ID
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Delete associated comments first
    await query(
      'DELETE FROM "Comments" WHERE "NewsId" = $1',
      [parseInt(id)]
    );

    // Delete news
    await query(
      'DELETE FROM "NewsArticles" WHERE "Id" = $1',
      [parseInt(id)]
    );

    return NextResponse.json({ status: 'OK', message: 'News deleted successfully' });
  } catch (e: any) {
    console.error('DELETE news error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}