import { http } from "@/lib/http";
import type {
  AvailabilitySlot,
  CreateAvailabilityDto,
  SlotStatus,
} from "@/types/availability-slot";

export interface GetSlotsParams {
  startDate?: string;
  endDate?: string;
  status?: SlotStatus;
}
class AvailabilityService {
  async createBatchSlots(
    dto: CreateAvailabilityDto
  ): Promise<{ success: boolean; message: string; data: AvailabilitySlot[] }> {
    try {
      const response = await http.post("/api/availability-slots", dto);
      return response;
    } catch (error) {
      console.error("Lỗi khi tạo lịch rảnh (service):", error);
      throw error;
    }
  }

  async getMySlots(params: GetSlotsParams = {}): Promise<AvailabilitySlot[]> {
    const query = new URLSearchParams();
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.status) query.set("status", params.status);

    const endpoint = `/api/availability-slots?${query.toString()}`;

    try {
      const response = await http.get<{ data: AvailabilitySlot[] }>(endpoint);
      return response.data as AvailabilitySlot[];
    } catch (error) {
      console.error("Lỗi khi lấy lịch rảnh (service):", error);
      throw error;
    }
  }

  async deleteSlot(slotId: string): Promise<void> {
    try {
      await http.delete(`/api/availability-slots/${slotId}`);
    } catch (error) {
      console.error("Lỗi khi xóa slot (service):", error);
      throw error;
    }
  }
}

export const availabilityService = new AvailabilityService();
