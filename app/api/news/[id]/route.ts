import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';
import { parseGallery, getRelativeTime } from '@/lib/utils';

// GET - Fetch single news by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // ← await add kiya

    const db = await getDB();
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
          NA.CategoryId,
          NA.BreakingDurationMinutes,
          C.CategoryName
        FROM NewsArticles NA
        LEFT JOIN Categories C ON NA.CategoryId = C.CategoryId
        WHERE NA.Id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ status: 'ERR', message: 'News not found' });
    }

    const news = result.recordset[0];

    const data = {
      Id: news.Id,
      Title: news.Title,
      Content: news.Content,
      Author: news.Author,
      PublishDate: news.PublishDate,
      CategoryId: news.CategoryId,
      CategoryName: news.CategoryName || 'विविध',
      Gallery: parseGallery(news.Gallery),
      BreakingDurationMinutes: news.BreakingDurationMinutes || 60,
      TimeAgo: getRelativeTime(news.PublishDate),
    };

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    console.error('GET single news error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}

// DELETE - Delete news by ID
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // ← await add kiya

    const db = await getDB();
    
    // First delete associated comments
    await db
      .request()
      .input('newsId', sql.Int, parseInt(id))
      .query('DELETE FROM Comments WHERE NewsId = @newsId');

    // Then delete the news article
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