const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(/\},\n\s+:\s*s,/g, "}\n        : s,");

fs.writeFileSync(path, content);
console.log("Fixed ternary");
