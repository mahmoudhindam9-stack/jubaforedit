const fs = require("fs");
const content = fs.readFileSync("src/routes/admin/mall.tsx", "utf8");
console.log(content.split("\\n").slice(0, 50).join("\\n"));
