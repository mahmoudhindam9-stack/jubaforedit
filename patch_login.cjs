const fs = require("fs");
const path = "src/routes/login.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(/\(u\) =>\n\s*\(u\.username/, "(u: any) =>\n        (u.username");

fs.writeFileSync(path, content);
