const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Replace:
//               existingTxRefs.add(txKey);
//             },
//           },
//         }
content = content.replace(
  /existingTxRefs\.add\(txKey\);\n\s+\},\n\s+\},/g,
  "existingTxRefs.add(txKey);\n            }\n          }",
);

fs.writeFileSync(path, content);
console.log("Fixed inner if braces 4");
