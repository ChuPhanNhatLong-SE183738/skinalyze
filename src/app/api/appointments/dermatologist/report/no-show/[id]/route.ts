import { api, handleApiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest
  //   context: { params: { id: string } }
) {
  try {
    const pathname = req.nextUrl.pathname;
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    const body = await req.json();

    const data = await api.patch(
      `/appointments/dermatologist/${id}/report-no-show`,
      body,
      { req }
    );
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
