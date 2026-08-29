const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// Find:
//               t = this.state.treasuries.find((x) => x.id === "tr-5");
//           },
//           if (t) liveBalance = t.balance || 0;
content = content.replace(
  /t = this\.state\.treasuries\.find\(\(x\) => x\.id === "tr-5"\);\n\s+\},\n\s+if \(t\)/g,
  't = this.state.treasuries.find((x) => x.id === "tr-5");\n          }\n          if (t)',
);

fs.writeFileSync(path, content);
console.log("Fixed treasury if block");
