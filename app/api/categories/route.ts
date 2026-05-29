import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET Categories
export async function GET() {
  try {
    const result = await query(`
      SELECT "CategoryId", "CategoryName", "NameMr", "NameEn" 
      FROM "Categories" 
      ORDER BY "CategoryId" ASC
    `);

    return NextResponse.json({
      status: 'OK',
      data: result.rows
    });

  } catch (e: any) {
    return NextResponse.json({
      status: 'ERR',
      message: e.message,
      data: []
    });
  }
}

// ADD Category
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nameMr, nameEn } = body;

    if (!nameMr || nameMr.trim() === '') {
      return NextResponse.json({
        status: 'ERR',
        message: 'Marathi name required'
      });
    }

    // Duplicate check
    const check = await query(
      `SELECT * FROM "Categories" WHERE "CategoryName" = $1`,
      [nameMr]
    );

    if (check.rows.length > 0) {
      return NextResponse.json({
        status: 'ERR',
        message: 'Category already exists'
      });
    }

    // Insert
    await query(
      `INSERT INTO "Categories" ("CategoryName", "NameMr", "NameEn")
       VALUES ($1, $2, $3)`,
      [nameMr, nameMr, nameEn || '']
    );

    return NextResponse.json({ status: 'OK' });

  } catch (e: any) {
    return NextResponse.json({
      status: 'ERR',
      message: e.message
    });
  }
}

// DELETE Category
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ status: 'ERR', message: 'Id required' });
    }

    await query(
      `DELETE FROM "Categories" WHERE "CategoryId" = $1`,
      [Number(id)]
    );

    return NextResponse.json({ status: 'OK' });

  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}

// PUT handler
export async function PUT(req: Request) {
  try {
    const { id, nameMr, nameEn } = await req.json();
    await query(
      `UPDATE "Categories" SET "NameMr" = $1, "NameEn" = $2 WHERE "CategoryId" = $3`,
      [nameMr, nameEn || '', Number(id)]
    );
    return NextResponse.json({ status: 'OK' });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}