const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(/\},\n\s+async/g, "}\n  async");
content = content.replace(/\},\n\s+get /g, "}\n  get ");
content = content.replace(/\},\n\s+set /g, "}\n  set ");
content = content.replace(/\},\n\s+private /g, "}\n  private ");
content = content.replace(/\},\n\s+public /g, "}\n  public ");

fs.writeFileSync(path, content);
console.log("Fixed async and other modifiers commas");
