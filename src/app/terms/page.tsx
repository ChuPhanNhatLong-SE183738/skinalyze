"use client";

import Navbar from "@/components/navbar/Navbar";
import React from "react";

const Terms = () => (
  <div className="min-h-screen bg-[#0a0e1a]">
    <Navbar />
    <main className="max-w-3xl mx-auto px-4 py-32">
      <h1 className="text-4xl font-bold mb-6 gradient-text">
        Skinalyze Terms & Conditions
      </h1>
      <p className="mb-6 text-gray-300">
        Welcome to Skinalyze – an AI system for scanning, analyzing and
        consulting on skin health. Please read the following terms carefully
        before using our service.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-emerald-400">
        1. Purpose of Use
      </h2>
      <p className="mb-4 text-gray-300">
        Skinalyze is an artificial intelligence (AI) platform in the medical
        field, helping users scan and analyze skin images and provide reference
        information about dermatological issues. This service does not replace
        professional medical diagnosis or treatment.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-emerald-400">
        2. User Rights and Responsibilities
      </h2>
      <ul className="list-disc pl-6 mb-4 text-gray-300">
        <li>
          Only use Skinalyze for personal or research purposes, not for
          commercial purposes without permission.
        </li>
        <li>
          Do not arbitrarily modify, copy, distribute or exploit the
          system&apos;s AI data.
        </li>
        <li>
          Be responsible for the accuracy of images and information provided to
          the system.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-emerald-400">
        3. Skinalyze Rights and Responsibilities
      </h2>
      <ul className="list-disc pl-6 mb-4 text-gray-300">
        <li>
          Provide AI skin analysis services based on the most modern data and
          algorithms.
        </li>
        <li>
          Secure users&apos; personal information and images in accordance with
          legal regulations.
        </li>
        <li>
          Not responsible for medical decisions based entirely on AI results
          without consultation from a specialist doctor.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-emerald-400">
        4. Limitation of Liability
      </h2>
      <p className="mb-4 text-gray-300">
        Analysis results from Skinalyze are for reference only and do not
        replace professional medical advice. Users should consult professional
        medical advice before making treatment decisions.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-emerald-400">
        5. Privacy & Data Security
      </h2>
      <p className="mb-4 text-gray-300">
        Skinalyze is committed to securing users&apos; personal information,
        images and medical data. Data is only used for AI analysis purposes and
        service quality improvement, not shared with third parties without
        consent.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-emerald-400">
        6. Terms Modification
      </h2>
      <p className="mb-4 text-gray-300">
        Skinalyze reserves the right to change and update the terms of use at
        any time. Users should check regularly for the latest information.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3 text-emerald-400">
        7. Contact
      </h2>
      <p className="mb-4 text-gray-300">
        If you have any questions about the terms of use, please contact us via
        email:{" "}
        <a
          href="mailto:support@Skinalyze.ai"
          className="text-emerald-400 underline hover:text-emerald-300 transition-colors"
        >
          support@Skinalyze.ai
        </a>
      </p>

      <div className="mt-12 text-gray-500 text-sm">Last updated: 07/2024</div>
    </main>
  </div>
);

export default Terms;
