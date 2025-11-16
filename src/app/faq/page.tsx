'use client'

import Navbar from "@/components/navbar/Navbar";
import React, { useState } from "react";

const FAQ = () => {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  const toggleItem = (index: number) => {
    setOpenItems((prev: any) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const faqData = [
    {
      question: "Skinalyze AI hoạt động như thế nào?",
      answer:
        "Skinalyze sử dụng công nghệ trí tuệ nhân tạo tiên tiến để phân tích hình ảnh da. Hệ thống được huấn luyện trên hàng triệu hình ảnh da liễu và sử dụng thuật toán deep learning để nhận diện các dấu hiệu bất thường, từ đó đưa ra đánh giá và khuyến nghị tham khảo.",
    },
    {
      question: "Độ chính xác của Skinalyze AI là bao nhiêu?",
      answer:
        "Skinalyze AI đạt độ chính xác lên đến 94% trong việc phát hiện các vấn đề da liễu phổ biến. Tuy nhiên, kết quả chỉ mang tính chất tham khảo và không thay thế cho chẩn đoán y tế chuyên nghiệp.",
    },
    {
      question: "Tôi có thể tin tưởng hoàn toàn vào kết quả AI không?",
      answer:
        "Không. Kết quả từ Skinalyze AI chỉ là công cụ hỗ trợ tham khảo. Bạn luôn cần tham khảo ý kiến của bác sĩ da liễu để có chẩn đoán chính xác và phương pháp điều trị phù hợp.",
    },
    {
      question: "Skinalyze có thể phát hiện những loại bệnh da nào?",
      answer:
        "Skinalyze có thể nhận diện và đánh giá các vấn đề da phổ biến như: mụn trứng cá, viêm da, nám da, tàn nhang, u nang, nốt ruồi bất thường, và nhiều tình trạng da khác. Hệ thống liên tục được cập nhật để mở rộng khả năng nhận diện.",
    },
    {
      question: "Làm thế nào để chụp ảnh da đúng cách?",
      answer:
        "Để có kết quả tốt nhất: (1) Chụp trong ánh sáng tự nhiên hoặc đèn LED trắng, (2) Giữ camera cách vùng da khoảng 15-20cm, (3) Đảm bảo hình ảnh rõ nét, không bị mờ, (4) Vùng da cần phân tích chiếm ít nhất 50% khung hình.",
    },
    {
      question: "Dữ liệu và hình ảnh của tôi có được bảo mật không?",
      answer:
        "Có. Skinalyze cam kết bảo mật tuyệt đối thông tin cá nhân và hình ảnh của người dùng. Dữ liệu được mã hóa và lưu trữ an toàn, không chia sẻ với bên thứ ba mà không có sự đồng ý của bạn.",
    },
    {
      question: "Skinalyze có miễn phí không?",
      answer:
        "Skinalyze cung cấp phiên bản miễn phí với các tính năng cơ bản. Phiên bản Premium với các tính năng nâng cao như phân tích chi tiết, theo dõi lịch sử và tư vấn từ chuyên gia có tính phí.",
    },
    {
      question: "Tôi có thể sử dụng Skinalyze trên điện thoại không?",
      answer:
        "Có. Skinalyze có ứng dụng di động cho cả iOS và Android. Bạn cũng có thể sử dụng phiên bản web trên trình duyệt di động.",
    },
    {
      question: "Skinalyze có phù hợp với trẻ em không?",
      answer:
        "Skinalyze được thiết kế cho mọi lứa tuổi, tuy nhiên đối với trẻ em dưới 13 tuổi, phụ huynh cần giám sát và tham khảo ý kiến bác sĩ nhi khoa trước khi sử dụng kết quả phân tích.",
    },
    {
      question: "Tôi không hài lòng với kết quả, có thể khiếu nại không?",
      answer:
        "Nếu bạn có thắc mắc về kết quả phân tích, hãy liên hệ với đội ngũ hỗ trợ của chúng tôi qua email support@Skinalyze.ai hoặc chat trực tuyến. Chúng tôi sẽ xem xét và hỗ trợ bạn trong vòng 24 giờ.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Hỗ trợ khách hàng
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Câu hỏi <span className="text-green-600">thường gặp</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tìm hiểu thêm về Skinalyze AI và cách sử dụng hệ thống phân tích da
            thông minh
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqData.map((item, index: number) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 rounded-2xl"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {item.question}
                  </h3>
                  <div className="flex-shrink-0">
                    <svg
                      className={`w-5 h-5 text-green-600 transform transition-transform duration-200 ${
                        openItems[index] ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {openItems[index] && (
                  <div className="px-6 pb-5">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-700 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Vẫn có thắc mắc?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Email hỗ trợ
              </h3>
              <p className="text-gray-600 mb-4">Gửi email cho chúng tôi</p>
              <a
                href="mailto:support@Skinalyze.ai"
                className="text-green-600 font-medium hover:text-green-700 transition-colors"
              >
                support@Skinalyze.ai
              </a>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chat trực tuyến
              </h3>
              <p className="text-gray-600 mb-4">Hỗ trợ 24/7</p>
              <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                Bắt đầu chat
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default FAQ;
