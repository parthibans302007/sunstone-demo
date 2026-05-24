import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  FileText, Download, Search, Filter, Save, Trash2, 
  ChevronLeft, ChevronRight, AlertTriangle, ShieldAlert, 
  Printer, Check, ListFilter, Users, Award, Percent, DollarSign,
  Briefcase, GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONAL_FIELDS = [
  { label: "Community / Caste", key: "community" },
  { label: "Blood Group", key: "bloodGroup" },
  { label: "Date of Birth", key: "dob" },
  { label: "GPA / CGPA", key: "gpa" },
  { label: "Fees Paid / Unpaid", key: "feesPaid" },
  { label: "No Due Status", key: "noDueStatus" },
  { label: "Internal Marks", key: "internalMarks" },
  { label: "Semester Marks", key: "semesterMarks" },
  { label: "Internship Status", key: "internshipCompleted" },
  { label: "Class Test Marks", key: "classTestMarks" },
  { label: "Attendance Percentage", key: "attendancePercentage" },
  { label: "Overall Performance", key: "overallPerformance" },
  { label: "Backlog Count", key: "backlogCount" },
  { label: "Email", key: "email" },
  { label: "Phone Number", key: "contactNumber" },
  { label: "Gender", key: "gender" }
];

const Reports = () => {
  const { user } = useAuth();
  
  // State for reports data
  const [reportData, setReportData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Filters State
  const [reportType, setReportType] = useState<string>("batch");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedPassStatus, setSelectedPassStatus] = useState<string>("");
  const [selectedFeesPaid, setSelectedFeesPaid] = useState<string>("");
  const [selectedInternship, setSelectedInternship] = useState<string>("");
  const [selectedIsActive, setSelectedIsActive] = useState<string>("");

  // Grid/Search/Sorting States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  // Selected Checkboxes
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "gpa", "feesPaid", "attendancePercentage", "overallPerformance"
  ]);

  // Presets State
  const [newTemplateName, setNewTemplateName] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Compare mode State
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareType, setCompareType] = useState<"batch" | "semester">("batch");
  const [compareVal1, setCompareVal1] = useState<string>("");
  const [compareVal2, setCompareVal2] = useState<string>("");
  const [compareData1, setCompareData1] = useState<any>(null);
  const [compareData2, setCompareData2] = useState<any>(null);

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
  const generateReport = useCallback(async (isCompareCall = false, compVal?: string) => {
    if (!isCompareCall) {
      setGenerating(true);
      setAccessDeniedMessage(null);
    }

    try {
      // Build filters object
      const params: any = {
        reportType,
        sortBy,
        sortOrder,
        groupBy,
        page: currentPage,
        limit,
        search: searchQuery
      };

      // Add selected filters
      if (isCompareCall && compVal) {
        if (compareType === "batch") params.batch = compVal;
        if (compareType === "semester") params.semester = compVal;
      } else {
        if (selectedBatch) params.batch = selectedBatch;
        if (selectedCourse) params.course = selectedCourse;
        if (selectedSemester) params.semester = selectedSemester;
        if (selectedYear) params.year = selectedYear;
        if (selectedSection) params.section = selectedSection;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedAcademicYear) params.academicYear = selectedAcademicYear;
        if (selectedPassStatus) params.passStatus = selectedPassStatus;
        if (selectedFeesPaid) params.feesPaid = selectedFeesPaid;
        if (selectedInternship) params.internshipCompleted = selectedInternship;
        if (selectedIsActive) params.isActive = selectedIsActive;
      }

      const { data } = await api.get("/reports", { params });
      
      if (isCompareCall) {
        return data;
      } else {
        setReportData(data);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setAccessDeniedMessage(err.response?.data?.message || "Access Denied: Restricted record access");
      } else {
        toast.error("Failed to generate report");
      }
      if (!isCompareCall) setReportData(null);
    } finally {
      if (!isCompareCall) setGenerating(false);
    }
  }, [
    reportType, selectedBatch, selectedCourse, selectedSemester, selectedYear,
    selectedSection, selectedCategory, selectedAcademicYear, selectedPassStatus,
    selectedFeesPaid, selectedInternship, selectedIsActive, sortBy, sortOrder,
    groupBy, currentPage, limit, searchQuery, compareType
  ]);

  // Load setup data
  useEffect(() => {
    setLoading(true);
    fetchSetup().finally(() => setLoading(false));
  }, [fetchSetup]);

  // Trigger report fetch when page, query, sort changes
  useEffect(() => {
    if (!isCompareMode) {
      generateReport();
    }
  }, [currentPage, sortBy, sortOrder, groupBy, isCompareMode]);

  // Compare mode handler
  const handleCompare = async () => {
    if (!compareVal1 || !compareVal2) {
      toast.error("Please choose both fields to compare");
      return;
    }
    setGenerating(true);
    try {
      const [res1, res2] = await Promise.all([
        generateReport(true, compareVal1),
        generateReport(true, compareVal2)
      ]);
      setCompareData1(res1);
      setCompareData2(res2);
      toast.success("Comparison reports generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to run comparison");
    } finally {
      setGenerating(false);
    }
  };

  // Presets saving/loading
  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    try {
      const templatePayload = {
        name: newTemplateName,
        reportType,
        filters: {
          batch: selectedBatch,
          course: selectedCourse,
          semester: selectedSemester,
          year: selectedYear,
          section: selectedSection,
          category: selectedCategory,
          academicYear: selectedAcademicYear,
          passStatus: selectedPassStatus,
          feesPaid: selectedFeesPaid,
          internshipCompleted: selectedInternship,
          isActive: selectedIsActive
        },
        selectedFields,
        sortBy,
        sortOrder,
        groupBy
      };
      await api.post("/reports/templates", templatePayload);
      toast.success("Preset saved successfully!");
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
      setReportType(temp.reportType || "batch");
      const f = temp.filters || {};
      setSelectedBatch(f.batch || "");
      setSelectedCourse(f.course || "");
      setSelectedSemester(f.semester || "");
      setSelectedYear(f.year || "");
      setSelectedSection(f.section || "");
      setSelectedCategory(f.category || "");
      setSelectedAcademicYear(f.academicYear || "");
      setSelectedPassStatus(f.passStatus || "");
      setSelectedFeesPaid(f.feesPaid || "");
      setSelectedInternship(f.internshipCompleted || "");
      setSelectedIsActive(f.isActive || "");
      
      if (temp.selectedFields) setSelectedFields(temp.selectedFields);
      if (temp.sortBy) setSortBy(temp.sortBy);
      if (temp.sortOrder) setSortOrder(temp.sortOrder);
      if (temp.groupBy) setGroupBy(temp.groupBy);

      toast.success(`Preset "${temp.name}" loaded!`);
    }
  };

  const handleDeleteTemplate = async (tId: string) => {
    try {
      await api.delete(`/reports/templates/${tId}`);
      toast.success("Preset deleted successfully");
      if (selectedTemplateId === tId) {
        setSelectedTemplateId("");
      }
      fetchSetup();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete preset template");
    }
  };

  // Toggle optional fields checkboxes
  const toggleField = (fieldKey: string) => {
    if (selectedFields.includes(fieldKey)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldKey));
    } else {
      setSelectedFields([...selectedFields, fieldKey]);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedBatch("");
    setSelectedCourse("");
    setSelectedSemester("");
    setSelectedYear("");
    setSelectedSection("");
    setSelectedCategory("");
    setSelectedAcademicYear("");
    setSelectedPassStatus("");
    setSelectedFeesPaid("");
    setSelectedInternship("");
    setSelectedIsActive("");
    setSearchQuery("");
    setGroupBy("");
    setSortBy("name");
    setSortOrder("asc");
    setSelectedTemplateId("");
    setAccessDeniedMessage(null);
  };

  // Exporters
  const handleExportCSV = () => {
    try {
      const studentsList = reportData?.students || [];

      const escapeCSVValue = (val: any) => {
        if (val === undefined || val === null) return '""';
        let str = String(val);
        const trimmed = str.trim();
        // Prevent CSV Injection: prefix with single quote if it starts with =, +, -, @
        if (trimmed.startsWith("=") || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("@")) {
          str = "'" + str;
        }
        return `"${str.replace(/"/g, '""')}"`;
      };

      const sanitizeFilenamePart = (part: string) => {
        if (!part) return "";
        return part
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, "-") // replace any non-alphanumeric character with a hyphen
          .replace(/-+/g, "-")        // collapse multiple consecutive hyphens
          .replace(/^-|-$/g, "");     // trim leading/trailing hyphens
      };

      // Applied filters summary
      const activeFilters: string[] = [];
      if (selectedBatch) activeFilters.push(`Batch: ${selectedBatch}`);
      if (selectedCourse) activeFilters.push(`Course: ${selectedCourse}`);
      if (selectedSemester) activeFilters.push(`Semester: ${selectedSemester}`);
      if (selectedYear) activeFilters.push(`Year: ${selectedYear}`);
      if (selectedSection) activeFilters.push(`Section: ${selectedSection}`);
      if (selectedCategory) {
        const catName = categories.find(c => c._id === selectedCategory)?.name || selectedCategory;
        activeFilters.push(`Department: ${catName}`);
      }
      if (selectedAcademicYear) activeFilters.push(`Academic Year: ${selectedAcademicYear}`);
      if (selectedPassStatus) activeFilters.push(`Pass Status: ${selectedPassStatus}`);
      if (selectedFeesPaid) activeFilters.push(`Fees: ${selectedFeesPaid === "true" ? "Paid" : "Unpaid"}`);
      if (selectedInternship) activeFilters.push(`Internship: ${selectedInternship === "true" ? "Completed" : "Not Completed"}`);
      if (selectedIsActive) activeFilters.push(`Status: ${selectedIsActive === "true" ? "Active" : "Inactive"}`);
      if (searchQuery) activeFilters.push(`Search: "${searchQuery}"`);

      const filtersSummary = activeFilters.length > 0 ? activeFilters.join(" | ") : "None";
      const isEmpty = studentsList.length === 0;

      // Build metadata rows
      const metaRows = [
        ["Report Title", "Sunstone Management System Attendance & Performance Report"],
        ["Report Type", reportType ? reportType.toUpperCase() : "N/A"],
        ["Course Filter", selectedCourse ? selectedCourse : "All Courses"],
        ["Semester Filter", selectedSemester ? `Semester ${selectedSemester}` : "All Semesters"],
        ["Year Filter", selectedYear ? `Year ${selectedYear}` : "All Years"],
        ["Batch Filter", selectedBatch ? selectedBatch : "All Batches"],
        ["Academic Year", selectedAcademicYear ? selectedAcademicYear : "All Academic Years"],
        ["Applied Filters Summary", filtersSummary],
        ["Total Optional Fields Exported", selectedFields.length.toString()],
        ["Generated Record Count", studentsList.length.toString()],
        ["Data Empty State", isEmpty ? "Yes (0 records found matching filters)" : "No"],
        ["Exported At", new Date().toLocaleString()],
        ["Export Timezone", Intl.DateTimeFormat().resolvedOptions().timeZone],
        ["Exported By", `${user?.name || "Unknown"}`],
        ["User Role", user?.role ? user.role.toUpperCase() : "N/A"],
        [] // Blank line
      ];

      const csvRows: string[] = [];

      // Add metadata rows
      const metaRowsCount = metaRows.length;
      for (let i = 0; i < metaRowsCount; i++) {
        csvRows.push(metaRows[i].map(escapeCSVValue).join(","));
      }

      // Add headers
      const headers = ["Student Name", "Register Number"];
      const activeFields: string[] = [];
      const optionalFieldsLen = OPTIONAL_FIELDS.length;
      for (let i = 0; i < optionalFieldsLen; i++) {
        const f = OPTIONAL_FIELDS[i];
        if (selectedFields.includes(f.key)) {
          headers.push(f.label);
          activeFields.push(f.key);
        }
      }
      csvRows.push(headers.map(escapeCSVValue).join(","));

      // Add student rows - optimized loop for large datasets (e.g. 10k+ rows)
      const studentCount = studentsList.length;
      if (studentCount === 0) {
        const emptyRow = ["No records found matching current filters.", "N/A"];
        const activeFieldsLen = activeFields.length;
        for (let j = 0; j < activeFieldsLen; j++) {
          emptyRow.push("N/A");
        }
        csvRows.push(emptyRow.map(escapeCSVValue).join(","));
      } else {
        const activeFieldsLen = activeFields.length;
        for (let i = 0; i < studentCount; i++) {
          const s = studentsList[i];
          const row = [s.name, s.rollNumber];
          for (let j = 0; j < activeFieldsLen; j++) {
            const key = activeFields[j];
            let val = s[key];
            if (key === "dob" && val) val = new Date(val).toLocaleDateString();
            else if (key === "feesPaid") val = val ? "Paid" : "Unpaid";
            else if (key === "noDueStatus") val = val ? "No Dues" : "Pending Dues";
            else if (key === "internshipCompleted") val = val ? "Completed" : "Not Completed";
            else if (key === "attendancePercentage") {
              val = typeof val === "number" ? `${val}%` : "N/A";
            }
            row.push(val !== undefined && val !== null ? val : "N/A");
          }
          csvRows.push(row.map(escapeCSVValue).join(","));
        }
      }

      // Create CSV content with UTF-8 BOM (\uFEFF) to make Excel parse UTF-8 characters correctly
      const csvContent = "\uFEFF" + csvRows.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Compute filename: sunstone-management-system-{reportType}-{course}-{batch}-{semester}-{year}-{date}.csv
      const rTypePart = sanitizeFilenamePart(reportType || "report");
      const coursePart = sanitizeFilenamePart(selectedCourse || "all-courses");
      const batchPart = selectedBatch ? sanitizeFilenamePart(`batch-${selectedBatch}`) : "all-batches";
      const semPart = selectedSemester ? sanitizeFilenamePart(`sem-${selectedSemester}`) : "all-sem";
      const yearPart = selectedYear ? sanitizeFilenamePart(`year-${selectedYear}`) : "all-years";
      const datePart = new Date().toISOString().slice(0, 10);
      const filename = `sunstone-management-system-${rTypePart}-${coursePart}-${batchPart}-${semPart}-${yearPart}-${datePart}.csv`;

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke with a timeout to avoid browser race conditions
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      toast.success("CSV Report downloaded successfully!");
    } catch (error) {
      console.error("Detailed CSV export failure:", error);
      toast.error("Failed to export report");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Sorting helper
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
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground">
        Loading report configuration...
      </div>
    );
  }

  const summary = reportData?.summary || {
    totalStudents: 0, passedStudents: 0, failedStudents: 0,
    avgGPA: 0, avgAttendance: 0, feesPendingCount: 0,
    noDueCount: 0, internshipCompletedCount: 0,
    topPerformers: [], studentsNeedingAttention: []
  };

  const studentsList = reportData?.students || [];
  const groupedData = reportData?.groupedData || null;
  const pagination = reportData?.pagination || { currentPage: 1, totalPages: 1 };

  return (
    <>
      {/* Printable Area Wrapper */}
      <div className="print-report-root flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5 relative overflow-hidden print:border-none print:pb-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sunstone Management System</h1>
            <p className="text-sm text-muted-foreground mt-1 print:hidden">
              Generate, filter, compare, and export custom academic and financial reports.
            </p>
            <div className="hidden print:block text-xs text-muted-foreground mt-1">
              Generated on {new Date().toLocaleString()} by {user?.name} ({user?.role})
            </div>
          </div>
          <div className="flex gap-2.5 print:hidden">
            <button 
              onClick={() => setIsCompareMode(!isCompareMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                isCompareMode 
                  ? "bg-accent/20 border-accent text-accent" 
                  : "bg-card border-border hover:bg-muted"
              )}
            >
              <ListFilter className="w-4 h-4" />
              {isCompareMode ? "Standard Mode" : "Comparison Mode"}
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-card border border-border text-foreground hover:bg-muted px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              Excel / CSV
            </button>
          </div>
        </div>

        {/* Access Denied Shield Page */}
        {accessDeniedMessage ? (
          <div className="glass border-destructive/30 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[450px]">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Access Denied</h2>
            <p className="text-muted-foreground max-w-md mx-auto mt-2.5 mb-6 text-sm">
              {accessDeniedMessage}
            </p>
            <button 
              onClick={resetFilters}
              className="px-5 py-2.5 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold transition-colors"
            >
              Reset Filters to My Scope
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar Filter Panel */}
            <div className="lg:col-span-1 space-y-6 print:hidden">
              <div className="glass p-5 rounded-2xl border border-border/50 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                    <Filter className="w-4 h-4 text-primary" />
                    Report Filters
                  </h3>
                  <button 
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-2"
                  >
                    Clear All
                  </button>
                </div>

                {/* Saved Presets */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saved Templates</label>
                  <div className="flex items-center gap-2">
                    <select 
                      className="flex-1 bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary w-full h-8"
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
                        className="p-1.5 rounded-lg border bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 h-8 w-8 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Report Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Report Type</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="batch">Batch-wise Report</option>
                    <option value="course">Course-wise Report</option>
                    <option value="semester">Semester-wise Report</option>
                    <option value="year">Year-wise Report</option>
                    <option value="section">Section-wise Report</option>
                    <option value="overallPerformance">Overall Performance</option>
                    <option value="topPerformers">Top Performers</option>
                    <option value="atRiskStudents">At-Risk Students</option>
                  </select>
                </div>

                {/* Batch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Batch</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                  >
                    <option value="">All Batches</option>
                    <option value="2023">2023 Batch</option>
                    <option value="2024">2024 Batch</option>
                    <option value="2025">2025 Batch</option>
                    <option value="2026">2026 Batch</option>
                  </select>
                </div>

                {/* Course */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="">All Courses</option>
                    <option value="BCA">BCA</option>
                    <option value="MBA">MBA</option>
                    <option value="BBA">BBA</option>
                    <option value="B.Tech">B.Tech</option>
                  </select>
                </div>

                {/* Semester */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Semester</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s.toString()}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Year</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="">All Years</option>
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y.toString()}>Year {y}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Section / Division</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    <option value="">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                {/* Department / Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Department</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {categories.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Academic Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Academic Year</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  >
                    <option value="">All Years</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>

                {/* Pass Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pass / Fail</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedPassStatus}
                    onChange={(e) => setSelectedPassStatus(e.target.value)}
                  >
                    <option value="">All Students</option>
                    <option value="pass">Passed</option>
                    <option value="fail">Failed / Low GPA</option>
                  </select>
                </div>

                {/* Fees Paid */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fees Status</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedFeesPaid}
                    onChange={(e) => setSelectedFeesPaid(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="true">Fees Paid</option>
                    <option value="false">Fees Unpaid</option>
                  </select>
                </div>

                {/* Internship Completed */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Internship</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedInternship}
                    onChange={(e) => setSelectedInternship(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="true">Completed</option>
                    <option value="false">Not Completed</option>
                  </select>
                </div>

                {/* Active Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Status</label>
                  <select 
                    className="w-full bg-background/50 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                    value={selectedIsActive}
                    onChange={(e) => setSelectedIsActive(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                  </select>
                </div>

                <button 
                  onClick={() => generateReport()}
                  disabled={generating}
                  className="w-full bg-accent hover:bg-accent/95 text-white py-2 rounded-xl text-sm font-semibold transition-all mt-2 flex items-center justify-center gap-1.5 disabled:opacity-75"
                >
                  <Check className="w-4 h-4" />
                  {generating ? "Loading..." : "Generate Report"}
                </button>
              </div>

              {/* Save preset panel */}
              <div className="glass p-5 rounded-2xl border border-border/50 flex flex-col gap-3">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <Save className="w-4 h-4 text-primary" />
                  Save Report Preset
                </h3>
                <div className="space-y-2">
                  <input 
                    type="text"
                    placeholder="Enter template name..."
                    className="w-full bg-background/50 border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                  />
                  <button 
                    onClick={handleSaveTemplate}
                    className="w-full bg-muted border hover:bg-muted/80 text-foreground py-1.5 rounded-lg text-xs font-semibold transition-all"
                  >
                    Save As Template
                  </button>
                </div>
              </div>
            </div>

            {/* Right Report Preview & Analytics Area */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-4 rounded-xl border border-border/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Total Students</span>
                    <span className="text-xl font-bold tracking-tight">{summary.totalStudents}</span>
                  </div>
                </div>

                <div className="glass p-4 rounded-xl border border-border/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success border border-success/20 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Passed (GPA 5+)</span>
                    <span className="text-xl font-bold tracking-tight text-success">{summary.passedStudents}</span>
                  </div>
                </div>

                <div className="glass p-4 rounded-xl border border-border/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ff6b00]/10 flex items-center justify-center text-[#ff6b00] border border-[#ff6b00]/20 shrink-0">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Avg Attendance</span>
                    <span className="text-xl font-bold tracking-tight text-[#ff6b00]">{summary.avgAttendance}%</span>
                  </div>
                </div>

                <div className="glass p-4 rounded-xl border border-border/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Average GPA</span>
                    <span className="text-xl font-bold tracking-tight text-accent">{summary.avgGPA}</span>
                  </div>
                </div>
              </div>

              {/* Sub Analytics: Fees, Internships & Risk details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fees Outstanding</span>
                    <DollarSign className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-destructive">{summary.feesPendingCount}</span>
                    <span className="text-xs text-muted-foreground block mt-0.5">Students have pending fees</span>
                  </div>
                </div>

                <div className="glass-card p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Internships Completed</span>
                    <Briefcase className="w-4 h-4 text-success" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-success">{summary.internshipCompletedCount}</span>
                    <span className="text-xs text-muted-foreground block mt-0.5">Students ready for placement</span>
                  </div>
                </div>

                <div className="glass-card p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attention Required</span>
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-warning">
                      {summary.studentsNeedingAttention?.length || 0}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">Below 75% attendance / backlog dues</span>
                  </div>
                </div>
              </div>

              {/* Checkbox Optional Columns Toggler */}
              <div className="glass p-5 rounded-2xl border border-border/50 print:hidden">
                <h3 className="font-semibold text-sm mb-3 text-foreground flex items-center gap-2">
                  <ListFilter className="w-4.5 h-4.5 text-accent" />
                  Optional Fields (Toggle Report Columns)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {OPTIONAL_FIELDS.map(f => {
                    const active = selectedFields.includes(f.key);
                    return (
                      <button
                        key={f.key}
                        onClick={() => toggleField(f.key)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium text-left transition-colors",
                          active
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background/40 border-border hover:bg-muted text-muted-foreground"
                        )}
                      >
                        <div className={cn("w-3 h-3 rounded flex items-center justify-center border", active ? "bg-primary border-primary text-white" : "border-muted-foreground")}>
                          {active && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                        </div>
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comparison Section (Rendered when Comparison Mode active) */}
              {isCompareMode && (
                <div className="glass p-5 rounded-2xl border border-border/50 print:hidden space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">Compare Batches or Semesters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Compare by</label>
                      <select 
                        className="w-full bg-background border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                        value={compareType}
                        onChange={(e) => { setCompareType(e.target.value as "batch" | "semester"); setCompareVal1(""); setCompareVal2(""); }}
                      >
                        <option value="batch">Batch</option>
                        <option value="semester">Semester</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Value 1</label>
                      <input 
                        type="text"
                        placeholder={compareType === "batch" ? "e.g. 2023" : "e.g. 5"}
                        className="w-full bg-background border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                        value={compareVal1}
                        onChange={(e) => setCompareVal1(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Value 2</label>
                      <input 
                        type="text"
                        placeholder={compareType === "batch" ? "e.g. 2024" : "e.g. 3"}
                        className="w-full bg-background border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                        value={compareVal2}
                        onChange={(e) => setCompareVal2(e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={handleCompare}
                      className="bg-accent hover:bg-accent/90 text-white py-1.5 px-4 rounded-lg text-xs font-semibold h-8"
                    >
                      Compare
                    </button>
                  </div>

                  {/* Render Side-By-Side Comparison */}
                  {(compareData1 || compareData2) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {compareData1 && (
                        <div className="glass p-4 rounded-xl border border-border/40">
                          <h4 className="font-bold text-xs text-primary mb-2 uppercase tracking-wide">{compareType}: {compareVal1}</h4>
                          <ul className="space-y-1 text-xs">
                            <li className="flex justify-between"><span>Total Students:</span> <strong>{compareData1.summary.totalStudents}</strong></li>
                            <li className="flex justify-between"><span>Avg Attendance:</span> <strong>{compareData1.summary.avgAttendance}%</strong></li>
                            <li className="flex justify-between"><span>Avg GPA:</span> <strong>{compareData1.summary.avgGPA}</strong></li>
                            <li className="flex justify-between"><span>Passed Rate:</span> <strong>{Math.round((compareData1.summary.passedStudents / (compareData1.summary.totalStudents || 1)) * 100)}%</strong></li>
                          </ul>
                        </div>
                      )}
                      {compareData2 && (
                        <div className="glass p-4 rounded-xl border border-border/40">
                          <h4 className="font-bold text-xs text-primary mb-2 uppercase tracking-wide">{compareType}: {compareVal2}</h4>
                          <ul className="space-y-1 text-xs">
                            <li className="flex justify-between"><span>Total Students:</span> <strong>{compareData2.summary.totalStudents}</strong></li>
                            <li className="flex justify-between"><span>Avg Attendance:</span> <strong>{compareData2.summary.avgAttendance}%</strong></li>
                            <li className="flex justify-between"><span>Avg GPA:</span> <strong>{compareData2.summary.avgGPA}</strong></li>
                            <li className="flex justify-between"><span>Passed Rate:</span> <strong>{Math.round((compareData2.summary.passedStudents / (compareData2.summary.totalStudents || 1)) * 100)}%</strong></li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Main Report Preview Table */}
              <div className="glass rounded-2xl border border-border/50 shadow-md relative overflow-hidden bg-card">
                
                {/* Search & Sort Panel */}
                <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="Search name or roll number..."
                      className="w-full bg-background/50 border rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary h-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && generateReport()}
                    />
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    {/* Group By selector */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground font-medium">Group by:</span>
                      <select
                        className="bg-background border rounded-lg px-2 py-1 text-xs outline-none h-8 cursor-pointer"
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
                </div>

                {/* Table Data Layout */}
                <div className="overflow-x-auto min-h-[300px]">
                  {generating ? (
                    <div className="flex items-center justify-center h-60 text-xs text-muted-foreground">
                      Generating report, please wait...
                    </div>
                  ) : groupBy && groupedData ? (
                    // GROUPED RENDER MODE
                    <div className="divide-y divide-border/30">
                      {groupedData.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground text-xs">No records matching filters</div>
                      ) : (
                        groupedData.map((group: any) => (
                          <div key={group.groupKey} className="p-4 space-y-3">
                            {/* Group Header Card */}
                            <div className="flex flex-col sm:flex-row justify-between bg-muted/30 p-3 rounded-lg border border-border/30 gap-2">
                              <span className="font-bold text-xs text-foreground uppercase tracking-wide">
                                Group: {group.groupKey}
                              </span>
                              <div className="flex gap-4 text-[11px] font-semibold text-muted-foreground">
                                <span>Headcount: <strong>{group.totalStudents}</strong></span>
                                <span>Passed: <strong className="text-success">{group.passedStudents}</strong></span>
                                <span>Failed: <strong className="text-destructive">{group.failedStudents}</strong></span>
                                <span>Avg GPA: <strong>{group.avgGPA}</strong></span>
                                <span>Avg Attendance: <strong>{group.avgAttendance}%</strong></span>
                              </div>
                            </div>
                            
                            {/* Group Students Details Mini-Table */}
                            <table className="w-full text-left text-xs divide-y divide-border/20">
                              <thead>
                                <tr className="text-[11px] font-bold text-muted-foreground uppercase bg-muted/10">
                                  <th className="py-2 px-3">Student Name</th>
                                  <th className="py-2 px-3">Roll Number</th>
                                  {OPTIONAL_FIELDS.map(f => selectedFields.includes(f.key) && (
                                    <th key={f.key} className="py-2 px-3">{f.label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/10">
                                {group.students.map((s: any) => (
                                  <tr key={s._id} className="hover:bg-muted/10 transition-colors">
                                    <td className="py-2 px-3 font-semibold text-foreground">{s.name}</td>
                                    <td className="py-2 px-3 text-muted-foreground font-mono">{s.rollNumber}</td>
                                    {OPTIONAL_FIELDS.map(f => {
                                      if (!selectedFields.includes(f.key)) return null;
                                      let val = s[f.key];
                                      if (f.key === "dob" && val) val = new Date(val).toLocaleDateString();
                                      if (f.key === "feesPaid") {
                                        return (
                                          <td key={f.key} className="py-2 px-3">
                                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", val ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                                              {val ? "Paid" : "Unpaid"}
                                            </span>
                                          </td>
                                        );
                                      }
                                      if (f.key === "noDueStatus") {
                                        return (
                                          <td key={f.key} className="py-2 px-3">
                                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", val ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                                              {val ? "No Dues" : "Dues"}
                                            </span>
                                          </td>
                                        );
                                      }
                                      if (f.key === "internshipCompleted") {
                                        return (
                                          <td key={f.key} className="py-2 px-3">
                                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", val ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                                              {val ? "Completed" : "No"}
                                            </span>
                                          </td>
                                        );
                                      }
                                      if (f.key === "attendancePercentage") {
                                        return (
                                          <td key={f.key} className={cn("py-2 px-3 font-bold", val >= 75 ? "text-success" : "text-destructive")}>
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
                    // STANDARD TABLE MODE
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="py-3 px-4 font-bold text-muted-foreground cursor-pointer hover:bg-muted/50" onClick={() => handleSortClick("name")}>
                            Student Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                          </th>
                          <th className="py-3 px-4 font-bold text-muted-foreground cursor-pointer hover:bg-muted/50" onClick={() => handleSortClick("rollNumber")}>
                            Register Number {sortBy === "rollNumber" && (sortOrder === "asc" ? "↑" : "↓")}
                          </th>
                          {OPTIONAL_FIELDS.map(f => {
                            if (!selectedFields.includes(f.key)) return null;
                            return (
                              <th 
                                key={f.key} 
                                className="py-3 px-4 font-bold text-muted-foreground cursor-pointer hover:bg-muted/50" 
                                onClick={() => handleSortClick(f.key)}
                              >
                                {f.label} {sortBy === f.key && (sortOrder === "asc" ? "↑" : "↓")}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {studentsList.length === 0 ? (
                          <tr>
                            <td colSpan={2 + selectedFields.length} className="text-center py-20 text-muted-foreground text-xs">
                              No records found matching current query.
                            </td>
                          </tr>
                        ) : (
                          studentsList.map((s: any) => (
                            <tr key={s._id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3 px-4 font-semibold text-foreground">{s.name}</td>
                              <td className="py-3 px-4 text-muted-foreground font-mono">{s.rollNumber}</td>
                              {OPTIONAL_FIELDS.map(f => {
                                if (!selectedFields.includes(f.key)) return null;
                                let val = s[f.key];
                                if (f.key === "dob" && val) val = new Date(val).toLocaleDateString();
                                
                                if (f.key === "feesPaid") {
                                  return (
                                    <td key={f.key} className="py-3 px-4">
                                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", val ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                                        {val ? "Paid" : "Unpaid"}
                                      </span>
                                    </td>
                                  );
                                }
                                if (f.key === "noDueStatus") {
                                  return (
                                    <td key={f.key} className="py-3 px-4">
                                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", val ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                                        {val ? "No Dues" : "Dues"}
                                      </span>
                                    </td>
                                  );
                                }
                                if (f.key === "internshipCompleted") {
                                  return (
                                    <td key={f.key} className="py-3 px-4">
                                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", val ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                                        {val ? "Completed" : "No"}
                                      </span>
                                    </td>
                                  );
                                }
                                if (f.key === "attendancePercentage") {
                                  return (
                                    <td key={f.key} className={cn("py-3 px-4 font-bold", val >= 75 ? "text-success" : "text-destructive")}>
                                      {val}%
                                    </td>
                                  );
                                }
                                return (
                                  <td key={f.key} className="py-3 px-4 text-muted-foreground">{val !== undefined && val !== null ? val : 'N/A'}</td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination Controls */}
                {!groupBy && pagination.totalPages > 1 && (
                  <div className="p-4 border-t border-border/40 flex items-center justify-between print:hidden">
                    <span className="text-xs text-muted-foreground">
                      Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={pagination.currentPage === 1}
                        className="p-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="p-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>
    </>
  );
};

export default Reports;
