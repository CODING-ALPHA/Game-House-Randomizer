"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HOUSE_CONFIG, HouseType, PRIMARY_HOUSES } from "@/config/houses";
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
  Search,
  Download,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Menu,
  X,
  Filter,
  LogOut,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Users,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
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

type SortField =
  | "name"
  | "level"
  | "department"
  | "matricNumber"
  | "house"
  | "createdAt";
type SortDirection = "asc" | "desc";

export default function OfficialsDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Selected student for detailed modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<"overview" | "students">(
    "overview"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHouse, setFilterHouse] = useState<HouseType | "all">("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Restore session from sessionStorage on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSecret = sessionStorage.getItem("officials_session_secret");
      if (savedSecret) {
        setPassword(savedSecret);
        verifyAndFetch(savedSecret);
        return;
      }
    }
    setAuthChecking(false);
  }, []);

  const verifyAndFetch = async (secretToVerify: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: secretToVerify }),
      });

      const data = await response.json();
      if (data.success) {
        setAuthenticated(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("officials_session_secret", secretToVerify);
        }
        await fetchDashboardData(secretToVerify);
      } else {
        setAuthenticated(false);
        setError("Invalid official authorization key");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("officials_session_secret");
        }
      }
    } catch {
      setError("Unable to authenticate with server");
    } finally {
      setLoading(false);
      setAuthChecking(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    verifyAndFetch(password);
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

  const fetchDashboardData = async (activeSecret = password) => {
    setLoadingData(true);
    setError(null);
    try {
      const [studentsRes, statsRes] = await Promise.all([
        fetch(
          `/api/admin/students?password=${encodeURIComponent(activeSecret)}`
        ),
        fetch(`/api/admin/stats?password=${encodeURIComponent(activeSecret)}`),
      ]);

      const studentsData = await studentsRes.json();
      const statsData = await statsRes.json();

      if (studentsData.error) {
        setError(studentsData.error);
        return;
      }

      if (studentsData.students) setStudents(studentsData.students);
      if (statsData.stats) setStats(statsData.stats);
    } catch {
      setError("Failed to synchronize latest data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(
        `/api/admin/export?password=${encodeURIComponent(password)}`
      );

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || "Failed to generate CSV export");
        return;
      }

      const blob = await response.blob();
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

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${studentName}" from the roster? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(studentId);
    try {
      const response = await fetch(
        `/api/admin/students?password=${encodeURIComponent(password)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: studentId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove student");
      }

      // Refresh data
      setStudents((prev) => prev.filter((s) => s._id !== studentId));
      if (selectedStudent?._id === studentId) {
        setSelectedStudent(null);
      }
      fetchDashboardData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete student record");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered & Sorted Records
  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.department.toLowerCase().includes(query) ||
          s.level.toLowerCase().includes(query) ||
          (s.matricNumber && s.matricNumber.toLowerCase().includes(query)) ||
          (s.email && s.email.toLowerCase().includes(query)) ||
          (s.phoneNumber && s.phoneNumber.includes(query)) ||
          (s.medicalConsiderations &&
            s.medicalConsiderations.toLowerCase().includes(query))
      );
    }

    if (filterHouse !== "all") {
      result = result.filter((s) => s.house === filterHouse);
    }

    if (filterLevel !== "all") {
      result = result.filter((s) => s.level === filterLevel);
    }

    if (filterDepartment !== "all") {
      result = result.filter((s) => s.department === filterDepartment);
    }

    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "createdAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return result;
  }, [
    students,
    searchQuery,
    filterHouse,
    filterLevel,
    filterDepartment,
    sortField,
    sortDirection,
  ]);

  // Pagination slice
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.level))).sort();
  }, [students]);

  const uniqueColleges = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.department))).sort();
  }, [students]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterHouse, filterLevel, filterDepartment]);

  // LOGIN SCREEN
  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#2E1065] via-[#1E1B4B] to-[#0F0A1E] text-white">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border-2 border-[#D4AF37] text-gray-900 p-8 sm:p-10 relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D4AF37] via-[#F5D061] to-[#D4AF37]"></div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 text-[#581C87] flex items-center justify-center mx-auto mb-4 shadow-md">
              <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-[#581C87] border border-purple-200 mb-2">
              <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
              Cross Fit: The Sisters Olympics
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E1065] tracking-tight">
              Officials Portal
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Authorized committee access only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="adminPassword"
                className="block text-xs font-bold uppercase tracking-wider text-[#2E1065] mb-2"
              >
                Access Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="adminPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter authorized key"
                  className="w-full pl-4 pr-12 py-3.5 bg-white border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#7E22CE] outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium text-base shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-700 p-1 rounded-lg focus:outline-none transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-[#7E22CE]" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || authChecking}
              className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#7E22CE] to-[#4C1D95] hover:opacity-95 transition-all shadow-lg hover:shadow-xl border border-[#D4AF37] flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-[#F5D061]" />
                  <span>Enter Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xs text-gray-500 hover:text-purple-700 font-medium transition-colors"
            >
              ← Back to Main Registration
            </button>
          </div>
        </div>
      </main>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 flex">
      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#2E1065] text-white flex flex-col justify-between border-r-2 border-[#D4AF37] shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Sidebar Header Brand */}
          <div className="p-5 border-b border-purple-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#581C87] border border-[#D4AF37] flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5 text-[#F5D061]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white leading-tight">
                  Cross Fit
                </h2>
                <p className="text-xs text-[#F5D061] font-semibold">
                  The Sisters Olympics
                </p>
                <span className="text-[10px] text-purple-300 uppercase tracking-widest font-bold">
                  Officials Portal
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-white/10"
              title="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5">
            <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider px-3 mb-1">
              Dashboard View
            </div>

            <button
              onClick={() => {
                setActiveTab("overview");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "overview"
                  ? "bg-[#D4AF37] text-[#2E1065] shadow-md"
                  : "text-purple-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Tribal Metrics</span>
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  activeTab === "overview"
                    ? "bg-[#2E1065] text-[#F5D061]"
                    : "bg-purple-900/60 text-purple-200"
                }`}
              >
                5 Tribes
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("students");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "students"
                  ? "bg-[#D4AF37] text-[#2E1065] shadow-md"
                  : "text-purple-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Member Roster</span>
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  activeTab === "students"
                    ? "bg-[#2E1065] text-[#F5D061]"
                    : "bg-purple-900/60 text-purple-200"
                }`}
              >
                {students.length}
              </span>
            </button>
          </div>

          {/* Quick Tribe Filters Section in Sidebar */}
          <div className="px-4 py-2 border-t border-purple-900/60">
            <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider px-3 mb-2">
              Filter By Tribe
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setFilterHouse("all");
                  setActiveTab("students");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterHouse === "all" && activeTab === "students"
                    ? "bg-white/20 text-white font-bold"
                    : "text-purple-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>All Tribes</span>
                <span className="text-[10px] text-purple-300 font-mono">
                  {students.length}
                </span>
              </button>
              {PRIMARY_HOUSES.map((key) => {
                const conf = HOUSE_CONFIG[key];
                const count = students.filter((s) => s.house === key).length;
                const isSelected =
                  filterHouse === key && activeTab === "students";
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterHouse(key);
                      setActiveTab("students");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-white/20 text-white font-bold"
                        : "text-purple-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: conf.hex }}
                      />
                      <span>{conf.name}</span>
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-purple-900/60 space-y-2">
          <button
            onClick={() => fetchDashboardData()}
            disabled={loadingData}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-purple-100 text-xs font-semibold transition-all border border-white/10"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingData ? "animate-spin" : ""}`}
            />
            <span>Sync Live Data</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#F5D061] text-[#2E1065] text-xs font-bold transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Roster</span>
          </button>

          <div className="pt-2 flex items-center justify-between text-xs text-purple-300 border-t border-purple-900/40">
            <button
              onClick={() => router.push("/")}
              className="hover:text-white flex items-center gap-1 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-red-300 hover:text-red-200 flex items-center gap-1 font-bold"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Offset by sidebar on desktop) */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Mobile Top App Bar with Menu Button */}
        <header className="sticky top-0 z-30 bg-[#2E1065] text-white px-4 py-3 border-b-2 border-[#D4AF37] flex items-center justify-between lg:hidden shadow-md">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
              title="Open navigation menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#F5D061]" />
              <span className="font-black text-sm tracking-tight truncate max-w-[200px]">
                Cross Fit
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboardData()}
              disabled={loadingData}
              className="p-1.5 rounded-lg bg-white/10 text-purple-100 hover:bg-white/20"
              title="Sync Data"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={handleExportCSV}
              className="p-1.5 rounded-lg bg-[#D4AF37] text-[#2E1065] font-bold"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Error notification banner if any */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Stat Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Total Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-purple-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Registrations
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-[#2E1065] mt-1">
                    {stats?.total ?? students.length}
                  </p>
                  <p className="text-xs text-purple-700 font-semibold mt-1">
                    Across 5 Royal Tribes
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#581C87] flex items-center justify-center border border-purple-200 shadow-sm">
                  <Users className="w-7 h-7" />
                </div>
              </div>

              {/* Event Date Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-purple-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Event Date
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                    Sat, 17th Oct, 2026
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Main School Field</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#B8860B] flex items-center justify-center border border-amber-200">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              {/* Level Breakdown Quick Pill */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-purple-100 sm:col-span-2 flex flex-col justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Academic Level Distribution
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {["100", "200", "300", "400", "500"].map((lvl) => {
                    const count = students.filter(
                      (s) => s.level === lvl
                    ).length;
                    return (
                      <div
                        key={lvl}
                        className="flex-1 min-w-[70px] bg-slate-50 border border-slate-200 rounded-xl p-2 text-center"
                      >
                        <span className="block text-xs font-semibold text-gray-500">
                          {lvl}L
                        </span>
                        <span className="block text-lg font-bold text-[#2E1065]">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Tribe Balance & Allocation Cards */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-purple-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#2E1065] flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#D4AF37]" />
                    <span>Live Tribe Balance & Member Roster</span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    The randomizer automatically balances participant counts
                    across each of the five tribes.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("students")}
                  className="text-xs font-bold text-[#7E22CE] hover:text-[#581C87] flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View Member Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {PRIMARY_HOUSES.map((key) => {
                  const config = HOUSE_CONFIG[key];
                  const count =
                    stats?.houses[key as HouseType] ??
                    students.filter((s) => s.house === key).length;
                  const total = stats?.total || students.length || 1;
                  const percentage = Math.round((count / total) * 100);

                  return (
                    <div
                      key={key}
                      className="rounded-2xl p-4 sm:p-5 border-2 transition-all hover:shadow-md flex flex-col justify-between"
                      style={{
                        borderColor: `${config.hex}40`,
                        backgroundColor: `${config.hex}08`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm"
                          style={{
                            backgroundColor: `${config.hex}20`,
                            borderColor: config.hex,
                            color: config.hex,
                          }}
                        >
                          <TribeLucideIcon tribe={key} className="w-5 h-5" />
                        </div>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{
                            backgroundColor: `${config.hex}20`,
                            color: config.hex,
                          }}
                        >
                          {config.colorName}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-base text-gray-900">
                          {config.name}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl sm:text-3xl font-black text-gray-900">
                            {count}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: config.hex,
                          }}
                        />
                      </div>

                      <button
                        onClick={() => {
                          setFilterHouse(key);
                          setActiveTab("students");
                        }}
                        className="mt-4 text-xs font-bold text-gray-600 hover:text-gray-900 text-left flex items-center gap-1 transition-colors"
                      >
                        <span>Filter roster</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Colleges Distribution Breakdown */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-purple-100">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#7E22CE]" />
                <span>Colleges Representation</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  "COAES",
                  "COMSS",
                  "COCS",
                  "COHES",
                  "COLAW",
                  "COEVS",
                  "COLBS",
                ].map((col) => {
                  const count = students.filter(
                    (s) => s.department === col
                  ).length;
                  return (
                    <button
                      key={col}
                      onClick={() => {
                        setFilterDepartment(col);
                        setActiveTab("students");
                      }}
                      className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-left hover:border-purple-400 transition-all"
                    >
                      <span className="block text-xs font-bold text-[#581C87]">
                        {col}
                      </span>
                      <span className="block text-xl font-black text-gray-900 mt-1">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: STUDENTS DIRECTORY ===================== */}
        {activeTab === "students" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-purple-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search Input */}
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <label
                    htmlFor="searchField"
                    className="block text-xs font-bold text-gray-700 uppercase mb-1"
                  >
                    Quick Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="searchField"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, matric, phone..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7E22CE] focus:border-[#7E22CE] outline-none text-sm text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-xs text-gray-400 hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tribe */}
                <div>
                  <label
                    htmlFor="filterTribeSelect"
                    className="block text-xs font-bold text-gray-700 uppercase mb-1"
                  >
                    Tribe
                  </label>
                  <select
                    id="filterTribeSelect"
                    value={filterHouse}
                    onChange={(e) =>
                      setFilterHouse(e.target.value as HouseType | "all")
                    }
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7E22CE] outline-none text-sm text-gray-900 font-medium cursor-pointer"
                  >
                    <option value="all">All Tribes</option>
                    {PRIMARY_HOUSES.map((key) => (
                      <option key={key} value={key}>
                        {HOUSE_CONFIG[key].name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Level */}
                <div>
                  <label
                    htmlFor="filterLevelSelect"
                    className="block text-xs font-bold text-gray-700 uppercase mb-1"
                  >
                    Level
                  </label>
                  <select
                    id="filterLevelSelect"
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7E22CE] outline-none text-sm text-gray-900 font-medium cursor-pointer"
                  >
                    <option value="all">All Levels</option>
                    {uniqueLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter College */}
                <div>
                  <label
                    htmlFor="filterCollegeSelect"
                    className="block text-xs font-bold text-gray-700 uppercase mb-1"
                  >
                    College
                  </label>
                  <select
                    id="filterCollegeSelect"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7E22CE] outline-none text-sm text-gray-900 font-medium cursor-pointer"
                  >
                    <option value="all">All Colleges</option>
                    {uniqueColleges.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter tags & Reset */}
              {(filterHouse !== "all" ||
                filterLevel !== "all" ||
                filterDepartment !== "all" ||
                searchQuery !== "") && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-500 font-medium">
                    Showing <strong>{filteredStudents.length}</strong> of{" "}
                    {students.length} sisters
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterHouse("all");
                      setFilterLevel("all");
                      setFilterDepartment("all");
                    }}
                    className="text-[#7E22CE] hover:underline font-bold"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-3xl shadow-sm border-2 border-purple-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-purple-50/70 border-b border-purple-200 text-xs font-bold text-[#2E1065] uppercase tracking-wider">
                      <th
                        className="py-3.5 px-4 cursor-pointer hover:bg-purple-100/70"
                        onClick={() => toggleSort("name")}
                      >
                        Full Name{" "}
                        {sortField === "name" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="py-3.5 px-4 cursor-pointer hover:bg-purple-100/70"
                        onClick={() => toggleSort("house")}
                      >
                        Assigned Tribe{" "}
                        {sortField === "house" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="py-3.5 px-4 cursor-pointer hover:bg-purple-100/70"
                        onClick={() => toggleSort("department")}
                      >
                        College{" "}
                        {sortField === "department" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="py-3.5 px-4 cursor-pointer hover:bg-purple-100/70"
                        onClick={() => toggleSort("level")}
                      >
                        Level{" "}
                        {sortField === "level" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="py-3.5 px-4">Matric No</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-gray-500 font-medium"
                        >
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student) => {
                        const config =
                          HOUSE_CONFIG[student.house] || HOUSE_CONFIG.esther;
                        return (
                          <tr
                            key={student._id}
                            className="hover:bg-purple-50/40 transition-colors"
                          >
                            {/* Name */}
                            <td className="py-3.5 px-4 font-bold text-gray-900">
                              <button
                                onClick={() => setSelectedStudent(student)}
                                className="hover:text-[#7E22CE] text-left"
                              >
                                {student.name}
                              </button>
                            </td>

                            {/* Tribe */}
                            <td className="py-3.5 px-4">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                                style={{
                                  backgroundColor: `${config.hex}15`,
                                  borderColor: `${config.hex}50`,
                                  color: config.hex,
                                }}
                              >
                                <TribeLucideIcon
                                  tribe={student.house}
                                  className="w-3.5 h-3.5"
                                />
                                <span>{config.name}</span>
                              </span>
                            </td>

                            {/* College */}
                            <td className="py-3.5 px-4 font-bold text-amber-900">
                              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-xs">
                                {student.department}
                              </span>
                            </td>

                            {/* Level */}
                            <td className="py-3.5 px-4 font-medium text-gray-700">
                              {student.level}L
                            </td>

                            {/* Matric */}
                            <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                              {student.matricNumber || (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>

                            {/* Contact */}
                            <td className="py-3.5 px-4 text-xs text-gray-600">
                              {student.phoneNumber ? (
                                <a
                                  href={`https://wa.me/${student.phoneNumber.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-green-600 font-semibold"
                                >
                                  {student.phoneNumber}
                                </a>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedStudent(student)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-[#7E22CE] hover:bg-purple-100 transition-all"
                                  title="View full dossier"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteStudent(
                                      student._id,
                                      student.name
                                    )
                                  }
                                  disabled={deletingId === student._id}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-30"
                                  title="Remove member"
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

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span>
                    Page {currentPage} of {totalPages} (
                    {filteredStudents.length} records)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 font-bold"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ===================== STUDENT DOSSIER MODAL ===================== */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border-2 border-[#D4AF37] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#2E1065] to-[#4C1D95] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-md"
                  style={{
                    backgroundColor: `${HOUSE_CONFIG[selectedStudent.house]?.hex || "#D4AF37"}20`,
                    borderColor:
                      HOUSE_CONFIG[selectedStudent.house]?.hex || "#D4AF37",
                  }}
                >
                  <TribeLucideIcon
                    tribe={selectedStudent.house}
                    className="w-6 h-6 text-white"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedStudent.name}
                  </h3>
                  <span className="text-xs text-[#F5D061] font-semibold">
                    {HOUSE_CONFIG[selectedStudent.house]?.name} • Level{" "}
                    {selectedStudent.level}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body Details */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
              {/* College & Matric */}
              <div className="grid grid-cols-2 gap-3 bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/80">
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">
                    College
                  </span>
                  <span className="font-extrabold text-[#581C87] text-base">
                    {selectedStudent.department}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">
                    Matric Number
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-gray-800 text-sm">
                      {selectedStudent.matricNumber || "Not provided"}
                    </span>
                    {selectedStudent.matricNumber && (
                      <button
                        onClick={() =>
                          copyToClipboard(
                            selectedStudent.matricNumber!,
                            "matric"
                          )
                        }
                        className="text-gray-400 hover:text-purple-700"
                        title="Copy matric"
                      >
                        {copiedField === "matric" ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Contact Information
                </span>
                <div className="space-y-1.5">
                  {selectedStudent.email && (
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-gray-700 font-medium text-xs sm:text-sm">
                        {selectedStudent.email}
                      </span>
                      <a
                        href={`mailto:${selectedStudent.email}`}
                        className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" /> Email
                      </a>
                    </div>
                  )}

                  {selectedStudent.phoneNumber && (
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-gray-700 font-medium text-xs sm:text-sm font-mono">
                        {selectedStudent.phoneNumber}
                      </span>
                      <a
                        href={`https://wa.me/${selectedStudent.phoneNumber.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-green-700 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Sports Events Selected */}
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Interested Sports & Games
                </span>
                {selectedStudent.sportsEvents &&
                selectedStudent.sportsEvents.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.sportsEvents.map((act) => (
                      <span
                        key={act}
                        className="px-2.5 py-1 rounded-lg bg-purple-100 text-[#581C87] text-xs font-bold border border-purple-200"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    None selected during registration.
                  </p>
                )}
              </div>

              {/* Medical Considerations */}
              {selectedStudent.medicalConsiderations && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="block text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5 mb-1">
                    <HeartPulse className="w-3.5 h-3.5 text-amber-700" />
                    Medical Considerations
                  </span>
                  <p className="text-xs text-amber-950 font-medium">
                    {selectedStudent.medicalConsiderations}
                  </p>
                </div>
              )}

              {/* Suggestions / Expectations */}
              {selectedStudent.suggestions && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="block text-xs font-bold text-blue-900 uppercase flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-blue-700" />
                    Suggestions / Expectations
                  </span>
                  <p className="text-xs text-blue-950 font-medium">
                    &ldquo;{selectedStudent.suggestions}&rdquo;
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <div className="pt-2 text-right text-xs text-gray-400">
                Registered on{" "}
                {new Date(selectedStudent.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  handleDeleteStudent(
                    selectedStudent._id,
                    selectedStudent.name
                  )
                }
                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Member</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-gray-800 text-white text-xs font-bold hover:bg-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
