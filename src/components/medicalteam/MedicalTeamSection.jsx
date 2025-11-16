'use client'

import React from "react";

const MedicalTeamSection = () => {
  const doctors = [
    {
      name: "Dr. Minh Trí",
      title: "Bác sĩ Da liễu & AI Specialist",
      experience: "15+ năm kinh nghiệm",
      description:
        "Chuyên gia hàng đầu trong lĩnh vực chẩn đoán và điều trị các bệnh về da. Tiên phong trong việc ứng dụng AI vào y học da liễu tại Việt Nam.",
      specialties: ["Chẩn đoán AI", "Da liễu tổng quát", "Nghiên cứu AI"],
      image: "./DoctorMinhTri.png",
      color: "blue",
    },
    {
      name: "Dr. Tinh",
      title: "Bác sĩ Da liễu & Machine Learning",
      experience: "12+ năm kinh nghiệm",
      description:
        "Chuyên gia về da liễu và thẩm mỹ da, có kinh nghiệm sâu trong việc ứng dụng công nghệ AI vào chẩn đoán và tư vấn chăm sóc da.",
      specialties: ["Thẩm mỹ da", "Chăm sóc da", "Tư vấn AI"],
      image: "./DoctorTinh.png",
      color: "green",
    },
  ];

  return (
    <section id="doctors" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Đội ngũ y tế
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Được phát triển và giám sát bởi các chuyên gia da liễu hàng đầu
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {doctors.map((doctor, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200"
            >
              <div className="flex items-start space-x-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {doctor.name}
                  </h3>
                  <p className={`text-${doctor.color}-600 font-semibold mb-2`}>
                    {doctor.title}
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    {doctor.experience}
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {doctor.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {doctor.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 bg-${doctor.color}-100 text-${doctor.color}-800 rounded-full text-sm font-medium`}
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MedicalTeamSection;