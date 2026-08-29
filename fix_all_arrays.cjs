const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(/\}(\n\s+)\{/g, "},$1{");

fs.writeFileSync(path, content);
console.log("Fixed all missing commas between objects in arrays");
