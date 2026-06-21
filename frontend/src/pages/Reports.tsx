import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  FileText, Download, Search, Filter, Save, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle, Printer, Check,
  ListFilter, Users, Percent, Briefcase, GraduationCap,
  RefreshCw, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ALL_FIELDS = [
  { label: "Student Name", key: "name" },
  { label: "Register Number", key: "rollNumber" },
  { label: "Department", key: "categoryName" },
  { label: "Course", key: "course" },
  { label: "Batch", key: "batch" },
  { label: "Year", key: "year" },
  { label: "Semester", key: "semester" },
  { label: "Section", key: "section" },
  { label: "GPA / CGPA", key: "gpa" },
  { label: "Backlog Count", key: "backlogCount" },
  { label: "Attendance %", key: "attendancePercentage" },
  { label: "Internship Completed", key: "internshipCompleted" },
  { label: "Placement Eligibility", key: "eligibility" },
  { label: "Readiness Score", key: "readinessScore" },
  { label: "Email Address", key: "email" },
  { label: "Contact Number", key: "contactNumber" },
  { label: "Parent Contact", key: "parentContact" },
  { label: "Residential Address", key: "address" },
  { label: "Gender", key: "gender" },
  { label: "Date of Birth", key: "dob" },
  { label: "Community / Group", key: "community" },
  { label: "Blood Group", key: "bloodGroup" },
  { label: "Fees Paid", key: "feesPaid" },
  { label: "No Due Status", key: "noDueStatus" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
};

const Reports = () => {
  const { user } = useAuth();
  
  // State for reports data
  const [reportData, setReportData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Active Category Card selector (instantly loads preset)
  const [activeCategory, setActiveCategory] = useState<string>("personal");

  // Advanced Filters State
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPassStatus, setSelectedPassStatus] = useState<string>("");
  const [selectedFeesPaid, setSelectedFeesPaid] = useState<string>("");
  const [selectedInternship, setSelectedInternship] = useState<string>("");
  const [selectedPlacement, setSelectedPlacement] = useState<string>("");

  // Grid/Search/Sorting States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  // Selected Columns / Fields
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "name", "rollNumber", "email", "contactNumber", "gender", "address"
  ]);

  // Presets State
  const [newTemplateName, setNewTemplateName] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Fetch initial setup categories & presets
  const fetchSetup = useCallback(async () => {
    try {
      const [catRes, tempRes] = await Promise.all([
        api.get("/categories"),
        api.get("/reports/templates")
      ]);
      setCategories(catRes.data);
      setTemplates(tempRes.data);
    } catch (err) {
      console.error("Failed to load templates/categories", err);
    }
  }, []);

  // Primary report generator
  const generateReport = useCallback(async () => {
    setGenerating(true);
    setAccessDeniedMessage(null);

    try {
      // Build filters query parameters
      const params: any = {
        sortBy,
        sortOrder,
        groupBy,
        page: currentPage,
        limit,
        search: searchQuery
      };

      // Add selected filters
      if (selectedBatch) params.batch = selectedBatch;
      if (selectedCourse) params.course = selectedCourse;
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedYear) params.year = selectedYear;
      if (selectedSection) params.section = selectedSection;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedPassStatus) params.passStatus = selectedPassStatus;
      if (selectedFeesPaid) params.feesPaid = selectedFeesPaid;
      if (selectedInternship) params.internshipCompleted = selectedInternship;

      const { data } = await api.get("/reports", { params });
      
      // Inject calculated placement statuses on the fly for UI integration
      const placementRes = await api.get("/placement/eligible");
      const placementList = placementRes.data?.students || [];

      let enrichedStudents = (data.students || []).map((s: any) => {
        const pInfo = placementList.find((ps: any) => ps.rollNumber === s.rollNumber) || {};
        return {
          ...s,
          eligibility: pInfo.eligibility || "Eligible",
          readinessScore: pInfo.readinessScore || 70,
          scoreCategory: pInfo.scoreCategory || "Needs Improvement",
          riskStatus: pInfo.riskStatus || "Safe"
        };
      });

      // Filter placement eligibility on the frontend if filter selected
      if (selectedPlacement) {
        enrichedStudents = enrichedStudents.filter((s: any) => s.eligibility === selectedPlacement);
      }

      setReportData({
        ...data,
        students: enrichedStudents
      });
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setAccessDeniedMessage(err.response?.data?.message || "Access Denied: Restricted record scope");
      } else {
        toast.error("Failed to compile reports data");
      }
      setReportData(null);
    } finally {
      setGenerating(false);
    }
  }, [
    selectedBatch, selectedCourse, selectedSemester, selectedYear,
    selectedSection, selectedCategory, selectedPassStatus,
    selectedFeesPaid, selectedInternship, selectedPlacement, sortBy, sortOrder,
    groupBy, currentPage, limit, searchQuery
  ]);

  // Load setup data
  useEffect(() => {
    setLoading(true);
    fetchSetup().finally(() => setLoading(false));
  }, [fetchSetup]);

  // Trigger report fetch when page, query, sort changes
  useEffect(() => {
    generateReport();
  }, [generateReport]);

  // 6 Primary Category Card click handlers
  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setGroupBy(""); // Clear grouping

    if (category === "personal") {
      setSelectedFields(["name", "rollNumber", "email", "contactNumber", "gender", "address"]);
    } else if (category === "attendance") {
      setSelectedFields(["name", "rollNumber", "course", "year", "section", "attendancePercentage"]);
    } else if (category === "performance") {
      setSelectedFields(["name", "rollNumber", "course", "gpa", "backlogCount", "overallPerformance"]);
    } else if (category === "placement") {
      setSelectedFields(["name", "rollNumber", "gpa", "attendancePercentage", "internshipCompleted", "eligibility", "readinessScore"]);
    } else if (category === "department") {
      setGroupBy("batch"); // Group by batch department summaries
      setSelectedFields(["name", "rollNumber", "course", "gpa", "attendancePercentage"]);
    } else if (category === "year") {
      setGroupBy("year"); // Group by year summaries
      setSelectedFields(["name", "rollNumber", "course", "gpa", "attendancePercentage"]);
    }
    
  };

  // Presets templates management
  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    try {
      const templatePayload = {
        name: newTemplateName,
        reportType: activeCategory,
        filters: {
          batch: selectedBatch,
          course: selectedCourse,
          semester: selectedSemester,
          year: selectedYear,
          section: selectedSection,
          category: selectedCategory,
          passStatus: selectedPassStatus,
          feesPaid: selectedFeesPaid,
          internshipCompleted: selectedInternship,
          placementEligibility: selectedPlacement
        },
        selectedFields,
        sortBy,
        sortOrder,
        groupBy
      };
      await api.post("/reports/templates", templatePayload);
      toast.success("Preset Template saved successfully!");
      setNewTemplateName("");
      fetchSetup();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save template preset");
    }
  };

  const handleLoadTemplate = (tId: string) => {
    setSelectedTemplateId(tId);
    if (!tId) return;
    const temp = templates.find(t => t._id === tId);
    if (temp) {
      setActiveCategory(temp.reportType || "personal");
      const f = temp.filters || {};
      setSelectedBatch(f.batch || "");
      setSelectedCourse(f.course || "");
      setSelectedSemester(f.semester || "");
      setSelectedYear(f.year || "");
      setSelectedSection(f.section || "");
      setSelectedCategory(f.category || "");
      setSelectedPassStatus(f.passStatus || "");
      setSelectedFeesPaid(f.feesPaid || "");
      setSelectedInternship(f.internshipCompleted || "");
      setSelectedPlacement(f.placementEligibility || "");
      
      if (temp.selectedFields) setSelectedFields(temp.selectedFields);
      if (temp.sortBy) setSortBy(temp.sortBy);
      if (temp.sortOrder) setSortOrder(temp.sortOrder);
      if (temp.groupBy) setGroupBy(temp.groupBy);

      toast.success(`Preset "${temp.name}" loaded!`);
      setTimeout(() => {
        generateReport();
      }, 50);
    }
  };

  const handleDeleteTemplate = async (tId: string) => {
    try {
      await api.delete(`/reports/templates/${tId}`);
      toast.success("Template preset deleted successfully");
      if (selectedTemplateId === tId) setSelectedTemplateId("");
      fetchSetup();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete preset template");
    }
  };

  // Toggle field column check
  const toggleField = (fieldKey: string) => {
    if (selectedFields.includes(fieldKey)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldKey));
    } else {
      setSelectedFields([...selectedFields, fieldKey]);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedBatch("");
    setSelectedCourse("");
    setSelectedSemester("");
    setSelectedYear("");
    setSelectedSection("");
    setSelectedCategory("");
    setSelectedPassStatus("");
    setSelectedFeesPaid("");
    setSelectedInternship("");
    setSelectedPlacement("");
    setSearchQuery("");
    setGroupBy("");
    setSortBy("name");
    setSortOrder("asc");
    setSelectedTemplateId("");
    setAccessDeniedMessage(null);
  };

  // Export CSV Data
  const handleExportCSV = () => {
    try {
      const studentsList = reportData?.students || [];
      const escapeCSVValue = (val: any) => {
        if (val === undefined || val === null) return '""';
        let str = String(val);
        const trimmed = str.trim();
        if (trimmed.startsWith("=") || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("@")) {
          str = "'" + str;
        }
        return `"${str.replace(/"/g, '""')}"`;
      };

      const csvRows: string[] = [];
      const headers = ALL_FIELDS.filter(f => selectedFields.includes(f.key)).map(f => f.label);
      csvRows.push(headers.map(escapeCSVValue).join(","));

      studentsList.forEach((s: any) => {
        const row = ALL_FIELDS.filter(f => selectedFields.includes(f.key)).map(f => {
          let val = s[f.key];
          if (f.key === "dob" && val) val = new Date(val).toLocaleDateString();
          else if (f.key === "feesPaid") val = val ? "Paid" : "Unpaid";
          else if (f.key === "noDueStatus") val = val ? "No Dues" : "Dues";
          else if (f.key === "internshipCompleted") val = val ? "Completed" : "Not Completed";
          else if (f.key === "attendancePercentage") val = typeof val === "number" ? `${val}%` : "N/A";
          return val !== undefined && val !== null ? val : "N/A";
        });
        csvRows.push(row.map(escapeCSVValue).join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const filename = `sunstone-${activeCategory}-report-${new Date().toISOString().slice(0, 10)}.csv`;

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSV Report downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export CSV report");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSortClick = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-xs font-bold">
        <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
        Loading report filters setup...
      </div>
    );
  }

  const studentsList = reportData?.students || [];
  const groupedData = reportData?.groupedData || null;
  const pagination = reportData?.pagination || { currentPage: 1, totalPages: 1 };

  if (user?.role === "student") {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 text-xs font-bold"
      >
        {/* Upper Brand Capsule */}
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">My Academic & Standing Reports</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Export and compile your individual scholastic transcripts, attendance registers, and placement eligibility benchmarks.
            </p>
          </div>
        </div>

        {/* Student Reports Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Attendance Report Card */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <Percent className="w-8 h-8 text-primary" />
              <h3 className="text-sm font-bold uppercase text-foreground leading-tight">My Attendance Report</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                Generate a comprehensive summary of your subject-wise lecture attendance, compliance ratings, and absent logs.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    const res = await api.get("/attendance");
                    const csvRows = ["Date,Subject,Status,Remarks"];
                    res.data.forEach((att: any) => {
                      csvRows.push(`"${new Date(att.date).toLocaleDateString()}","${att.subject}","${att.status || 'N/A'}","${att.remarks || ''}"`);
                    });
                    const csvContent = "\uFEFF" + csvRows.join("\r\n");
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `my_attendance_report.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Attendance report downloaded successfully!");
                  } catch {
                    toast.error("Failed to generate attendance report");
                  }
                }}
                className="flex-1 bg-primary text-white hover:bg-primary/90 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 h-10 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>CSV Sheet</span>
              </button>
              
              <button 
                onClick={() => window.print()}
                className="bg-muted border hover:bg-muted/80 text-foreground px-4 rounded-xl font-bold transition-all h-10 flex items-center justify-center active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Performance Report Card */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h3 className="text-sm font-bold uppercase text-foreground leading-tight">My Academic Transcript</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                Export your current semester performance report containing CGPA, backlog counts, test markings, and term grades.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    const res = await api.get("/students/profile/me");
                    const csvRows = [
                      "Parameter,Scholastic Value",
                      `"Student Name","${res.data.user?.name || 'N/A'}"`,
                      `"Register Number","${res.data.rollNumber || 'N/A'}"`,
                      `"Course Program","${res.data.course || 'N/A'}"`,
                      `"Current Semester","${res.data.semester || 'N/A'}"`,
                      `"Cumulative GPA","${res.data.gpa || '0.0'}"`,
                      `"Active Backlog Count","${res.data.backlogCount || '0'}"`,
                      `"Internal Marks","${res.data.internalMarks || '0'}"`,
                      `"Semester Marks","${res.data.semesterMarks || '0'}"`,
                      `"Class Test Marks","${res.data.classTestMarks || '0'}"`,
                      `"Overall Rating","${res.data.overallPerformance || 'Average'}"`
                    ];
                    const csvContent = "\uFEFF" + csvRows.join("\r\n");
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `my_academic_transcript.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Academic transcript downloaded successfully!");
                  } catch {
                    toast.error("Failed to generate transcript");
                  }
                }}
                className="flex-1 bg-primary text-white hover:bg-primary/90 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 h-10 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>CSV Sheet</span>
              </button>
              
              <button 
                onClick={() => window.print()}
                className="bg-muted border hover:bg-muted/80 text-foreground px-4 rounded-xl font-bold transition-all h-10 flex items-center justify-center active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Placement Report Card */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <Briefcase className="w-8 h-8 text-primary" />
              <h3 className="text-sm font-bold uppercase text-foreground leading-tight">Placement Evaluation Report</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                Generate your placement eligibility summary showing readiness index, completed milestones, and missing metrics.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    const res = await api.get("/placement/eligible");
                    const p = res.data?.students?.[0] || {};
                    const csvRows = [
                      "Evaluation Parameter,Readiness Value",
                      `"Eligibility Status","${p.eligibility || 'Not Eligible'}"`,
                      `"Readiness Index Score","${p.readinessScore || '0'}"`,
                      `"Placement Category","${p.scoreCategory || 'High Risk'}"`,
                      `"Risk Status Check","${p.riskStatus || 'High Risk'}"`,
                      `"Internship Milestone","${p.internshipCompleted ? 'Completed' : 'In Progress'}"`,
                      `"Min GPA Criteria Met","${p.gpa >= res.data?.rule?.minCGPA ? 'Yes' : 'No'}"`,
                      `"Min Attendance Criteria Met","${p.attendancePercentage >= res.data?.rule?.minAttendance ? 'Yes' : 'No'}"`
                    ];
                    const csvContent = "\uFEFF" + csvRows.join("\r\n");
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `my_placement_readiness_summary.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Readiness report downloaded successfully!");
                  } catch {
                    toast.error("Failed to generate placement readiness report");
                  }
                }}
                className="flex-1 bg-primary text-white hover:bg-primary/90 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 h-10 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>CSV Sheet</span>
              </button>
              
              <button 
                onClick={() => window.print()}
                className="bg-muted border hover:bg-muted/80 text-foreground px-4 rounded-xl font-bold transition-all h-10 flex items-center justify-center active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 print:space-y-0"
    >
      {/* Upper Brand Capsule */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden print:border-none print:pb-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Academic & Roster Reports</h1>
          <p className="text-xs text-muted-foreground font-medium print:hidden">
            Filter, examine, aggregate, compare, and export complex student registers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-card border border-border text-foreground hover:bg-muted px-4 py-2.5 rounded-xl text-xs font-bold transition-all h-9 active:scale-95"
          >
            <Printer className="w-4 h-4 text-primary" />
            Print/PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-primary text-white hover:bg-primary/95 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all h-9 shadow-md shadow-primary/10 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* 6 Category Selection Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 print:hidden">
        {[
          { key: "personal", label: "Personal Info", icon: Users, desc: "Personal demographics ledger" },
          { key: "attendance", label: "Attendance", icon: Percent, desc: "Compliance records" },
          { key: "performance", label: "Performance", icon: GraduationCap, desc: "CGPA & Marks report" },
          { key: "placement", label: "Placement Eligibility", icon: Briefcase, desc: "Readiness scores & shortlists" },
          { key: "department", label: "Dept Summary", icon: Layers, desc: "Department comparison logs" },
          { key: "year", label: "Year Summary", icon: FileText, desc: "Academic term logs" }
        ].map(card => {
          const active = activeCategory === card.key;
          return (
            <button
              key={card.key}
              onClick={() => handleCategoryClick(card.key)}
              className={cn(
                "p-6 rounded-2xl border text-left flex flex-col justify-between h-32 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 border-[1px]",
                active
                  ? "bg-primary text-white border-primary border-[2px] shadow-lg shadow-primary/20 hover:bg-primary/90"
                  : "bg-card border-border hover:border-border/100 text-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-center mb-3">
                <card.icon className={cn("w-6 h-6", active ? "text-white" : "text-primary")} />
              </div>
              <div className="space-y-2 text-center">
                <span className="font-extrabold text-xs block leading-tight">{card.label}</span>
                <span className={cn("text-[9px] font-medium leading-none block mt-2", active ? "text-white/80" : "text-muted-foreground")}>
                  {card.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {accessDeniedMessage ? (
        <div className="bg-card border border-destructive/20 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6" /></div>
          <h2 className="text-sm font-bold text-foreground uppercase">Scope Limitations</h2>
          <p className="text-muted-foreground text-xs mt-2 max-w-sm font-medium">{accessDeniedMessage}</p>
          <button onClick={resetFilters} className="mt-4 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-bold border">Reset Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Filters Panel */}
          <div className="lg:col-span-1 space-y-6 print:hidden">
            <div className="bg-card p-5 rounded-2xl border border-border/60 flex flex-col gap-4 shadow-sm text-xs font-bold">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <h3 className="font-extrabold uppercase tracking-wider flex items-center gap-2 text-foreground">
                  <Filter className="w-4 h-4 text-primary" />
                  Roster Query
                </h3>
                <button onClick={resetFilters} className="text-[10px] text-muted-foreground hover:text-foreground font-bold uppercase underline">Clear</button>
              </div>

              {/* Template Preset Loader */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Load Preset Template</label>
                <div className="flex items-center gap-2">
                  <select 
                    className="flex-1 bg-card border border-border rounded-xl px-2.5 py-1.5 outline-none text-xs cursor-pointer h-9 w-full"
                    value={selectedTemplateId}
                    onChange={(e) => handleLoadTemplate(e.target.value)}
                  >
                    <option value="">-- Load Preset --</option>
                    {templates.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.reportType})</option>
                    ))}
                  </select>
                  {selectedTemplateId && (
                    <button 
                      onClick={() => handleDeleteTemplate(selectedTemplateId)}
                      className="p-2 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 h-9 w-9 flex items-center justify-center transition-colors"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters List */}
              <div className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Batch</label>
                  <select className="bg-card border rounded-xl px-2.5 py-1.5 outline-none cursor-pointer h-9 w-full" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                    <option value="">All Batches</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Course Program</label>
                  <select className="bg-card border rounded-xl px-2.5 py-1.5 outline-none cursor-pointer h-9 w-full" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                    <option value="">All Courses</option>
                    <option value="BCA">BCA</option>
                    <option value="MBA">MBA</option>
                    <option value="BBA">BBA</option>
                    <option value="B.Tech">B.Tech</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Semester</label>
                  <select className="bg-card border rounded-xl px-2.5 py-1.5 outline-none cursor-pointer h-9 w-full" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                    <option value="">All Semesters</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>Semester {s}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Year</label>
                  <select className="bg-card border rounded-xl px-2.5 py-1.5 outline-none cursor-pointer h-9 w-full" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                    <option value="">All Years</option>
                    {[1,2,3,4].map(y => <option key={y} value={y.toString()}>Year {y}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Section</label>
                  <select className="bg-card border rounded-xl px-2.5 py-1.5 outline-none cursor-pointer h-9 w-full" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                    <option value="">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Department</label>
                  <select className="bg-card border rounded-xl px-2.5 py-1.5 outline-none cursor-pointer h-9 w-full" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    <option value="">All Departments</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Internship Status</label>
                  <select className="bg-card border rounded-xl px-2.5 py-1.5 outline-none cursor-pointer h-9 w-full" value={selectedInternship} onChange={e => setSelectedInternship(e.target.value)}>
                    <option value="">All Accounts</option>
                    <option value="true">Completed</option>
                    <option value="false">Not Completed</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Placement Eligibility</label>
                  <select className="bg-card border rounded-xl px-2.5 py-1.5 outline-none cursor-pointer h-9 w-full" value={selectedPlacement} onChange={e => setSelectedPlacement(e.target.value)}>
                    <option value="">All</option>
                    <option value="Eligible">Eligible</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                    <option value="Not Eligible">Not Eligible</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={generateReport}
                disabled={generating}
                className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl text-xs font-bold transition-all mt-2 flex items-center justify-center gap-1.5 disabled:opacity-75 h-10 shadow-sm active:scale-95"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Run Query</span>
                  </>
                )}
              </button>
            </div>

            {/* Template Saver */}
            <div className="bg-card p-5 rounded-2xl border border-border/60 flex flex-col gap-3 shadow-sm text-xs font-bold">
              <h3 className="font-extrabold uppercase tracking-wider flex items-center gap-2 text-foreground">
                <Save className="w-4 h-4 text-primary" />
                Save Report Preset
              </h3>
              <div className="space-y-2">
                <input 
                  type="text"
                  placeholder="Preset name (e.g. BCA Placement Ready)..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
                <button 
                  onClick={handleSaveTemplate}
                  className="w-full bg-muted border hover:bg-muted/80 text-foreground py-2 rounded-xl text-xs font-bold transition-all h-9 active:scale-95"
                >
                  Save Preset
                </button>
              </div>
            </div>
          </div>

          {/* Right Data Grid & Custom Builder Preview */}
          <div className="lg:col-span-3 space-y-6">
            {/* Custom Report Builder Column Selection Panel */}
            <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm print:hidden">
              <h3 className="font-extrabold text-xs uppercase tracking-wider mb-4 text-foreground flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-primary" />
                Drag-and-Drop Column Report Builder
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ALL_FIELDS.map(f => {
                  const active = selectedFields.includes(f.key);
                  return (
                    <button
                      key={f.key}
                      onClick={() => toggleField(f.key)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all",
                        active
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-background/40 border-border hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <div className={cn("w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0", active ? "bg-primary border-primary text-white" : "border-muted-foreground bg-card")}>
                        {active && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                      </div>
                      <span className="truncate">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compiled Data Table Preview */}
            <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input 
                    type="text"
                    placeholder="Search name or roll register number..."
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generateReport()}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-muted-foreground font-semibold">Group by:</span>
                  <select
                    className="bg-card border border-border rounded-xl px-2.5 py-1.5 outline-none h-9 cursor-pointer"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                  >
                    <option value="">No Grouping</option>
                    <option value="batch">Batch</option>
                    <option value="course">Course</option>
                    <option value="semester">Semester</option>
                    <option value="year">Year</option>
                    <option value="section">Section</option>
                  </select>
                </div>
              </div>

              {/* Grid content */}
              <div className="overflow-x-auto min-h-[300px]">
                {generating ? (
                  <div className="flex flex-col items-center justify-center h-60 text-xs text-muted-foreground gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                    <span className="font-semibold">Compiling report rows...</span>
                  </div>
                ) : groupBy && groupedData ? (
                  // Grouped Records rendering
                  <div className="divide-y divide-border/40">
                    {groupedData.length === 0 ? (
                      <div className="py-20 text-center text-muted-foreground text-xs font-semibold">No records found matching query filters.</div>
                    ) : (
                      groupedData.map((group: any) => (
                        <div key={group.groupKey} className="p-4 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between bg-muted/40 p-3 rounded-xl border border-border/45 gap-2.5 font-bold text-xs">
                            <span className="text-foreground uppercase tracking-wide">Cohort Group: {group.groupKey}</span>
                            <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground uppercase tracking-wider">
                              <span>Total: <strong>{group.totalStudents}</strong></span>
                              <span>Passed: <strong className="text-success">{group.passedStudents}</strong></span>
                              <span>Avg CGPA: <strong>{group.avgGPA}</strong></span>
                              <span>Avg Attendance: <strong>{group.avgAttendance}%</strong></span>
                            </div>
                          </div>

                          <table className="w-full text-left text-xs divide-y divide-border/30">
                            <thead>
                              <tr className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/10">
                                {ALL_FIELDS.filter(f => selectedFields.includes(f.key)).map(f => (
                                  <th key={f.key} className="py-2 px-3">{f.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20 font-semibold text-foreground">
                              {group.students.map((s: any) => (
                                <tr key={s._id} className="hover:bg-muted/10 transition-colors">
                                  {ALL_FIELDS.filter(f => selectedFields.includes(f.key)).map(f => {
                                    let val = s[f.key];
                                    if (f.key === "dob" && val) val = new Date(val).toLocaleDateString();
                                    
                                    if (f.key === "feesPaid") {
                                      return (
                                        <td key={f.key} className="py-2 px-3">
                                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", val ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
                                            {val ? "Paid" : "Unpaid"}
                                          </span>
                                        </td>
                                      );
                                    }
                                    if (f.key === "eligibility") {
                                      return (
                                        <td key={f.key} className="py-2 px-3">
                                          <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase border",
                                            val === 'Eligible' ? "bg-success/15 text-success border-success/35" :
                                            val === 'Needs Improvement' ? "bg-warning/15 text-warning border-warning/35" :
                                            "bg-destructive/15 text-destructive border-destructive/35"
                                          )}>
                                            {val}
                                          </span>
                                        </td>
                                      );
                                    }
                                    if (f.key === "attendancePercentage") {
                                      return (
                                        <td key={f.key} className={cn("py-2 px-3 font-black", val >= 75 ? "text-success" : "text-destructive")}>
                                          {val}%
                                        </td>
                                      );
                                    }
                                    return (
                                      <td key={f.key} className="py-2 px-3 text-muted-foreground">{val !== undefined && val !== null ? val : 'N/A'}</td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Flat Table list rendering
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 font-bold text-muted-foreground uppercase text-[10px] tracking-wide select-none">
                        {ALL_FIELDS.filter(f => selectedFields.includes(f.key)).map(f => (
                          <th 
                            key={f.key}
                            className="py-3 px-4 cursor-pointer hover:bg-muted/60"
                            onClick={() => handleSortClick(f.key)}
                          >
                            {f.label} {sortBy === f.key && (sortOrder === "asc" ? "↑" : "↓")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-semibold text-foreground">
                      {studentsList.length === 0 ? (
                        <tr>
                          <td colSpan={selectedFields.length} className="text-center py-20 text-muted-foreground text-xs font-semibold">
                            No records found matching current query filters.
                          </td>
                        </tr>
                      ) : (
                        studentsList.map((s: any) => (
                          <tr key={s._id} className="hover:bg-muted/20 transition-colors">
                            {ALL_FIELDS.filter(f => selectedFields.includes(f.key)).map(f => {
                              let val = s[f.key];
                              if (f.key === "dob" && val) val = new Date(val).toLocaleDateString();
                              
                              if (f.key === "feesPaid") {
                                return (
                                  <td key={f.key} className="py-3 px-4">
                                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", val ? "bg-success/15 text-success border-success/20" : "bg-destructive/15 text-destructive border-destructive/20")}>
                                      {val ? "Paid" : "Unpaid"}
                                    </span>
                                  </td>
                                );
                              }
                              if (f.key === "eligibility") {
                                return (
                                  <td key={f.key} className="py-3 px-4">
                                    <span className={cn(
                                      "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border",
                                      val === 'Eligible' ? "bg-success/15 text-success border-success/35" :
                                      val === 'Needs Improvement' ? "bg-warning/15 text-warning border-warning/35" :
                                      "bg-destructive/15 text-destructive border-destructive/35"
                                    )}>
                                      {val}
                                    </span>
                                  </td>
                                );
                              }
                              if (f.key === "attendancePercentage") {
                                return (
                                  <td key={f.key} className={cn("py-3 px-4 font-black text-sm", val >= 75 ? "text-success" : "text-destructive")}>
                                    {val}%
                                  </td>
                                );
                              }
                              return (
                                <td key={f.key} className="py-3 px-4 text-muted-foreground font-semibold">{val !== undefined && val !== null ? val : 'N/A'}</td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table pagination */}
              {!groupBy && pagination.totalPages > 1 && (
                <div className="p-4 border-t border-border/40 flex items-center justify-between print:hidden bg-muted/20 font-bold">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={pagination.currentPage === 1}
                      className="p-1.5 border rounded-xl bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="p-1.5 border rounded-xl bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Reports;
