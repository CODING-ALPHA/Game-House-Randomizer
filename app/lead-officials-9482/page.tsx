"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HOUSE_CONFIG, HouseType, PRIMARY_HOUSES } from "@/config/houses";
import {
  Crown,
  Lock,
  Search,
  Download,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  X,
  LogOut,
  BarChart3,
  Users,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  Phone,
  Mail,
  HeartPulse,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { TribeLucideIcon } from "@/components/RoyalIcons";

interface Student {
  _id: string;
  name: string;
  level: string;
  department: string;
  matricNumber?: string;
  email?: string;
  phoneNumber?: string;
  sportsEvents?: string[];
  medicalConsiderations?: string;
  suggestions?: string;
  house: HouseType;
  createdAt: string;
}

interface Stats {
  total: number;
  houses: Record<HouseType, number>;
}

export default function SimpleOfficialsDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Active tab & filters
  const [activeTab, setActiveTab] = useState<"overview" | "roster">("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHouse, setFilterHouse] = useState<HouseType | "all">("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterCollege, setFilterCollege] = useState<string>("all");

  // Detailed student modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [copiedMatric, setCopiedMatric] = useState(false);

  // Restore session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = sessionStorage.getItem("officials_session_secret");
      if (savedKey) {
        setPassword(savedKey);
        verifyAndFetch(savedKey);
        return;
      }
    }
    setAuthChecking(false);
  }, []);

  const verifyAndFetch = async (secret: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: secret }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("officials_session_secret", secret);
        }
        await loadData(secret);
      } else {
        setAuthenticated(false);
        setError("Invalid access key");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("officials_session_secret");
        }
      }
    } catch {
      setError("Authentication failed");
    } finally {
      setLoading(false);
      setAuthChecking(false);
    }
  };

  const loadData = async (activeKey = password) => {
    setLoadingData(true);
    setError(null);
    try {
      const [studentsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/students?password=${encodeURIComponent(activeKey)}`),
        fetch(`/api/admin/stats?password=${encodeURIComponent(activeKey)}`),
      ]);

      const sData = await studentsRes.json();
      const stData = await statsRes.json();

      if (sData.students) setStudents(sData.students);
      if (stData.stats) setStats(stData.stats);
    } catch {
      setError("Failed to synchronize data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("officials_session_secret");
    }
    setAuthenticated(false);
    setPassword("");
    setStudents([]);
    setStats(null);
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch(
        `/api/admin/export?password=${encodeURIComponent(password)}`
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sisters-olympics-roster-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch {
      setError("Failed to download CSV");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name} from roster?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(
        `/api/admin/students?password=${encodeURIComponent(password)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      if (!res.ok) throw new Error("Delete failed");
      setStudents((prev) => prev.filter((s) => s._id !== id));
      if (selectedStudent?._id === id) setSelectedStudent(null);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to remove member");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.level.toLowerCase().includes(q) ||
          (s.matricNumber && s.matricNumber.toLowerCase().includes(q)) ||
          (s.phoneNumber && s.phoneNumber.includes(q))
      );
    }

    if (filterHouse !== "all") {
      result = result.filter((s) => s.house === filterHouse);
    }

    if (filterLevel !== "all") {
      result = result.filter((s) => s.level === filterLevel);
    }

    if (filterCollege !== "all") {
      result = result.filter((s) => s.department === filterCollege);
    }

    return result;
  }, [students, searchQuery, filterHouse, filterLevel, filterCollege]);

  // LOGIN VIEW
  if (!authenticated) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#2E1065] via-[#1E1B4B] to-[#0F0A1E]">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border-2 border-[#D4AF37]">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3 text-[#581C87]">
              <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Cross Fit: The Sisters Olympics
            </p>
            <h1 className="text-xl font-black text-gray-900 mt-0.5">
              Officials Portal
            </h1>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyAndFetch(password);
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="pwd"
                className="block text-xs font-bold uppercase text-gray-700 mb-1.5"
              >
                Access Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="pwd"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter key"
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#7E22CE] outline-none text-gray-900 font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-purple-700" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || authChecking}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#7E22CE] to-[#4C1D95] text-white font-bold text-sm shadow hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Enter Dashboard"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full text-center text-xs text-gray-500 hover:text-purple-700 pt-2 block"
            >
              ← Back to Registration
            </button>
          </form>
        </div>
      </main>
    );
  }

  // AUTHENTICATED DASHBOARD (100% RESPONSIVE & SIMPLE)
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8FAFC] text-gray-900 flex flex-col">
      {/* Top Header Bar */}
      <header className="w-full bg-[#2E1065] text-white border-b-2 border-[#D4AF37] shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#581C87] border border-[#D4AF37] flex items-center justify-center">
              <Crown className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base leading-tight text-white">
                Cross Fit
              </h1>
              <p className="text-[10px] text-[#F5D061] font-semibold leading-none hidden sm:block">
                The Sisters Olympics • Officials
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => loadData()}
              disabled={loadingData}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-100 text-xs font-semibold flex items-center gap-1"
              title="Sync Data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingData ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#F5D061] text-[#2E1065] text-xs font-extrabold flex items-center gap-1 shadow-sm"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 text-xs border border-red-500/20"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Simple Tab Switcher */}
        <div className="w-full bg-[#1E1B4B] border-t border-purple-900/50">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 flex gap-6">
            <button
              onClick={() => setActiveTab("roster")}
              className={`py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "roster"
                  ? "border-[#D4AF37] text-[#F5D061]"
                  : "border-transparent text-purple-300 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Roster ({students.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "overview"
                  ? "border-[#D4AF37] text-[#F5D061]"
                  : "border-transparent text-purple-300 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tribe Metrics</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (Full Width & Contained) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ==================== TAB 1: OVERVIEW METRICS ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Total registrations banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Total Registrations
                </span>
                <p className="text-3xl font-black text-[#2E1065]">
                  {stats?.total ?? students.length}
                </p>
                <p className="text-xs text-purple-700 font-medium">
                  5 Royal Tribes
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#581C87] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>

            {/* 5 Tribe Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {PRIMARY_HOUSES.map((key) => {
                const conf = HOUSE_CONFIG[key];
                const count =
                  stats?.houses[key as HouseType] ??
                  students.filter((s) => s.house === key).length;
                const total = stats?.total || students.length || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterHouse(key);
                      setActiveTab("roster");
                    }}
                    className="bg-white rounded-2xl p-4 border text-left hover:shadow-md transition-all flex flex-col justify-between"
                    style={{ borderColor: `${conf.hex}40` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: conf.hex }}
                      >
                        <TribeLucideIcon tribe={key} className="w-4 h-4" />
                      </span>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${conf.hex}15`,
                          color: conf.hex,
                        }}
                      >
                        {pct}%
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-gray-600">
                        {conf.name}
                      </span>
                      <span className="text-2xl font-black text-gray-900">
                        {count}
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: conf.hex,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: ROSTER ==================== */}
        {activeTab === "roster" && (
          <div className="space-y-3">
            {/* Simple Compact Filter Bar */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-purple-200 shadow-sm space-y-2.5">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, matric, or phone..."
                  className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7E22CE] outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills in a scrollable flex row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {/* Tribe dropdown pill */}
                <select
                  value={filterHouse}
                  onChange={(e) =>
                    setFilterHouse(e.target.value as HouseType | "all")
                  }
                  className="px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none"
                >
                  <option value="all">All Tribes</option>
                  {PRIMARY_HOUSES.map((h) => (
                    <option key={h} value={h}>
                      {HOUSE_CONFIG[h].name}
                    </option>
                  ))}
                </select>

                {/* Level pill */}
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none"
                >
                  <option value="all">All Levels</option>
                  {["100", "200", "300", "400", "500"].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}L
                    </option>
                  ))}
                </select>

                {/* College pill */}
                <select
                  value={filterCollege}
                  onChange={(e) => setFilterCollege(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none"
                >
                  <option value="all">All Colleges</option>
                  {[
                    "COAES",
                    "COMSS",
                    "COCS",
                    "COHES",
                    "COLAW",
                    "COEVS",
                    "COLBS",
                  ].map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>

                {(filterHouse !== "all" ||
                  filterLevel !== "all" ||
                  filterCollege !== "all" ||
                  searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterHouse("all");
                      setFilterLevel("all");
                      setFilterCollege("all");
                      setSearchQuery("");
                    }}
                    className="text-purple-700 font-bold hover:underline whitespace-nowrap text-[11px]"
                  >
                    Reset
                  </button>
                )}

                <span className="ml-auto text-[11px] text-gray-400 font-medium whitespace-nowrap">
                  {filteredStudents.length} members
                </span>
              </div>
            </div>

            {/* Mobile Card List View (Strictly Responsive on Phones: block md:hidden) */}
            <div className="block md:hidden space-y-2.5">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border">
                  No matching members found.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const conf =
                    HOUSE_CONFIG[student.house] || HOUSE_CONFIG.esther;
                  return (
                    <div
                      key={student._id}
                      className="bg-white rounded-2xl p-4 border shadow-xs space-y-3"
                      style={{ borderLeft: `5px solid ${conf.hex}` }}
                    >
                      {/* Name & Tribe */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="font-bold text-sm text-gray-900 text-left hover:text-purple-700"
                          >
                            {student.name}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              {student.department}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                              {student.level}L
                            </span>
                          </div>
                        </div>

                        {/* Tribe pill */}
                        <span
                          className="px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 flex-shrink-0"
                          style={{
                            backgroundColor: `${conf.hex}15`,
                            color: conf.hex,
                          }}
                        >
                          <TribeLucideIcon
                            tribe={student.house}
                            className="w-3 h-3"
                          />
                          <span>{conf.name}</span>
                        </span>
                      </div>

                      {/* Matric & Phone */}
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100">
                        <span className="font-mono text-[11px]">
                          {student.matricNumber || "No matric"}
                        </span>
                        {student.phoneNumber && (
                          <a
                            href={`https://wa.me/${student.phoneNumber.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-green-700 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{student.phoneNumber}</span>
                          </a>
                        )}
                      </div>

                      {/* Card actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-gray-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(student._id, student.name)
                          }
                          disabled={deletingId === student._id}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                          title="Delete member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (Hidden on Phones, Shown on Tablets/Desktops: hidden md:block) */}
            <div className="hidden md:block bg-white rounded-2xl border border-purple-200 shadow-xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-purple-50/70 border-b border-purple-200 text-xs font-bold text-[#2E1065] uppercase">
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Tribe</th>
                      <th className="py-3 px-4">College</th>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Matric No</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-gray-400"
                        >
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const conf =
                          HOUSE_CONFIG[student.house] || HOUSE_CONFIG.esther;
                        return (
                          <tr
                            key={student._id}
                            className="hover:bg-purple-50/30 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-gray-900">
                              <button
                                onClick={() => setSelectedStudent(student)}
                                className="hover:text-purple-700 text-left"
                              >
                                {student.name}
                              </button>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{
                                  backgroundColor: `${conf.hex}15`,
                                  color: conf.hex,
                                }}
                              >
                                <TribeLucideIcon
                                  tribe={student.house}
                                  className="w-3 h-3"
                                />
                                <span>{conf.name}</span>
                              </span>
                            </td>

                            <td className="py-3 px-4 font-bold text-amber-900">
                              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-xs">
                                {student.department}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-gray-600 font-medium">
                              {student.level}L
                            </td>

                            <td className="py-3 px-4 font-mono text-xs text-gray-600">
                              {student.matricNumber || "—"}
                            </td>

                            <td className="py-3 px-4 text-xs">
                              {student.phoneNumber ? (
                                <a
                                  href={`https://wa.me/${student.phoneNumber.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-700 font-semibold hover:underline"
                                >
                                  {student.phoneNumber}
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedStudent(student)}
                                  className="p-1 rounded hover:bg-purple-100 text-gray-600 hover:text-purple-800"
                                  title="View details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(student._id, student.name)
                                  }
                                  disabled={deletingId === student._id}
                                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== STUDENT DETAILS POPUP MODAL ==================== */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-purple-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#2E1065] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{
                    backgroundColor:
                      HOUSE_CONFIG[selectedStudent.house]?.hex || "#7E22CE",
                  }}
                >
                  <TribeLucideIcon
                    tribe={selectedStudent.house}
                    className="w-4 h-4"
                  />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">
                    {selectedStudent.name}
                  </h3>
                  <span className="text-[10px] text-[#F5D061] font-semibold">
                    {HOUSE_CONFIG[selectedStudent.house]?.name} •{" "}
                    {selectedStudent.department} {selectedStudent.level}L
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 font-bold block">COLLEGE</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {selectedStudent.department}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block">MATRIC</span>
                  <span className="font-mono font-bold text-gray-800 text-sm">
                    {selectedStudent.matricNumber || "Not provided"}
                  </span>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-1.5">
                {selectedStudent.email && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">
                      {selectedStudent.email}
                    </span>
                    <a
                      href={`mailto:${selectedStudent.email}`}
                      className="font-bold text-purple-700 hover:underline"
                    >
                      Email
                    </a>
                  </div>
                )}
                {selectedStudent.phoneNumber && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-mono font-medium">
                      {selectedStudent.phoneNumber}
                    </span>
                    <a
                      href={`https://wa.me/${selectedStudent.phoneNumber.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-green-700 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> WhatsApp
                    </a>
                  </div>
                )}
              </div>

              {/* Sports */}
              {selectedStudent.sportsEvents &&
                selectedStudent.sportsEvents.length > 0 && (
                  <div>
                    <span className="text-gray-500 font-bold block mb-1">
                      SELECTED SPORTS
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedStudent.sportsEvents.map((act) => (
                        <span
                          key={act}
                          className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-semibold text-[10px]"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Medical */}
              {selectedStudent.medicalConsiderations && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-amber-900 font-bold block mb-0.5 flex items-center gap-1">
                    <HeartPulse className="w-3 h-3" /> Medical Note
                  </span>
                  <p className="text-amber-950 font-medium">
                    {selectedStudent.medicalConsiderations}
                  </p>
                </div>
              )}

              {/* Suggestions */}
              {selectedStudent.suggestions && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-blue-900 font-bold block mb-0.5 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Suggestion
                  </span>
                  <p className="text-blue-950 font-medium">
                    &ldquo;{selectedStudent.suggestions}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  handleDelete(selectedStudent._id, selectedStudent.name)
                }
                className="text-red-600 hover:text-red-800 font-bold text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 rounded-lg bg-gray-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
