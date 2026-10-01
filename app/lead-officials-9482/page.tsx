"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HOUSE_CONFIG, HouseType, PRIMARY_HOUSES } from "@/config/houses";
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

type SortField = "name" | "level" | "department" | "matricNumber" | "house" | "createdAt";
type SortDirection = "asc" | "desc";

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHouse, setFilterHouse] = useState<HouseType | "all">("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "students">("overview");
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setAuthenticated(true);
        fetchData();
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const adminPassword = password;

      const [studentsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/students?password=${encodeURIComponent(adminPassword)}`),
        fetch(`/api/admin/stats?password=${encodeURIComponent(adminPassword)}`),
      ]);

      const studentsData = await studentsRes.json();
      const statsData = await statsRes.json();

      if (studentsData.error) {
        setError(studentsData.error);
        return;
      }

      if (studentsData.students) setStudents(studentsData.students);
      if (statsData.stats) setStats(statsData.stats);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleExport = async () => {
    try {
      const adminPassword = password;
      const response = await fetch(
        `/api/admin/export?password=${encodeURIComponent(adminPassword)}`
      );

      if (!response.ok) {
        const error = await response.json();
        setError(error.error || "Failed to export CSV");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to export CSV");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!password) {
      setError("Admin password missing. Please reauthenticate to continue.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this member? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(studentId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/students?password=${encodeURIComponent(password)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: studentId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete student");
      }

      const deletedStudent = data.deletedStudent as Student | undefined;

      setStudents((prev) => prev.filter((s) => s._id !== studentId));
      if (deletedStudent) {
        setStats((prev) => {
          if (!prev) return prev;
          const houseKey = deletedStudent.house;
          const updatedHouseCount = Math.max(
            (prev.houses[houseKey] || 0) - 1,
            0
          );
          return {
            ...prev,
            total: Math.max(prev.total - 1, 0),
            houses: {
              ...prev.houses,
              [houseKey]: updatedHouseCount,
            },
          };
        });
      }
    } catch (err) {
      console.error("Delete student failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete student"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.department.toLowerCase().includes(query) ||
          s.level.toLowerCase().includes(query) ||
          (s.matricNumber && s.matricNumber.toLowerCase().includes(query))
      );
    }

    // House filter
    if (filterHouse !== "all") {
      filtered = filtered.filter((s) => s.house === filterHouse);
    }

    // Level filter
    if (filterLevel !== "all") {
      filtered = filtered.filter((s) => s.level === filterLevel);
    }

    // Department filter
    if (filterDepartment !== "all") {
      filtered = filtered.filter((s) => s.department === filterDepartment);
    }

    // Sorting
    filtered.sort((a, b) => {
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

    return filtered;
  }, [students, searchQuery, filterHouse, filterLevel, filterDepartment, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Chart data for visualization
  const chartData = useMemo(() => {
    if (!stats) return null;
    const maxCount = Math.max(...Object.values(stats.houses), 1);
    
    return Object.entries(HOUSE_CONFIG).map(([key, config]) => ({
      house: key as HouseType,
      name: config.name,
      count: stats.houses[key as HouseType] || 0,
      percentage: stats.total > 0 ? ((stats.houses[key as HouseType] || 0) / stats.total) * 100 : 0,
      barWidth: stats.total > 0 ? ((stats.houses[key as HouseType] || 0) / maxCount) * 100 : 0,
      color: config.hex,
      gradient: config.gradient,
      emoji: config.emoji,
    }));
  }, [stats]);

  // Get unique levels and departments
  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.level))).sort();
  }, [students]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.department))).sort();
  }, [students]);

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-blue-100 text-sm">Enter admin password to continue</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                  placeholder="Enter admin password"
                />
              </div>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "Login to Dashboard"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-2xl z-50 transform transition-transform lg:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>
              <p className="text-sm text-gray-600">Game of Thrones</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <button
            onClick={() => { setActiveTab("overview"); setMobileSidebarOpen(false); }}
            className={`w-full text-left px-4 py-4 rounded-xl transition-all flex items-center gap-4 ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-semibold">Overview</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("students"); setMobileSidebarOpen(false); }}
            className={`w-full text-left px-4 py-4 rounded-xl transition-all flex items-center gap-4 ${
              activeTab === "students"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-semibold">Students</span>
          </button>
          
          <button
            onClick={handleExport}
            className="w-full text-left px-4 py-4 rounded-xl transition-all flex items-center gap-4 text-green-600 hover:bg-green-50 border-2 border-green-200 hover:border-green-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-semibold">Export CSV</span>
          </button>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={() => router.push("/")}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-40">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800">Admin Dashboard</h2>
            <p className="text-xs text-gray-600">Game of Thrones</p>
          </div>
          
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>
        
        <div className="flex border-t border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              activeTab === "students"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Students
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-80 p-4 lg:p-6 pt-20 lg:pt-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-lg">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && stats && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="bg-gradient-to-br from-[#7E22CE] to-[#4C1D95] text-white p-6 rounded-2xl shadow-lg border-2 border-[#D4AF37]">
                      <div className="text-3xl lg:text-4xl font-bold mb-2">{stats.total}</div>
                      <div className="text-sm lg:text-base font-semibold text-purple-200">Total Registered</div>
                    </div>
                    {PRIMARY_HOUSES.map((key) => {
                      const config = HOUSE_CONFIG[key];
                      return (
                        <div
                          key={key}
                          className={`bg-gradient-to-br ${config.gradient} text-white p-4 lg:p-6 rounded-2xl shadow-lg border-2 border-white/30`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {config.image ? (
                              <img 
                                src={config.image} 
                                alt={config.name} 
                                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white/50 shadow-sm bg-white object-cover" 
                              />
                            ) : (
                              <span className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white/50 shadow-sm flex items-center justify-center bg-white/20 backdrop-blur-sm">
                                <TribeLucideIcon tribe={key} className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                              </span>
                            )}
                            <div className="text-lg lg:text-2xl font-bold">
                              {stats.houses[key as HouseType] || 0}
                            </div>
                          </div>
                          <div className="text-xs lg:text-sm font-semibold text-white/90 truncate">
                            {config.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                      <h3 className="text-xl font-bold text-gray-800 mb-6">Distribution by House</h3>
                      <div className="space-y-4">
                        {chartData?.map((item) => (
                          <div key={item.house}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{item.emoji}</span>
                                <span className="font-semibold text-gray-700 text-sm lg:text-base">{item.name}</span>
                              </div>
                              <span className="font-bold text-gray-800 text-sm lg:text-base">{item.count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 lg:h-6 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                style={{
                                  width: `${item.barWidth}%`,
                                  background: `linear-gradient(to right, ${item.color}, ${item.color}dd)`,
                                }}
                              >
                                {item.barWidth > 20 && (
                                  <span className="text-xs font-semibold text-white">
                                    {item.percentage.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                      <h3 className="text-xl font-bold text-gray-800 mb-6">House Allocation</h3>
                      <div className="flex flex-col lg:flex-row items-center gap-6">
                        <div className="relative w-48 h-48 lg:w-56 lg:h-56 flex-shrink-0">
                          <svg viewBox="0 0 200 200" className="w-full h-full">
                            {chartData && (() => {
                              let currentAngle = -90;
                              const total = chartData.reduce((sum, item) => sum + item.count, 0);
                              
                              return chartData.map((item, index) => {
                                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                                const angle = (percentage / 100) * 360;
                                const startAngle = currentAngle;
                                const endAngle = currentAngle + angle;
                                
                                const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                                const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                                const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                                const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
                                
                                const largeArc = angle > 180 ? 1 : 0;
                                
                                const pathData = [
                                  `M 100 100`,
                                  `L ${x1} ${y1}`,
                                  `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
                                  `Z`,
                                ].join(" ");
                                
                                currentAngle += angle;
                                
                                return (
                                  <path
                                    key={item.house}
                                    d={pathData}
                                    fill={item.color}
                                    stroke="white"
                                    strokeWidth="3"
                                  />
                                );
                              });
                            })()}
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.total}</div>
                              <div className="text-sm text-gray-600">Total</div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                          {chartData?.map((item) => (
                            <div key={item.house} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                              <div
                                className="w-4 h-4 rounded flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-800 truncate">{item.name}</div>
                                <div className="text-xs text-gray-600">{item.count} students</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "students" && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                  {/* Filters and Search */}
                  <div className="p-4 lg:p-6 border-b border-gray-200 bg-gray-50/50">
                    <div className="space-y-4">
                      {/* Search */}
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search by name, level, or college..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-500"
                        />
                      </div>
                      
                      {/* Filters Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <select
                          value={filterHouse}
                          onChange={(e) => setFilterHouse(e.target.value as HouseType | "all")}
                          className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                        >
                          <option value="all">All Houses</option>
                          {Object.entries(HOUSE_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>
                              {config.emoji} {config.name}
                            </option>
                          ))}
                        </select>
                        
                        <select
                          value={filterLevel}
                          onChange={(e) => setFilterLevel(e.target.value)}
                          className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                        >
                          <option value="all">All Levels</option>
                          {uniqueLevels.map((level) => (
                            <option key={level} value={level}>
                              Level {level}
                            </option>
                          ))}
                        </select>
                        
                        <select
                          value={filterDepartment}
                          onChange={(e) => setFilterDepartment(e.target.value)}
                          className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                        >
                          <option value="all">All Colleges</option>
                          {uniqueDepartments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Results and Export */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-sm text-gray-600">
                          Showing <span className="font-semibold text-gray-800">{filteredStudents.length}</span> of <span className="font-semibold text-gray-800">{students.length}</span> students
                        </p>
                        <button
                          onClick={handleExport}
                          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                          {[
                            { field: "name" as SortField, label: "Name" },
                            { field: "matricNumber" as SortField, label: "Matric No." },
                            { field: "level" as SortField, label: "Level" },
                            { field: "department" as SortField, label: "College" },
                            { field: "house" as SortField, label: "House" },
                            { field: "createdAt" as SortField, label: "Registered" },
                          ].map(({ field, label }) => (
                            <th
                              key={field}
                              className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300 transition-colors whitespace-nowrap"
                              onClick={() => handleSort(field)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs lg:text-sm">{label}</span>
                                {sortField === field && (
                                  <svg
                                    className={`w-4 h-4 ${sortDirection === "asc" ? "" : "transform rotate-180"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-base">
                              <div className="flex flex-col items-center gap-3">
                                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                  <p className="font-semibold text-gray-600">No students found</p>
                                  <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((student, index) => (
                            <tr
                              key={student._id}
                              className={`hover:bg-gray-50 transition-colors ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                              }`}
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-800">{student.name}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">
                                  {student.matricNumber || <span className="text-gray-400 italic">N/A</span>}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {student.level}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm text-gray-600 max-w-xs truncate">{student.department}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {HOUSE_CONFIG[student.house]?.image ? (
                                    <img
                                      src={HOUSE_CONFIG[student.house].image}
                                      alt={HOUSE_CONFIG[student.house]?.name || student.house}
                                      className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm bg-white"
                                    />
                                  ) : (
                                    <span
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm font-bold text-white border-2 border-white"
                                      style={{ backgroundColor: HOUSE_CONFIG[student.house]?.hex || "#9333EA" }}
                                    >
                                      <TribeLucideIcon tribe={student.house} className="w-4 h-4 text-white" />
                                    </span>
                                  )}
                                  <span className="text-sm font-semibold text-gray-800 hidden sm:block">
                                    {HOUSE_CONFIG[student.house]?.name || student.house}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(student.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleDeleteStudent(student._id)}
                                  disabled={deletingId === student._id}
                                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deletingId === student._id ? (
                                    <>
                                      <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                      Removing...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
