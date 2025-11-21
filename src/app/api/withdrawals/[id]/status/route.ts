import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/api/v1/withdrawals/${id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token.value}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to update withdrawal status" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error updating withdrawal status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
