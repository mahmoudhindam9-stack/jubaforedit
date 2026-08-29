const fs = require("fs");
const path = "src/routes/admin/ledger.tsx";
let content = fs.readFileSync(path, "utf8");

const target1 = `    return matchingEntries
      .map(({ entry, line }) => {`;
const rep1 = `    return matchingEntries
      .map(({ entry, line }, index) => {`;
content = content.replace(target1, rep1);

const target2 = `        return {
          id: \`\${entry.id}-\${line.account_code}\`,`;
const rep2 = `        return {
          id: \`\${entry.id}-\${line.account_code}-\${index}\`,`;
content = content.replace(target2, rep2);

fs.writeFileSync(path, content);
console.log("Keys fixed");
