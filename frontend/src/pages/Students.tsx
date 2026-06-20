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
  MapPin, Calendar, Check, GraduationCap, Briefcase, Award, Clock, FileText, CheckCircle
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
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } }
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

      {/* Directory Controls Panel */}
      <div className="bg-card border border-border/60 p-4 rounded-2xl shadow-sm space-y-4">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 pt-2 border-t border-border/40 text-xs font-bold">
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
            <label className="text-[10px] text-muted-foreground uppercase">Sem</label>
            <select className="bg-card border rounded-lg px-2 py-1.5 w-full cursor-pointer" value={semFilter} onChange={e => setSemFilter(e.target.value)}>
              <option value="all">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>Sem {s}</option>)}
            </select>
          </div>

          {/* Section Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase">Section</label>
            <select className="bg-card border rounded-lg px-2 py-1.5 w-full cursor-pointer" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* CGPA Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase">CGPA</label>
            <select className="bg-card border rounded-lg px-2 py-1.5 w-full cursor-pointer" value={cgpaFilter} onChange={e => setCgpaFilter(e.target.value)}>
              <option value="all">All GPA</option>
              <option value="9+">Outstanding (9.0+)</option>
              <option value="8-9">Very Good (8.0 - 9.0)</option>
              <option value="7-8">Good (7.0 - 8.0)</option>
              <option value="6-7">Average (6.0 - 7.0)</option>
              <option value="below6">Below 6.0</option>
            </select>
          </div>

          {/* Attendance Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase">Attendance</label>
            <select className="bg-card border rounded-lg px-2 py-1.5 w-full cursor-pointer" value={attFilter} onChange={e => setAttFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="90+">High (&gt;90%)</option>
              <option value="75-90">Good (75-90%)</option>
              <option value="below75">At-Risk (&lt;75%)</option>
            </select>
          </div>

          {/* Internship Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase">Internship</label>
            <select className="bg-card border rounded-lg px-2 py-1.5 w-full cursor-pointer" value={internFilter} onChange={e => setInternFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Not Completed</option>
            </select>
          </div>

          {/* Placement Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase">Placement</label>
            <select className="bg-card border rounded-lg px-2 py-1.5 w-full cursor-pointer" value={placementFilter} onChange={e => setPlacementFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="Eligible">Eligible</option>
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="Not Eligible">Not Eligible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Student list display */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 bg-card border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-24 text-center border border-dashed rounded-2xl bg-card border-border/80 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-bold text-muted-foreground">No students match the current filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        
        // GRID VIEW CARD RENDER
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredStudents.map((s) => {
            const initials = s.user?.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "ST";
            return (
              <button
                key={s._id}
                onClick={() => handleStudentClick(s)}
                className="bg-card border border-border hover:border-primary/50 rounded-2xl p-5 text-left flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 group relative"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-accent/15 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors leading-snug">{s.user?.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5 tracking-wider font-semibold">{s.rollNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-semibold mb-3">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Dept:</span>
                      <span className="text-foreground max-w-[120px] truncate">{s.category?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>CGPA:</span>
                      <span className="text-primary font-black">{s.gpa || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Attendance:</span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", s.attendancePercentage >= 75 ? "bg-success/15 text-success border-success/25" : "bg-destructive/15 text-destructive border-destructive/25")}>
                        {s.attendancePercentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Placement Status:</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border",
                        s.eligibility === 'Eligible' ? "bg-success/15 text-success border-success/35" :
                        s.eligibility === 'Needs Improvement' ? "bg-warning/15 text-warning border-warning/35" :
                        "bg-destructive/15 text-destructive border-destructive/35"
                      )}>
                        {s.eligibility}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn("h-1.5 rounded-full transition-all duration-300", s.attendancePercentage >= 75 ? "bg-success" : "bg-destructive")}
                    style={{ width: `${s.attendancePercentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        
        // TABLE VIEW DENSE DATA TABLE RENDER
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/40 font-bold text-muted-foreground uppercase text-[10px] tracking-wide select-none">
                  <th className="py-3 px-4 cursor-pointer hover:bg-muted/60" onClick={() => handleSort("name")}>Student Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-muted/60" onClick={() => handleSort("rollNumber")}>Roll Number {sortField === "rollNumber" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-muted/60" onClick={() => handleSort("department")}>Department {sortField === "department" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-muted/60 text-center" onClick={() => handleSort("course")}>Course {sortField === "course" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-muted/60 text-center" onClick={() => handleSort("year")}>Year {sortField === "year" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-muted/60 text-center" onClick={() => handleSort("gpa")}>CGPA {sortField === "gpa" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-muted/60 text-center" onClick={() => handleSort("attendancePercentage")}>Attendance % {sortField === "attendancePercentage" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-muted/60 text-right" onClick={() => handleSort("eligibility")}>Placement Eligibility {sortField === "eligibility" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-semibold text-foreground">
                {paginatedStudents.map((s) => (
                  <tr 
                    key={s._id} 
                    onClick={() => handleStudentClick(s)}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-foreground">{s.user?.name}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-[10px]">{s.rollNumber}</td>
                    <td className="py-3 px-4 text-muted-foreground">{s.category?.name}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{s.course}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">Year {s.year} (Sem {s.semester})</td>
                    <td className="py-3 px-4 text-center text-primary font-black">{s.gpa}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black border", s.attendancePercentage >= 75 ? "bg-success/15 text-success border-success/25" : "bg-destructive/15 text-destructive border-destructive/25")}>
                        {s.attendancePercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border",
                        s.eligibility === 'Eligible' ? "bg-success/15 text-success border-success/35" :
                        s.eligibility === 'Needs Improvement' ? "bg-warning/15 text-warning border-warning/35" :
                        "bg-destructive/15 text-destructive border-destructive/35"
                      )}>
                        {s.eligibility}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border/40 flex items-center justify-between bg-muted/10 font-bold">
              <span className="text-xs text-muted-foreground font-semibold">
                Showing page {currentPage} of {totalPages} ({filteredStudents.length} students total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border rounded-xl bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border rounded-xl bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANUAL ENROLLMENT DIALOG MODAL WIZARD */}
      <AnimatePresence>
        {isEnrollModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card w-full max-w-xl rounded-2xl shadow-xl border flex flex-col my-8 max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b flex justify-between items-center bg-muted/15">
                <div>
                  <h2 className="text-base font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Student Enrollment Wizard
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Step {enrollStep} of 4: Fill student personal and academic records</p>
                </div>
                <button onClick={() => setIsEnrollModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>

              {/* Step indicator capsule bar */}
              <div className="px-6 py-3 border-b flex justify-between gap-1 bg-muted/5 font-semibold text-[10px] text-muted-foreground">
                <span className={cn("px-2.5 py-1 rounded-full", enrollStep >= 1 ? "bg-primary text-white" : "bg-muted")}>1. PERSONAL</span>
                <span className={cn("px-2.5 py-1 rounded-full", enrollStep >= 2 ? "bg-primary text-white" : "bg-muted")}>2. ACADEMIC</span>
                <span className={cn("px-2.5 py-1 rounded-full", enrollStep >= 3 ? "bg-primary text-white" : "bg-muted")}>3. PLACEMENT & STATUS</span>
                <span className={cn("px-2.5 py-1 rounded-full", enrollStep >= 4 ? "bg-primary text-white" : "bg-muted")}>4. REVIEW</span>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <form id="enroll-wizard-form" onSubmit={handleEnrollSubmit} className="space-y-4 text-xs font-bold">
                  {enrollStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input required className="pl-9 text-xs" value={enrollForm.name} onChange={e => setEnrollForm({...enrollForm, name: e.target.value})} placeholder="Jane Doe" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input type="email" required className="pl-9 text-xs" value={enrollForm.email} onChange={e => setEnrollForm({...enrollForm, email: e.target.value})} placeholder="jane@sunstone.edu" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Contact Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input required className="pl-9 text-xs" value={enrollForm.contactNumber} onChange={e => setEnrollForm({...enrollForm, contactNumber: e.target.value})} placeholder="+91 XXXXX XXXXX" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Parent Contact</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input required className="pl-9 text-xs" value={enrollForm.parentContact} onChange={e => setEnrollForm({...enrollForm, parentContact: e.target.value})} placeholder="+91 XXXXX XXXXX" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Gender</label>
                          <select className="w-full border rounded-lg px-3 h-10 bg-card outline-none" value={enrollForm.gender} onChange={e => setEnrollForm({...enrollForm, gender: e.target.value})}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Date of Birth</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input type="date" required className="pl-9 text-xs" value={enrollForm.dob} onChange={e => setEnrollForm({...enrollForm, dob: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-muted-foreground uppercase">Residential Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/60" />
                          <textarea required className="w-full border rounded-lg pl-9 pr-3 py-2 h-16 bg-card outline-none text-xs" value={enrollForm.address} onChange={e => setEnrollForm({...enrollForm, address: e.target.value})} placeholder="Residential building, campus quarters..." />
                        </div>
                      </div>
                    </div>
                  )}

                  {enrollStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Roll / Register Number</label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input required className="pl-9 text-xs font-mono" value={enrollForm.rollNumber} onChange={e => setEnrollForm({...enrollForm, rollNumber: e.target.value})} placeholder="CS-2026-001" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Department Category</label>
                          <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                            <select required className="w-full border rounded-lg pl-9 pr-3 h-10 bg-card outline-none" value={enrollForm.category} onChange={e => setEnrollForm({...enrollForm, category: e.target.value})}>
                              <option value="" disabled>Select Department</option>
                              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Course Program</label>
                          <select className="w-full border rounded-lg px-3 h-10 bg-card outline-none" value={enrollForm.course} onChange={e => setEnrollForm({...enrollForm, course: e.target.value})}>
                            <option value="BCA">BCA</option>
                            <option value="MBA">MBA</option>
                            <option value="BBA">BBA</option>
                            <option value="B.Tech">B.Tech</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Batch Year</label>
                          <Input className="text-xs" value={enrollForm.batch} onChange={e => setEnrollForm({...enrollForm, batch: e.target.value})} placeholder="2026" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Section</label>
                          <select className="w-full border rounded-lg px-3 h-10 bg-card outline-none" value={enrollForm.section} onChange={e => setEnrollForm({...enrollForm, section: e.target.value})}>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Current Academic Year</label>
                          <Input className="text-xs" value={enrollForm.academicYear} onChange={e => setEnrollForm({...enrollForm, academicYear: e.target.value})} placeholder="2025-2026" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <label className="text-muted-foreground uppercase">Year (1-4)</label>
                            <select className="w-full border rounded-lg px-3 h-10 bg-card outline-none" value={enrollForm.year} onChange={e => setEnrollForm({...enrollForm, year: Number(e.target.value)})}>
                              {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-muted-foreground uppercase">Sem (1-8)</label>
                            <select className="w-full border rounded-lg px-3 h-10 bg-card outline-none" value={enrollForm.semester} onChange={e => setEnrollForm({...enrollForm, semester: Number(e.target.value)})}>
                              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {enrollStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Cumulative GPA (CGPA)</label>
                          <Input type="number" step="0.01" className="text-xs" value={enrollForm.gpa} onChange={e => setEnrollForm({...enrollForm, gpa: parseFloat(e.target.value)})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground uppercase">Active Backlog Count</label>
                          <Input type="number" className="text-xs" value={enrollForm.backlogCount} onChange={e => setEnrollForm({...enrollForm, backlogCount: parseInt(e.target.value)})} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 bg-muted/20 p-3.5 rounded-xl border">
                        <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                          <input type="checkbox" checked={enrollForm.internshipCompleted} onChange={e => setEnrollForm({...enrollForm, internshipCompleted: e.target.checked})} className="rounded text-primary focus:ring-primary h-4 w-4 shrink-0" />
                          <span>Internship Completed</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                          <input type="checkbox" checked={enrollForm.feesPaid} onChange={e => setEnrollForm({...enrollForm, feesPaid: e.target.checked})} className="rounded text-primary focus:ring-primary h-4 w-4 shrink-0" />
                          <span>Fees Paid</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                          <input type="checkbox" checked={enrollForm.noDueStatus} onChange={e => setEnrollForm({...enrollForm, noDueStatus: e.target.checked})} className="rounded text-primary focus:ring-primary h-4 w-4 shrink-0" />
                          <span>No Dues Status</span>
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-muted-foreground uppercase">Faculty Comments & Notes</label>
                        <textarea className="w-full border rounded-lg px-3 py-2 h-20 bg-card outline-none text-xs font-semibold" value={enrollForm.notes} onChange={e => setEnrollForm({...enrollForm, notes: e.target.value})} placeholder="Mentorship review details, behavioral remarks..." />
                      </div>
                    </div>
                  )}

                  {enrollStep === 4 && (
                    <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/80 text-xs text-foreground/80 leading-relaxed font-semibold animate-in fade-in duration-200">
                      <h4 className="font-extrabold text-sm uppercase text-primary border-b pb-1">Roster Enrollment Preview Summary</h4>
                      <ul className="space-y-2.5">
                        <li className="flex justify-between"><span>Student Name:</span> <strong className="text-foreground">{enrollForm.name} ({enrollForm.gender})</strong></li>
                        <li className="flex justify-between"><span>Email / Contact:</span> <strong className="text-foreground">{enrollForm.email} | {enrollForm.contactNumber}</strong></li>
                        <li className="flex justify-between"><span>Roll Number:</span> <strong className="text-foreground font-mono">{enrollForm.rollNumber}</strong></li>
                        <li className="flex justify-between"><span>Program Program:</span> <strong className="text-foreground">{enrollForm.course} - Section {enrollForm.section}</strong></li>
                        <li className="flex justify-between"><span>Year & Semester:</span> <strong className="text-foreground">Year {enrollForm.year} (Semester {enrollForm.semester})</strong></li>
                        <li className="flex justify-between"><span>CGPA:</span> <strong className="text-primary font-black">{enrollForm.gpa}</strong></li>
                        <li className="flex justify-between"><span>Active Backlogs:</span> <strong className={enrollForm.backlogCount > 0 ? "text-destructive font-black" : "text-success font-black"}>{enrollForm.backlogCount}</strong></li>
                        <li className="flex justify-between"><span>Milestone Flags:</span> <strong className="text-foreground">{enrollForm.internshipCompleted ? "Internship ✅" : "Internship ❌"} | {enrollForm.feesPaid ? "Fees Clear ✅" : "Fees Pending ❌"}</strong></li>
                      </ul>
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-[10px] p-2.5 rounded-lg mt-2 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Creating this student profile automatically configures a portal user account with the password set to <strong>password123</strong>.</span>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Actions Footer */}
              <div className="p-5 border-t bg-muted/15 flex justify-between gap-3 rounded-b-2xl">
                {enrollStep > 1 ? (
                  <button 
                    type="button" 
                    onClick={() => setEnrollStep(prev => prev - 1)}
                    className="px-4.5 py-2 rounded-xl text-xs font-bold border hover:bg-muted transition-colors"
                  >
                    Previous
                  </button>
                ) : <div />}
                
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEnrollModalOpen(false)} 
                    className="px-4.5 py-2 rounded-xl text-xs font-bold border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  {enrollStep < 4 ? (
                    <button 
                      type="button" 
                      onClick={() => setEnrollStep(prev => prev + 1)}
                      className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      form="enroll-wizard-form" 
                      disabled={isSubmittingEnroll} 
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/95 transition-colors disabled:opacity-70 flex items-center gap-1.5 shadow-md shadow-primary/10"
                    >
                      {isSubmittingEnroll ? "Enrolling..." : "Complete Enroll"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXCEL / CSV UPLOAD WIZARD DIALOG MODAL */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border flex flex-col my-8 max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b flex justify-between items-center bg-muted/15">
                <div>
                  <h2 className="text-base font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Spreadsheet Upload Importer
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Bulk ingest or update student records using mapped CSV spreadsheets</p>
                </div>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>

              {/* Step indicator bar */}
              <div className="px-6 py-3 border-b flex justify-between gap-1 bg-muted/5 font-semibold text-[10px] text-muted-foreground">
                <span className={cn("px-2.5 py-1 rounded-full", csvStep >= 1 ? "bg-primary text-white" : "bg-muted")}>1. UPLOAD FILE</span>
                <span className={cn("px-2.5 py-1 rounded-full", csvStep >= 2 ? "bg-primary text-white" : "bg-muted")}>2. MAP COLUMNS</span>
                <span className={cn("px-2.5 py-1 rounded-full", csvStep >= 3 ? "bg-primary text-white" : "bg-muted")}>3. VALIDATE & PREVIEW</span>
              </div>

              {/* Wizard Content */}
              <div className="p-6 overflow-y-auto flex-1 text-xs font-semibold">
                {csvStep === 1 && (
                  <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/5 hover:bg-muted/10 transition-colors relative">
                    <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <Upload className="w-10 h-10 text-primary mb-3.5" />
                    <span className="font-extrabold text-sm text-foreground">Click or Drag CSV Spreadsheet here</span>
                    <span className="text-muted-foreground text-[10px] mt-1 font-medium">Supports mapping custom headers directly into student ledgers</span>
                  </div>
                )}

                {csvStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-[10px] p-3 rounded-lg flex items-start gap-2.5">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <span>Map your spreadsheet headers to database fields. Unmapped fields will fall back to default student records values. <strong>Name, Email, and Roll Number are required.</strong></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {REQUIRED_MAPPING_FIELDS.map(field => {
                        const required = field.key === "name" || field.key === "email" || field.key === "rollNumber";
                        return (
                          <div key={field.key} className="flex flex-col gap-1 border-b pb-2">
                            <label className="text-[10px] uppercase text-muted-foreground font-extrabold">
                              {field.label} {required && <span className="text-destructive font-black">*</span>}
                            </label>
                            <select 
                              className="bg-card border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-xs"
                              value={mappings[field.key] || ""}
                              onChange={e => setMappings({...mappings, [field.key]: e.target.value})}
                            >
                              <option value="">-- Do Not Map --</option>
                              {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {csvStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Metrics bar */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-success/10 border border-success/20 text-success p-3 rounded-xl text-center">
                        <span className="text-[10px] block uppercase font-bold">Ready rows</span>
                        <strong className="text-lg font-black">{validationReport.validRows.length}</strong>
                      </div>
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-center">
                        <span className="text-[10px] block uppercase font-bold">Failed rows</span>
                        <strong className="text-lg font-black">{validationReport.invalidRows.length}</strong>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-xl text-center">
                        <span className="text-[10px] block uppercase font-bold">Total Imported</span>
                        <strong className="text-lg font-black">{csvRows.length}</strong>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-[10px] uppercase text-muted-foreground tracking-wide">Valid Rows Preview</h4>
                      <div className="overflow-x-auto border rounded-lg max-h-[160px] overflow-y-auto">
                        <table className="w-full text-left text-[10px]">
                          <thead className="bg-muted/40 font-bold border-b text-muted-foreground uppercase">
                            <tr>
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Roll</th>
                              <th className="py-2 px-3">Email</th>
                              <th className="py-2 px-3">GPA</th>
                              <th className="py-2 px-3 text-right">Sem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 text-foreground font-semibold">
                            {validationReport.validRows.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-5 text-center text-muted-foreground">No valid student rows found</td>
                              </tr>
                            ) : (
                              validationReport.validRows.slice(0, 10).map((row, idx) => (
                                <tr key={idx}>
                                  <td className="py-1.5 px-3 font-bold">{row.name}</td>
                                  <td className="py-1.5 px-3 font-mono">{row.rollNumber}</td>
                                  <td className="py-1.5 px-3 text-muted-foreground">{row.email}</td>
                                  <td className="py-1.5 px-3 text-primary font-black">{row.gpa}</td>
                                  <td className="py-1.5 px-3 text-right text-muted-foreground">Sem {row.semester}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Failure details */}
                    {validationReport.invalidRows.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-[10px] uppercase text-destructive tracking-wide">Validation Failures list</h4>
                        <div className="overflow-y-auto border border-destructive/20 rounded-lg max-h-[120px] bg-destructive/5 p-3 space-y-2">
                          {validationReport.invalidRows.map((err, idx) => (
                            <div key={idx} className="flex gap-2.5 items-start text-[10px] font-semibold text-destructive">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>Row {err.row} (Roll: {err.rollNumber || "N/A"}): {err.errors.join(", ")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wizard Actions Footer */}
              <div className="p-5 border-t bg-muted/15 flex justify-between gap-3 rounded-b-2xl">
                {csvStep > 1 ? (
                  <button 
                    type="button" 
                    onClick={() => setCsvStep(prev => prev - 1)}
                    className="px-4.5 py-2 rounded-xl text-xs font-bold border hover:bg-muted transition-colors"
                  >
                    Back
                  </button>
                ) : <div />}

                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsUploadModalOpen(false)} 
                    className="px-4.5 py-2 rounded-xl text-xs font-bold border hover:bg-muted transition-colors"
                  >
                    Close
                  </button>
                  {csvStep === 2 && (
                    <button 
                      type="button" 
                      onClick={handleCsvMappingNext}
                      className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-colors"
                    >
                      Analyze Rows
                    </button>
                  )}
                  {csvStep === 3 && (
                    <button 
                      type="button" 
                      onClick={handleImportSubmit}
                      disabled={isImporting || validationReport.validRows.length === 0}
                      className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-primary/10"
                    >
                      {isImporting ? "Importing..." : "Execute Bulk Import"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUDENT PROFILE DETAILED MODAL DRAWER */}
      <AnimatePresence>
        {isProfileModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 200 }}
              className="bg-card w-full max-w-xl h-full shadow-2xl border-l flex flex-col text-xs font-semibold"
            >
              {/* Profile Header */}
              <div className="p-5 border-b bg-muted/15 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-sm shadow border border-white/20">
                  {selectedStudent.user?.name?.split(" ").map((n: string) => n[0]).slice(0,2).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-foreground leading-snug">{selectedStudent.user?.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5 tracking-wider">Register Roll ID: {selectedStudent.rollNumber}</p>
                </div>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>

              {/* Tabs selector */}
              <div className="flex border-b overflow-x-auto bg-muted/5 font-extrabold text-[10px] tracking-wide text-muted-foreground select-none shrink-0">
                {(["personal", "academic", "attendance", "placement", "notes", "timeline"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setProfileTab(tab)}
                    className={cn("px-4 py-3 border-b-2 border-transparent uppercase transition-all whitespace-nowrap", profileTab === tab && "border-primary text-primary bg-muted/10")}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab views details content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {profileTab === "personal" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h4 className="font-extrabold text-xs uppercase text-primary border-b pb-1">Personal Ledger details</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Date of Birth</span>
                        <span className="font-bold text-foreground">
                          {selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Gender Status</span>
                        <span className="font-bold text-foreground">{selectedStudent.gender || "N/A"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Phone Number</span>
                        <span className="font-bold text-foreground">{selectedStudent.contactNumber || "N/A"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Email Address</span>
                        <span className="font-bold text-foreground">{selectedStudent.user?.email || "N/A"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Parent Contact</span>
                        <span className="font-bold text-foreground">{selectedStudent.parentContact || "N/A"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Community Group</span>
                        <span className="font-bold text-foreground">{selectedStudent.community || "N/A"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-[10px] text-muted-foreground uppercase">Residential Address</span>
                      <span className="font-semibold text-foreground bg-muted/20 p-2.5 rounded-lg border">{selectedStudent.address || "N/A"}</span>
                    </div>
                  </div>
                )}

                {profileTab === "academic" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h4 className="font-extrabold text-xs uppercase text-primary border-b pb-1">Academic Standing Enrollment</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Academic Department</span>
                        <span className="font-bold text-foreground">{selectedStudent.category?.name || "N/A"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Course Program</span>
                        <span className="font-bold text-foreground">{selectedStudent.course || "N/A"} (Batch {selectedStudent.batch})</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Current Term Year</span>
                        <span className="font-bold text-foreground">Year {selectedStudent.year} (Semester {selectedStudent.semester})</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Section Class</span>
                        <span className="font-bold text-foreground">Section {selectedStudent.section || "A"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">GPA / CGPA Score</span>
                        <span className="font-extrabold text-primary text-sm">{selectedStudent.gpa || "N/A"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Active Backlogs</span>
                        <span className={cn("font-bold text-sm", selectedStudent.backlogCount > 0 ? "text-destructive" : "text-success")}>
                          {selectedStudent.backlogCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === "attendance" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h4 className="font-extrabold text-xs uppercase text-primary border-b pb-1">Live Attendance Summary</h4>
                    <div className="flex items-center gap-6 bg-muted/20 p-5 rounded-2xl border border-border/60">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center text-sm font-black text-primary bg-card shrink-0">
                        {selectedStudent.attendancePercentage}%
                      </div>
                      <div className="space-y-1.5 font-semibold text-xs flex-1">
                        <span className="text-muted-foreground block text-[10px] uppercase">Compliance Standing</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full font-bold border text-[10px] w-fit block",
                          selectedStudent.attendancePercentage >= 75 ? "bg-success/15 text-success border-success/35" : "bg-destructive/15 text-destructive border-destructive/35"
                        )}>
                          {selectedStudent.attendancePercentage >= 75 ? "Good Compliance Standing" : "Attendance Warning Flagged"}
                        </span>
                        <p className="text-muted-foreground text-[10px]">Students must maintain attendance above 75% to stay eligible for final examinations.</p>
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === "placement" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h4 className="font-extrabold text-xs uppercase text-primary border-b pb-1">Placement Status & Metrics</h4>
                    
                    {/* Readiness Score Card */}
                    <div className="flex items-center gap-6 bg-muted/25 border p-5 rounded-xl justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block font-bold">Placement Readiness Score</span>
                        <strong className="text-2xl font-black text-primary block mt-1">{selectedStudent.readinessScore}</strong>
                        <span className="text-muted-foreground text-[10px]">Evaluated: {selectedStudent.scoreCategory}</span>
                      </div>
                      <div className={cn(
                        "px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase text-center shrink-0",
                        selectedStudent.eligibility === 'Eligible' ? "bg-success/15 text-success border-success/35" :
                        selectedStudent.eligibility === 'Needs Improvement' ? "bg-warning/15 text-warning border-warning/35" :
                        "bg-destructive/15 text-destructive border-destructive/35"
                      )}>
                        {selectedStudent.eligibility}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Internship Status</span>
                        <span className="font-bold text-foreground">
                          {selectedStudent.internshipCompleted ? "Completed Certificate ✅" : "No Registered Internship ❌"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 border-b pb-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Risk Assessment</span>
                        <span className={cn(
                          "font-bold",
                          selectedStudent.riskStatus === 'Safe' ? "text-success" :
                          selectedStudent.riskStatus === 'Needs Attention' ? "text-warning" :
                          "text-destructive"
                        )}>
                          {selectedStudent.riskStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === "notes" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h4 className="font-extrabold text-xs uppercase text-primary border-b pb-1">
                      Mentorship notes & history
                    </h4>

                    {/* Mentorship Notes History List */}
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {(!selectedStudent.mentorshipNotes || selectedStudent.mentorshipNotes.length === 0) ? (
                        <div className="p-4 rounded-xl bg-muted/20 border border-dashed text-center text-muted-foreground font-semibold text-xs leading-relaxed italic">
                          No structured coordinator notes, guidance comments, or warning history recorded.
                        </div>
                      ) : (
                        [...selectedStudent.mentorshipNotes].reverse().map((note: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={cn(
                              "p-3.5 rounded-xl border text-xs leading-relaxed space-y-2",
                              note.type === "Warning" ? "bg-destructive/5 border-destructive/20 text-destructive-foreground" :
                              note.type === "Guidance" ? "bg-primary/5 border-primary/20 text-foreground" :
                              "bg-card border-border/80 text-foreground"
                            )}
                          >
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className={cn(
                                "px-1.5 py-0.25 rounded uppercase border tracking-wider",
                                note.type === "Warning" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                note.type === "Guidance" ? "bg-primary/10 text-primary border-primary/20" :
                                "bg-muted text-muted-foreground border-border/40"
                              )}>
                                {note.type}
                              </span>
                              <span className="text-muted-foreground font-semibold">
                                {note.authorName} · {new Date(note.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="font-semibold text-foreground/90">{note.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Mentorship Note Form (Faculty & Admin only) */}
                    {user?.role !== "student" && (
                      <div className="border-t border-border/50 pt-4.5 space-y-3">
                        <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">Add Mentorship Record</h5>
                        
                        <div className="flex gap-2">
                          {(["Note", "Warning", "Guidance"] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNoteType(type)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all",
                                noteType === type 
                                  ? "bg-primary text-white border-primary shadow-sm"
                                  : "bg-card border-border text-foreground hover:bg-muted"
                              )}
                            >
                              {type === "Warning" ? "⚠️ Warning" : type === "Guidance" ? "💡 Guidance" : "📝 Note"}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <textarea
                            placeholder="Type advice, notes, or warning details here..."
                            className="w-full border rounded-xl p-3 h-20 bg-card outline-none font-semibold text-xs focus:border-primary transition-all"
                            value={newNoteContent}
                            onChange={e => setNewNoteContent(e.target.value)}
                          />
                          <div className="flex justify-end">
                            <button 
                              onClick={handleAddMentorshipNote} 
                              disabled={isAddingNote} 
                              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-bold disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 h-9 cursor-pointer"
                            >
                              {isAddingNote ? "Recording..." : "Record Note"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {profileTab === "timeline" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h4 className="font-extrabold text-xs uppercase text-primary border-b pb-1">Roster Chronological Timeline</h4>
                    <div className="relative border-l pl-4.5 ml-2.5 space-y-4">
                      {getTimelineEvents(selectedStudent).map((ev, i) => (
                        <div key={i} className="relative">
                          {/* Dot badge */}
                          <div className={cn("absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border", ev.color)}>
                            <ev.icon className="w-2.5 h-2.5" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-muted-foreground uppercase font-semibold">{ev.date}</span>
                            <h5 className="font-bold text-xs text-foreground mt-0.5">{ev.title}</h5>
                            <p className="text-muted-foreground text-[10px] mt-0.5 font-medium leading-relaxed">{ev.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-5 border-t bg-muted/15 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsProfileModalOpen(false)} className="px-4.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-all">Close Profile</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Students;
