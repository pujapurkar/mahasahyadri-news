import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const result = await query(
      `
      SELECT *
      FROM "SubAdminRequests"
      WHERE "Username" = $1
      AND "Password" = $2
      AND "Status" = 'Approved'
      `,
      [username, password]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        status: "ERROR",
        message: "Invalid Credentials Or Not Approved Yet",
      });
    }

    return NextResponse.json({
      status: "OK",
      message: "Login Successful",
      user: result.rows[0],
    });

  } catch (error: any) {
    return NextResponse.json({
      status: "ERROR",
      message: error.message,
    });
  }
}