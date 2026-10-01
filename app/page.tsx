"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HOUSE_CONFIG, PRIMARY_HOUSES } from "@/config/houses";
import {
  Crown,
  Sparkles,
  User,
  GraduationCap,
  Landmark,
  Hash,
  Mail,
  Phone,
  Trophy,
  HeartPulse,
  Lightbulb,
  Calendar,
  MapPin,
  Lock,
  Target,
  Check,
  Plus,
  AlertCircle,
  TribeLucideIcon,
} from "@/components/RoyalIcons";

const LEVELS = ["100", "200", "300", "400", "500"];
const COLLEGES = [
  "COAES",
  "COMSS",
  "COCS",
  "COHES",
  "COLAW",
  "COEVS",
  "COLBS",
];

const ACTIVITIES = [
  "March Past",
  "Tug of War",
  "Sack Race",
  "Three-Legged Race",
  "Egg and Spoon Race",
  "100m Race",
  "Relay Race",
  "Balls and Baskets",
  "Blind Ball Picking",
  "Basketball",
  "Football",
  "Chess",
  "Ludo",
  "Musical Chairs",
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    department: "",
    matricNumber: "",
    email: "",
    phoneNumber: "",
    sportsEvents: [] as string[],
    medicalConsiderations: "",
    suggestions: "",
  });
  const [registered, setRegistered] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [closedMessage, setClosedMessage] = useState<string>("");

  const matricPlaceholder = formData.department
    ? `Example: BU22${formData.department}1068`
    : "Enter your matric number (e.g. BU22COCS1068)";

  useEffect(() => {
    // Check if user already registered on this device
    if (typeof window !== "undefined" && localStorage.getItem("registered_once")) {
      setRegistered(true);
    }

    // Check registration status from server
    fetch("/api/registration-status")
      .then((res) => res.json())
      .then((data) => {
        setRegistrationOpen(data.open);
        setClosedMessage(data.message);
      })
      .catch((err) => {
        console.error("Failed to check registration status:", err);
        setRegistrationOpen(true);
      });
  }, []);

  const toggleActivity = (activity: string) => {
    setFormData((prev) => {
      const exists = prev.sportsEvents.includes(activity);
      if (exists) {
        return {
          ...prev,
          sportsEvents: prev.sportsEvents.filter((item) => item !== activity),
        };
      } else {
        return {
          ...prev,
          sportsEvents: [...prev.sportsEvents, activity],
        };
      }
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed. Please check your details.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("registered_once", "yes");
      }
      setRegistered(true);
      router.push(`/result?id=${data.student._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong during registration.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (registrationOpen === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B]">
        <div className="bg-white/95 border-4 border-[#D4AF37] rounded-3xl p-8 shadow-2xl text-center max-w-md mx-auto">
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin h-10 w-10 text-[#D4AF37]"
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
          </div>
          <p className="mt-4 text-[#3B0764] font-bold text-lg">Preparing the Royal Court...</p>
        </div>
      </main>
    );
  }

  // Registration closed
  if (registrationOpen === false) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B]">
        <div className="bg-white/95 border-4 border-[#D4AF37] rounded-3xl p-8 shadow-2xl text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center text-[#B8860B]">
            <Lock className="w-8 h-8 text-[#B8860B]" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#3B0764] mb-3">Registration Closed</h2>
          <p className="text-gray-700 mb-6 text-base">
            {closedMessage || "Registration is currently closed. Please contact the organizers for more information."}
          </p>
          <div className="pt-4 border-t border-[#D4AF37]/30">
            <p className="text-sm text-purple-800 font-semibold tracking-wide uppercase">Daughters of the King</p>
          </div>
        </div>
      </main>
    );
  }

  // Already registered
  if (registered) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B]">
        <div className="bg-white/95 border-4 border-[#D4AF37] rounded-3xl p-8 shadow-2xl text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 flex items-center justify-center text-[#7E22CE]">
            <Crown className="w-10 h-10 text-[#D4AF37]" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#3B0764] mb-3">Registration Completed</h2>
          <p className="text-gray-700 mb-4 text-base">
            You have already registered your place in the Kingdom on this device.
          </p>
          <p className="text-[#B8860B] font-semibold text-sm">
            May your tribe bring glory to the King!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-hidden">
      {/* Royal Lilac & Gold Gradient Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at top, #4C1D95 0%, #2E1065 40%, #1E1B4B 80%, #0F0A1E 100%)",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:28px_28px] opacity-15"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2E1065]/40 to-[#0F0A1E]/80"></div>
      </div>

      {/* Floating Tribe Emblems at the top */}
      <div className="fixed top-0 left-0 right-0 z-10 flex justify-center gap-2 sm:gap-4 p-2 sm:p-4 opacity-80">
        {PRIMARY_HOUSES.map((key) => {
          const house = HOUSE_CONFIG[key];
          return (
            <div
              key={key}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-md transition-all hover:scale-110"
              style={{
                backgroundColor: `${house.hex}25`,
                borderColor: house.hex,
                color: house.hex,
              }}
              title={`${house.name} (${house.colorName})`}
            >
              <TribeLucideIcon tribe={key} className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
          );
        })}
      </div>

      {/* Main Container */}
      <div className="relative z-20 w-full max-w-5xl my-8">
        {/* Event Header Banner */}
        <div className="text-center mb-8 sm:mb-12 px-3 pt-6">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/60 text-[#FFE082] px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase mb-4 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-[#F5D061]" />
            <span>Annual Royal Gathering</span>
            <Sparkles className="w-4 h-4 text-[#F5D061]" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-3 tracking-tight drop-shadow-2xl">
            <span className="bg-gradient-to-r from-[#FCE7F3] via-[#E9D5FF] to-[#F5D061] bg-clip-text text-transparent">
              Daughters of the King
            </span>
          </h1>

          <p className="text-xl sm:text-2xl lg:text-3xl font-semibold italic text-[#F5D061] mb-5 tracking-wide drop-shadow-md">
            &ldquo;Loved by the father, claimed by the king&rdquo;
          </p>

          {/* Event Details Badge with Lucide icons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-purple-100 max-w-2xl mx-auto">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-sm">
              <Calendar className="w-4 h-4 text-[#F5D061]" />
              <span><strong>Tentative Date:</strong> Saturday, 17th October, 2026</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-sm">
              <MapPin className="w-4 h-4 text-[#F5D061]" />
              <span><strong>Venue:</strong> Main school field</span>
            </div>
          </div>
        </div>

        {/* Content Layout: Form & Sidebars */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Registration Form */}
          <div className="w-full lg:col-span-2">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-4 border-[#D4AF37] relative overflow-hidden p-5 sm:p-8">
              {/* Decorative Lilac & Gold Header Bar */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#C084FC] via-[#D4AF37] to-[#EC4899]"></div>

              <div className="text-center mb-6 pt-2">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7E22CE] to-[#4C1D95] text-white px-5 py-2.5 rounded-full mb-3 shadow-md border border-[#D4AF37]/50">
                  <Crown className="w-5 h-5 text-[#F5D061]" />
                  <h2 className="text-lg sm:text-xl font-bold tracking-wide">
                    Claim Your Tribe
                  </h2>
                  <Sparkles className="w-4 h-4 text-[#F5D061]" />
                </div>
                <p className="text-gray-700 text-sm sm:text-base font-medium">
                  Register your information to be assigned to your royal tribe.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:gap-5">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-bold text-purple-950 mb-1.5 uppercase tracking-wider flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-[#9333EA]" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#9333EA] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-500 shadow-sm text-base"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Level & College */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Level */}
                    <div>
                      <label
                        htmlFor="level"
                        className="block text-sm font-bold text-purple-950 mb-1.5 uppercase tracking-wider flex items-center gap-2"
                      >
                        <GraduationCap className="w-4 h-4 text-[#9333EA]" />
                        Level
                      </label>
                      <select
                        id="level"
                        required
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({ ...formData, level: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#9333EA] outline-none transition-all font-medium text-gray-900 shadow-sm appearance-none cursor-pointer text-base"
                      >
                        <option value="">Select your level</option>
                        {LEVELS.map((level) => (
                          <option key={level} value={level}>
                            Level {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* College */}
                    <div>
                      <label
                        htmlFor="department"
                        className="block text-sm font-bold text-purple-950 mb-1.5 uppercase tracking-wider flex items-center gap-2"
                      >
                        <Landmark className="w-4 h-4 text-[#9333EA]" />
                        College
                      </label>
                      <select
                        id="department"
                        required
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({ ...formData, department: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#9333EA] outline-none transition-all font-medium text-gray-900 shadow-sm appearance-none cursor-pointer text-base"
                      >
                        <option value="">Select college</option>
                        {COLLEGES.map((college) => (
                          <option key={college} value={college}>
                            {college}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Matric Number */}
                  <div>
                    <label
                      htmlFor="matricNumber"
                      className="block text-sm font-bold text-purple-950 mb-1.5 uppercase tracking-wider flex items-center gap-2"
                    >
                      <Hash className="w-4 h-4 text-[#9333EA]" />
                      Matric Number
                      {formData.level === "100" && (
                        <span className="text-xs font-normal text-purple-700 lowercase">(optional for 100 level)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      id="matricNumber"
                      value={formData.matricNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          matricNumber: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#9333EA] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-500 shadow-sm text-base"
                      placeholder={matricPlaceholder}
                    />
                    <p className="mt-1.5 text-xs text-purple-900 font-medium">
                      {formData.department
                        ? `Format: BUXX${formData.department}XXXX (e.g. BU22${formData.department}1068)`
                        : "Format: BUXXXXXXXXXX once you select your college."}
                    </p>
                  </div>

                  {/* Email & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-bold text-purple-950 mb-1.5 uppercase tracking-wider flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4 text-[#9333EA]" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#9333EA] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-500 shadow-sm text-base"
                        placeholder="sister@example.com"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-bold text-purple-950 mb-1.5 uppercase tracking-wider flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4 text-[#9333EA]" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, phoneNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#9333EA] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-500 shadow-sm text-base"
                        placeholder="e.g. 08123456789"
                      />
                    </div>
                  </div>

                  {/* Sports Events Interested In */}
                  <div>
                    <label className="block text-sm font-bold text-purple-950 mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-[#D4AF37]" />
                        Sports Events Interested In
                      </span>
                      <span className="text-xs font-normal text-purple-700 capitalize">
                        (Select all you like)
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-3 bg-purple-50/70 border-2 border-purple-200 rounded-xl">
                      {ACTIVITIES.map((activity) => {
                        const isSelected = formData.sportsEvents.includes(activity);
                        return (
                          <button
                            type="button"
                            key={activity}
                            onClick={() => toggleActivity(activity)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                              isSelected
                                ? "bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white border-[#D4AF37] shadow-sm scale-102"
                                : "bg-white text-gray-800 border-purple-200 hover:border-[#D4AF37] hover:bg-purple-100/50"
                            }`}
                          >
                            <span className="truncate">{activity}</span>
                            <span className="text-xs ml-1 flex-shrink-0 font-bold">
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-[#F5D061]" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Relevant Medical Considerations */}
                  <div>
                    <label
                      htmlFor="medicalConsiderations"
                      className="block text-sm font-bold text-purple-950 mb-1.5 uppercase tracking-wider flex items-center gap-2"
                    >
                      <HeartPulse className="w-4 h-4 text-[#9333EA]" />
                      Relevant Medical Considerations
                    </label>
                    <input
                      type="text"
                      id="medicalConsiderations"
                      value={formData.medicalConsiderations}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medicalConsiderations: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#9333EA] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-500 shadow-sm text-base"
                      placeholder="E.g. None, asthma, dust allergy, physical injury"
                    />
                  </div>

                  {/* Suggestion / Expectation Space */}
                  <div>
                    <label
                      htmlFor="suggestions"
                      className="block text-sm font-bold text-purple-950 mb-1.5 uppercase tracking-wider flex items-center gap-2"
                    >
                      <Lightbulb className="w-4 h-4 text-[#D4AF37]" />
                      Suggestion / Expectation Space
                    </label>
                    <textarea
                      id="suggestions"
                      rows={3}
                      value={formData.suggestions}
                      onChange={(e) =>
                        setFormData({ ...formData, suggestions: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#9333EA] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-500 shadow-sm text-base"
                      placeholder="Share your thoughts, suggestions, or expectations for the event..."
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-100 border-2 border-red-500 text-red-900 px-4 py-3 rounded-xl flex items-center gap-3 font-semibold text-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#9333EA] via-[#B8860B] to-[#7E22CE] text-white py-4 rounded-xl font-extrabold text-lg sm:text-xl uppercase tracking-wider hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl border-2 border-[#D4AF37] transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-6 w-6 text-white"
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
                        <span>Claiming Your Tribe...</span>
                      </>
                    ) : (
                      <>
                        <Crown className="w-6 h-6 text-[#F5D061]" />
                        <span>Claim Your Royal Tribe</span>
                        <Sparkles className="w-5 h-5 text-[#F5D061]" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Information Cards */}
          <div className="w-full lg:col-span-1 space-y-6">
            {/* The 5 Tribes Card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border-4 border-[#D4AF37] p-5 sm:p-6">
              <h3 className="text-xl font-extrabold text-[#3B0764] mb-3 text-center flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
                <span>The Royal Tribes</span>
                <Crown className="w-5 h-5 text-[#D4AF37]" />
              </h3>
              <div className="space-y-3">
                {PRIMARY_HOUSES.map((key) => {
                  const house = HOUSE_CONFIG[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 bg-purple-50/60 hover:bg-purple-100/70 transition-all"
                      style={{ borderColor: `${house.hex}60` }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: house.hex }}
                      >
                        <TribeLucideIcon tribe={key} className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {house.name}
                        </p>
                        <p className="text-xs text-gray-600 font-medium">
                          {house.colorName} • {house.tagline}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activities for the Day */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border-4 border-[#D4AF37] p-5 sm:p-6">
              <h3 className="text-lg font-extrabold text-[#3B0764] mb-3 text-center flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-[#D4AF37]" />
                <span>Activities for the Day</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-700">
                {ACTIVITIES.map((act) => (
                  <div
                    key={act}
                    className="flex items-center gap-1.5 p-1.5 bg-purple-50/80 rounded-lg border border-purple-100"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9333EA] flex-shrink-0"></span>
                    <span className="truncate">{act}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Motto Card */}
            <div className="bg-gradient-to-br from-[#7E22CE] to-[#4C1D95] rounded-3xl shadow-xl border-4 border-[#D4AF37] p-5 text-center text-white">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center text-[#F5D061]">
                <Crown className="w-6 h-6 text-[#F5D061]" />
              </div>
              <p className="text-lg font-bold text-[#F5D061] italic mb-1">
                Tell a friend to tell a friend.
              </p>
              <p className="text-sm font-semibold text-purple-100">
                May the best house win!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center px-4">
          <p className="text-[#D4AF37] font-semibold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            <span>Daughters of the King — Loved by the father, claimed by the king</span>
            <Crown className="w-4 h-4 text-[#D4AF37]" />
          </p>
          <p className="text-purple-300 text-xs mt-1">
            Saturday, 17th October, 2026 • Main school field
          </p>
        </div>
      </div>
    </main>
  );
}