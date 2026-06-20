import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { 
  TrendingUp, BarChart as ChartIcon, Layers, Calendar, 
  RefreshCw, ClipboardCheck, GraduationCap, Briefcase, Award 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line 
} from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#2563EB", "#0F172A", "#16A34A", "#F59E0B", "#DC2626", "#8B5CF6"];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [placementStudents, setPlacementStudents] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsRes, placementRes] = await Promise.all([
        api.get("/students"),
        api.get("/placement/eligible")
      ]);
      setStudents(studentsRes.data);
      setPlacementStudents(placementRes.data?.students || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate Department Metrics
  const deptData = useMemo(() => {
    const map: Record<string, {
      total: number;
      gpaSum: number;
      attSum: number;
      internshipCount: number;
      eligibleCount: number;
    }> = {};

    placementStudents.forEach((s: any) => {
      const dept = s.department || "Other";
      if (!map[dept]) {
        map[dept] = { total: 0, gpaSum: 0, attSum: 0, internshipCount: 0, eligibleCount: 0 };
      }
      map[dept].total++;
      map[dept].gpaSum += s.gpa || 0;
      map[dept].attSum += s.attendancePercentage || 0;
      if (s.internshipCompleted) map[dept].internshipCount++;
      if (s.eligibility === 'Eligible') map[dept].eligibleCount++;
    });

    return Object.entries(map).map(([dept, data]) => ({
      name: dept,
      total: data.total,
      avgGpa: data.total === 0 ? 0 : parseFloat((data.gpaSum / data.total).toFixed(2)),
      avgAtt: data.total === 0 ? 0 : Math.round(data.attSum / data.total),
      internPercent: data.total === 0 ? 0 : Math.round((data.internshipCount / data.total) * 100),
      eligiblePercent: data.total === 0 ? 0 : Math.round((data.eligibleCount / data.total) * 100)
    }));
  }, [placementStudents]);

  // Aggregate Year Comparisons
  const yearData = useMemo(() => {
    const map: Record<number, { gpaSum: number; attSum: number; count: number }> = {};
    placementStudents.forEach((s: any) => {
      const year = s.year || 1;
      if (!map[year]) {
        map[year] = { gpaSum: 0, attSum: 0, count: 0 };
      }
      map[year].gpaSum += s.gpa || 0;
      map[year].attSum += s.attendancePercentage || 0;
      map[year].count++;
    });

    return Object.entries(map).map(([year, data]) => ({
      name: `Year ${year}`,
      gpa: data.count === 0 ? 0 : parseFloat((data.gpaSum / data.count).toFixed(2)),
      attendance: data.count === 0 ? 0 : Math.round(data.attSum / data.count)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [placementStudents]);

  // Aggregate Semester Comparisons
  const semData = useMemo(() => {
    const map: Record<number, { gpaSum: number; attSum: number; count: number }> = {};
    placementStudents.forEach((s: any) => {
      const sem = s.semester || 1;
      if (!map[sem]) {
        map[sem] = { gpaSum: 0, attSum: 0, count: 0 };
      }
      map[sem].gpaSum += s.gpa || 0;
      map[sem].attSum += s.attendancePercentage || 0;
      map[sem].count++;
    });

    return Object.entries(map).map(([sem, data]) => ({
      name: `Sem ${sem}`,
      gpa: data.count === 0 ? 0 : parseFloat((data.gpaSum / data.count).toFixed(2)),
      attendance: data.count === 0 ? 0 : Math.round(data.attSum / data.count)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [placementStudents]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-xs font-bold">
        <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
        Processing department metrics & analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Institutional Analytics</h1>
          <p className="text-xs text-muted-foreground font-medium">Compare academic metrics and enrollment performance ratios across cohorts.</p>
        </div>
      </div>

      {/* Grid of comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dept Comparison Chart */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Departmental Metrics</h3>
            <p className="text-xs text-muted-foreground">Average CGPA vs Attendance % by department</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#2563EB" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#16A34A" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="avgGpa" name="Average CGPA" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar yAxisId="right" dataKey="avgAtt" name="Attendance %" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Year Comparison Chart */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Year-wise Comparison</h3>
            <p className="text-xs text-muted-foreground">Average performance metrics aggregated by batch year</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#8B5CF6" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="gpa" name="Mean CGPA" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar yAxisId="right" dataKey="attendance" name="Mean Attendance %" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Semester Comparison Chart */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Semester Progress Trends</h3>
          <p className="text-xs text-muted-foreground">Average CGPA vs Attendance tracking across semesters</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={semData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" orientation="left" stroke="#2563EB" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#16A34A" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Line yAxisId="left" type="monotone" dataKey="gpa" name="Mean GPA" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line yAxisId="right" type="monotone" dataKey="attendance" name="Mean Attendance %" stroke="#16A34A" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Department Performance Grid Table */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Department Performance Summary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Key performance indicators aggregated at the department level</p>
          </div>
          <Layers className="w-5 h-5 text-primary" />
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 font-bold border-b text-muted-foreground uppercase text-[10px] tracking-wide">
              <tr>
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4 text-center">Total Students</th>
                <th className="py-3 px-4 text-center">Average Attendance</th>
                <th className="py-3 px-4 text-center">Average CGPA</th>
                <th className="py-3 px-4 text-center">Internship Rate</th>
                <th className="py-3 px-4 text-right">Placement eligible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-semibold text-foreground">
              {deptData.map((d, idx) => (
                <tr key={idx} className="hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-4 font-bold">{d.name}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{d.total}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", d.avgAtt >= 75 ? "bg-success/15 text-success border-success/25" : "bg-destructive/15 text-destructive border-destructive/25")}>
                      {d.avgAtt}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-primary font-black">{d.avgGpa}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground font-bold">{d.internPercent}%</td>
                  <td className="py-3 px-4 text-right text-success font-black">{d.eligiblePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
