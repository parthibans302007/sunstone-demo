import { cn } from "@/lib/utils";
import { CalendarRange, Calendar, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const timetable = [
  { time: "09:00 - 10:00", mon: "Data Structures", tue: "Database Systems", wed: "Operating Systems", thu: "Computer Networks", fri: "Software Engg.", sat: "" },
  { time: "10:00 - 11:00", mon: "Database Systems", tue: "Data Structures", wed: "Computer Networks", thu: "Operating Systems", fri: "Lab", sat: "Data Structures" },
  { time: "11:15 - 12:15", mon: "Operating Systems", tue: "Software Engg.", wed: "Data Structures", thu: "Database Systems", fri: "Lab", sat: "Software Engg." },
  { time: "01:00 - 02:00", mon: "Computer Networks", tue: "Operating Systems", wed: "Software Engg.", thu: "Data Structures", fri: "Computer Networks", sat: "" },
  { time: "02:00 - 03:00", mon: "Lab", tue: "Lab", wed: "Database Systems", thu: "Lab", fri: "", sat: "" },
];

const holidays = [
  { date: "Jan 26", name: "Republic Day", desc: "National celebration of Republic declaration" },
  { date: "Mar 29", name: "Good Friday", desc: "Observance holiday" },
  { date: "Apr 14", name: "Ambedkar Jayanti", desc: "Birth anniversary of B.R. Ambedkar" },
  { date: "Aug 15", name: "Independence Day", desc: "National Independence Day" },
  { date: "Oct 2", name: "Gandhi Jayanti", desc: "Birth anniversary of Mahatma Gandhi" },
  { date: "Nov 01", name: "Diwali", desc: "Festival of lights" },
  { date: "Dec 25", name: "Christmas", desc: "Winter festival" },
];

const days = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

const Timetable = () => (
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
          <CalendarRange className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Schedule & Timetable</h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">CS Department · Semester IV · Division A</p>
        </div>
      </div>
    </div>

    {/* Timetable Planner Grid Card */}
    <motion.div variants={itemVariants} className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weekly Class Schedule</span>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3 h-3" /> Standard Timing
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-border/40 bg-muted/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-5 w-32">Time Block</th>
              {dayLabels.map((d) => (
                <th key={d} className="py-3 px-4 text-center">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-semibold">
            {timetable.map((row, i) => (
              <tr key={i} className="hover:bg-muted/15 transition-colors">
                <td className="py-4 px-5 text-muted-foreground font-mono text-[10px] whitespace-nowrap bg-muted/5">{row.time}</td>
                {days.map((d) => {
                  const subjectName = row[d];
                  const isLab = subjectName === "Lab";
                  
                  return (
                    <td key={d} className="py-3 px-2 text-center">
                      {subjectName ? (
                        <div 
                          className={cn(
                            "mx-auto px-2.5 py-2 rounded-xl text-center flex flex-col justify-center gap-1 border max-w-[120px] transition-transform duration-200 hover:scale-102",
                            isLab 
                              ? "bg-accent/10 border-accent/25 text-accent shadow-inner" 
                              : "bg-primary/5 border-primary/20 text-foreground"
                          )}
                        >
                          <span className="truncate block font-bold text-[11px] leading-tight">{subjectName}</span>
                          <span className="text-[8px] text-muted-foreground/80 font-bold uppercase tracking-wider flex items-center justify-center gap-0.5">
                            <MapPin className="w-2 h-2 text-primary" /> {isLab ? "CS Lab A" : "Room 204"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30 font-bold">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>

    {/* Holiday Grid list Card */}
    <motion.div variants={itemVariants} className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <Calendar className="w-4.5 h-4.5 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Annual Academic Holidays 2026</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {holidays.map((h, index) => {
          const dateMonth = h.date.split(" ")[0];
          const dateDay = h.date.split(" ")[1];
          
          return (
            <div 
              key={index} 
              className="flex items-center gap-3.5 p-3.5 rounded-xl bg-muted/40 border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group"
            >
              {/* background logo */}
              <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-125 transition-transform duration-500 text-foreground">
                <Calendar className="w-16 h-16" />
              </div>

              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/15 border border-primary/20 flex flex-col justify-center items-center text-center shrink-0">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider leading-none">{dateMonth}</p>
                <p className="text-base font-black text-primary leading-none mt-1">{dateDay}</p>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground leading-snug">{h.name}</p>
                <p className="text-[9px] text-muted-foreground/85 font-semibold line-clamp-1 leading-snug">{h.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  </motion.div>
);

export default Timetable;
