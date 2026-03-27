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
          ISNULL(U.FullName, N'प्रशासक') AS FullName
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

// POST - Add comment (Admin or User)
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const newsId = searchParams.get('newsId');
    const commentText = searchParams.get('commentText');
    const userName = searchParams.get('userName'); // ← NEW: Get userName parameter

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

    // If userName is provided (user comment), create/get user
    let userId = null;
    if (userName && userName.trim()) {
      // Check if user already exists
      const userCheck = await db
        .request()
        .input('fullName', sql.NVarChar(100), userName.trim())
        .query('SELECT UserId FROM PublicUsers WHERE FullName = @fullName');

      if (userCheck.recordset.length > 0) {
        // User exists
        userId = userCheck.recordset[0].UserId;
      } else {
        // Create new user
        const userInsert = await db
          .request()
          .input('fullName', sql.NVarChar(100), userName.trim())
          .query(`
            INSERT INTO PublicUsers (FullName, Email)
            OUTPUT INSERTED.UserId
            VALUES (@fullName, '')
          `)
        userId = userInsert.recordset[0].UserId;
      }
    }

    // Insert comment (UserId = NULL for Admin, otherwise User ID)
    await db
      .request()
      .input('Content', sql.NVarChar(sql.MAX), commentText.trim())
      .input('NewsId', sql.Int, parseInt(newsId))
      .input('UserId', sql.Int, userId)
      .query(`
        INSERT INTO Comments (Content, CommentDate, UserId, NewsId)
        VALUES (@Content, GETDATE(), @UserId, @NewsId)
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