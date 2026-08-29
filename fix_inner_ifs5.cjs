const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Replace:
//           if (!isNaN(num) && num > maxSeq) {
//             maxSeq = num;
//           },
content = content.replace(/maxSeq = num;\n\s+\},/g, "maxSeq = num;\n          }");

fs.writeFileSync(path, content);
console.log("Fixed inner if braces 5");
