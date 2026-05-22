import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseGallery } from '@/lib/utils';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'mahasahyadri' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(buffer);
  });
}

function toISTDate(dateStr: string): Date {
  return new Date(dateStr + ':00');
}

// GET - Fetch news by category
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'सर्व बातम्या';

    let queryText = `
      SELECT 
        NA."Id",
        NA."Title",
        NA."Content",
        NA."Author",
        NA."PublishDate",
        NA."Gallery",
        C."CategoryName" AS "Category",
        (SELECT COUNT(*) FROM "Comments" WHERE "NewsId" = NA."Id") AS "CommentCount"
      FROM "NewsArticles" NA
      LEFT JOIN "Categories" C ON NA."CategoryId" = C."CategoryId"
      WHERE NA."PublishDate" <= NOW()
    `;

    const params: any[] = [];

    if (category !== 'सर्व बातम्या') {
      params.push(category);
      queryText += ` AND C."CategoryName" = $${params.length}`;
    }

    queryText += ` ORDER BY NA."PublishDate" DESC`;

    const result = await query(queryText, params);

    const data = result.rows.map((r: any) => ({
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
    const breakingEnd = formData.get('breakingEnd') as string;
    const isHero = formData.get('isHero') as string;
    const images = formData.getAll('images') as File[];

    if (!headline || !content || categoryId === '0' || !author) {
      return NextResponse.json({ status: 'ERR', message: 'All fields are required' });
    }

    // Image upload - with or without Cloudinary
    const galleryPaths: string[] = [];
    for (const image of images) {
      if (image.size > 0) {
        try {
          const url = await uploadToCloudinary(image);
          galleryPaths.push(url);
        } catch (err) {
          console.error('Image upload failed:', err);
          // Image upload fail ho toh bhi news save hogi
        }
      }
    }

    const publishDateTime = date ? toISTDate(date) : new Date();
    const breakingEndDate = breakingEnd ? toISTDate(breakingEnd) : null;

    await query(
      `INSERT INTO "NewsArticles" 
        ("Title", "Content", "CategoryId", "Author", "PublishDate", "Gallery", "BreakingEndDate", "ViewCount", "IsHero")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)`,
      [
        headline,
        content,
        parseInt(categoryId),
        author,
        publishDateTime,
        JSON.stringify(galleryPaths),
        breakingEndDate || null,
        isHero === '1',
      ]
    );

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
    const breakingEnd = formData.get('breakingEnd') as string;
    const isHero = formData.get('isHero') as string;
    const images = formData.getAll('images') as File[];

    if (!editId || !headline || !content || categoryId === '0' || !author) {
      return NextResponse.json({ status: 'ERR', message: 'All fields are required' });
    }

    const existing = await query(
      'SELECT "Gallery" FROM "NewsArticles" WHERE "Id" = $1',
      [parseInt(editId)]
    );

    let galleryPaths: string[] = [];

    if (images.length > 0 && images[0].size > 0) {
      for (const image of images) {
        if (image.size > 0) {
          try {
            const url = await uploadToCloudinary(image);
            galleryPaths.push(url);
          } catch (err) {
            console.error('Image upload failed:', err);
          }
        }
      }
    } else {
      galleryPaths = parseGallery(existing.rows[0]?.Gallery || '[]');
    }

    const publishDateTime = date ? toISTDate(date) : new Date();
    const breakingEndDate = breakingEnd ? toISTDate(breakingEnd) : null;

    await query(
      `UPDATE "NewsArticles" 
       SET "Title" = $1,
           "Content" = $2,
           "CategoryId" = $3,
           "Author" = $4,
           "PublishDate" = $5,
           "Gallery" = $6,
           "BreakingEndDate" = $7,
           "IsHero" = $8
       WHERE "Id" = $9`,
      [
        headline,
        content,
        parseInt(categoryId),
        author,
        publishDateTime,
        JSON.stringify(galleryPaths),
        breakingEndDate || null,
        isHero === '1',
        parseInt(editId),
      ]
    );

    return NextResponse.json({ status: 'OK', message: 'News updated successfully!' });
  } catch (e: any) {
    console.error('PUT news error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}