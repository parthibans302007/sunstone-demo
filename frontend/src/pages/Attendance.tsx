import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Check, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

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
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Mark Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </div>

      <div className="bg-card rounded-lg border p-5 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1.5 block">Category / Batch</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-card h-10"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="" disabled>Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
             <label className="text-sm font-medium mb-1.5 block">Subject</label>
             <Input 
                className="h-10" 
                placeholder="e.g. Mathematics, Programming" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
             />
          </div>
          <div className="flex gap-2 h-10">
            <Button variant="outline" className="h-full" onClick={selectAll}>Select All</Button>
            <Button variant="outline" className="h-full" onClick={deselectAll}>Deselect All</Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <span className="text-sm font-medium">Student List</span>
          <span className="text-sm text-muted-foreground">{presentCount}/{students.length} present</span>
        </div>
        <div className="divide-y">
          {students.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No students found for this category.</div>
          ) : (
            students.map((student) => (
              <button
                key={student._id}
                onClick={() => toggle(student._id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 text-left transition-colors",
                  attendance[student._id] ? "bg-success/5" : "hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                  attendance[student._id] ? "bg-success border-success" : "border-muted-foreground/30"
                )}>
                  {attendance[student._id] && <Check className="w-4 h-4 text-success-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{student.user?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} disabled={loading || students.length === 0}>
          <Save className="w-4 h-4 mr-2" /> {loading ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </>
  );
};

export default Attendance;
