import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';

// GET - Fetch comments for a news article (with nested replies)
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
          C.ParentId,
          ISNULL(U.FullName, N'प्रशासक') AS FullName
        FROM Comments C
        LEFT JOIN PublicUsers U ON C.UserId = U.UserId
        WHERE C.NewsId = @nid
        ORDER BY C.CommentDate ASC
      `);

    // Build hierarchical structure
    const commentsMap = new Map();
    const rootComments: any[] = [];

    result.recordset.forEach((r: any) => {
      const comment = {
        CommentId: r.CommentId,
        User: r.FullName,
        Text: r.Content,
        Date: new Date(r.CommentDate).toLocaleString('en-IN'),
        ParentId: r.ParentId,
        Replies: []
      };
      commentsMap.set(r.CommentId, comment);
    });

    // Organize into parent-child structure
    commentsMap.forEach((comment) => {
      if (comment.ParentId === null) {
        rootComments.push(comment);
      } else {
        const parent = commentsMap.get(comment.ParentId);
        if (parent) {
          parent.Replies.push(comment);
        }
      }
    });

    return NextResponse.json({ status: 'OK', comments: rootComments });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}

// POST - Add comment or reply
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const newsId = searchParams.get('newsId');
    const commentText = searchParams.get('commentText');
    const userName = searchParams.get('userName');
    const parentId = searchParams.get('parentId'); // ← NEW: For replies

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
      const userCheck = await db
        .request()
        .input('fullName', sql.NVarChar(100), userName.trim())
        .query('SELECT UserId FROM PublicUsers WHERE FullName = @fullName');

      if (userCheck.recordset.length > 0) {
        userId = userCheck.recordset[0].UserId;
      } else {
        const userInsert = await db
          .request()
          .input('fullName', sql.NVarChar(100), userName.trim())
          .query(`
            INSERT INTO PublicUsers (FullName, Email, JoinedDate)
            OUTPUT INSERTED.UserId
            VALUES (@fullName, '', GETDATE())
          `);
        userId = userInsert.recordset[0].UserId;
      }
    }

    // Insert comment with ParentId (if reply)
    await db
      .request()
      .input('Content', sql.NVarChar(sql.MAX), commentText.trim())
      .input('NewsId', sql.Int, parseInt(newsId))
      .input('UserId', sql.Int, userId)
      .input('ParentId', sql.Int, parentId ? parseInt(parentId) : null)
      .query(`
        INSERT INTO Comments (Content, CommentDate, UserId, NewsId, ParentId)
        VALUES (@Content, GETDATE(), @UserId, @NewsId, @ParentId)
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
    
    // Delete replies first (if any)
    await db
      .request()
      .input('parentId', sql.Int, parseInt(commentId))
      .query('DELETE FROM Comments WHERE ParentId = @parentId');
    
    // Delete main comment
    await db
      .request()
      .input('cid', sql.Int, parseInt(commentId))
      .query('DELETE FROM Comments WHERE CommentId = @cid');

    return NextResponse.json({ status: 'OK', message: 'Comment deleted' });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}