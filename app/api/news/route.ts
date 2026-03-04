import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { parseGallery, getRelativeTime } from '@/lib/utils';

// GET - Fetch news by category
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'सर्व बातम्या';

    const db = await getDB();
    let query = `
      SELECT 
        NA.Id,
        NA.Title,
        NA.Content,
        NA.Author,
        NA.PublishDate,
        NA.Gallery,
        C.CategoryName AS Category,
        (SELECT COUNT(*) FROM Comments WHERE NewsId = NA.Id) AS CommentCount
      FROM NewsArticles NA
      LEFT JOIN Categories C ON NA.CategoryId = C.CategoryId
    `;

    if (category !== 'सर्व बातम्या') {
      query += ` WHERE C.CategoryName = @category`;
    }

    query += ` ORDER BY NA.PublishDate DESC`;

    const request = db.request();
    if (category !== 'सर्व बातम्या') {
      request.input('category', sql.NVarChar, category);
    }

    const result = await request.query(query);

    const data = result.recordset.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      Content: r.Content,
      Category: r.Category || 'विविध',
      Author: r.Author,
      PublishDate: r.PublishDate,
      Gallery: parseGallery(r.Gallery),
      CommentCount: r.CommentCount || 0,
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    console.error('GET news error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}

// POST - Create new news
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const headline = formData.get('headline') as string;
    const content = formData.get('content') as string;
    const categoryId = formData.get('categoryId') as string;
    const author = formData.get('author') as string;
    const date = formData.get('date') as string;
    const breakingDuration = formData.get('breakingDuration') as string;
    const images = formData.getAll('images') as File[];

    if (!headline || !content || categoryId === '0' || !author) {
      return NextResponse.json({ status: 'ERR', message: 'All fields are required' });
    }

    // Handle image uploads
    const uploadDir = join(process.cwd(), 'public', 'Uploads');
    await mkdir(uploadDir, { recursive: true });

    const galleryPaths: string[] = [];
    for (const image of images) {
      if (image.size > 0) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const filename = `${timestamp}-${image.name}`;
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);
        galleryPaths.push(`/Uploads/${filename}`);
      }
    }

    // Insert into database
    const db = await getDB();
    await db
      .request()
      .input('title', sql.NVarChar, headline)
      .input('content', sql.NVarChar, content)
      .input('categoryId', sql.Int, parseInt(categoryId))
      .input('author', sql.NVarChar, author)
      .input('publishDate', sql.DateTime, new Date(date))
      .input('gallery', sql.NVarChar, JSON.stringify(galleryPaths))
      .input('breakingDuration', sql.Int, parseInt(breakingDuration))
      .query(`
        INSERT INTO NewsArticles 
        (Title, Content, CategoryId, Author, PublishDate, Gallery, BreakingDurationMinutes, ViewCount)
        VALUES 
        (@title, @content, @categoryId, @author, @publishDate, @gallery, @breakingDuration, 0)
      `);

    return NextResponse.json({ status: 'OK', message: 'News published successfully!' });
  } catch (e: any) {
    console.error('POST news error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}
// PUT - Update existing news
export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const editId = formData.get('editId') as string;
    const headline = formData.get('headline') as string;
    const content = formData.get('content') as string;
    const categoryId = formData.get('categoryId') as string;
    const author = formData.get('author') as string;
    const date = formData.get('date') as string;
    const breakingDuration = formData.get('breakingDuration') as string;
    const images = formData.getAll('images') as File[];

    if (!editId || !headline || !content || categoryId === '0' || !author) {
      return NextResponse.json({ status: 'ERR', message: 'All fields are required' });
    }

    const db = await getDB();

    // Get existing gallery
    const existing = await db
      .request()
      .input('id', sql.Int, parseInt(editId))
      .query('SELECT Gallery FROM NewsArticles WHERE Id = @id');

    let galleryPaths: string[] = [];

    // If new images uploaded, use them; otherwise keep existing
    if (images.length > 0 && images[0].size > 0) {
      const uploadDir = join(process.cwd(), 'public', 'Uploads');
      await mkdir(uploadDir, { recursive: true });

      for (const image of images) {
        if (image.size > 0) {
          const bytes = await image.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const timestamp = Date.now();
          const filename = `${timestamp}-${image.name}`;
          const filepath = join(uploadDir, filename);
          await writeFile(filepath, buffer);
          galleryPaths.push(`/Uploads/${filename}`);
        }
      }
    } else {
      // Keep existing gallery
      galleryPaths = parseGallery(existing.recordset[0]?.Gallery || '[]');
    }

    // Update database
    await db
      .request()
      .input('id', sql.Int, parseInt(editId))
      .input('title', sql.NVarChar, headline)
      .input('content', sql.NVarChar, content)
      .input('categoryId', sql.Int, parseInt(categoryId))
      .input('author', sql.NVarChar, author)
      .input('publishDate', sql.DateTime, new Date(date))
      .input('gallery', sql.NVarChar, JSON.stringify(galleryPaths))
      .input('breakingDuration', sql.Int, parseInt(breakingDuration))
      .query(`
        UPDATE NewsArticles 
        SET Title = @title,
            Content = @content,
            CategoryId = @categoryId,
            Author = @author,
            PublishDate = @publishDate,
            Gallery = @gallery,
            BreakingDurationMinutes = @breakingDuration
        WHERE Id = @id
      `);

    return NextResponse.json({ status: 'OK', message: 'News updated successfully!' });
  } catch (e: any) {
    console.error('PUT news error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}