const fs = require("fs");
const path = "src/routes/admin/ledger.tsx";
let content = fs.readFileSync(path, "utf8");

const buttonHtml = `
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm("هل أنت متأكد من مسح جميع الحركات المحاسبية والمالية؟ لا يمكن التراجع عن هذه الخطوة.")) {
                erpStore.factoryResetTransactions();
                toast({
                  title: "تم المسح",
                  description: "تم تصفير جميع الحركات المحاسبية استعداداً للمزامنة.",
                  variant: "default"
                });
                // Force reload to refresh ui
                setTimeout(() => window.location.reload(), 1000);
              }
            }}
            className="gap-2 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">مسح الحركات وتصفير الأرصدة (تهيئة للمزامنة)</span>
          </Button>
`;

if (!content.includes("factoryResetTransactions")) {
  // We need to inject Trash2 import if not present
  if (!content.includes("Trash2")) {
    content = content.replace(
      /import {([^}]+)} from "lucide-react";/,
      'import { $1, Trash2 } from "lucide-react";',
    );
  }

  // Find where to inject the button. Let's place it next to "تصدير ميزان المراجعة" button or similar.
  // The header has a div with "flex items-center gap-2 flex-wrap" which contains the Title and Badge.
  // Wait, there's another div for buttons on the right.
  // Let's inject it into `<div className="flex flex-wrap items-center gap-2">` which has buttons.
  const injectRegex = /(<div className="flex flex-wrap items-center gap-2">)/;
  content = content.replace(injectRegex, `$1\n${buttonHtml}`);
  fs.writeFileSync(path, content);
  console.log("Patched ledger UI with wipe button");
}
