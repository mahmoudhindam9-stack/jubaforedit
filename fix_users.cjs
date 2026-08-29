const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Replace `  }\n  manager: {` with `  },\n  manager: {`
// and same for cashier etc.
content = content.replace(/\}(\n\s+manager:)/g, "},$1");
content = content.replace(/\}(\n\s+cashier:)/g, "},$1");
content = content.replace(/\}(\n\s+captain:)/g, "},$1");
content = content.replace(/\}(\n\s+kitchen:)/g, "},$1");
content = content.replace(/\}(\n\s+accountant:)/g, "},$1");

fs.writeFileSync(path, content);
console.log("Fixed missing commas in DEFAULT_PERMISSIONS");
