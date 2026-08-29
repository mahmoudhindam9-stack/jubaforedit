const fs = require("fs");
const path = "src/routes/cashier-treasury.tsx";
let content = fs.readFileSync(path, "utf8");

// Replace addTreasuryTransaction calls to include `, true`
content = content.replace(
  /transferPaymentMethod,\n\s*undefined,\n\s*\);/g,
  "transferPaymentMethod,\n      undefined,\n      true\n    );",
);

fs.writeFileSync(path, content);
console.log("Patched cashier-treasury.tsx skipJournal");
