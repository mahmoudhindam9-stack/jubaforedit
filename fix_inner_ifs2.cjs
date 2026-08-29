const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// The lines:
//                   if (isMatch) {
//                     cntDebit += Number(line.debit || 0);
//                     cntCredit += Number(line.credit || 0);
//                   },
//                 },
//               });
//             });
content = content.replace(
  /cntCredit \+= Number\(line.credit \|\| 0\);\n\s+\},\n\s+\},/g,
  "cntCredit += Number(line.credit || 0);\n                  }\n                }",
);

fs.writeFileSync(path, content);
console.log("Fixed inner if braces 2");
