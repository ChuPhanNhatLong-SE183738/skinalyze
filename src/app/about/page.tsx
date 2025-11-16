import Navbar from "@/components/navbar/Navbar";
import React from "react";

const About = () => {
  const stats = [
    { number: "94%", label: "Độ chính xác AI" },
    { number: "1M+", label: "Hình ảnh đã phân tích" },
    { number: "50+", label: "Bệnh da được nhận diện" },
    { number: "24/7", label: "Hỗ trợ khách hàng" },
  ];

  const timeline = [
    {
      year: "2025",
      title: "Thành lập công ty",
      description:
        "Skinalyze được thành lập với tầm nhìn ứng dụng AI vào chăm sóc sức khỏe da",
    },
    {
      year: "2025",
      title: "Phát triển AI Engine",
      description:
        "Xây dựng thuật toán AI đầu tiên cho phân tích da với độ chính xác 85%",
    },
    {
      year: "2026",
      title: "Ra mắt Beta Version",
      description:
        "Thử nghiệm với 1000+ người dùng và cải thiện độ chính xác lên 90%",
    },
    {
      year: "2027",
      title: "Mở rộng thị trường",
      description: "Chính thức ra mắt tại Việt Nam và các nước Đông Nam Á",
    },
    {
      year: "2028",
      title: "AI 3.0 & Mô hình 3D",
      description:
        "Nâng cấp lên AI 3.0 với độ chính xác 94% và tích hợp công nghệ 3D",
    },
  ];

  const team = [
    {
      name: "Dr. Nguyễn Minh Anh",
      position: "CEO & Co-founder",
      specialty: "AI Research & Product Strategy",
      image:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop&crop=face",
      description: "15+ năm kinh nghiệm trong AI và công nghệ y tế",
    },
    {
      name: "Dr. Trần Thị Mai",
      position: "Chief Medical Officer",
      specialty: "Dermatology & Clinical Research",
      image:
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face",
      description: "Chuyên gia da liễu với 20+ năm kinh nghiệm lâm sàng",
    },
    {
      name: "Lê Văn Đức",
      position: "CTO & Co-founder",
      specialty: "Machine Learning & Software Architecture",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      description: "Chuyên gia AI với background từ Google và Microsoft",
    },
    {
      name: "Phạm Thị Hương",
      position: "Head of UX Design",
      specialty: "Healthcare UX & Product Design",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      description: "10+ năm thiết kế UX cho các ứng dụng y tế",
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
            Về chúng tôi
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Chúng tôi là <span className="text-green-600">Skinalyze</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tiên phong trong việc ứng dụng trí tuệ nhân tạo để cách mạng hóa
            ngành chăm sóc sức khỏe da, mang đến giải pháp chẩn đoán thông minh
            và chính xác cho mọi người.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Sứ mệnh & Tầm nhìn
              </h2>

              <div className="space-y-8">
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Sứ mệnh
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Democratize việc tiếp cận chăm sóc sức khỏe da thông qua
                    công nghệ AI tiên tiến, giúp mọi người có thể phát hiện sớm
                    và quản lý các vấn đề da liễu một cách hiệu quả và thuận
                    tiện.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Tầm nhìn
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Trở thành nền tảng AI hàng đầu thế giới trong lĩnh vực chẩn
                    đoán da liễu, góp phần xây dựng một tương lai mà việc chăm
                    sóc sức khỏe da trở nên dễ dàng, chính xác và có thể tiếp
                    cận được với mọi người.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Innovation First
                  </h3>
                  <p className="text-gray-600">
                    Không ngừng đổi mới và cải tiến công nghệ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Thành tích của chúng tôi
            </h2>
            <p className="text-lg text-gray-600">
              Những con số ấn tượng trong hành trình phát triển Skinalyze
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Hành trình phát triển
            </h2>
            <p className="text-lg text-gray-600">
              Từ ý tưởng đến hiện thực - câu chuyện của Skinalyze
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-green-200"></div>

            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={index} className="relative flex items-start">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10">
                    {item.year.slice(-2)}
                  </div>
                  <div className="ml-8 bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow flex-1">
                    <div className="text-sm text-green-600 font-semibold mb-1">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Giá trị cốt lõi
            </h2>
            <p className="text-lg text-gray-600">
              Những nguyên tắc định hướng mọi hoạt động của chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Chính xác
              </h3>
              <p className="text-gray-600">
                Cam kết cung cấp kết quả phân tích chính xác và đáng tin cậy
                nhất
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bảo mật</h3>
              <p className="text-gray-600">
                Bảo vệ thông tin cá nhân và dữ liệu y tế của người dùng một cách
                tuyệt đối
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Đổi mới</h3>
              <p className="text-gray-600">
                Không ngừng nghiên cứu và phát triển công nghệ mới
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Hợp tác</h3>
              <p className="text-gray-600">
                Làm việc chặt chẽ với cộng đồng y tế và nghiên cứu
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quan tâm</h3>
              <p className="text-gray-600">
                Đặt sức khỏe và lợi ích của người dùng lên hàng đầu
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Toàn cầu</h3>
              <p className="text-gray-600">
                Hướng tới phục vụ người dùng trên toàn thế giới
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Đội ngũ lãnh đạo
            </h2>
            <p className="text-lg text-gray-600">
              Những chuyên gia hàng đầu đang dẫn dắt Skinalyze tiến lên
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <div className="text-green-600 font-semibold mb-2">
                    {member.position}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    {member.specialty}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Tham gia cùng chúng tôi trong hành trình cách mạng hóa chăm sóc da
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Khám phá sức mạnh của AI trong việc chăm sóc sức khỏe da của bạn
          </p>
          <a
            href="https://drive.usercontent.google.com/download?id=123ZloJnFZ7Zl_ifoFm61ntP1f1r0LqAt&export=download&authuser=0&confirm=t&uuid=9131b936-3d60-41c7-a7ad-cc2b70e843a5&at=AN8xHopwJHFiAzU-0nvW7l_zIAeV%3A1752304941111"
            className="bg-white text-green-600 font-semibold py-4 px-8 rounded-2xl hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
          >
            Tải ứng dụng miễn phí
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;
