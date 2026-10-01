"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HOUSE_CONFIG, HouseType } from "@/config/houses";
import {
  Crown,
  TribeLucideIcon,
  MessageCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Sparkles,
} from "@/components/RoyalIcons";

interface Student {
  name: string;
  level: string;
  department: string;
  college?: string;
  matricNumber?: string;
  house: HouseType;
}

const HOUSE_THEMES: Record<
  HouseType,
  {
    bgGradient: string;
    cardBg: string;
    textColor: string;
    borderColor: string;
    accentColor: string;
    overlayColor: string;
  }
> = {
  jael: {
    bgGradient: "from-[#2E1065] via-red-950 to-[#1E1B4B]",
    cardBg: "bg-white/95 backdrop-blur-md",
    textColor: "text-red-950",
    borderColor: "border-red-500",
    accentColor: "text-red-700",
    overlayColor: "bg-red-500/10",
  },
  abigail: {
    bgGradient: "from-[#2E1065] via-emerald-950 to-[#1E1B4B]",
    cardBg: "bg-white/95 backdrop-blur-md",
    textColor: "text-emerald-950",
    borderColor: "border-emerald-500",
    accentColor: "text-emerald-700",
    overlayColor: "bg-emerald-500/10",
  },
  esther: {
    bgGradient: "from-[#2E1065] via-[#581C87] to-[#1E1B4B]",
    cardBg: "bg-white/95 backdrop-blur-md",
    textColor: "text-purple-950",
    borderColor: "border-[#D4AF37]",
    accentColor: "text-purple-700",
    overlayColor: "bg-purple-500/10",
  },
  deborah: {
    bgGradient: "from-[#2E1065] via-blue-950 to-[#1E1B4B]",
    cardBg: "bg-white/95 backdrop-blur-md",
    textColor: "text-blue-950",
    borderColor: "border-blue-500",
    accentColor: "text-blue-700",
    overlayColor: "bg-blue-500/10",
  },
  priscilla: {
    bgGradient: "from-[#2E1065] via-pink-950 to-[#1E1B4B]",
    cardBg: "bg-white/95 backdrop-blur-md",
    textColor: "text-pink-950",
    borderColor: "border-pink-500",
    accentColor: "text-pink-700",
    overlayColor: "bg-pink-500/10",
  },
  // Legacy aliases
  stark: {
    bgGradient: "from-slate-100 via-slate-200 to-slate-300",
    cardBg: "bg-white/95 backdrop-blur-sm",
    textColor: "text-slate-800",
    borderColor: "border-slate-600/50",
    accentColor: "text-slate-700",
    overlayColor: "bg-white/10",
  },
  baratheon: {
    bgGradient: "from-amber-100 via-amber-200 to-yellow-300",
    cardBg: "bg-amber-50/95 backdrop-blur-sm",
    textColor: "text-amber-900",
    borderColor: "border-amber-700/50",
    accentColor: "text-amber-800",
    overlayColor: "bg-amber-500/10",
  },
  greyjoy: {
    bgGradient: "from-slate-800 via-slate-900 to-black",
    cardBg: "bg-slate-700/95 backdrop-blur-sm",
    textColor: "text-white",
    borderColor: "border-slate-500/50",
    accentColor: "text-slate-200",
    overlayColor: "bg-slate-600/20",
  },
  lannister: {
    bgGradient: "from-red-700 via-red-800 to-red-900",
    cardBg: "bg-red-600/95 backdrop-blur-sm",
    textColor: "text-white",
    borderColor: "border-red-400/50",
    accentColor: "text-red-200",
    overlayColor: "bg-red-500/20",
  },
  targaryen: {
    bgGradient: "from-rose-600 via-red-700 to-rose-800",
    cardBg: "bg-rose-600/95 backdrop-blur-sm",
    textColor: "text-white",
    borderColor: "border-rose-400/50",
    accentColor: "text-rose-200",
    overlayColor: "bg-rose-500/20",
  },
};

