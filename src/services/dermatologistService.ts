import { http } from "@/lib/http";
import type { Dermatologist } from "@/types/dermatologist";
import type { ApiResponse } from "@/types/api";

class DermatologistService {
  async getMyProfile(): Promise<Dermatologist> {
    try {
      const response = await http.get<ApiResponse<Dermatologist>>(
        "/api/dermatologists/my-profile"
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin bác sĩ (service):", error);
      throw error;
    }
  }
}

export const dermatologistService = new DermatologistService();
