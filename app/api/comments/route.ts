import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch comments for a news article (with nested replies)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const newsId = searchParams.get('newsId');

    if (!newsId) {
      return NextResponse.json({ status: 'ERR', message: 'newsId required' });
    }

    const result = await query(`
      SELECT 
        C."CommentId",
        C."Content",
        C."CommentDate",
        C."ParentId",
        COALESCE(U."FullName", 'प्रशासक') AS "FullName"
      FROM "Comments" C
      LEFT JOIN "PublicUsers" U ON C."UserId" = U."UserId"
      WHERE C."NewsId" = $1
      ORDER BY C."CommentDate" ASC
    `, [parseInt(newsId)]);

    // Build hierarchical structure
    const commentsMap = new Map();
    const rootComments: any[] = [];

    result.rows.forEach((r: any) => {
      const comment = {
        CommentId: r.CommentId,
        User: r.FullName,
        Text: r.Content,
        Date: r.CommentDate,
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
    const parentId = searchParams.get('parentId');

    if (!newsId || !commentText?.trim()) {
      return NextResponse.json({ status: 'ERR', message: 'newsId and commentText required' });
    }

    // Check if news exists
    const check = await query(
      'SELECT COUNT(*) as cnt FROM "NewsArticles" WHERE "Id" = $1',
      [parseInt(newsId)]
    );

    if (parseInt(check.rows[0].cnt) === 0) {
      return NextResponse.json({ status: 'ERR', message: 'News article not found' });
    }

    // If userName is provided, create/get user
    let userId = null;
    if (userName && userName.trim()) {
      const userCheck = await query(
        'SELECT "UserId" FROM "PublicUsers" WHERE "FullName" = $1',
        [userName.trim()]
      );

      if (userCheck.rows.length > 0) {
        userId = userCheck.rows[0].UserId;
      } else {
        const userInsert = await query(`
          INSERT INTO "PublicUsers" ("FullName", "Email", "JoinedDate", "IsActive")
          VALUES ($1, NULL, NOW(), true)
          RETURNING "UserId"
        `, [userName.trim()]);
        userId = userInsert.rows[0].UserId;
      }
    }

    // Insert comment
    await query(`
      INSERT INTO "Comments" ("Content", "CommentDate", "UserId", "NewsId", "ParentId")
      VALUES ($1, NOW(), $2, $3, $4)
    `, [
      commentText.trim(),
      userId,
      parseInt(newsId),
      parentId ? parseInt(parentId) : null
    ]);

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

    // Delete replies first
    await query(
      'DELETE FROM "Comments" WHERE "ParentId" = $1',
      [parseInt(commentId)]
    );

    // Delete main comment
    await query(
      'DELETE FROM "Comments" WHERE "CommentId" = $1',
      [parseInt(commentId)]
    );

    return NextResponse.json({ status: 'OK', message: 'Comment deleted' });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}