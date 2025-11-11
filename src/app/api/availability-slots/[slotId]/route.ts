import { api, handleApiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slotId: string } }
) {
  try {
    const { slotId } = params;
    await api.delete(`/availability-slots/${slotId}`, { req: request });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
