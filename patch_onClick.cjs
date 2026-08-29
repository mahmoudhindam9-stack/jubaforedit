const fs = require("fs");
const path = "src/routes/admin/mall.tsx";
let content = fs.readFileSync(path, "utf8");

const regex =
  /printContractContent\([\s\S]*?contractForm\.language,\n                      contractForm\.id_image\n                    \);/g;

const replacement = `printContractContent(
                      contractForm,
                      shops.find((s) => s.id === contractForm.shop_id)?.shop_number || "---"
                    );`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log("Updated onClick");
