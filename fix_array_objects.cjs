const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Replace `}\n  {` with `},\n  {`
// Any `}\s*\{` where there are only spaces/newlines between them.
content = content.replace(/\}(\s+)\{/g, "},$1{");

fs.writeFileSync(path, content);
console.log("Fixed missing commas between objects");
