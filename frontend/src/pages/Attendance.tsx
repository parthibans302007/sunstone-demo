import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Check, Save, UserCheck, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const Attendance = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    const fetchStudents = async () => {
      try {
        const { data } = await api.get("/students");
        // Filter by selected category
        const filtered = data.filter((s: any) => s.category?._id === selectedCategory);
        setStudents(filtered);
        
        // initialize all present
        const initialMap: Record<string, boolean> = {};
        filtered.forEach((s: any) => {
          initialMap[s._id] = true;
        });
        setAttendance(initialMap);
      } catch (error) {
        console.error("Failed to fetch students", error);
      }
    };
    fetchStudents();
  }, [selectedCategory]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  
  const toggle = (id: string) => setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
  const selectAll = () => setAttendance(Object.fromEntries(students.map((s) => [s._id, true])));
  const deselectAll = () => setAttendance(Object.fromEntries(students.map((s) => [s._id, false])));

  const presentCount = Object.values(attendance).filter(Boolean).length;

  const handleSave = async () => {
    if (!subject) {
      toast.error("Please enter a subject name");
      return;
    }
    
    setLoading(true);
    try {
      const records = students.map(s => ({
        student: s._id,
        status: attendance[s._id] ? 'Present' : 'Absent'
      }));

      await api.post('/attendance', {
        date: new Date().toISOString(),
        category: selectedCategory,
        subject,
        records
      });

      toast.success(`Attendance saved for ${subject}`, {
        description: `${presentCount}/${students.length} students marked present`,
      });
    } catch (error: any) {
      toast.error("Failed to save attendance", {
        description: error.response?.data?.message || "An error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header capsule */}
      <div className="bg-gradient-to-r from-sidebar-accent/10 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Mark Attendance</h1>
          <p className="text-xs text-muted-foreground font-medium">Capture daily lecture participation sheets for classroom rosters.</p>
        </div>
        <div className="bg-card border border-border px-4 py-2 rounded-xl text-xs font-semibold shadow-sm select-none shrink-0 relative z-10">
          <span>{today}</span>
        </div>
      </div>

      {/* Roster Controls Card */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Department / Batch</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <select
                className="w-full border border-border/80 rounded-xl pl-9 pr-3 h-10 text-sm bg-card text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="" disabled>Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lecture Subject Title</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input 
                className="pl-9 h-10 bg-card focus-visible:ring-primary focus-visible:border-primary" 
                placeholder="e.g. Database Systems, Financial Accounting" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          <div className="flex gap-2 text-xs">
            <Button variant="outline" className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider" onClick={selectAll}>Present All</Button>
            <Button variant="outline" className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider" onClick={deselectAll}>Absent All</Button>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            Status count: <span className="text-foreground font-bold">{presentCount}</span> / <span className="font-bold">{students.length}</span> marked present
          </span>
        </div>
      </div>

      {/* Students Marking Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Class Roster List</span>
          {students.length > 0 && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Ready to submit
            </span>
          )}
        </div>

        <div className="divide-y divide-border/40 max-h-[500px] overflow-y-auto">
          {students.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2.5 text-muted-foreground">
              <AlertCircle className="w-8 h-8" />
              <p className="text-xs font-semibold">No students enrolled in this category/batch yet.</p>
            </div>
          ) : (
            students.map((student) => {
              const isChecked = attendance[student._id];
              const nameStr = student.user?.name || "Student User";
              const initials = nameStr.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
              
              return (
                <motion.button
                  key={student._id}
                  variants={itemVariants}
                  onClick={() => toggle(student._id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-3.5 text-left border-l-2 transition-all duration-200 outline-none",
                    isChecked 
                      ? "bg-success/5 border-l-success border-b border-b-success/10" 
                      : "border-l-transparent hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200",
                    isChecked 
                      ? "bg-success border-success text-white scale-105 shadow-sm" 
                      : "border-muted-foreground/30 bg-card hover:border-muted-foreground/50"
                  )}>
                    {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center text-xs font-bold border shrink-0">
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-snug">{nameStr}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5 tracking-wider">{student.rollNumber}</p>
                  </div>

                  <span className={cn(
                    "text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0",
                    isChecked 
                      ? "bg-success/15 text-success border-success/20" 
                      : "bg-destructive/15 text-destructive border-destructive/20"
                  )}>
                    {isChecked ? "Present" : "Absent"}
                  </span>
                </motion.button>
              )
            })
          )}
        </div>
      </motion.div>

      {/* Roster Submission Footer */}
      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleSave} 
          disabled={loading || students.length === 0}
          className="bg-primary hover:bg-primary/95 text-white font-semibold px-5 rounded-xl shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center gap-2 active:scale-95 h-11"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving sheet...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Submit Attendance Sheet</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Attendance;
