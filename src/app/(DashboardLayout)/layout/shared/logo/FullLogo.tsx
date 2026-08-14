"use client";

import Link from "next/link";
import { IconHeartHandshake } from "@tabler/icons-react";

interface FullLogoProps {
  href?: string;
  className?: string;
}

const FullLogo: React.FC<FullLogoProps> = ({ href = "/dashboard", className = "" }) => {
  return (
    <Link href={href} className={`flex items-center gap-3 py-2 group ${className}`}>
      <div className="flex items-center justify-center w-11 h-11 rounded-[16px] bg-[#00b589] text-white shadow-md shadow-emerald-600/20 shrink-0 group-hover:scale-105 transition-transform duration-200">
        <IconHeartHandshake size={26} stroke={2.2} />
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex items-center leading-none">
          <span className="text-2xl font-extrabold tracking-tight text-[#00604b] dark:text-emerald-400">
            HealthEasy
          </span>
          <span className="text-2xl font-black text-[#ff9600] ml-0.5">-G</span>
        </div>
        <span className="text-[10px] font-bold tracking-widest text-[#5c728d] dark:text-slate-400 uppercase mt-1">
          GHANA HOSPITAL PLATFORM
        </span>
      </div>
    </Link>
  );
};

export default FullLogo;

