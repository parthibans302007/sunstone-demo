import { cn } from "@/lib/utils";

const timetable = [
  { time: "9:00 - 10:00", mon: "Data Structures", tue: "Database Systems", wed: "Operating Systems", thu: "Computer Networks", fri: "Software Engg.", sat: "" },
  { time: "10:00 - 11:00", mon: "Database Systems", tue: "Data Structures", wed: "Computer Networks", thu: "Operating Systems", fri: "Lab", sat: "Data Structures" },
  { time: "11:15 - 12:15", mon: "Operating Systems", tue: "Software Engg.", wed: "Data Structures", thu: "Database Systems", fri: "Lab", sat: "Software Engg." },
  { time: "1:00 - 2:00", mon: "Computer Networks", tue: "Operating Systems", wed: "Software Engg.", thu: "Data Structures", fri: "Computer Networks", sat: "" },
  { time: "2:00 - 3:00", mon: "Lab", tue: "Lab", wed: "Database Systems", thu: "Lab", fri: "", sat: "" },
];

const holidays = [
  { date: "Jan 26", name: "Republic Day" },
  { date: "Mar 29", name: "Good Friday" },
  { date: "Apr 14", name: "Ambedkar Jayanti" },
  { date: "Aug 15", name: "Independence Day" },
  { date: "Oct 2", name: "Gandhi Jayanti" },
  { date: "Nov 1", name: "Diwali" },
  { date: "Dec 25", name: "Christmas" },
];

const days = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Timetable = () => (
  <>
    <div className="mb-6">
      <h1 className="text-xl font-bold">Timetable & Holidays</h1>
      <p className="text-sm text-muted-foreground mt-0.5">CS Department — Year 2 — Semester IV</p>
    </div>

    <div className="glass-card mb-6 overflow-x-auto rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
            {dayLabels.map((d) => (
              <th key={d} className="text-center py-3 px-4 font-medium text-muted-foreground">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timetable.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">{row.time}</td>
              {days.map((d) => (
                <td key={d} className="py-3 px-4 text-center">
                  {row[d] ? (
                    <span className={cn("text-xs px-2 py-1 rounded", row[d] === "Lab" ? "bg-accent/10 text-accent" : "bg-primary/5 text-foreground")}>
                      {row[d]}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="glass-card p-6 rounded-xl">
      <h3 className="text-sm font-semibold mb-4">Holiday Calendar 2024</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {holidays.map((h) => (
          <div key={h.date} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
            <div className="w-12 text-center">
              <p className="text-xs text-muted-foreground">{h.date.split(" ")[0]}</p>
              <p className="text-lg font-bold">{h.date.split(" ")[1]}</p>
            </div>
            <p className="text-sm font-medium">{h.name}</p>
          </div>
        ))}
      </div>
    </div>
  </>
);

export default Timetable;
