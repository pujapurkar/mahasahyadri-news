import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const result = await query(`
    SELECT *
    FROM "SubAdminRequests"
    WHERE "Status" = 'Pending'
    ORDER BY "Id" DESC
  `);

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { id, status } = body;

  await query(
    `
    UPDATE "SubAdminRequests"
    SET "Status" = $1
    WHERE "Id" = $2
    `,
    [status, id]
  );

  return NextResponse.json({
    status: "OK",
  });
}