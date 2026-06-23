import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM SubAdminRequests WHERE Status='Pending'`
    );

    return NextResponse.json({
      status: "OK",
      data: result.rows
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "ERROR",
      message: error.message
    });
  }
}