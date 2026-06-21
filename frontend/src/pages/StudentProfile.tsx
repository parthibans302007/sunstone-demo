import { useParams } from "react-router-dom";
import { 
  ArrowLeft, Mail, Phone, Award, TrendingDown, AlertTriangle,
  CheckCircle, HelpCircle, RefreshCw, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const fetchStudentProfile = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Fetch student profile details
      let studentRes;
      if (id) {
        studentRes = await api.get(`/students/${id}`);
      } else {
        studentRes = await api.get("/students/profile/me");
      }
      
      const sData = studentRes.data;
      setStudent(sData);

      if (sData) {
        // 2. Fetch attendance history
        const attRes = await api.get("/attendance", { params: { studentId: sData._id } });
        setAttendances(attRes.data || []);
      }
    } catch (error) {
      console.error("Failed to load student profile details", error);
      toast.error("Failed to load student profile details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudentProfile();
  }, [fetchStudentProfile]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-xs font-bold">
        <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
        Compiling student profile record...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm font-semibold">
        Student profile details not found.
      </div>
    );
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarGrid = () => {
    const currentYear = new Date().getFullYear();
    const firstDay = new Date(currentYear, selectedMonth, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
    const cells = [];
    
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      
      // Find matching attendance record for this day
      const record = attendances.find((r: any) => {
        const rDate = new Date(r.date);
        return rDate.getMonth() === selectedMonth && rDate.getDate() === d;
      });
      
      cells.push({ 
        day: d, 
        record: record ? { status: String(record.status).toLowerCase(), date: dateStr } : null 
      });
    }
    return cells;
  };

  // Process subject-wise attendance metrics
  const subjectsMap: Record<string, { name: string; total: number; attended: number; faculty: string }> = {};
  attendances.forEach(att => {
      const subject = att.subject;
      if (!subjectsMap[subject]) {
          subjectsMap[subject] = {
              name: subject,
              total: 0,
              attended: 0,
              faculty: att.faculty?.name || "Course Coordinator"
          };
      }
      subjectsMap[subject].total++;
      if (att.status === 'Present' || att.status === 'Late' || att.status === 'present' || att.status === 'late') {
          subjectsMap[subject].attended++;
      }
  });
  const computedSubjects = Object.values(subjectsMap);

  const initials = (student.user?.name || "Student").split(" ").map((n: string) => n[0]).join("").toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 text-xs font-bold"
    >
      <div className="flex justify-between items-center print:hidden">
        {id ? (
          <Button variant="ghost" size="sm" className="hover:bg-muted rounded-xl text-xs font-bold" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Students
          </Button>
        ) : (
          <div />
        )}
        
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-card hover:bg-muted border border-border/80 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 text-foreground cursor-pointer select-none"
        >
          <Printer className="w-4 h-4 text-primary" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Header Profile Capsule */}
      <motion.div variants={itemVariants} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-destructive"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-xl font-extrabold shadow-sm border border-white/20 select-none">
              {initials}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-foreground leading-tight">{student.user?.name}</h1>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {student.rollNumber} · {student.category?.name || "Engineering"} · Year {student.year || 1}
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary" /> {student.user?.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> {student.contactNumber || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:self-end md:self-center bg-muted/40 p-4 rounded-xl border border-border/30 w-full md:w-auto justify-between md:justify-start">
            <div className="space-y-1">
              <p className={cn("text-3xl font-black leading-none", student.attendancePercentage >= 75 ? "text-success" : "text-destructive")}>
                {student.attendancePercentage}%
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Overall Attendance</p>
            </div>
            <div className="w-px bg-border/80 h-10" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
                <Award className="w-4 h-4 text-primary shrink-0" />
                <span>Rank #{student.rank || 1}</span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">out of {student.totalStudents || 1} peers</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights Alerts */}
      <motion.div variants={itemVariants} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" />
          AI Attendance Insights & Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
          <div className={cn(
            "border rounded-xl p-3.5 flex items-start gap-2.5",
            student.attendancePercentage < 75 
              ? "bg-destructive/10 border-destructive/25 text-destructive" 
              : "bg-success/10 border-success/25 text-success"
          )}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {student.attendancePercentage < 75 ? (
              <span>Your compliance rating is at risk! (<strong>{student.attendancePercentage}%</strong>). Please attend extra sessions.</span>
            ) : (
              <span>Excellent classroom compliance! Keep maintaining it above the 75% limit.</span>
            )}
          </div>
          <div className="bg-primary/10 border border-primary/25 text-primary rounded-xl p-3.5 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Regular attendance loops mapped on <strong>Mondays</strong>. Reach out to coordinate makeup tests if required.</span>
          </div>
          <div className="bg-success/10 border border-success/25 text-success rounded-xl p-3.5 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Strong 90% attendance record maintained in Core Technical Electives for 3 months.</span>
          </div>
        </div>
      </motion.div>

      {/* Split details section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject wise list details */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Subject-Wise Attendance Metrics</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Summary of attendance per individual subject curriculum</p>
          </div>
          
          <div className="space-y-4">
            {computedSubjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs font-semibold">
                No individual lecture records found for this academic term.
              </div>
            ) : (
              computedSubjects.map((sub) => {
                const pct = Math.round((sub.attended / sub.total) * 100);
                return (
                  <div key={sub.name} className="space-y-2 border-b border-border/30 pb-3 last:border-none last:pb-0">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{sub.name}</span>
                      <span className={cn(pct >= 75 ? "text-success" : "text-destructive")}>{pct}%</span>
                    </div>
                    <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                      <div className={cn("h-1.5 rounded-full", pct >= 75 ? "bg-success" : "bg-destructive")} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      <span>{sub.attended}/{sub.total} Lectures attended</span>
                      <span>Faculty: {sub.faculty}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Calendar visual board */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Attendance Calendar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Grid tracking present/absent days for classes</p>
            </div>
            
            <select
              className="border border-border/80 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-card text-foreground cursor-pointer outline-none focus:ring-1 focus:ring-primary h-8"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={m} value={i}>{m} {new Date().getFullYear()}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-6 gap-1 text-center py-2 flex-1 mt-4">
            {days.map((d) => (
              <div key={d} className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider py-1">{d}</div>
            ))}
            {calendarGrid().map((cell, i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square flex items-center justify-center text-xs rounded-lg select-none border border-transparent transition-all",
                  !cell && "invisible",
                  (cell?.record?.status === "present" || cell?.record?.status === "present") && "bg-success/15 text-success border-success/10 font-bold",
                  (cell?.record?.status === "absent" || cell?.record?.status === "absent") && "bg-destructive/15 text-destructive border-destructive/10 font-bold",
                  (cell?.record?.status === "late" || cell?.record?.status === "late") && "bg-warning/15 text-warning border-warning/10 font-bold",
                  cell && !cell.record && "text-muted-foreground/60 border-border/30 hover:border-primary/20"
                )}
                title={cell?.record ? `Status: ${cell.record.status} on ${cell.record.date}` : ""}
              >
                {cell?.day}
              </div>
            ))}
          </div>

          {/* Legend footer */}
          <div className="flex gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-3 border-t border-border/50">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-success/20 border border-success/10" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-destructive/20 border border-destructive/10" /> Absent</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-warning/20 border border-warning/10" /> Late</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-muted border border-border/40" /> No Class</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentProfile;
