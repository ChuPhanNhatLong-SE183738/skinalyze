"use client";

import React from "react";
import { motion } from "framer-motion";

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
      title: "Schedule",
      description:
        "Track your skin health with smart personalized examination calendar",
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
      title: "Smart AI Camera",
      description:
        "Advanced AI technology helps capture high-quality photos and accurate analysis",
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
      title: "Expert Consultation",
      description:
        "Connect directly with top dermatologists for in-depth consultation",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  const features = [
    {
      icon: "🎯",
      title: "Accurate Diagnosis",
      description: "Up to 95% accuracy verified by leading medical experts",
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      icon: "⚡",
      title: "Instant Results",
      description:
        "Receive detailed analysis results in just seconds after taking a photo",
      color: "bg-green-50 text-green-600 border-green-200",
    },
    {
      icon: "📊",
      title: "Track Progress",
      description:
        "Store history and scientifically track skin changes over time",
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
    {
      icon: "🔒",
      title: "Absolute Security",
      description:
        "Data encrypted end-to-end and protected by international medical standards",
      color: "bg-red-50 text-red-600 border-red-200",
    },
    {
      icon: "💡",
      title: "Personal Advice",
      description:
        "AI analyzes and provides personalized skin care recommendations for each individual",
      color: "bg-yellow-50 text-yellow-600 border-yellow-200",
    },
    {
      icon: "👨‍⚕️",
      title: "Expert Support",
      description:
        "Professional dermatology team ready to consult and support 24/7",
      color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
  ];

  return (
    <section id="features" className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Features Hero */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-4 py-2 glass-card text-emerald-300 rounded-full text-xs font-mono uppercase tracking-widest mb-6 border border-emerald-300/30"
          >
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
            CÔNG NGHỆ AI TIÊN TIẾN
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight uppercase"
          >
            TÍNH NĂNG <span className="gradient-text">ĐỘT PHÁ</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Experience intelligent skin care technology with AI developed by
            leading medical experts
          </motion.p>
        </div>

        {/* Key Features Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {keyFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
              data-hover="true"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
              <motion.div
                whileHover={{ y: -8 }}
                className="relative glass-card border border-white/10 rounded-3xl p-8 hover:border-emerald-400/30 transition-all duration-500"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors uppercase tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed font-light">
                  {feature.description}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-b-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Feature Showcase */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative mb-20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-3xl"></div>
          <div className="relative grid lg:grid-cols-2 gap-16 items-center p-12 lg:p-16 glass-card border border-white/10 rounded-3xl">
            {/* Left - Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative">
                <img
                  src="./feature.png"
                  alt="Skinalyze AI Features"
                  className="w-full h-auto rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-3xl"></div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center px-3 py-1 glass-card text-emerald-300 rounded-full text-xs font-mono uppercase tracking-widest mb-4 border border-emerald-300/30">
                  ✨ AI TECHNOLOGY
                </div>
                <h3 className="text-4xl font-black text-white mb-6 leading-tight uppercase tracking-tight">
                  NEXT-GEN <span className="gradient-text">AI TECHNOLOGY</span>
                </h3>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed font-light">
                  Using advanced machine learning algorithms to analyze skin
                  images with high accuracy, helping to detect potential issues
                  early and provide appropriate care recommendations.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 glass-card rounded-2xl border border-emerald-400/30">
                  <div className="text-3xl font-black gradient-text mb-2">
                    95%
                  </div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider font-mono">
                    Accuracy
                  </div>
                </div>
                <div className="text-center p-4 glass-card rounded-2xl border border-teal-400/30">
                  <div className="text-3xl font-black gradient-text mb-2">
                    2s
                  </div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider font-mono">
                    Analysis
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="http://api.nhatlonh.id.vn/files/Skinalyze.apk"
                  className="group flex items-center justify-center glass-card text-white border border-white/20 px-8 py-4 rounded-2xl font-bold hover:border-emerald-400/50 transition-all duration-300 glow-emerald uppercase tracking-widest text-sm"
                  data-hover="true"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  Download Android
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Features Grid */}
        <div className="text-center mb-16">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-white mb-4 uppercase tracking-tight"
          >
            WHY CHOOSE <span className="gradient-text">SKINALYZE</span>?
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto font-light"
          >
            Outstanding benefits that only Skinalyze can provide
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8 }}
              className="group relative glass-card rounded-3xl p-8 hover:border-[#4fb7b3]/30 transition-all duration-500 border border-white/10"
              data-hover="true"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4fb7b3] to-[#a8fbd3] rounded-t-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center text-2xl mb-6 border border-emerald-400/30"
              >
                {feature.icon}
              </motion.div>

              <h4 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors uppercase tracking-wide">
                {feature.title}
              </h4>

              <p className="text-gray-400 leading-relaxed font-light">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
