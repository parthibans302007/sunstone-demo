import { useParams } from "react-router-dom";
import { mockStudents, mockSubjects, generateAttendanceCalendar } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Mail, Phone, Award, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const StudentProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // If no id param, show the logged-in student's profile (for /my-attendance route)
  const studentId = id || (user?.role === "student" ? "s1" : undefined);
  const student = mockStudents.find((s) => s.id === studentId);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const calendar = generateAttendanceCalendar(selectedMonth, 2024);

  if (!student) return <p>Student not found</p>;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarGrid = () => {
    const firstDay = new Date(2024, selectedMonth, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(2024, selectedMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `2024-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const record = calendar.find((r) => r.date === dateStr);
      cells.push({ day: d, record });
    }
    return cells;
  };

  return (
    <>
      {id && (
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      )}

      {/* Header */}
      <div className="glass-card p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-sidebar-primary/20 via-accent/10 to-transparent"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {student.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{student.name}</h1>
            <p className="text-sm text-muted-foreground">{student.rollNo} · {student.department} · Year {student.year}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {student.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {student.phone}</span>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className={cn("text-3xl font-bold", student.overallAttendance >= 75 ? "text-success" : "text-destructive")}>
              {student.overallAttendance}%
            </div>
            <p className="text-xs text-muted-foreground">Overall Attendance</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground justify-center sm:justify-end">
              <Award className="w-3.5 h-3.5" /> Rank #{student.rank} of {student.totalStudents}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="glass-card p-6 mb-8 border-l-4 border-accent">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-accent" /> AI Insights
        </h3>
        <div className="space-y-2 text-sm">
          <div className="bg-warning/10 border border-warning/20 rounded-md p-3">
            ⚠️ Attendance in <strong>Operating Systems</strong> dropped 8% this month. Consider extra sessions.
          </div>
          <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
            📅 Pattern detected: {student.name.split(" ")[0]} tends to miss <strong>Monday</strong> classes more frequently.
          </div>
          <div className="bg-success/10 border border-success/20 rounded-md p-3">
            ✅ Strong consistency in <strong>Computer Networks</strong> — 90% attendance maintained for 3 months.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-4">Subject-wise Attendance</h3>
          <div className="space-y-3">
            {mockSubjects.map((sub) => {
              const pct = Math.round((sub.attended / sub.totalClasses) * 100);
              return (
                <div key={sub.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{sub.name} <span className="text-muted-foreground">({sub.code})</span></span>
                    <span className={cn("font-semibold", pct >= 75 ? "text-success" : "text-destructive")}>{pct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={cn("h-2 rounded-full", pct >= 75 ? "bg-success" : "bg-destructive")} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub.attended}/{sub.totalClasses} classes · {sub.faculty}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Monthly Calendar</h3>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-card"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={m} value={i}>{m} 2024</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-6 gap-1 text-center">
            {days.map((d) => (
              <div key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
            ))}
            {calendarGrid().map((cell, i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square flex items-center justify-center text-xs rounded",
                  !cell && "invisible",
                  cell?.record?.status === "present" && "bg-success/20 text-success font-medium",
                  cell?.record?.status === "absent" && "bg-destructive/20 text-destructive font-medium",
                  cell?.record?.status === "holiday" && "bg-muted text-muted-foreground",
                  cell && !cell.record && "text-muted-foreground"
                )}
              >
                {cell?.day}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/20" /> Present</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/20" /> Absent</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted" /> Holiday</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfile;
