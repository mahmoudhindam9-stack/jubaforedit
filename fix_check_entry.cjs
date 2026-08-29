const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// We'll replace the checkEntry logic to also match the year if dateStr is provided
// Or just let's check if the date of the entry is in the same year as targetDate.

content = content.replace(
  /    let maxSeq = 0;\s*const checkEntry = \(je: any\) => \{\s*if \(!je \|\| !je\.reference\) return;\s*const ref = String\(je\.reference\)\.trim\(\);\s*if \(ref\.includes\("\/"\)\) \{\s*const parts = ref\.split\("\/"\);\s*if \(parts\[0\] === periodStr\) \{\s*const num = parseInt\(parts\[1\], 10\);\s*if \(!isNaN\(num\) && num > maxSeq\) \{\s*maxSeq = num;\s*\}\s*\}\s*\}\s*\};/g,
  `    let maxSeq = 0;
    const targetYear = dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear();
    const checkEntry = (je: any) => {
      if (!je || !je.reference) return;
      
      const jeYear = je.date ? new Date(je.date).getFullYear() : new Date().getFullYear();
      if (jeYear !== targetYear) return;
      
      const ref = String(je.reference).trim();
      if (ref.includes("/")) {
        const parts = ref.split("/");
        if (parts[0] === periodStr) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    };`,
);

fs.writeFileSync(path, content);
console.log("Fixed checkEntry for year boundary");
