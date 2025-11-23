"use client";

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
      question: "How does Skinalyze AI work?",
      answer:
        "Skinalyze uses advanced artificial intelligence technology to analyze skin images. The system is trained on millions of dermatological images and uses deep learning algorithms to identify abnormalities, providing assessments and reference recommendations.",
    },
    {
      question: "What is the accuracy rate of Skinalyze AI?",
      answer:
        "Skinalyze AI achieves up to 94% accuracy in detecting common skin problems. However, results are for reference only and do not replace professional medical diagnosis.",
    },
    {
      question: "Can I fully trust the AI results?",
      answer:
        "No. Results from Skinalyze AI are only a reference support tool. You should always consult with a dermatologist for accurate diagnosis and appropriate treatment methods.",
    },
    {
      question: "What types of skin conditions can Skinalyze detect?",
      answer:
        "Skinalyze can identify and assess common skin issues such as: acne, dermatitis, melasma, freckles, cysts, abnormal moles, and many other skin conditions. The system is continuously updated to expand recognition capabilities.",
    },
    {
      question: "How to take proper skin photos?",
      answer:
        "For best results: (1) Take photos in natural light or white LED light, (2) Keep camera about 15-20cm from the skin area, (3) Ensure images are clear and not blurry, (4) The skin area to be analyzed should occupy at least 50% of the frame.",
    },
    {
      question: "Is my data and images secure?",
      answer:
        "Yes. Skinalyze is committed to absolute confidentiality of users' personal information and images. Data is encrypted and stored securely, not shared with third parties without your consent.",
    },
    {
      question: "Is Skinalyze free?",
      answer:
        "Skinalyze offers a free version with basic features. The Premium version with advanced features such as detailed analysis, history tracking, and expert consultation is paid.",
    },
    {
      question: "Can I use Skinalyze on my phone?",
      answer:
        "Yes. Skinalyze has mobile applications for both iOS and Android. You can also use the web version on mobile browsers.",
    },
    {
      question: "Is Skinalyze suitable for children?",
      answer:
        "Skinalyze is designed for all ages, however for children under 13, parents need to supervise and consult with a pediatrician before using the analysis results.",
    },
    {
      question:
        "If I'm not satisfied with the results, can I file a complaint?",
      answer:
        "If you have questions about the analysis results, please contact our support team via email support@Skinalyze.ai or live chat. We will review and assist you within 24 hours.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-emerald-950/50 to-teal-950/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 glass-card border border-emerald-400/30 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
            <span className="gradient-text">Customer Support</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Learn more about Skinalyze AI and how to use the intelligent skin
            analysis system
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#0a0e1a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqData.map((item, index: number) => (
              <div
                key={index}
                className="glass-card border border-white/10 rounded-2xl hover:border-emerald-400/50 transition-all duration-200"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 rounded-2xl"
                >
                  <h3 className="text-lg font-semibold text-white pr-4">
                    {item.question}
                  </h3>
                  <div className="flex-shrink-0">
                    <svg
                      className={`w-5 h-5 text-emerald-400 transform transition-transform duration-200 ${
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
                      <p className="text-gray-400 leading-relaxed">
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
      <section className="py-20 bg-gradient-to-br from-emerald-950/30 to-teal-950/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Still have questions?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Our support team is always ready to help you
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="glass-card border border-white/10 p-6 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-emerald-400"
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
              <h3 className="text-lg font-semibold text-white mb-2">
                Support Email
              </h3>
              <p className="text-gray-400 mb-4">Send us an email</p>
              <a
                href="mailto:support@Skinalyze.ai"
                className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
              >
                support@Skinalyze.ai
              </a>
            </div>

            <div className="glass-card border border-white/10 p-6 rounded-2xl">
              <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-teal-400"
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
              <h3 className="text-lg font-semibold text-white mb-2">
                Live Chat
              </h3>
              <p className="text-gray-400 mb-4">24/7 Support</p>
              <button className="text-teal-400 font-medium hover:text-teal-300 transition-colors">
                Start Chat
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
