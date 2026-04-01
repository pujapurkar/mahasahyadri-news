import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// ✅ GET Categories
export async function GET() {
  try {
    const db = await getDB();

    const result = await db.request().query(
      'SELECT CategoryId, CategoryName FROM Categories ORDER BY CategoryId ASC'
    );

    return NextResponse.json({
      status: 'OK',
      data: result.recordset
    });

  } catch (e: any) {
    return NextResponse.json({
      status: 'ERR',
      message: e.message,
      data: []
    });
  }
}

// ✅ ADD Category (NEW 🔥)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nameMr, nameEn } = body;

    // validation
    if (!nameMr || nameMr.trim() === '') {
      return NextResponse.json({
        status: 'ERR',
        message: 'Marathi name required'
      });
    }

    const db = await getDB();

    // 🔥 Duplicate check
    const check = await db.request()
      .input('name', nameMr)
      .query(`SELECT * FROM Categories WHERE CategoryName = @name`);

    if (check.recordset.length > 0) {
      return NextResponse.json({
        status: 'ERR',
        message: 'Category already exists'
      });
    }

    // 🔥 Insert
    await db.request()
      .input('name', nameMr)
      .query(`
        INSERT INTO Categories (CategoryName)
        VALUES (@name)
      `);

    return NextResponse.json({ status: 'OK' });

  } catch (e: any) {
    return NextResponse.json({
      status: 'ERR',
      message: e.message
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ status: 'ERR', message: 'Id required' });
    }

    const db = await getDB();

    await db.request()
      .input('id', Number(id)) // 🔥 FIX
      .query('DELETE FROM Categories WHERE CategoryId = @id');

    return NextResponse.json({ status: 'OK' });

  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}