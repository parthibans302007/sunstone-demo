import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Plus, User, Mail, Phone, BookOpen, AlertCircle, X,
  Hash, LayoutGrid, List, ChevronLeft, ChevronRight, Download, Upload,
  MapPin, Calendar, Check, GraduationCap, Briefcase, Award, Clock, FileText, CheckCircle, ClipboardCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COLORS = ["#2563EB", "#0F172A", "#16A34A", "#F59E0B", "#DC2626", "#8B5CF6"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { stiffness: 300, damping: 20 } }
};

// CSV parsing helper
const parseCSV = (text: string) => {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || !lines[0]) return { headers: [], rows: [] };

  // Parse headers, handling quotes
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser handling quotes
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index].replace(/^["']|["']$/g, '') : "";
    });
    rows.push(row);
  }

  return { headers, rows };
};

const REQUIRED_MAPPING_FIELDS = [
  { key: "name", label: "Student Name" },
  { key: "email", label: "Personal Email Id" },
  { key: "rollNumber", label: "Register No" },
  { key: "category", label: "Programme" },
  { key: "uid", label: "UID" },
  { key: "contactNumber", label: "Mobile No" },
  { key: "whatsappNumber", label: "Whatsapp Number" },
  { key: "officialEmail", label: "Official Email ID" },
  { key: "fatherName", label: "Father Name" },
  { key: "fatherOccupation", label: "Father Occupation" },
  { key: "fatherMobile", label: "Father Mobile Number" },
  { key: "motherName", label: "Mother Name" },
  { key: "motherOccupation", label: "Mother Occupation" },
  { key: "motherMobile", label: "Mother Mobile Number" },
  { key: "guardianName", label: "Guardian Name" },
  { key: "guardianMobile", label: "Guardian Mobile No" },
  { key: "year", label: "Year" },
  { key: "semester", label: "Semester" },
  { key: "attendancePercentage", label: "Attendance Percentage" },
  { key: "cgpa", label: "CGPA" },
  { key: "backlogCount", label: "Number Of Arrears" },
  { key: "internshipCompleted", label: "Internship Status" }
];

