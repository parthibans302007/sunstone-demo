import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  
  // Custom Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", rollNumber: "", category: "", contactNumber: "", parentContact: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchStudents = async () => {
    try {
      const [studentsRes, categoriesRes] = await Promise.all([
        api.get("/students"),
        api.get("/categories")
      ]);
      setStudents(studentsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/students", newStudent);
      setIsModalOpen(false);
      setNewStudent({ name: "", email: "", rollNumber: "", category: "", contactNumber: "", parentContact: "" });
      toast.success("Student correctly added to database!");
      fetchStudents(); // live refresh
    } catch (error: any) {
      console.error("Failed to add student", error);
      toast.error(error.response?.data?.message || "Failed to add student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = students.filter((s) => {
    const deptMatch = deptFilter === "all" || s.category?._id === deptFilter;
    const nameMatch = s.user?.name?.toLowerCase().includes(search.toLowerCase());
    const rollMatch = s.rollNumber?.toLowerCase().includes(search.toLowerCase());
    return deptMatch && (nameMatch || rollMatch);
  });

  return (
    <>
      <div className="mb-6 bg-gradient-to-r from-sidebar-accent/10 to-transparent p-6 rounded-2xl border border-border/50 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">Students Directory</h1>
          <p className="text-sm text-muted-foreground mt-1 text-balance">Manage and view student performance profiles.</p>
        </div>
        {user?.role === "admin" && (
          <button onClick={() => setIsModalOpen(true)} className="relative z-10 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8 glass p-2 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <Input placeholder="Search by name or roll number..." className="pl-11 bg-transparent border-none shadow-none focus-visible:ring-0 text-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-px bg-border/50 hidden sm:block mx-1"></div>
        <div className="flex items-center gap-2 px-2">
          <Filter className="w-4 h-4 text-muted-foreground/70" />
          <select
            className="bg-transparent text-sm font-medium focus:outline-none focus:ring-0 text-foreground py-2 cursor-pointer w-full sm:w-auto"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {categories.map((c: any) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading students...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground border border-dashed rounded-xl">No students found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((student) => {
            const initial = student.user?.name ? student.user.name.charAt(0) : "S";
            const attendance = 100; // API needs to return calculated value
            return (
              <button
                key={student._id}
                onClick={() => navigate(`/students/${student._id}`)}
                className="glass-card p-5 text-left group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary shadow-inner group-hover:scale-110 transition-transform duration-300">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{student.user?.name || "Unknown"}</p>
                      <p className="text-xs font-mono text-muted-foreground">{student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-3 font-medium bg-muted/40 p-2 rounded-lg">
                    <span className="text-muted-foreground">{student.category?.name || "N/A"}</span>
                    <span className={cn("px-1.5 py-0.5 rounded", attendance >= 75 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                      {attendance}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn("h-1.5 rounded-full transition-all duration-1000", attendance >= 75 ? "bg-success" : "bg-destructive")}
                    style={{ width: `${attendance}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight">Add New Student</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="add-student-form" onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Full Name</label>
                    <input required className="w-full border rounded-lg px-3 py-2 text-sm bg-background/50 focus:ring-1 focus:ring-primary outline-none" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Email & Login</label>
                    <input type="email" required className="w-full border rounded-lg px-3 py-2 text-sm bg-background/50 focus:ring-1 focus:ring-primary outline-none" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} placeholder="john@sunstone.edu" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Roll Number</label>
                    <input required className="w-full border rounded-lg px-3 py-2 text-sm bg-background/50 focus:ring-1 focus:ring-primary outline-none" value={newStudent.rollNumber} onChange={e => setNewStudent({...newStudent, rollNumber: e.target.value})} placeholder="CS-2026-001" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Program / Department</label>
                    <select required className="w-full border rounded-lg px-3 py-2 text-sm bg-background/50 focus:ring-1 focus:ring-primary outline-none" value={newStudent.category} onChange={e => setNewStudent({...newStudent, category: e.target.value})}>
                      <option value="" disabled>Select Department</option>
                      {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Student Contact</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background/50 focus:ring-1 focus:ring-primary outline-none" value={newStudent.contactNumber} onChange={e => setNewStudent({...newStudent, contactNumber: e.target.value})} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Parent Contact</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background/50 focus:ring-1 focus:ring-primary outline-none" value={newStudent.parentContact} onChange={e => setNewStudent({...newStudent, parentContact: e.target.value})} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-muted/50 transition-colors">Cancel</button>
              <button type="submit" form="add-student-form" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-70">
                {isSubmitting ? "Creating..." : "Save to Database"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Students;
