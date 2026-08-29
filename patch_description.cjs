const fs = require("fs");
const path = "src/routes/admin/ledger.tsx";
let content = fs.readFileSync(path, "utf8");

// For autoBalanceDetails dialog
content = content.replace(
  '<AlertDialogDescription className="text-right text-sm leading-relaxed text-foreground/90 pt-2 space-y-4">',
  '<AlertDialogDescription asChild><div className="text-right text-sm leading-relaxed text-foreground/90 pt-2 space-y-4">',
);
content = content.replace(
  `              )}
            </AlertDialogDescription>`,
  `              )}
            </div></AlertDialogDescription>`,
);

// For closedYearAlertMessage dialog
content = content.replace(
  '<AlertDialogDescription className="text-right text-sm leading-relaxed text-foreground/90 pt-2 space-y-2">',
  '<AlertDialogDescription asChild><div className="text-right text-sm leading-relaxed text-foreground/90 pt-2 space-y-2">',
);
content = content.replace(
  `              </p>
            </AlertDialogDescription>`,
  `              </p>
            </div></AlertDialogDescription>`,
);

fs.writeFileSync(path, content);
console.log("Patched descriptions");
