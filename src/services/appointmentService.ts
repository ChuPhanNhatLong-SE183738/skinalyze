import { http } from "@/lib/http";
import type { Appointment } from "@/types/appointment";
import type { ApiResponse } from "@/types/api";

class AppointmentService {
  async getAppointmentById(appointmentId: string): Promise<Appointment> {
    try {
      const response = await http.get<ApiResponse<Appointment>>(
        `/api/appointments/${appointmentId}`
      );

      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết cuộc hẹn (service):", error);
      throw error;
    }
  }
}

export const appointmentService = new AppointmentService();
