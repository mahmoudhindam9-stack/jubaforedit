const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Find:
//               });
//             },
//           });
// Change to:
//               });
//             }
//           });
content = content.replace(/\s*\}\);\n\s*\},/g, "\n              });\n            }");

fs.writeFileSync(path, content);
console.log("Fixed brace");
