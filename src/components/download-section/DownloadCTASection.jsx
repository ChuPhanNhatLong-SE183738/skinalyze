'use client'
import React from "react";

const DownloadCTASection = () => {
  const stats = [
    { number: "500K+", label: "Lượt tải xuống" },
    { number: "95%", label: "Độ chính xác" },
    { number: "4.8★", label: "Đánh giá" },
    { number: "24/7", label: "Hỗ trợ" },
  ];

  const handleDownload = () => {
    const downloadUrl = "http://api.nhatlonh.id.vn/files/Skinalyze.apk";
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "Skinalyze.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="download" className="py-20 bg-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Tải ứng dụng ngay hôm nay
        </h2>
        <p className="text-xl opacity-90 mb-12 max-w-3xl mx-auto leading-relaxed">
          Bắt đầu hành trình chăm sóc da thông minh với công nghệ AI tiên tiến.
          Hoàn toàn miễn phí và dễ sử dụng.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl transition-colors font-medium"
          >
            <svg
              className="w-8 h-8 mr-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
            </svg>
            <div className="text-left">
              <div className="text-sm opacity-80">Tải xuống cho</div>
              <div className="text-lg font-semibold">Android</div>
            </div>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold mb-2">{stat.number}</div>
              <div className="text-green-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DownloadCTASection;
