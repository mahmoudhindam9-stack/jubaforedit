const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Replace `}\n  "something"` with `},\n  "something"`
content = content.replace(/\}(\n\s+")[a-zA-Z0-9@.\-_]+(":\s*\{)/g, "},$1$2");

fs.writeFileSync(path, content);
console.log("Fixed missing commas before quoted keys");
