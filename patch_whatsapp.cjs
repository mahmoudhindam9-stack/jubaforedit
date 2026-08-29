const fs = require("fs");
const path = "src/routes/admin/mall.tsx";
let content = fs.readFileSync(path, "utf8");

// 1. Add MessageCircle to lucide-react imports
content = content.replace(
  /Paperclip,\n\} from "lucide-react";/,
  'Paperclip,\n  MessageCircle,\n} from "lucide-react";',
);

// 2. Add DropdownMenu imports
const dropdownImport = `import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
`;
content = content.replace(
  /import \{ Button \} from "@\/components\/ui\/button";/,
  dropdownImport + 'import { Button } from "@/components/ui/button";',
);

// 3. Add handleSendWhatsApp function
const handleWhatsAppRegex = /const handleSaveTermination = \(\) => \{/;
const handleWhatsAppFunc = `  const handleSendWhatsApp = (shop: MallShop, type: string) => {
    if (!shop.phone || shop.phone === "-") {
      toast.error("لا يوجد رقم هاتف مسجل للمستأجر.");
      return;
    }

    let cleanPhone = shop.phone.replace(/\\D/g, "");
    if (!cleanPhone.startsWith("211") && !cleanPhone.startsWith("20") && !cleanPhone.startsWith("249")) {
        // Just a naive check, you might want to add country code prefix if not present, e.g. +211 for South Sudan
        // assuming standard numbers if no code is present. For now we will just use it as is if it has a code or append a default if needed.
        // If it starts with 0, remove 0 and add 211
        if (cleanPhone.startsWith("0")) {
            cleanPhone = "211" + cleanPhone.substring(1);
        }
    }

    let message = "";
    const tenantName = shop.tenant_name || "Valued Tenant";
    const shopNum = shop.shop_number || "";
    
    switch (type) {
      case "payment":
        message = \`Dear \${tenantName}, \\n\\nThis is a gentle reminder from Juba Mall Management regarding the rent payment for Shop #\${shopNum}. Please ensure the payment is settled at your earliest convenience to avoid any late fees. \\n\\nThank you for your cooperation.\`;
        break;
      case "renewal":
        message = \`Dear \${tenantName}, \\n\\nWe hope this message finds you well. This is a reminder from Juba Mall Management that your lease contract for Shop #\${shopNum} is approaching its expiration date. Please contact the management office to discuss renewal options. \\n\\nBest regards.\`;
        break;
      case "welcome":
        message = \`Dear \${tenantName}, \\n\\nWelcome to Juba Mall! We are thrilled to have you as part of our business community at Shop #\${shopNum}. If you need any assistance, please do not hesitate to contact the management office. \\n\\nBest of luck with your business!\`;
        break;
      case "violation":
        message = \`Dear \${tenantName}, \\n\\nThis is an official notice from Juba Mall Management regarding Shop #\${shopNum}. We have observed a violation of the mall's rules and regulations. Please rectify the issue immediately to avoid further action. \\n\\nFor more details, please visit the management office.\`;
        break;
      default:
        message = \`Dear \${tenantName}, \\n\\nMessage from Juba Mall Management regarding Shop #\${shopNum}.\`;
    }

    const whatsappUrl = \`https://wa.me/\${cleanPhone}?text=\${encodeURIComponent(message)}\`;
    window.open(whatsappUrl, "_blank");
  };

  const handleSaveTermination = () => {`;

content = content.replace(handleWhatsAppRegex, handleWhatsAppFunc);

// 4. Add the button in the shop card
const shopActionsRegex =
  /<Button\n\s*size="sm"\n\s*variant="outline"\n\s*className="h-8 text-xs font-bold gap-1 rounded-xl bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer"\n\s*onClick=\{[^{}]*setViewingContractShop\(shop\)[^{}]*\}\n\s*>\n\s*<Paperclip size=\{14\} \/>\n\s*المرفقات \(عقد والهوية\)\n\s*<\/Button>/;

const shopActionsReplacement = `<Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1 rounded-xl bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer"
                    onClick={() => setViewingContractShop(shop)}
                  >
                    <Paperclip size={14} />
                    المرفقات
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-bold gap-1 rounded-xl bg-green-50 text-green-600 border-green-200 hover:bg-green-100 cursor-pointer"
                      >
                        <MessageCircle size={14} />
                        واتساب
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent dir="rtl" className="w-48 rounded-xl font-bold text-xs">
                      <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendWhatsApp(shop, 'payment')}>
                        تذكير بالسداد (Payment)
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendWhatsApp(shop, 'renewal')}>
                        تجديد العقد (Renewal)
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendWhatsApp(shop, 'welcome')}>
                        رسالة ترحيب (Welcome)
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => handleSendWhatsApp(shop, 'violation')}>
                        إنذار مخالفة (Violation)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>`;

content = content.replace(shopActionsRegex, shopActionsReplacement);

fs.writeFileSync(path, content);
console.log("Updated WhatsApp Integration");
