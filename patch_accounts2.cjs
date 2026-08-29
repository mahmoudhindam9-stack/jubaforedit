const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

const injection = `
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
          if (!loadedAccounts.some((a) => a.code === acc.code)) {
            loadedAccounts.push({ ...acc, id: "acc-" + acc.code, balance: 0, balance_egp: 0, balance_usd: 0, initial_balance: 0, status: "active", system_binding: "none" });
          }
        });
`;

content = content.replace(
  /ORACLE_MIGRATION_ACCOUNTS\.forEach\(\(oracleAcc\) => \{[\s\S]*?\}\);\n/,
  (match) => {
    return match + injection;
  },
);

fs.writeFileSync(path, content);
console.log("Patched accounts 2");
