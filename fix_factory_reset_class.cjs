const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Replace `UPDATE");\n  },` with `UPDATE");\n  }`
content = content.replace(
  /UPDATE"\);\n  \},\n  addJournalEntry\(/g,
  'UPDATE");\n  }\n  addJournalEntry(',
);

fs.writeFileSync(path, content);
console.log("Removed comma from factoryResetTransactions");
