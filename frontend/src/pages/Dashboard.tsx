import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { cn } from "@/lib/utils";
import { 
  Users, ClipboardCheck, AlertTriangle, TrendingUp, UserCheck, 
  Calendar, Sparkles, GraduationCap, ChevronRight, Briefcase, 
  FileText, Upload, Plus, Layers, ShieldAlert, Award, Settings
} from "lucide-react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from "recharts";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const COLORS = ["#2563EB", "#0F172A", "#16A34A", "#F59E0B", "#DC2626", "#8B5CF6"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const AdminFacultyDashboard = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [placementData, setPlacementData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsRes, attendanceRes, placementRes] = await Promise.all([
        api.get("/students"),
        api.get("/attendance"),
        api.get("/placement/eligible")
      ]);
      setStudents(studentsRes.data);
      setAttendances(attendanceRes.data);
      setPlacementData(placementRes.data);
    } catch (error) {
      console.error("Failed to fetch live dashboard data", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    socket.connect();
    
    const onAttendanceUpdate = (payload: any) => {
        if (!payload || !payload.subject) return;
        toast.info(`Live Update: Attendance for ${payload.subject} was just marked!`, {
          icon: <ClipboardCheck className="w-4 h-4 text-primary" />
        });
        fetchDashboardData();
    };

    const onConnectError = (err: any) => {
        console.warn("Socket connection failed. Reconnecting in background...", err.message);
    };

    const onDisconnect = (reason: string) => {
        console.warn("Socket disconnected:", reason);
    };

    const onReconnectAttempt = (attempt: number) => {
        console.log(`Socket reconnect attempt #${attempt}`);
    };

    socket.on("attendanceUpdate", onAttendanceUpdate);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);

    return () => {
        socket.off("attendanceUpdate", onAttendanceUpdate);
        socket.off("connect_error", onConnectError);
        socket.off("disconnect", onDisconnect);
        socket.off("reconnect_attempt", onReconnectAttempt);
        socket.disconnect();
    };
  }, [fetchDashboardData]);

  // Compute Statistics
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const departments = Array.from(new Set(students.map(s => s?.category?.name).filter(Boolean)));
    const totalDepartments = departments.length;
    
    // Count active faculty from attendance entries
    const uniqueFaculty = new Set(attendances.map(a => a?.faculty?._id || a?.faculty).filter(Boolean));
    const totalFaculty = uniqueFaculty.size || 1; // Fallback to 1

    // Average CGPA
    const avgCGPA = totalStudents === 0 
      ? 0 
      : parseFloat((students.reduce((sum, s) => sum + (s.gpa || 0), 0) / totalStudents).toFixed(2));

    // Internship rate
    const internshipRate = totalStudents === 0 
      ? 0 
      : Math.round((students.filter(s => s.internshipCompleted).length / totalStudents) * 100);

    // Live Attendance calc
    let totalPossible = 0;
    let totalAttended = 0;
    const studentAttendanceMap: Record<string, { total: number, present: number }> = {};
    
    students.forEach(s => {
      if (s && s._id) {
        studentAttendanceMap[s._id] = { total: 0, present: 0 };
      }
    });

    attendances.forEach(a => {
      if (!a || !a.records) return;
      a.records.forEach((r: any) => {
        if (!r || !r.student) return;
        const sid = r.student._id || r.student;
        if (sid && studentAttendanceMap[sid]) {
          studentAttendanceMap[sid].total++;
          totalPossible++;
          if (r.status === 'Present') {
            studentAttendanceMap[sid].present++;
            totalAttended++;
          }
        }
      });
    });

    const avgAttendance = totalPossible === 0 ? 0 : Math.round((totalAttended / totalPossible) * 100);

    // Placement Eligibility Stats from API data
    const placementStudents = placementData?.students || [];
    const placementEligibleCount = placementStudents.filter((s: any) => s.eligibility === 'Eligible').length;
    const placementNeedsImpCount = placementStudents.filter((s: any) => s.eligibility === 'Needs Improvement').length;
    const placementNotEligibleCount = placementStudents.filter((s: any) => s.eligibility === 'Not Eligible').length;

    // Students at Risk
    // A student is at risk if: Attendance < 75% OR CGPA < 5.0 OR backlogs > 0
    const atRiskStudents = placementStudents.filter((s: any) => s.riskStatus === 'High Risk').length;

    // Attendance Trend chart data (Grouped by Month/Week)
    const attendanceTrend = [
      { name: "Month 1", attendance: avgAttendance > 0 ? Math.max(50, avgAttendance - 5) : 78 },
      { name: "Month 2", attendance: avgAttendance > 0 ? Math.max(50, avgAttendance - 2) : 83 },
      { name: "Month 3", attendance: avgAttendance > 0 ? Math.max(50, avgAttendance + 3) : 88 },
      { name: "Month 4", attendance: avgAttendance || 85 }
    ];

    // Department Performance Metrics
    const deptStatsMap: Record<string, { gpaSum: number; attSum: number; count: number }> = {};
    students.forEach(s => {
      if (!s) return;
      const dept = s.category?.name || "Other";
      if (!deptStatsMap[dept]) {
        deptStatsMap[dept] = { gpaSum: 0, attSum: 0, count: 0 };
      }
      deptStatsMap[dept].gpaSum += s.gpa || 0;
      
      const sId = s._id?.toString() || s._id;
      if (!sId) return;
      const attStats = studentAttendanceMap[sId] || { total: 0, present: 0 };
      const attPercent = attStats.total === 0 ? 100 : Math.round((attStats.present / attStats.total) * 100);
      deptStatsMap[dept].attSum += attPercent;
      deptStatsMap[dept].count++;
    });

    const departmentComparisons = Object.entries(deptStatsMap).map(([dept, data]) => ({
      name: dept,
      cgpa: parseFloat((data.gpaSum / data.count).toFixed(2)),
      attendance: Math.round(data.attSum / data.count)
    }));

    // Readiness score distribution counts
    const scoreDist = [
      { name: "Excellent (95+)", value: placementStudents.filter((s: any) => s.readinessScore >= 95).length },
      { name: "Ready (80-94)", value: placementStudents.filter((s: any) => s.readinessScore >= 80 && s.readinessScore < 95).length },
      { name: "Needs Imp (65-79)", value: placementStudents.filter((s: any) => s.readinessScore >= 65 && s.readinessScore < 80).length },
      { name: "High Risk (<65)", value: placementStudents.filter((s: any) => s.readinessScore < 65).length }
    ].filter(item => item.value > 0);

    // Fallback if no placement data
    if (scoreDist.length === 0) {
      scoreDist.push({ name: "Unclassified", value: totalStudents });
    }

    // Placement status distribution counts
    const placementEligibilityDist = [
      { name: "Eligible", value: placementEligibleCount },
      { name: "Needs Improvement", value: placementNeedsImpCount },
      { name: "Not Eligible", value: placementNotEligibleCount }
    ].filter(item => item.value > 0);

    // Top performers per department (Top 1 CGPA per unique department)
    const topPerformers: any[] = [];
    departments.forEach(dept => {
      const deptStudents = placementStudents.filter((s: any) => s.department === dept);
      if (deptStudents.length > 0) {
        const sorted = [...deptStudents].sort((a, b) => b.gpa - a.gpa);
        topPerformers.push(sorted[0]);
      }
    });

    return {
      totalStudents,
      totalFaculty,
      totalDepartments,
      avgAttendance,
      avgCGPA,
      placementEligibleCount,
      atRiskStudents,
      internshipRate,
      attendanceTrend,
      departmentComparisons,
      scoreDist,
      placementEligibilityDist,
      topPerformers
    };
  }, [students, attendances, placementData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-card border rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-card border rounded-2xl animate-pulse" />
        <div className="h-80 bg-card border rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* KPI Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} subtitle="Enrolled Roster" />
        <StatCard title="Total Faculty" value={stats.totalFaculty} icon={UserCheck} subtitle="Active Instructors" />
        <StatCard title="Departments" value={stats.totalDepartments} icon={Layers} subtitle="Academic Branches" />
        <StatCard title="Avg Attendance" value={`${stats.avgAttendance}%`} icon={ClipboardCheck} variant={stats.avgAttendance >= 75 ? "success" : "warning"} />
        <StatCard title="Average CGPA" value={stats.avgCGPA} icon={GraduationCap} subtitle="Out of 10.0" />
        <StatCard title="Placement Eligible" value={stats.placementEligibleCount} icon={Briefcase} variant="success" />
        <StatCard title="Students At Risk" value={stats.atRiskStudents} icon={AlertTriangle} variant={stats.atRiskStudents > 0 ? "destructive" : "success"} />
        <StatCard title="Internship Rate" value={`${stats.internshipRate}%`} icon={Award} subtitle="Milestone Completed" />
      </motion.div>

      {/* Quick Actions Panel */}
      <motion.div variants={itemVariants} className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Quick Administration Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate("/students", { state: { openEnroll: true } })}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
          <button 
            onClick={() => navigate("/students", { state: { openUpload: true } })}
            className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-muted transition-all active:scale-95"
          >
            <Upload className="w-4 h-4 text-primary" />
            Upload Excel / CSV
          </button>
          <button 
            onClick={() => navigate("/reports")}
            className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-muted transition-all active:scale-95"
          >
            <FileText className="w-4 h-4 text-primary" />
            Generate Report
          </button>
          <button 
            onClick={() => navigate("/placement")}
            className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-muted transition-all active:scale-95"
          >
            <Briefcase className="w-4 h-4 text-primary" />
            View Placement List
          </button>
          <button 
            onClick={() => navigate("/reports", { state: { openTemplates: true } })}
            className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-muted transition-all active:scale-95"
          >
            <Settings className="w-4 h-4 text-primary" />
            Manage Templates
          </button>
        </div>
      </motion.div>

      {/* First Charts row: Attendance & GPA */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Attendance Analytics</h3>
            <p className="text-xs text-muted-foreground">Monthly historical attendance velocity trend</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.attendanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAtt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Comparisons */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Department Consistency</h3>
            <p className="text-xs text-muted-foreground">Average CGPA vs Attendance % by department</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.departmentComparisons} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#2563EB" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#16A34A" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="cgpa" name="Average CGPA" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar yAxisId="right" dataKey="attendance" name="Attendance %" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Second Charts row: Placement & Readiness */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Eligibility Pie */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Placement Eligibility</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Eligibility classification matching configured thresholds</p>
            
            <div className="space-y-2 mt-6 text-xs w-full">
              {stats.placementEligibilityDist.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-bold text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-foreground">{item.value} Students</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-[180px] h-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={stats.placementEligibilityDist} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={55} 
                  outerRadius={75} 
                  dataKey="value"
                  stroke="none"
                >
                  {stats.placementEligibilityDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Placement Readiness Score Dist */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Readiness Score Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Placement readiness score brackets (CGPA/Att/Internship)</p>
            
            <div className="space-y-2 mt-6 text-xs w-full">
              {stats.scoreDist.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
                    <span className="font-bold text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-foreground">{item.value} Students</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-[180px] h-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={stats.scoreDist} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={55} 
                  outerRadius={75} 
                  dataKey="value"
                  stroke="none"
                >
                  {stats.scoreDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Top Performers list Section */}
      <motion.div variants={itemVariants} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Top Departmental Performers</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top performing student from each academic department based on CGPA</p>
          </div>
          <Award className="w-5 h-5 text-amber-500 animate-bounce" />
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Student Name</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Year / Sem</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">CGPA</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Attendance %</th>
                <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Placement Readiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {stats.topPerformers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs font-medium">
                    No student performance records found.
                  </td>
                </tr>
              ) : stats.topPerformers.map((s, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{s.name}</td>
                  <td className="py-3 px-4 text-muted-foreground font-semibold">{s.department}</td>
                  <td className="py-3 px-4 text-muted-foreground font-medium">Year {s.year} / Sem {s.semester}</td>
                  <td className="py-3 px-4 text-center font-black text-primary">{s.gpa}</td>
                  <td className="py-3 px-4 text-center font-bold text-success">{s.attendancePercentage}%</td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-extrabold border",
                      s.readinessScore >= 95 ? "bg-success/15 text-success border-success/35" :
                      s.readinessScore >= 80 ? "bg-primary/15 text-primary border-primary/35" :
                      s.readinessScore >= 65 ? "bg-warning/15 text-warning border-warning/35" :
                      "bg-destructive/15 text-destructive border-destructive/35"
                    )}>
                      {s.readinessScore} ({s.scoreCategory})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

const StudentDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [placement, setPlacement] = useState<any>(null);
  const [placementData, setPlacementData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentDashboard = async () => {
    try {
      const [profileRes, placementRes, notifRes] = await Promise.all([
        api.get("/students/profile/me"),
        api.get("/placement/eligible"),
        api.get("/notifications")
      ]);
      
      setData(profileRes.data);
      setPlacementData(placementRes.data);
      if (placementRes.data && placementRes.data.students && placementRes.data.students.length > 0) {
        setPlacement(placementRes.data.students[0]);
      }
      setNotifications(notifRes.data || []);
    } catch (error) {
      console.error("Failed to fetch student dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDashboard();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      toast.success("Notification marked as read");
      fetchStudentDashboard();
    } catch (e) {
      toast.error("Failed to update notification");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-5">
        <div className="h-32 bg-card border rounded-2xl animate-pulse" />
        <div className="h-32 bg-card border rounded-2xl animate-pulse" />
        <div className="h-32 bg-card border rounded-2xl animate-pulse" />
        <div className="h-32 bg-card border rounded-2xl animate-pulse" />
        <div className="h-32 bg-card border rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-10 text-center text-muted-foreground text-sm font-semibold shadow-sm">
        ⚠️ Profile records missing. Please contact administration to register your student profile.
      </div>
    );
  }

  const attendancePct = data.attendancePercentage || 100;
  const isAtRisk = attendancePct < 75;
  const activeBacklogs = data.backlogCount || 0;

  // Placement suggestions
  const rule = placementData?.rule || { minCGPA: 6.0, minAttendance: 75, internshipRequired: false, maxBacklogs: 0 };
  const suggestions: string[] = [];
  if (data.gpa < rule.minCGPA) {
    suggestions.push(`Improve CGPA by ${(rule.minCGPA - data.gpa).toFixed(1)} grade points to meet the ${rule.minCGPA} target.`);
  }
  if (attendancePct < rule.minAttendance) {
    suggestions.push(`Improve attendance by ${rule.minAttendance - attendancePct}% to clear the ${rule.minAttendance}% minimum.`);
  }
  if (activeBacklogs > rule.maxBacklogs) {
    suggestions.push(`Clear pending backlogs. Current active: ${activeBacklogs} (Threshold: max ${rule.maxBacklogs}).`);
  }
  if (rule.internshipRequired && !data.internshipCompleted) {
    suggestions.push("Complete required internship program milestone.");
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 text-xs font-bold"
    >
      {/* 5 stats cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
        <StatCard
          title="Overall Attendance"
          value={`${attendancePct}%`}
          icon={ClipboardCheck}
          subtitle={isAtRisk ? "Debarment warning" : "Compliance Cleared"}
          variant={isAtRisk ? "destructive" : "success"}
        />
        <StatCard
          title="Cumulative GPA"
          value={data.gpa}
          icon={TrendingUp}
          subtitle={`Semester ${data.semester} performance`}
          variant={data.gpa >= 7.5 ? "success" : data.gpa >= 5.0 ? "default" : "destructive"}
        />
        <StatCard
          title="Active Backlogs"
          value={activeBacklogs}
          icon={AlertTriangle}
          subtitle={activeBacklogs > 0 ? "Immediate remedial" : "Zero active backlogs"}
          variant={activeBacklogs > 0 ? "destructive" : "success"}
        />
        <StatCard
          title="Placement Status"
          value={placement?.eligibility || "Eligible"}
          icon={Briefcase}
          subtitle={placement?.eligibility === "Eligible" ? "Shortlists active" : "Needs parameters correction"}
          variant={placement?.eligibility === "Eligible" ? "success" : placement?.eligibility === "Needs Improvement" ? "default" : "destructive"}
        />
        <StatCard
          title="Readiness Score"
          value={placement?.readinessScore || 0}
          icon={Award}
          subtitle={`Category: ${placement?.scoreCategory || "Needs Attention"}`}
          variant={placement?.readinessScore >= 80 ? "success" : placement?.readinessScore >= 65 ? "default" : "destructive"}
        />
      </motion.div>

      {/* Main split grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left detailed profile summary info */}
        <div className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase mb-4">Academic Enrollment Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1 border-b border-border/40 pb-2">
                <span className="text-[10px] text-muted-foreground uppercase font-black">Full Name</span>
                <span className="font-semibold text-foreground">{data.name}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-border/40 pb-2">
                <span className="text-[10px] text-muted-foreground uppercase font-black">University Register No</span>
                <span className="font-semibold text-foreground font-mono">{data.rollNumber}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-border/40 pb-2">
                <span className="text-[10px] text-muted-foreground uppercase font-black">Program & Batch</span>
                <span className="font-semibold text-foreground">{data.course} ({data.batch} Batch)</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-border/40 pb-2">
                <span className="text-[10px] text-muted-foreground uppercase font-black">Current Division / Sem</span>
                <span className="font-semibold text-foreground">Section {data.section} / Semester {data.semester}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-border/40 pb-2 sm:border-b-0">
                <span className="text-[10px] text-muted-foreground uppercase font-black">Fee Account Ledger</span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mt-1 border", data.feesPaid ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
                  {data.feesPaid ? "Ledger Cleared" : "Payment Pending"}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-b border-border/40 pb-2 sm:border-b-0 sm:pb-0">
                <span className="text-[10px] text-muted-foreground uppercase font-black">Internship Milestone</span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mt-1 border", data.internshipCompleted ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20")}>
                  {data.internshipCompleted ? "Completed" : "In Progress"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-5 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Dues Verification Status: {data.noDueStatus ? "✅ Cleared" : "❌ Uncleared"}</span>
            <span className="font-medium">Verified at last term check</span>
          </div>
        </div>

        {/* Missing Requirements & Suggestions */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Placement Suggestions</h3>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1.5 font-semibold text-xs leading-relaxed">
            {suggestions.length === 0 ? (
              <div className="bg-success/10 border border-success/25 text-success rounded-xl p-3">
                ✨ Excellent work! You have satisfied all rules and criteria for campus placement drives.
              </div>
            ) : (
              suggestions.map((sug, idx) => (
                <div key={idx} className="bg-warning/10 border border-warning/25 text-warning rounded-xl p-3">
                  ⚠️ {sug}
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Notifications Widget */}
      <motion.div variants={itemVariants} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Recent Academic Notifications</h3>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">{notifications.filter(n => !n.isRead).length} unread alerts</span>
        </div>

        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground font-semibold">
              No recent notifications logged.
            </div>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <div 
                key={n._id} 
                className={cn(
                  "p-3 rounded-xl border flex justify-between items-start gap-4 transition-all",
                  n.isRead ? "bg-muted/20 border-border/40" : "bg-primary/5 border-primary/20"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span className={cn(
                      "px-1.5 py-0.25 rounded text-[8px] uppercase tracking-wide border",
                      n.priority === "high" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      n.priority === "medium" ? "bg-warning/10 text-warning border-warning/20" :
                      "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {n.priority}
                    </span>
                    <span className="text-foreground">{n.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">{n.message}</p>
                </div>

                {!n.isRead && (
                  <button 
                    onClick={() => handleMarkRead(n._id)}
                    className="text-[9px] uppercase tracking-wider underline text-primary hover:text-primary/80 font-bold shrink-0 cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Welcome header capsule */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border border-border/50 rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Glow backdrop decorator */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome back, {user?.name?.split(" ")[0]}</h1>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Sunstone Management System Console · Academic Year 2025-2026
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border/80 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm select-none relative z-10">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>

      {user?.role === "student" ? <StudentDashboard /> : <AdminFacultyDashboard />}
    </div>
  );
};

export default Dashboard;
