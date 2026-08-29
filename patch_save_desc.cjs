const fs = require("fs");
const path = "src/routes/admin/ledger.tsx";
let content = fs.readFileSync(path, "utf8");

// For Save Confirmation Dialog
content = content.replace(
  '<AlertDialogDescription className="text-right text-sm space-y-3 pt-2 text-foreground/80 leading-relaxed">',
  '<AlertDialogDescription asChild><div className="text-right text-sm space-y-3 pt-2 text-foreground/80 leading-relaxed">',
);
content = content.replace(
  `              </div>
            </AlertDialogDescription>`,
  `              </div>
            </div></AlertDialogDescription>`,
);

fs.writeFileSync(path, content);
console.log("Patched save description");
