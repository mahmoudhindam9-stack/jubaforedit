const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(/\},\s*else/g, "} else");
content = content.replace(/\},\s*catch/g, "} catch");
content = content.replace(/\},;/g, "};");
content = content.replace(/\},\[\];/g, "}];");
content = content.replace(/\},\s*\)/g, "})");

// Also fix `},\n  [a-zA-Z]` if it's a statement like `const`, `return`, `if`, etc.
content = content.replace(
  /\},\n(\s*)(return|if|const|let|var|console|throw|this|break|continue|switch|for|while)/g,
  "}\n$1$2",
);

fs.writeFileSync(path, content);
console.log("Fixed common comma errors");
