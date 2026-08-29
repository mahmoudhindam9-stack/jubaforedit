const fs = require("fs");
const path = "src/features/inventory/components/PurchaseManagement.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  '<AlertDialogDescription className="text-xs space-y-2">',
  '<AlertDialogDescription asChild><div className="text-xs space-y-2 text-muted-foreground">',
);
content = content.replace(
  `              </div>
            </AlertDialogDescription>`,
  `              </div>
            </div></AlertDialogDescription>`,
);

fs.writeFileSync(path, content);
console.log("Patched PurchaseManagement");
