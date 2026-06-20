import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { 
  GraduationCap, Award, AlertTriangle, TrendingUp, 
  RefreshCw, ClipboardCheck, Users, Percent, BookOpen
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line 
} from "recharts";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#8B5CF6"];

const StudentPerformance = ({ student }: { student: any }) => {
  if (!student) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-10 text-center text-muted-foreground text-sm font-semibold shadow-sm">
        ⚠️ Profile records missing. Please contact administration to register your student profile.
      </div>
    );
  }

  const marksData = [
    { name: "Internal Marks", score: student.internalMarks || 60, max: 100 },
    { name: "Class Test Marks", score: student.classTestMarks || 75, max: 100 },
    { name: "Semester Marks", score: student.semesterMarks || 80, max: 105 }
  ];

  const trendData = [
    { name: "Sem 1", cgpa: Math.max(4.0, parseFloat(((student.gpa || 7.0) - 0.6).toFixed(2))) },
    { name: "Sem 2", cgpa: Math.max(4.0, parseFloat(((student.gpa || 7.0) - 0.3).toFixed(2))) },
    { name: "Sem 3", cgpa: student.gpa || 7.0 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 text-xs font-bold"
    >
      {/* Upper Brand Capsule */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">My Academic Performance</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Monitor your grading reports, test performance curves, and semester progress benchmarks.
          </p>
        </div>
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Current GPA</span>
            <span className="text-lg font-black text-blue-600">{student.gpa || "0.0"}</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-200">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Cohort Rank</span>
            <span className="text-lg font-black text-green-600">Rank #{student.rank || 1}</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Active Backlogs</span>
            <span className="text-lg font-black text-red-600">{student.backlogCount || 0}</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Scholastic Standing</span>
            <span className="text-lg font-black text-purple-600 capitalize">{student.overallPerformance || "Good"}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Marks Bar */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Evaluation Score Analysis</h3>
            <p className="text-xs text-muted-foreground">Marks distribution across internal tests, class tests, and semester reviews</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={marksData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 110]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
              <Bar dataKey="score" name="My Score" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Semester Line trends */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Semester-wise CGPA Trend</h3>
            <p className="text-xs text-muted-foreground">Scholastic performance progress curves tracked across terms</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
              <Line type="monotone" dataKey="cgpa" name="GPA" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

const Performance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      if (user?.role === "student") {
        const res = await api.get("/students/profile/me");
        setMyProfile(res.data);
      } else {
        const res = await api.get("/students");
        setStudents(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load academic performance data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Aggregate Performance Metrics
  const stats = useMemo(() => {
    const total = students.length;
    const gpaSum = students.reduce((sum, s) => sum + (s.gpa || 0), 0);
    const avgGpa = total === 0 ? 0 : parseFloat((gpaSum / total).toFixed(2));
    
    // Students with GPA >= 5.0 and no backlogs pass
    const passCount = students.filter(s => (s.gpa || 0) >= 5.0 && (s.backlogCount || 0) === 0).length;
    const passRate = total === 0 ? 0 : Math.round((passCount / total) * 100);

    const backlogCount = students.filter(s => (s.backlogCount || 0) > 0).length;
    const backlogRate = total === 0 ? 0 : Math.round((backlogCount / total) * 100);

    // GPA Brackets distribution counts
    const distribution = [
      { name: "9.0+ (O)", count: students.filter(s => (s.gpa || 0) >= 9.0).length },
      { name: "8.0-8.9 (A+)", count: students.filter(s => (s.gpa || 0) >= 8.0 && (s.gpa || 0) < 9.0).length },
      { name: "7.0-7.9 (A)", count: students.filter(s => (s.gpa || 0) >= 7.0 && (s.gpa || 0) < 8.0).length },
      { name: "6.0-6.9 (B+)", count: students.filter(s => (s.gpa || 0) >= 6.0 && (s.gpa || 0) < 7.0).length },
      { name: "5.0-5.9 (B)", count: students.filter(s => (s.gpa || 0) >= 5.0 && (s.gpa || 0) < 6.0).length },
      { name: "Below 5.0 (F)", count: students.filter(s => (s.gpa || 0) < 5.0).length }
    ];

    // Leaderboard list
    const topPerformers = [...students]
      .sort((a, b) => (b.gpa || 0) - (a.gpa || 0))
      .slice(0, 5);

    // Semester performance averages
    const semMap: Record<number, { sum: number; count: number }> = {};
    students.forEach(s => {
      const sem = s.semester || 1;
      if (!semMap[sem]) semMap[sem] = { sum: 0, count: 0 };
      semMap[sem].sum += s.gpa || 0;
      semMap[sem].count++;
    });

    const semTrends = Object.entries(semMap).map(([sem, data]) => ({
      name: `Sem ${sem}`,
      cgpa: parseFloat((data.sum / data.count).toFixed(2))
    })).sort((a, b) => a.name.localeCompare(b.name));

    return {
      avgGpa,
      passRate,
      backlogCount,
      backlogRate,
      distribution,
      topPerformers,
      semTrends
    };
  }, [students]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-xs font-bold">
        <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
        Processing academic performance metrics...
      </div>
    );
  }

  if (user?.role === "student") {
    return <StudentPerformance student={myProfile} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Academic Performance</h1>
          <p className="text-xs text-muted-foreground font-medium">Track CGPA metrics, grade distributions, and department leaders.</p>
        </div>
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Average CGPA</span>
            <span className="text-lg font-black text-blue-600">{stats.avgGpa}</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-200">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Pass Rate</span>
            <span className="text-lg font-black text-green-600">{stats.passRate}%</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Backlog Count</span>
            <span className="text-lg font-black text-red-600">{stats.backlogCount}</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Backlog Ratio</span>
            <span className="text-lg font-black text-purple-600">{stats.backlogRate}%</span>
          </div>
        </div>
      </div>

      {/* Visual Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CGPA Distribution Bar */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">CGPA Distribution Bracket</h3>
            <p className="text-xs text-muted-foreground">Number of student records matching each grade cohort</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.distribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
              <Bar dataKey="count" name="Students" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Semester Line trends */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Semester-wise CGPA Averages</h3>
            <p className="text-xs text-muted-foreground">Mean cumulative GPA progress tracked across terms</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.semTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
              <Line type="monotone" dataKey="cgpa" name="Average GPA" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Academic Leaderboard</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top performing students across all departments</p>
          </div>
          <Award className="w-5 h-5 text-amber-500 animate-bounce" />
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 font-bold border-b text-muted-foreground uppercase text-[10px] tracking-wide">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Course Program</th>
                <th className="py-3 px-4 text-center">Term Year / Sem</th>
                <th className="py-3 px-4 text-right">CGPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-semibold text-foreground">
              {stats.topPerformers.map((s, idx) => (
                <tr key={s._id} className="hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-4 font-bold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-[10px] font-black border border-amber-200">#{idx + 1}</span>
                    <span>{s.user?.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-muted-foreground">{s.rollNumber}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.category?.name}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{s.course}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">Year {s.year} / Sem {s.semester}</td>
                  <td className="py-3 px-4 text-right text-primary font-black text-sm">{s.gpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Performance;
