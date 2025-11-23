/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "framer-motion";
import { Specialist } from "../types";
import { Stethoscope } from "lucide-react";

interface SpecialistCardProps {
  specialist: Specialist;
  onClick: () => void;
}

const SpecialistCard: React.FC<SpecialistCardProps> = ({
  specialist,
  onClick,
}) => {
  return (
    <motion.div
      className="group relative h-[400px] md:h-[500px] w-full overflow-hidden border-b md:border-r border-white/10 bg-black cursor-pointer"
      initial="rest"
      whileHover="hover"
      whileTap="hover"
      animate="rest"
      data-hover="true"
      onClick={onClick}
    >
      {/* Image Background with Zoom */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src={specialist.image}
          alt={specialist.name}
          className="h-full w-full object-cover grayscale will-change-transform"
          variants={{
            rest: { scale: 1, opacity: 0.6, filter: "grayscale(100%)" },
            hover: { scale: 1.05, opacity: 0.9, filter: "grayscale(0%)" },
          }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
      </div>

      {/* Overlay Info */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono border border-[#4fb7b3]/30 text-[#4fb7b3] px-3 py-1 rounded-full backdrop-blur-md bg-[#4fb7b3]/10">
            {specialist.hospital}
          </span>
          <motion.div
            variants={{
              rest: { opacity: 0, x: 20, y: -20 },
              hover: { opacity: 1, x: 0, y: 0 },
            }}
            className="bg-[#4fb7b3] text-black rounded-full p-2 will-change-transform"
          >
            <Stethoscope className="w-5 h-5" />
          </motion.div>
        </div>

        <div>
          <div className="overflow-hidden">
            <motion.h3
              className="font-heading text-2xl md:text-3xl font-bold uppercase text-white mix-blend-difference will-change-transform leading-tight"
              variants={{
                rest: { y: 0 },
                hover: { y: -5 },
              }}
              transition={{ duration: 0.4 }}
            >
              {specialist.name}
            </motion.h3>
          </div>
          <motion.p
            className="text-xs md:text-sm font-medium uppercase tracking-widest text-[#a8fbd3] mt-2 will-change-transform"
            variants={{
              rest: { opacity: 0, y: 10 },
              hover: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {specialist.specialty}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default SpecialistCard;
