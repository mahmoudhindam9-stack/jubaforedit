const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /const entry = \{\s*id:\s*customId/g,
  `if (reference && !/^\\d{2}\\/\\d{2,}$/.test(String(reference).trim())) {
      description = description + " - المرجع: " + String(reference).trim();
    }
    const entry = {
      id:
        customId`,
);

fs.writeFileSync(path, content);
console.log("Fixed addJournalEntry description");
