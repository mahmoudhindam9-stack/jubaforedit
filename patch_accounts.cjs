const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

const accountsInjection = `
    const standardAccounts = [
      { code: "101000", name_ar: "خزينة الكاشير الرئيسية", name_en: "Main Cashier Treasury", type: "asset", level: 4, parent_code: "13010" },
      { code: "102000", name_ar: "حساب البنك / فيزا", name_en: "Bank / Card", type: "asset", level: 4, parent_code: "13010" },
      { code: "103000", name_ar: "محافظ إلكترونية", name_en: "E-Wallets", type: "asset", level: 4, parent_code: "13010" },
      { code: "201100", name_ar: "تأمينات مستأجرين", name_en: "Tenant Deposits", type: "liability", level: 4, parent_code: "2" },
      { code: "202000", name_ar: "الضرائب المستحقة", name_en: "Taxes Payable", type: "liability", level: 4, parent_code: "2" },
      { code: "401000", name_ar: "إيرادات المبيعات / المطعم", name_en: "Sales / Restaurant Revenue", type: "revenue", level: 4, parent_code: "4" },
      { code: "501000", name_ar: "تكلفة البضاعة المباعة", name_en: "COGS", type: "expense", level: 4, parent_code: "5" }
    ];
    standardAccounts.forEach(acc => {
      if (!this.state.accounts.find(a => a.code === acc.code)) {
        this.state.accounts.push({ ...acc, id: "acc-" + acc.code, balance: 0, balance_egp: 0, balance_usd: 0, is_active: true });
      }
    });
`;

const initRegex =
  /(if \(!this\.state\.accounts \|\| this\.state\.accounts\.length === 0\) \{[\s\S]*?this\.state\.accounts = \[\.\.\.DEFAULT_ACCOUNTS\];\n\s*\})/;

if (initRegex.test(content)) {
  content = content.replace(initRegex, `$1\n${accountsInjection}`);
  // Also run it on loadState
  const loadStateRegex = /(Object\.assign\(this\.state,\s*parsed\);)/;
  content = content.replace(loadStateRegex, `$1\n${accountsInjection}`);
}

fs.writeFileSync(path, content);
console.log("Patched erpStore.ts with standard accounts");
