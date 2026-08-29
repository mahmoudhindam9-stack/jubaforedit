const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// The lines:
//               if (resolved && resolved.id === tr.id) {
//                 isMatch = true;
//               },
//             },
//             if (isMatch) {
//               totalDebit += Number(line.debit || 0);
//               totalCredit += Number(line.credit || 0);
//             },

content = content.replace(
  /isMatch = true;\n\s+\},\n\s+\},/g,
  "isMatch = true;\n              }\n            }",
);
content = content.replace(
  /totalCredit \+= Number\(line.credit \|\| 0\);\n\s+\},/g,
  "totalCredit += Number(line.credit || 0);\n            }",
);

fs.writeFileSync(path, content);
console.log("Fixed inner if braces");
