const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(/\},\s*;/g, "};");

fs.writeFileSync(path, content);
console.log("Fixed comma semicolon");
