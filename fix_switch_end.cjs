const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Find:
//             default:
//               break;
//           },
content = content.replace(
  /default:\n\s+break;\n\s+\},/g,
  "default:\n              break;\n          }",
);

fs.writeFileSync(path, content);
console.log("Fixed switch block end brace");
