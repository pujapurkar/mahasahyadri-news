import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, mobile, username, password } = body;

    // Validation
    if (!email || !mobile || !username || !password) {
      return NextResponse.json({
        status: "ERROR",
        message: "All fields are required",
      });
    }

    // Check existing username
    const existingUser = await query(
      `SELECT * FROM "SubAdminRequests" WHERE "Username" = $1`,
      [username]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        status: "ERROR",
        message: "Username already exists",
      });
    }

    // Insert request
    await query(
      `
      INSERT INTO "SubAdminRequests"
      (
        "Email",
        "Mobile",
        "Username",
        "Password",
        "Status"
      )
      VALUES
      ($1, $2, $3, $4, 'Pending')
      `,
      [email, mobile, username, password]
    );

    return NextResponse.json({
      status: "OK",
      message: "Request Submitted Successfully",
    });

  } catch (error: any) {
    console.error("Sub Admin Registration Error:", error);

    return NextResponse.json({
      status: "ERROR",
      message: error.message || "Something went wrong",
    });
  }
}