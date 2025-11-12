import { api, handleApiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const data = await api.get("/dermatologists/my-profile", { req });
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
