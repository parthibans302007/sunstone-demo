import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Briefcase, CheckCircle, AlertTriangle, XCircle,
  Search, Download, RefreshCw, Sliders, Check, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { stiffness: 300, damping: 20 } }
};

const StudentPlacementView = ({ student, rule }: { student: any, rule: any }) => {
  const suggestions: string[] = [];
  if (student.gpa < rule.minCGPA) {
    suggestions.push(`Improve CGPA by ${(rule.minCGPA - student.gpa).toFixed(1)} grade points to meet the ${rule.minCGPA} threshold.`);
  }
  if (student.attendancePercentage < rule.minAttendance) {
    suggestions.push(`Improve attendance by ${rule.minAttendance - student.attendancePercentage}% to clear the ${rule.minAttendance}% threshold.`);
  }
  if (student.backlogCount > rule.maxBacklogs) {
    suggestions.push(`Clear pending backlogs. Current active: ${student.backlogCount} (Max allowed: ${rule.maxBacklogs}).`);
  }
  if (rule.internshipRequired && !student.internshipCompleted) {
    suggestions.push("Complete required internship program milestone.");
  }

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="show" className="space-y-6 text-xs font-bold">
      {/* Upper Brand Capsule */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">My Placement Eligibility Status</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Review your campus placement qualification parameters, readiness index, and advisor requirements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Cards column */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Eligibility Summary</h3>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Readiness Index Score</span>
                <div className="text-3xl font-black text-primary mt-1">{student.readinessScore || 0} / 100</div>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Eligibility Decision</span>
                <div className="mt-1">
                  <span className={cn(
                    "px-3 py-1 rounded text-xs font-extrabold border uppercase inline-block",
                    student.eligibility === 'Eligible' ? "bg-success/15 text-success border-success/35" :
                    student.eligibility === 'Needs Improvement' ? "bg-warning/15 text-warning border-warning/35" :
                    "bg-destructive/15 text-destructive border-destructive/35"
                  )}>
                    {student.eligibility}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Risk Evaluation</span>
                <div className={cn(
                  "text-xs font-bold mt-1",
                  student.riskStatus === "High Risk" ? "text-destructive" :
                  student.riskStatus === "Needs Attention" ? "text-warning" : "text-success"
                )}>
                  {student.riskStatus || "Safe"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements check list */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Rule Verification Checklist</h3>

            <div className="space-y-4 font-semibold text-xs text-foreground">
              <div className="flex items-center justify-between border-b pb-3 border-border/40">
                <div className="space-y-0.5">
                  <div>Cumulative Grade GPA Threshold</div>
                  <div className="text-[10px] text-muted-foreground">Required: {rule.minCGPA || 6.0} · Current: {student.gpa || 0.0}</div>
                </div>
                <div>
                  {student.gpa >= rule.minCGPA ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-3 border-border/40">
                <div className="space-y-0.5">
                  <div>Compliance Attendance Ratio</div>
                  <div className="text-[10px] text-muted-foreground">Required: {rule.minAttendance || 75}% · Current: {student.attendancePercentage || 0}%</div>
                </div>
                <div>
                  {student.attendancePercentage >= rule.minAttendance ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-3 border-border/40">
                <div className="space-y-0.5">
                  <div>Active Backlogs Check</div>
                  <div className="text-[10px] text-muted-foreground">Required: Max {rule.maxBacklogs || 0} · Current: {student.backlogCount || 0}</div>
                </div>
                <div>
                  {student.backlogCount <= rule.maxBacklogs ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pb-0">
                <div className="space-y-0.5">
                  <div>Internship Milestone Completed</div>
                  <div className="text-[10px] text-muted-foreground">{rule.internshipRequired ? "Required Milestone" : "Optional / Suggested"}</div>
                </div>
                <div>
                  {student.internshipCompleted ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : rule.internshipRequired ? (
                    <XCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Improvement Suggestions & Advices</h3>

            <div className="space-y-3 leading-relaxed text-xs">
              {suggestions.length === 0 ? (
                <div className="bg-success/15 text-success border border-success/30 p-4 rounded-xl">
                  ✨ Congratulations! All criteria values meet active thresholds. You are cleared for corporate shortlists.
                </div>
              ) : (
                suggestions.map((sug, idx) => (
                  <div key={idx} className="bg-warning/10 border border-warning/25 text-warning p-3.5 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
                    <span>{sug}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Placement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submittingRules, setSubmittingRules] = useState(false);
  const [activeTab, setActiveTab] = useState<"directory" | "shortlist" | "rules">("directory");
  
  const [placementData, setPlacementData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");

  const [rulesForm, setRulesForm] = useState({
    minCGPA: 6.0,
    minAttendance: 75,
    internshipRequired: false,
    maxBacklogs: 0
  });

  const fetchPlacementData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/placement/eligible");
      setPlacementData(res.data);
      if (res.data?.rule) {
        setRulesForm({
          minCGPA: res.data.rule.minCGPA || 6.0,
          minAttendance: res.data.rule.minAttendance || 75,
          internshipRequired: res.data.rule.internshipRequired || false,
          maxBacklogs: res.data.rule.maxBacklogs || 0
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load placement eligibility data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlacementData();
  }, [fetchPlacementData]);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRules(true);
    try {
      await api.post("/placement/rules", rulesForm);
      toast.success("Placement eligibility thresholds updated successfully!");
      fetchPlacementData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update criteria thresholds");
    } finally {
      setSubmittingRules(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!placementData?.students) return [];
    return placementData.students.filter((s: any) => {
      const matchSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.rollNumber || '').toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || s.department === deptFilter;
      
      let matchEligibility = true;
      if (eligibilityFilter !== "all") {
        matchEligibility = s.eligibility === eligibilityFilter;
      }

      return matchSearch && matchDept && matchEligibility;
    });
  }, [placementData, search, deptFilter, eligibilityFilter]);

  const shortlistedStudents = useMemo(() => {
    return filteredStudents.filter((s: any) => s.eligibility === "Eligible" && s.readinessScore >= 80);
  }, [filteredStudents]);

  const stats = useMemo(() => {
    const list = placementData?.students || [];
    const eligible = list.filter((s: any) => s.eligibility === "Eligible").length;
    const needsImp = list.filter((s: any) => s.eligibility === "Needs Improvement").length;
    const notEligible = list.filter((s: any) => s.eligibility === "Not Eligible").length;
    const total = list.length;
    const readyRate = total === 0 ? 0 : Math.round((eligible / total) * 100);

    return { eligible, needsImp, notEligible, total, readyRate };
  }, [placementData]);

  const departments = useMemo(() => {
    if (!placementData?.students) return [];
    return Array.from(new Set(placementData.students.map((s: any) => s.department)));
  }, [placementData]);

  const handleExportShortlist = () => {
    try {
      const escapeCSVValue = (val: any) => {
        if (val === undefined || val === null) return '""';
        let str = String(val);
        const trimmed = str.trim();
        if (trimmed.startsWith("=") || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("@")) {
          str = "'" + str;
        }
        return `"${str.replace(/"/g, '""')}"`;
      };

      const csvRows = [
        ["Student Name", "Roll Number", "Department", "CGPA", "Attendance %", "Readiness Score", "Rank Category"]
      ];

      shortlistedStudents.forEach((s: any) => {
        csvRows.push([
          s.name,
          s.rollNumber,
          s.department,
          s.gpa.toString(),
          `${s.attendancePercentage}%`,
          s.readinessScore.toString(),
          s.scoreCategory
        ]);
      });

      const csvContent = "\uFEFF" + csvRows.map(r => r.map(escapeCSVValue).join(",")).join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `sunstone-placement-shortlist-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Placement Shortlist exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export placement shortlist");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-xs font-bold">
        <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
        Compiling placement eligibility metrics...
      </div>
    );
  }

  if (user?.role === "student") {
    const sRecord = placementData?.students?.[0] || {
      name: user.name,
      rollNumber: "N/A",
      gpa: 0,
      attendancePercentage: 100,
      internshipCompleted: false,
      backlogCount: 0,
      readinessScore: 70,
      eligibility: "Not Eligible",
      scoreCategory: "High Risk",
      riskStatus: "High Risk"
    };
    const activeRule = placementData?.rule || { minCGPA: 6.0, minAttendance: 75, internshipRequired: false, maxBacklogs: 0 };

    return (
      <motion.div variants={itemVariants} initial="hidden" animate="show">
        <StudentPlacementView student={sRecord} rule={activeRule} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Brand Capsule */}
      <motion.div variants={itemVariants} initial="hidden" animate="show">
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Placement Eligibility Portal</h1>
            <p className="text-xs text-muted-foreground font-medium">Define recruitment parameters, calculate scores, and generate corporate placement ready shortlists.</p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards row */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ transitionDelay: "0.1s" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-2xl p-6 border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-200">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Eligible students</span>
              <span className="text-lg font-black text-green-600">{stats.eligible}</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-6 border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Needs Improvement</span>
              <span className="text-lg font-black text-amber-600">{stats.needsImp}</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-6 border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Not Eligible</span>
              <span className="text-lg font-black text-red-600">{stats.notEligible}</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-6 border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Ready Cohort Ratio</span>
              <span className="text-lg font-black text-primary">{stats.readyRate}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs Menu */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ transitionDelay: "0.2s" }}>
        <div className="flex border-b text-xs font-bold text-muted-foreground select-none bg-card p-1 rounded-xl border border-border/60 gap-1">
          <button
            onClick={() => setActiveTab("directory")}
            className={cn("px-4 py-2 rounded-lg transition-all uppercase whitespace-nowrap", activeTab === "directory" ? "bg-primary text-white" : "hover:bg-muted hover:text-foreground")}
          >
            Eligibility Directory
          </button>
          <button
            onClick={() => setActiveTab("shortlist")}
            className={cn("px-4 py-2 rounded-lg transition-all uppercase whitespace-nowrap", activeTab === "shortlist" ? "bg-primary text-white" : "hover:bg-muted hover:text-foreground")}
          >
            Placement Shortlist
          </button>
          {user?.role === "admin" && (
            <button
              onClick={() => setActiveTab("rules")}
              className={cn("px-4 py-2 rounded-lg transition-all uppercase whitespace-nowrap", activeTab === "rules" ? "bg-primary text-white" : "hover:bg-muted hover:text-foreground")}
            >
              Threshold Rules
            </button>
          )}
        </div>
      </motion.div>

      {/* Content views */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ transitionDelay: "0.3s" }}>
        <div className="space-y-4">
        {activeTab === "directory" && (
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-5 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input 
                  type="text"
                  placeholder="Search name or roll number..."
                  className="w-full bg-background border rounded-lg pl-9 pr-3 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary h-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3.5 w-full sm:w-auto shrink-0 justify-end text-xs font-bold">
                <div className="flex flex-col gap-0.5">
                  <select className="bg-card border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer h-9" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                    <option value="all">All Departments</option>
                    {departments.map(d => <option key={String(d)} value={String(d)}>{String(d)}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <select className="bg-card border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer h-9" value={eligibilityFilter} onChange={e => setEligibilityFilter(e.target.value)}>
                    <option value="all">All Eligibility</option>
                    <option value="Eligible">Eligible</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                    <option value="Not Eligible">Not Eligible</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 font-bold border-b text-muted-foreground uppercase text-[10px] tracking-wide">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">CGPA</th>
                    <th className="py-3 px-4 text-center">Attendance</th>
                    <th className="py-3 px-4 text-center">Readiness Score</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-semibold text-foreground">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground font-semibold">No student records match filters</td>
                    </tr>
                  ) : (
                    filteredStudents.map((s: any) => (
                      <tr key={s._id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 font-bold">{s.name}</td>
                        <td className="py-3 px-4 font-mono text-[10px] text-muted-foreground">{s.rollNumber}</td>
                        <td className="py-3 px-4 text-muted-foreground">{s.department}</td>
                        <td className="py-3 px-4 text-center text-primary font-black">{s.gpa}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", s.attendancePercentage >= 75 ? "bg-success/15 text-success border-success/25" : "bg-destructive/15 text-destructive border-destructive/25")}>
                            {s.attendancePercentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-extrabold text-xs text-primary">{s.readinessScore} ({s.scoreCategory})</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded text-[10px] font-extrabold border uppercase",
                            s.eligibility === 'Eligible' ? "bg-success/15 text-success border-success/35" :
                            s.eligibility === 'Needs Improvement' ? "bg-warning/15 text-warning border-warning/35" :
                            "bg-destructive/15 text-destructive border-destructive/35"
                          )}>
                            {s.eligibility}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "shortlist" && (
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">Final-Year Placement Ready Roster Shortlist</h3>
                <p className="text-[10px] text-muted-foreground">Shortlist criteria: Eligible standing + Placement Readiness Score of 80 or higher.</p>
              </div>
              <button 
                onClick={handleExportShortlist}
                disabled={shortlistedStudents.length === 0}
                className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export Shortlist CSV
              </button>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 font-bold border-b text-muted-foreground uppercase text-[10px] tracking-wide">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">CGPA</th>
                    <th className="py-3 px-4 text-center">Attendance</th>
                    <th className="py-3 px-4 text-center">Readiness Score</th>
                    <th className="py-3 px-4 text-right">Roster Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-semibold text-foreground">
                  {shortlistedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground font-semibold">No students meet the shortlist criteria (Eligible + Score &gt;= 80)</td>
                    </tr>
                  ) : (
                    shortlistedStudents.map((s: any) => (
                      <tr key={s._id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 font-bold">{s.name}</td>
                        <td className="py-3 px-4 font-mono text-[10px] text-muted-foreground">{s.rollNumber}</td>
                        <td className="py-3 px-4 text-muted-foreground">{s.department}</td>
                        <td className="py-3 px-4 text-center text-primary font-black">{s.gpa}</td>
                        <td className="py-3 px-4 text-center text-success font-bold">{s.attendancePercentage}%</td>
                        <td className="py-3 px-4 text-center text-primary font-extrabold">{s.readinessScore} ({s.scoreCategory})</td>
                        <td className="py-3 px-4 text-right text-success font-extrabold uppercase">Placement Ready</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "rules" && user?.role === "admin" && (
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-6 max-w-lg">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              Criteria Rules Configuration
            </h3>

            <form onSubmit={handleSaveRules} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-muted-foreground uppercase">Minimum CGPA required (0.0 to 10.0)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10"
                  className="w-full bg-background border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
                  value={rulesForm.minCGPA}
                  onChange={e => setRulesForm({...rulesForm, minCGPA: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase">Minimum Attendance Percentage required (0 to 100)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  className="w-full bg-background border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
                  value={rulesForm.minAttendance}
                  onChange={e => setRulesForm({...rulesForm, minAttendance: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase">Maximum backlogs allowed</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full bg-background border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
                  value={rulesForm.maxBacklogs}
                  onChange={e => setRulesForm({...rulesForm, maxBacklogs: parseInt(e.target.value)})}
                />
              </div>

              <label className="flex items-center gap-2.5 bg-muted/20 border p-3 rounded-xl cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rulesForm.internshipRequired} 
                  onChange={e => setRulesForm({...rulesForm, internshipRequired: e.target.checked})}
                  className="rounded text-primary focus:ring-primary h-4.5 w-4.5"
                />
                <span>Mandatory Internship milestone completed</span>
              </label>

              <button 
                type="submit" 
                disabled={submittingRules}
                className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow shadow-primary/10 h-10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingRules ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save criteria thresholds
              </button>
            </form>
          </div>
        )}
      </div>
      </motion.div>
    </div>
  );
};

export default Placement;
