import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, BookOpen, Layers, Check, Edit2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface Category {
  _id: string;
  name: string;
  description: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData);
      } else {
        await api.post("/categories", formData);
      }
      setFormData({ name: "", description: "" });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category", error);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description });
    setEditingId(category._id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-sm font-semibold">
        Loading departments...
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sidebar-accent/10 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Category Management</h1>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Configure and define academic branches, departments, or cohort batches.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Card */}
        <motion.div variants={itemVariants} className="lg:col-span-1 bg-card border border-border/60 rounded-2xl p-5 shadow-sm h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Layers className="w-4.5 h-4.5 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase">{editingId ? "Modify Category" : "Add Category"}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Category Name</label>
              <Input
                placeholder="e.g. Computer Science, MBA, BCA"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-10 bg-transparent focus-visible:ring-primary focus-visible:border-primary text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
              <textarea
                placeholder="Details about program, semesters, and intakes..."
                className="flex min-h-[100px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs uppercase h-10 active:scale-95 shadow-sm">
                {editingId ? "Update Category" : "Create Category"}
              </Button>
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setEditingId(null); setFormData({ name: "", description: "" }); }}
                  className="rounded-xl h-10 text-xs font-bold"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Right Categories Table Card */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registered Departments</span>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {categories.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left align-middle border-collapse">
              <thead className="bg-muted/30 border-b border-border/40">
                <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3">Category Name</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 font-bold text-foreground">{category.name}</td>
                    <td className="px-5 py-4 text-muted-foreground font-semibold leading-relaxed max-w-xs truncate">{category.description || "—"}</td>
                    <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(category)}
                        className="rounded-xl w-8 h-8 hover:bg-primary/10 text-primary border border-transparent hover:border-primary/20 transition-colors"
                        title="Edit Category"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(category._id)}
                        className="rounded-xl w-8 h-8 hover:bg-destructive/10 text-destructive border border-transparent hover:border-destructive/20 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6" />
                      <span className="text-xs font-semibold">No departments found. Create one to begin.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Categories;
