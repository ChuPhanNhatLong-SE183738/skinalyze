'use client'

import Navbar from "@/components/navbar/Navbar";
import React from "react";

const Terms = () => (
  <div className="min-h-screen bg-white">
    <Navbar />
    <main className="max-w-3xl mx-auto px-4 py-32">
      <h1 className="text-4xl font-bold mb-6 text-green-700">
        Điều khoản & Điều kiện sử dụng Skinalyze
      </h1>
      <p className="mb-6 text-gray-700">
        Chào mừng bạn đến với Skinalyze – hệ thống AI hỗ trợ quét, phân tích và tư
        vấn sức khỏe da liễu. Vui lòng đọc kỹ các điều khoản dưới đây trước khi
        sử dụng dịch vụ của chúng tôi.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-green-600">
        1. Mục đích sử dụng
      </h2>
      <p className="mb-4 text-gray-700">
        Skinalyze là nền tảng ứng dụng trí tuệ nhân tạo (AI) trong lĩnh vực y tế,
        giúp người dùng quét, phân tích hình ảnh da và cung cấp thông tin tham
        khảo về các vấn đề da liễu. Dịch vụ này không thay thế cho chẩn đoán
        hoặc điều trị y tế chuyên nghiệp.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-green-600">
        2. Quyền và trách nhiệm của người dùng
      </h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>
          Chỉ sử dụng Skinalyze cho mục đích cá nhân hoặc nghiên cứu, không sử
          dụng cho mục đích thương mại khi chưa được phép.
        </li>
        <li>
          Không tự ý thay đổi, sao chép, phát tán hoặc khai thác dữ liệu AI của
          hệ thống.
        </li>
        <li>
          Chịu trách nhiệm về tính chính xác của hình ảnh và thông tin cung cấp
          cho hệ thống.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-green-600">
        3. Quyền và trách nhiệm của Skinalyze
      </h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>
          Cung cấp dịch vụ AI phân tích da dựa trên dữ liệu và thuật toán hiện
          đại nhất.
        </li>
        <li>
          Bảo mật thông tin cá nhân và hình ảnh của người dùng theo quy định
          pháp luật.
        </li>
        <li>
          Không chịu trách nhiệm với các quyết định y tế dựa hoàn toàn vào kết
          quả AI mà không có sự tư vấn của bác sĩ chuyên khoa.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-green-600">
        4. Giới hạn trách nhiệm
      </h2>
      <p className="mb-4 text-gray-700">
        Kết quả phân tích từ Skinalyze chỉ mang tính chất tham khảo, không thay
        thế cho ý kiến chuyên môn của bác sĩ. Người dùng cần tham khảo ý kiến y
        tế chuyên nghiệp trước khi đưa ra quyết định điều trị.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-green-600">
        5. Quyền riêng tư & bảo mật dữ liệu
      </h2>
      <p className="mb-4 text-gray-700">
        Skinalyze cam kết bảo mật thông tin cá nhân, hình ảnh và dữ liệu y tế của
        người dùng. Dữ liệu chỉ được sử dụng cho mục đích phân tích AI và cải
        thiện chất lượng dịch vụ, không chia sẻ cho bên thứ ba khi chưa có sự
        đồng ý.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-green-600">
        6. Thay đổi điều khoản
      </h2>
      <p className="mb-4 text-gray-700">
        Skinalyze có quyền thay đổi, cập nhật điều khoản sử dụng bất cứ lúc nào.
        Người dùng nên thường xuyên kiểm tra để cập nhật thông tin mới nhất.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-green-600">
        7. Liên hệ
      </h2>
      <p className="mb-4 text-gray-700">
        Nếu có thắc mắc về điều khoản sử dụng, vui lòng liên hệ với chúng tôi
        qua email:{" "}
        <a
          href="mailto:support@Skinalyze.ai"
          className="text-green-700 underline"
        >
          support@Skinalyze.ai
        </a>
      </p>

      <div className="mt-12 text-gray-500 text-sm">
        Cập nhật lần cuối: 07/2024
      </div>
    </main>
  </div>
);

export default Terms;
