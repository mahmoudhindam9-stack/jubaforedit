const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Replace `            },\n            case "something"` with `            }\n            case "something"`
content = content.replace(/\s*\},(\n\s+case ")/g, "\n            }$1");
// And for `default:`
content = content.replace(/\s*\},(\n\s+default:)/g, "\n            }$1");

fs.writeFileSync(path, content);
console.log("Fixed switch case blocks");
