const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// The code looks like this:
// inventorySettings: parsed.inventorySettings || {
//   allowNegativeStock: true,
//   defaultUnit: "كيلو",
// }
// totalDisposedExpiryValue: ...
// So we need to find `}\n          totalDisposedExpiryValue` and replace with `},\n          totalDisposedExpiryValue`
content = content.replace(/\}(\n\s+totalDisposedExpiryValue)/g, "},$1");

fs.writeFileSync(path, content);
console.log("Fixed comma before totalDisposedExpiryValue");
