import { api, handleApiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    const data = await api.get(`/treatment-routines/${id}`, { req });
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const data = await api.patch(`/treatment-routines/${id}`, body, { req });
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
