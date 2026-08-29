const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Any }, followed by } catch
content = content.replace(/\},\n(\s*)\}\s*catch/g, "}\n$1} catch");

fs.writeFileSync(path, content);
console.log("Fixed catch commas");
