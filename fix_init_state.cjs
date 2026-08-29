const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Find:
//       }
//       totalDisposedExpiryValue: 0,
// Change to:
//       },
//       totalDisposedExpiryValue: 0,
content = content.replace(
  /\}\n\s+totalDisposedExpiryValue: 0,/g,
  "},\n      totalDisposedExpiryValue: 0,",
);

fs.writeFileSync(path, content);
console.log("Fixed init state brace");
