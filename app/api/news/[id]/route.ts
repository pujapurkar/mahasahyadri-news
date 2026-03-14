import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';
import { parseGallery } from '@/lib/utils';

// GET - Fetch single news by ID (and increment view count)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDB();
    
    // Check if request is from admin or user
    const url = new URL(req.url);
    const isAdminView = url.searchParams.has('admin');
    
    // Increment view count ONLY for user side
    if (!isAdminView) {
      await db
        .request()
        .input('id', sql.Int, parseInt(id))
        .query('UPDATE NewsArticles SET ViewCount = ViewCount + 1 WHERE Id = @id');
    }
    
    // Get news details
    const result = await db
      .request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT 
          NA.Id,
          NA.Title,
          NA.Content,
          NA.Author,
          NA.PublishDate,
          NA.Gallery,
          NA.ViewCount,
          C.CategoryName
        FROM NewsArticles NA
        LEFT JOIN Categories C ON NA.CategoryId = C.CategoryId
        WHERE NA.Id = @id
      `);

    if (!result.recordset.length) {
      return NextResponse.json({ status: 'ERR', message: 'News not found' });
    }

    const newsItem = result.recordset[0];
    const data = {
      Id: newsItem.Id,
      Title: newsItem.Title,
      Content: newsItem.Content,
      Author: newsItem.Author,
      PublishDate: newsItem.PublishDate,
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
    const db = await getDB();

    // Delete associated comments first
    await db
      .request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM Comments WHERE NewsId = @id');

    // Delete news
    await db
      .request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM NewsArticles WHERE Id = @id');

    return NextResponse.json({ status: 'OK', message: 'News deleted successfully' });
  } catch (e: any) {
    console.error('DELETE news error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}