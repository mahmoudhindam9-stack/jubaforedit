const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Replace diff > 0 (gain) and diff < 0 (loss) accounts
content = content.replace(
  /account_code: "401000",\s*debit: 0,\s*credit: diff,/g,
  'account_code: "41010",\n          debit: 0,\n          credit: diff,',
);
content = content.replace(
  /account_code: "501000",\s*debit: Math\.abs\(diff\),\s*credit: 0,/g,
  'account_code: "31020",\n          debit: Math.abs(diff),\n          credit: 0,',
);

fs.writeFileSync(path, content);
console.log("Patched Mall termination accounts");
