const HowItWorksSection = () => {
  const steps = [
    {
      step: "01",
      title: "Chụp ảnh",
      description:
        "Sử dụng camera điện thoại để chụp ảnh vùng da cần kiểm tra với ánh sáng tự nhiên",
      icon: "📱",
    },
    {
      step: "02",
      title: "AI phân tích",
      description:
        "Thuật toán AI sẽ phân tích hình ảnh và so sánh với hàng triệu mẫu dữ liệu y tế",
      icon: "🤖",
    },
    {
      step: "03",
      title: "Nhận kết quả",
      description:
        "Xem báo cáo chi tiết và nhận lời khuyên từ các chuyên gia da liễu",
      icon: "📊",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Cách thức hoạt động
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chỉ với 3 bước đơn giản, bạn có thể nhận được phân tích chi tiết về
            tình trạng da
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  {item.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-white border-4 border-green-600 rounded-full flex items-center justify-center">
                  <span className="font-bold text-green-600 text-sm">
                    {item.step}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {item.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
