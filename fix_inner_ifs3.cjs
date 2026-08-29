const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// The lines:
//               linkedTreasuryTransactions++;
//             },
//           },
//         }
content = content.replace(
  /linkedTreasuryTransactions\+\+;\n\s+\},\n\s+\},/g,
  "linkedTreasuryTransactions++;\n            }\n          }",
);

fs.writeFileSync(path, content);
console.log("Fixed inner if braces 3");
