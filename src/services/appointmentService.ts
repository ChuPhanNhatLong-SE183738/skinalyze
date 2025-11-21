import { http } from "@/lib/http";
import type {
  Appointment,
  CompleteAppointmentDto,
  UpdateMedicalNoteDto,
} from "@/types/appointment";
import type { ApiResponse } from "@/types/api";

class AppointmentService {
  async getAppointments(
    filters: FindAppointmentsDto = {}
  ): Promise<Appointment[]> {
    try {
      const definedFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== undefined && value !== null
        )
      );
      const queryParams = new URLSearchParams(
        definedFilters as Record<string, string>
      ).toString();

      const endpoint = `/api/appointments?${queryParams}`;

      const response = await http.get<ApiResponse<Appointment[]>>(endpoint);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách cuộc hẹn (service):", error);
      throw error;
    }
  }
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

  async checkInDermatologist(
    appointmentId: string
  ): Promise<ApiResponse<void>> {
    return http.patch(
      `/api/appointments/dermatologist/check-in/${appointmentId}`,
      {}
    );
  }

  async updateMedicalNote(
    appointmentId: string,
    note: string
  ): Promise<Appointment> {
    const dto: UpdateMedicalNoteDto = { medicalNote: note };
    // Gọi BFF Route
    const response = await http.patch<ApiResponse<Appointment>>(
      `/api/appointments/dermatologist/medical-note/${appointmentId}`,
      dto
    );
    return response.data;
  }

  async completeAppointment(
    appointmentId: string,
    dto: CompleteAppointmentDto
  ): Promise<Appointment> {
    const response = await http.patch<ApiResponse<Appointment>>(
      `/api/appointments/dermatologist/complete/${appointmentId}`,
      dto
    );
    return response.data;
  }

  async cancelByDermatologist(appointmentId: string): Promise<Appointment> {
    const response = await http.patch<ApiResponse<Appointment>>(
      `/api/appointments/dermatologist/cancel/${appointmentId}`,
      {}
    );
    return response.data;
  }

  async generateManualMeetLink(
    appointmentId: string
  ): Promise<{ meetLink: string }> {
    const response = await http.patch<ApiResponse<{ meetLink: string }>>(
      `/api/appointments/dermatologist/generate-meet-link/${appointmentId}`,
      {}
    );
    return response.data;
  }
}

export const appointmentService = new AppointmentService();
