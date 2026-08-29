const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(/\}\s*0\);/g, "}, 0);");

fs.writeFileSync(path, content);
console.log("Fixed reduce");
