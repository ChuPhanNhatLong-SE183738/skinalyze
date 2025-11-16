import React from "react";

const FeaturesSection = () => {
  const keyFeatures = [
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      title: "Lập lịch kiểm tra định kỳ",
      description:
        "Theo dõi sức khỏe da của bạn với lịch kiểm tra thông minh được cá nhân hóa",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      title: "Camera AI thông minh",
      description:
        "Công nghệ AI tiên tiến giúp chụp ảnh chất lượng cao và phân tích chính xác",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      title: "Tư vấn chuyên gia",
      description:
        "Kết nối trực tiếp với các bác sĩ da liễu hàng đầu để nhận tư vấn chuyên sâu",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  const features = [
    {
      icon: "🎯",
      title: "Chẩn đoán chính xác",
      description:
        "Độ chính xác lên đến 95% được kiểm chứng bởi các chuyên gia y tế hàng đầu",
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      icon: "⚡",
      title: "Kết quả tức thì",
      description:
        "Nhận kết quả phân tích chi tiết chỉ trong vài giây sau khi chụp ảnh",
      color: "bg-green-50 text-green-600 border-green-200",
    },
    {
      icon: "📊",
      title: "Theo dõi tiến trình",
      description:
        "Lưu trữ lịch sử và theo dõi sự thay đổi của da theo thời gian một cách khoa học",
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
    {
      icon: "🔒",
      title: "Bảo mật tuyệt đối",
      description:
        "Dữ liệu được mã hóa end-to-end và bảo vệ theo tiêu chuẩn y tế quốc tế",
      color: "bg-red-50 text-red-600 border-red-200",
    },
    {
      icon: "💡",
      title: "Lời khuyên cá nhân",
      description:
        "AI phân tích và đưa ra lời khuyên chăm sóc da được cá nhân hóa cho từng người",
      color: "bg-yellow-50 text-yellow-600 border-yellow-200",
    },
    {
      icon: "👨‍⚕️",
      title: "Hỗ trợ chuyên gia",
      description:
        "Đội ngũ bác sĩ da liễu chuyên nghiệp sẵn sàng tư vấn và hỗ trợ 24/7",
      color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Features Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Công nghệ AI tiên tiến
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Tính năng{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              đột phá
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Trải nghiệm công nghệ chăm sóc da thông minh với AI được phát triển
            bởi các chuyên gia y tế hàng đầu
          </p>
        </div>

        {/* Key Features Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {keyFeatures.map((feature, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-b-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Showcase */}
        <div className="relative mb-20">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl"></div>
          <div className="relative grid lg:grid-cols-2 gap-16 items-center p-12 lg:p-16">
            {/* Left - Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative">
                <img
                  src="./feature.png"
                  alt="Skinalyze AI Features"
                  className="w-full h-auto rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                  ✨ AI Technology
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Công nghệ AI{" "}
                  <span className="text-green-600">thế hệ mới</span>
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Sử dụng thuật toán machine learning tiên tiến để phân tích
                  hình ảnh da với độ chính xác cao, giúp phát hiện sớm các vấn
                  đề tiềm ẩn và đưa ra lời khuyên chăm sóc phù hợp.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white/50 rounded-2xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    95%
                  </div>
                  <div className="text-sm text-gray-600">Độ chính xác</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-2xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    2s
                  </div>
                  <div className="text-sm text-gray-600">
                    Thời gian phân tích
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="http://api.nhatlonh.id.vn/files/Skinalyze.apk"
                  className="group flex items-center justify-center bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  Tải cho Android
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Features Grid */}
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-900 mb-4">
            Tại sao chọn <span className="text-green-600">Skinalyze</span>?
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Những lợi ích vượt trội mà chỉ Skinalyze mới có thể mang lại
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-green-200"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-t-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

              <div
                className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-2xl mb-6 transform group-hover:scale-110 transition-transform duration-300 border-2`}
              >
                {feature.icon}
              </div>

              <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
                {feature.title}
              </h4>

              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