export default function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      setError("Invalid student ID");
      setLoading(false);
      return;
    }

    fetch(`/api/student?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Student record not found");
        return res.json();
      })
      .then((data) => {
        const studentRecord = data.student || data;
        setStudent(studentRecord);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B]">
        <div className="bg-white/95 border-4 border-[#D4AF37] rounded-3xl p-8 shadow-2xl text-center max-w-md mx-auto">
          <svg
            className="animate-spin h-10 w-10 text-[#D4AF37] mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-purple-950 font-bold text-lg">Revealing Your Royal Tribe...</p>
        </div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B]">
        <div className="bg-white/95 border-4 border-[#D4AF37] rounded-3xl p-8 shadow-2xl text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Notice</h2>
          <p className="text-gray-700 mb-6">{error || "Unable to find registration record."}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-[#7E22CE] to-[#9333EA] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all border border-[#D4AF37]"
          >
            Return to Registration
          </button>
        </div>
      </main>
    );
  }

  const rawHouse = (student.house ? student.house.toLowerCase() : "esther") as HouseType;
  const houseConfig = HOUSE_CONFIG[rawHouse] || HOUSE_CONFIG.esther;
  const theme = HOUSE_THEMES[rawHouse] || HOUSE_THEMES.esther;

  return (
    <main
      className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} p-4 sm:p-8 flex items-center justify-center relative overflow-hidden`}
    >
      {/* Background royal pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>

      <div className="max-w-2xl w-full mx-auto relative z-10 space-y-6">
        {/* Main Royal Crest Card */}
        <div
          className={`${theme.cardBg} rounded-3xl shadow-2xl border-4 ${theme.borderColor} p-6 sm:p-8 text-center relative overflow-hidden`}
        >
          {/* Top Gold Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#D4AF37] via-[#F5D061] to-[#D4AF37]"></div>

          <div className="mt-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-purple-100 text-[#4C1D95] border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>The Sisters Olympics</span>
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            </span>
          </div>

          {/* Tribe Avatar with Lucide Icon */}
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full flex items-center justify-center shadow-2xl mb-4 border-4"
            style={{
              backgroundColor: `${houseConfig.hex}25`,
              borderColor: houseConfig.hex,
              color: houseConfig.hex,
            }}
          >
            <TribeLucideIcon tribe={rawHouse} className="w-12 h-12 sm:w-14 sm:h-14" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#3B0764] mb-2 tracking-tight">
            Welcome to {houseConfig.name}!
          </h1>

          <p className="text-base sm:text-lg font-semibold text-[#B8860B] mb-5">
            {houseConfig.tagline || "Loved by the father, claimed by the king"}
          </p>

          <div className="h-1 w-20 mx-auto rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D061] mb-6"></div>

          {/* Student Info Pill */}
          <div className="bg-purple-50/90 rounded-2xl p-4 sm:p-5 border-2 border-purple-200/80 max-w-lg mx-auto shadow-sm">
            <p className="text-xl sm:text-2xl font-black text-gray-900 mb-2 tracking-tight">
              {student.name}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm font-semibold">
              {student.level && (
                <span className="px-3.5 py-1 rounded-full bg-purple-100 text-[#581C87] border border-purple-300 font-bold">
                  Level {student.level}
                </span>
              )}
              {(student.college || student.department) && (
                <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-bold">
                  {student.college || student.department}
                </span>
              )}
              {student.matricNumber && (
                <span className="px-3.5 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-300 font-bold">
                  {student.matricNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp & Tribe Connect Card */}
        <div
          className={`${theme.cardBg} rounded-3xl shadow-2xl border-4 border-[#D4AF37] p-6 sm:p-8 text-center relative overflow-hidden`}
        >
          <h3 className="font-extrabold text-xl sm:text-2xl text-[#3B0764] mb-2 flex items-center justify-center gap-2">
            <MessageCircle className="w-6 h-6 text-[#16A34A]" />
            <span>Join {houseConfig.name} Group</span>
          </h3>
          <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-md mx-auto">
            Connect with your fellow sisters in {houseConfig.name} on WhatsApp to coordinate for the games and activities!
          </p>

          <button
            type="button"
            onClick={() =>
              window.open(houseConfig.whatsapp, "_blank", "noopener,noreferrer")
            }
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 border-2 border-green-300"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span>Join {houseConfig.name} WhatsApp</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center text-purple-200 text-xs sm:text-sm">
          <p className="font-semibold text-[#F5D061] italic flex items-center justify-center gap-2">
            <Crown className="w-4 h-4 text-[#F5D061]" />
            <span>&ldquo;Tell a friend to tell a friend. May the best house win&rdquo;</span>
            <Crown className="w-4 h-4 text-[#F5D061]" />
          </p>
          <p className="mt-1 flex items-center justify-center gap-2 text-purple-300">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Saturday, 17th October, 2026</span>
            <span>•</span>
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Main school field</span>
          </p>
        </div>
      </div>
    </main>
  );
}