const Students = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Filtering, search & pagination
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [semFilter, setSemFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [cgpaFilter, setCgpaFilter] = useState("all");
  const [attFilter, setAttFilter] = useState("all");
  const [internFilter, setInternFilter] = useState("all");
  const [placementFilter, setPlacementFilter] = useState("all");

  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modals & wizards state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Student creation wizard (Step-based manual form)
  const [enrollStep, setEnrollStep] = useState(1);
  const [enrollForm, setEnrollForm] = useState({
    name: "", email: "", rollNumber: "", category: "", contactNumber: "", parentContact: "", address: "",
    batch: "2026", course: "BCA", semester: 1, year: 1, section: "A", academicYear: "2025-2026",
    gender: "Male", dob: "", community: "General", bloodGroup: "O+", gpa: 7.0, backlogCount: 0,
    internshipCompleted: false, feesPaid: false, noDueStatus: false, notes: ""
  });
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);

  // CSV Importer mapping state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvStep, setCsvStep] = useState(1);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [validationReport, setValidationReport] = useState<{
    validRows: any[];
    invalidRows: { row: number; rollNumber?: string; errors: string[] }[];
  }>({ validRows: [], invalidRows: [] });
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    imported: number;
    updated: number;
    failed: number;
    errors: any[];
    importBatchId: string;
  } | null>(null);

  // History and Rollback states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState<Record<string, boolean>>({});

  // Active student detailed profile
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [profileTab, setProfileTab] = useState<"personal" | "academic" | "attendance" | "placement" | "notes" | "timeline">("personal");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editingNotesText, setEditingNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [noteType, setNoteType] = useState<"Note" | "Warning" | "Guidance">("Note");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsRes, categoriesRes, placementRes] = await Promise.all([
        api.get("/students"),
        api.get("/categories"),
        api.get("/placement/eligible")
      ]);

      // Match students with calculated placement eligibility details
      const placementStudents = placementRes.data?.students || [];
      const enrichedStudents = studentsRes.data.map((s: any) => {
        const pInfo = placementStudents.find((ps: any) => ps.rollNumber === s.rollNumber) || {};
        return {
          ...s,
          attendancePercentage: pInfo.attendancePercentage !== undefined ? pInfo.attendancePercentage : 100,
          readinessScore: pInfo.readinessScore || 70,
          scoreCategory: pInfo.scoreCategory || "Needs Improvement",
          eligibility: pInfo.eligibility || "Eligible",
          riskStatus: pInfo.riskStatus || "Safe"
        };
      });

      setStudents(enrichedStudents);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load student directory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handle outside navigations triggering modals
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.openEnroll) {
        setIsEnrollModalOpen(true);
        setEnrollStep(1);
      } else if (state.openUpload) {
        setIsUploadModalOpen(true);
        setCsvStep(1);
      }
      // clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter application
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search matches
      const nameStr = s.user?.name || "";
      const searchLower = search.toLowerCase();
      const matchSearch = nameStr.toLowerCase().includes(searchLower) || s.rollNumber?.toLowerCase().includes(searchLower);

      // Dept / Category
      const matchDept = deptFilter === "all" || s.category?._id === deptFilter;

      // Year / Sem / Section
      const matchYear = yearFilter === "all" || s.year === Number(yearFilter);
      const matchSem = semFilter === "all" || s.semester === Number(semFilter);
      const matchSection = sectionFilter === "all" || s.section === sectionFilter;

      // CGPA Range
      let matchCgpa = true;
      const gpa = s.gpa || 0;
      if (cgpaFilter === "9+") matchCgpa = gpa >= 9.0;
      else if (cgpaFilter === "8-9") matchCgpa = gpa >= 8.0 && gpa < 9.0;
      else if (cgpaFilter === "7-8") matchCgpa = gpa >= 7.0 && gpa < 8.0;
      else if (cgpaFilter === "6-7") matchCgpa = gpa >= 6.0 && gpa < 7.0;
      else if (cgpaFilter === "below6") matchCgpa = gpa < 6.0;

      // Attendance Range
      let matchAtt = true;
      const att = s.attendancePercentage;
      if (attFilter === "90+") matchAtt = att >= 90;
      else if (attFilter === "75-90") matchAtt = att >= 75 && att < 90;
      else if (attFilter === "below75") matchAtt = att < 75;

      // Internship & Placement Status
      const matchIntern = internFilter === "all" || (internFilter === "completed" ? s.internshipCompleted : !s.internshipCompleted);
      const matchPlacement = placementFilter === "all" || s.eligibility === placementFilter;

      return matchSearch && matchDept && matchYear && matchSem && matchSection && matchCgpa && matchAtt && matchIntern && matchPlacement;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Handle nested fields
      if (sortField === "name") {
        valA = a.user?.name || "";
        valB = b.user?.name || "";
      } else if (sortField === "department") {
        valA = a.category?.name || "";
        valB = b.category?.name || "";
      }

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, search, deptFilter, yearFilter, semFilter, sectionFilter, cgpaFilter, attFilter, internFilter, placementFilter, sortField, sortOrder]);

  // Paginated List
  const paginatedStudents = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Reset pagination on filter update
  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter, yearFilter, semFilter, sectionFilter, cgpaFilter, attFilter, internFilter, placementFilter]);

  // Handle Manual student enrollment save
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.category) {
      toast.error("Please select a department");
      return;
    }
    setIsSubmittingEnroll(true);
    try {
      await api.post("/students", enrollForm);
      toast.success("Student successfully enrolled!");
      setIsEnrollModalOpen(false);
      // Reset form
      setEnrollForm({
        name: "", email: "", rollNumber: "", category: "", contactNumber: "", parentContact: "", address: "",
        batch: "2026", course: "BCA", semester: 1, year: 1, section: "A", academicYear: "2025-2026",
        gender: "Male", dob: "", community: "General", bloodGroup: "O+", gpa: 7.0, backlogCount: 0,
        internshipCompleted: false, feesPaid: false, noDueStatus: false, notes: ""
      });
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create student profile");
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  // CSV/Excel Importer file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

          if (rows.length === 0) {
            toast.error("Spreadsheet is empty");
            return;
          }

          const headers = Object.keys(rows[0]);
          setCsvHeaders(headers);
          setCsvRows(rows);

          // Auto map matching columns
          const autoMap: Record<string, string> = {};
          REQUIRED_MAPPING_FIELDS.forEach(req => {
            const match = headers.find(h =>
              h.toLowerCase() === req.key.toLowerCase() ||
              h.toLowerCase() === req.label.toLowerCase() ||
              h.toLowerCase().trim() === req.label.toLowerCase().trim() ||
              h.toLowerCase().includes(req.key.toLowerCase())
            );
            if (match) {
              autoMap[req.key] = match;
            }
          });
          setMappings(autoMap);
          setCsvStep(2);
        } catch (err: any) {
          console.error(err);
          toast.error("Failed to parse file: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // CSV/Excel validation check step
  const handleCsvMappingNext = () => {
    // Validate mappings
    const missing = REQUIRED_MAPPING_FIELDS.filter(f => f.key === "name" || f.key === "email" || f.key === "rollNumber" || f.key === "category")
      .filter(f => !mappings[f.key]);

    if (missing.length > 0) {
      toast.error(`Please map required fields: ${missing.map(m => m.label).join(", ")}`);
      return;
    }

    // Process and validate rows
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const seenEmails = new Set();
    const seenRolls = new Set();

    csvRows.forEach((row, index) => {
      const mappedRow: any = {};
      REQUIRED_MAPPING_FIELDS.forEach(field => {
        const csvCol = mappings[field.key];
        mappedRow[field.key] = csvCol ? String(row[csvCol]).trim() : "";
      });

      const errors: string[] = [];
      const rowNum = index + 2;

      // Basic field checks
      if (!mappedRow.name) errors.push("Missing Student Name");
      if (!mappedRow.rollNumber) errors.push("Missing Register No");
      if (!mappedRow.category) errors.push("Missing Programme");
      if (!mappedRow.email || !mappedRow.email.includes("@")) {
        errors.push("Invalid or missing Personal Email Id");
      }

      // Check Mobile patterns
      const mobileFields = ["contactNumber", "whatsappNumber", "fatherMobile", "motherMobile", "guardianMobile"];
      mobileFields.forEach(f => {
        const val = mappedRow[f];
        if (val) {
          const cleanNum = val.replace(/[\s\+\-\(\)]/g, "");
          if (isNaN(Number(cleanNum)) || cleanNum.length < 7) {
            errors.push(`Invalid mobile for ${f}: '${val}'`);
          }
        }
      });

      // CGPA ranges 0-10
      const cgpa = parseFloat(mappedRow.cgpa || "0");
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        errors.push(`CGPA must be a number between 0.0 and 10.0 (got '${mappedRow.cgpa}')`);
      }

      // Attendance ranges 0-100
      const att = parseFloat(mappedRow.attendancePercentage || "0");
      if (isNaN(att) || att < 0 || att > 100) {
        errors.push(`Attendance Percentage must be between 0 and 100 (got '${mappedRow.attendancePercentage}')`);
      }

      // Arrears ranges 0-50
      const backlogCount = parseInt(mappedRow.backlogCount || "0");
      if (isNaN(backlogCount) || backlogCount < 0 || backlogCount > 50) {
        errors.push(`Number Of Arrears must be between 0 and 50 (got '${mappedRow.backlogCount}')`);
      }

      if (seenEmails.has(mappedRow.email)) {
        errors.push(`Duplicate email in spreadsheet: '${mappedRow.email}'`);
      }
      seenEmails.add(mappedRow.email);

      if (seenRolls.has(mappedRow.rollNumber)) {
        errors.push(`Duplicate Register No in spreadsheet: '${mappedRow.rollNumber}'`);
      }
      seenRolls.add(mappedRow.rollNumber);

      if (errors.length > 0) {
        invalidRows.push({ row: rowNum, rollNumber: mappedRow.rollNumber, errors });
      } else {
        validRows.push(mappedRow);
      }
    });

    setValidationReport({ validRows, invalidRows });
    setCsvStep(3);
  };

  // Save Excel/CSV rows to Database
  const handleImportSubmit = async () => {
    if (validationReport.validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      if (csvFile) {
        formData.append("file", csvFile);
      }
      formData.append("mapping", JSON.stringify(mappings));

      const res = await api.post("/students/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const { totalRows, imported, updated, failed, errors } = res.data;
      toast.success(`Ingested spreadsheet: ${imported} imported, ${updated} updated, ${failed} failed`);

      setImportResult({
        totalRows,
        imported,
        updated,
        failed,
        errors,
        importBatchId: res.data.importBatchId
      });
      setCsvStep(4);
      fetchStudents();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Excel bulk upload failed to execute");
    } finally {
      setIsImporting(false);
    }
  };

  const fetchImportHistory = useCallback(async () => {
    try {
      setIsFetchingHistory(true);
      const res = await api.get("/students/import-history");
      setImportHistory(res.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
      toast.error("Failed to load import history");
    } finally {
      setIsFetchingHistory(false);
    }
  }, []);

  const handleRollback = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to rollback this import? This will remove newly created students and restore updated records to their original state.")) {
      return;
    }

    setIsRollingBack(prev => ({ ...prev, [batchId]: true }));
    try {
      const res = await api.post(`/students/rollback/${batchId}`);
      toast.success(res.data.message || "Import successfully rolled back!");
      fetchImportHistory();
      fetchStudents();
    } catch (error: any) {
      console.error("Rollback failed", error);
      toast.error(error.response?.data?.message || "Failed to rollback import");
    } finally {
      setIsRollingBack(prev => ({ ...prev, [batchId]: false }));
    }
  };

  // Open detailed drawer
  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
    setProfileTab("personal");
    setEditingNotesText(student.notes || "");
    setIsEditingNotes(false);
    setIsProfileModalOpen(true);
  };

  // Save Student Notes
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await api.put(`/students/${selectedStudent._id}`, { notes: editingNotesText });
      toast.success("Student notes successfully saved!");
      setSelectedStudent(res.data);
      setIsEditingNotes(false);
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update student notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddMentorshipNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error("Please enter mentorship note content");
      return;
    }
    setIsAddingNote(true);
    try {
      const res = await api.post(`/students/${selectedStudent._id}/mentorship-notes`, {
        type: noteType,
        content: newNoteContent
      });
      toast.success("Mentorship note saved to history!");
      setSelectedStudent(res.data);
      setNewNoteContent("");
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save mentorship note");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Mock timelines
  const getTimelineEvents = (s: any) => {
    if (!s) return [];

    // Generate dates based on s.createdAt
    const createdDate = new Date(s.createdAt || Date.now());
    const updatedDate = new Date(s.updatedAt || Date.now());

    const events = [
      {
        title: "Student Ledger Created",
        desc: `University ledger profile initiated under register ID ${s.rollNumber}. Default password established.`,
        date: createdDate.toLocaleDateString(),
        icon: User,
        color: "text-blue-500 bg-blue-50"
      }
    ];

    if (s.gpa) {
      events.push({
        title: "CGPA Term Update",
        desc: `Academic Cumulative GPA calculated at ${s.gpa} out of 10.0.`,
        date: updatedDate.toLocaleDateString(),
        icon: GraduationCap,
        color: "text-purple-500 bg-purple-50"
      });
    }

    if (s.attendancePercentage) {
      events.push({
        title: "Live Attendance Refresh",
        desc: `Total attendance percentage compiled at ${s.attendancePercentage}%. Status: ${s.attendancePercentage >= 75 ? 'Good standing' : 'Flagged low attendance'}.`,
        date: new Date(updatedDate.getTime() - 86400000).toLocaleDateString(),
        icon: ClipboardCheck,
        color: s.attendancePercentage >= 75 ? "text-green-500 bg-green-50" : "text-red-500 bg-red-50"
      });
    }

    if (s.internshipCompleted) {
      events.push({
        title: "Internship Milestone Completed",
        desc: "Student verified internship completed certificate. Placement readiness score increased.",
        date: createdDate.toLocaleDateString(),
        icon: Award,
        color: "text-emerald-500 bg-emerald-50"
      });
    }

    if (s.eligibility) {
      events.push({
        title: "Placement Status Calculated",
        desc: `Placement Eligibility System evaluated student as: ${s.eligibility} (Score: ${s.readinessScore}).`,
        date: updatedDate.toLocaleDateString(),
        icon: Briefcase,
        color: s.eligibility === 'Eligible' ? "text-green-500 bg-green-50" : s.eligibility === 'Needs Improvement' ? "text-amber-500 bg-amber-50" : "text-red-500 bg-red-50"
      });
    }

    return events.reverse();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <motion.div variants={itemVariants} initial="hidden" animate="show">
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Students Directory</h1>
            <p className="text-xs text-muted-foreground font-medium">Manage academic profiles, performance records, and placement readiness.</p>
          </div>
          {user?.role === "admin" && (
            <div className="flex flex-wrap gap-2.5 relative z-10">
              <button
                onClick={() => { setCsvStep(1); setIsUploadModalOpen(true); }}
                className="flex items-center gap-2 bg-card border border-border hover:bg-muted text-foreground px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <Upload className="w-4 h-4 text-primary" />
                Spreadsheet Upload
              </button>
              <button
                onClick={() => { setEnrollStep(1); setIsEnrollModalOpen(true); }}
                className="flex items-center gap-2 bg-primary text-white px-4.5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Enroll Student
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Directory Controls Panel */}
      <div className="relative overflow-hidden rounded-2xl p-6 border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300">
        {/* Toggle & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="Search by student name or roll register number..."
              className="pl-10 h-10 bg-transparent border-border focus-visible:ring-primary text-xs font-semibold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
            <div className="flex bg-muted/40 border p-1 rounded-xl gap-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={cn("p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all", viewMode === "table" && "bg-card shadow-sm text-primary border border-border/10")}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all", viewMode === "grid" && "bg-card shadow-sm text-primary border border-border/10")}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="relative overflow-hidden rounded-2xl p-6 border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300 pt-2 border-t border-border/40 text-xs font-bold">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {/* Department Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase">Dept</label>
            <select className="bg-card border rounded-lg px-2 py-1.5 w-full cursor-pointer" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="all">All Departments</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase">Year</label>
            <select className="bg-card border rounded-lg px-2 py-1.5 w-full cursor-pointer" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
              <option value="all">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          {/* Sem Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase">Sem</label