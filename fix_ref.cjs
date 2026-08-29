const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// We want to replace the `generateJournalReference` method's top part.
// From:
//   generateJournalReference(
//     ...
//   ) {
//     if (providedRef && String(providedRef).trim()) {
//       const trimmed = String(providedRef).trim();
//       if (trimmed.includes("/")) {
//         const parts = trimmed.split("/");
//         const pClean = parts[0].trim().padStart(2, "0");
//         const jClean = parts[1].trim().padStart(2, "0");
//         return `${pClean}/${jClean}`;
//       }
//       return trimmed;
//     }

content = content.replace(
  /  generateJournalReference\([\s\S]*?\) \{\s*if \(providedRef && String\(providedRef\)\.trim\(\)\) \{\s*const trimmed = String\(providedRef\)\.trim\(\);\s*if \(trimmed\.includes\("\/"\)\) \{\s*const parts = trimmed\.split\("\/"\);\s*const pClean = parts\[0\]\.trim\(\)\.padStart\(2, "0"\);\s*const jClean = parts\[1\]\.trim\(\)\.padStart\(2, "0"\);\s*return \`\$\{pClean\}\/\$\{jClean\}\`;\s*\}\s*return trimmed;\s*\}/,
  `  generateJournalReference(
    dateStr?: string,
    providedRef?: string,
    pendingEntries: any[] = [],
    periodVal?: any,
    journalNumVal?: any,
  ) {
    if (providedRef && String(providedRef).trim()) {
      const trimmed = String(providedRef).trim();
      if (/^\\d{2}\\/\\d{2,}$/.test(trimmed)) {
        const parts = trimmed.split("/");
        const pClean = parts[0].trim().padStart(2, "0");
        const jClean = parts[1].trim().padStart(2, "0");
        return \`\${pClean}/\${jClean}\`;
      }
    }`,
);

fs.writeFileSync(path, content);
console.log("Fixed generateJournalReference");
