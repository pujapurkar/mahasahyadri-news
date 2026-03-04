import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';

// GET - Fetch comments for a news article
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const newsId = searchParams.get('newsId');

    if (!newsId) {
      return NextResponse.json({ status: 'ERR', message: 'newsId required' });
    }

    const db = await getDB();
    const result = await db
      .request()
      .input('nid', sql.Int, parseInt(newsId))
      .query(`
        SELECT 
          C.CommentId,
          C.Content,
          C.CommentDate,
          ISNULL(U.FullName, N'Admin') AS FullName
        FROM Comments C
        LEFT JOIN PublicUsers U ON C.UserId = U.UserId
        WHERE C.NewsId = @nid
        ORDER BY C.CommentDate DESC
      `);

    const comments = result.recordset.map((r: any) => ({
      CommentId: r.CommentId,
      User: r.FullName,
      Text: r.Content,
      Date: new Date(r.CommentDate).toLocaleString('en-IN'),
    }));

    return NextResponse.json({ status: 'OK', comments });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}

// POST - Add comment (Admin comment)
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const newsId = searchParams.get('newsId');
    const commentText = searchParams.get('commentText');

    if (!newsId || !commentText?.trim()) {
      return NextResponse.json({ status: 'ERR', message: 'newsId and commentText required' });
    }

    const db = await getDB();

    // Check if news exists
    const check = await db
      .request()
      .input('NewsId', sql.Int, parseInt(newsId))
      .query('SELECT COUNT(*) as cnt FROM NewsArticles WHERE Id = @NewsId');

    if (check.recordset[0].cnt === 0) {
      return NextResponse.json({ status: 'ERR', message: 'News article not found' });
    }

    // Insert admin comment (UserId = NULL means Admin)
    await db
      .request()
      .input('Content', sql.NVarChar(sql.MAX), commentText.trim())
      .input('NewsId', sql.Int, parseInt(newsId))
      .query(`
        INSERT INTO Comments (Content, CommentDate, UserId, NewsId)
        VALUES (@Content, GETDATE(), NULL, @NewsId)
      `);

    return NextResponse.json({ status: 'OK', message: 'Comment saved successfully' });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}

// DELETE - Delete comment
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ status: 'ERR', message: 'commentId required' });
    }

    const db = await getDB();
    await db
      .request()
      .input('cid', sql.Int, parseInt(commentId))
      .query('DELETE FROM Comments WHERE CommentId = @cid');

    return NextResponse.json({ status: 'OK', message: 'Comment deleted' });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}