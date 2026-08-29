const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// 1. Fix account code in recordMallPayment
content = content.replace(
  /account_code: "401000",\s*debit: isRefund \? absAmount : 0,\s*credit: isRefund \? 0 : absAmount,/g,
  'account_code: "41010130",\n            debit: isRefund ? absAmount : 0,\n            credit: isRefund ? 0 : absAmount,',
);

// 2. addMallGardenRevenue
const addRevRegex =
  /addMallGardenRevenue\(rev\) \{([\s\S]*?)this\.logAction\("ADMIN", "إضافة إيراد حديقة", `تم إضافة إيراد بقيمة \$\{newRev\.amount\}`, "CREATE"\);\n\s*\}/;
const addRevReplacement = `addMallGardenRevenue(rev, treasuryId, paymentMethod = "cash") {
    const newRev = {
      ...rev,
      id: "rev-" + Date.now(),
    };
    this.state.mallGardenRevenues = [...(this.state.mallGardenRevenues || []), newRev];
    
    if (treasuryId && newRev.amount > 0) {
      const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
      if (treasury) {
        const treasuryAccountCode = treasury.type === "bank" ? "102000" : (treasury.branch_id === "branch-2" ? "101001" : "101000");
        const lines = [
          { account_code: treasuryAccountCode, debit: newRev.amount, credit: 0 },
          { account_code: "430", debit: 0, credit: newRev.amount } // 430: ايرادات السنترال بوب (الحديقة)
        ];
        this.addJournalEntry(
          \`إيراد حديقة: \${newRev.title}\`,
          lines,
          newRev.id,
          "EGP",
          newRev.date
        );
        this.addTreasuryTransaction(
          treasuryId,
          "sales",
          newRev.amount,
          "EGP",
          \`إيراد حديقة: \${newRev.title}\`,
          newRev.id,
          paymentMethod,
          null,
          true
        );
      }
    }

    this.saveState();
    this.logAction("ADMIN", "إضافة إيراد حديقة", \`تم إضافة إيراد بقيمة \${newRev.amount}\`, "CREATE");
  }`;
content = content.replace(addRevRegex, addRevReplacement);

// 3. addMallGardenExpense
const addExpRegex =
  /addMallGardenExpense\(exp\) \{([\s\S]*?)this\.logAction\([\s\S]*?"إضافة مصروف مول\/حديقة",[\s\S]*?"CREATE",\n\s*\);\n\s*\}/;
const addExpReplacement = `addMallGardenExpense(exp, treasuryId, paymentMethod = "cash") {
    const newExp = {
      ...exp,
      id: "exp-" + Date.now(),
    };
    this.state.mallGardenExpenses = [...(this.state.mallGardenExpenses || []), newExp];
    
    if (treasuryId && newExp.amount > 0) {
      const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
      if (treasury) {
        const treasuryAccountCode = treasury.type === "bank" ? "102000" : (treasury.branch_id === "branch-2" ? "101001" : "101000");
        const lines = [
          { account_code: "31010", debit: newExp.amount, credit: 0 }, // 31010: مصروفات تشغيل المول/الحديقة
          { account_code: treasuryAccountCode, debit: 0, credit: newExp.amount }
        ];
        this.addJournalEntry(
          \`مصروف حديقة/مول: \${newExp.title}\`,
          lines,
          newExp.id,
          "EGP",
          newExp.date
        );
        this.addTreasuryTransaction(
          treasuryId,
          "withdrawal",
          newExp.amount,
          "EGP",
          \`مصروف حديقة/مول: \${newExp.title}\`,
          newExp.id,
          paymentMethod,
          null,
          true
        );
      }
    }

    this.saveState();
    this.logAction(
      "ADMIN",
      "إضافة مصروف مول/حديقة",
      \`تم إضافة مصروف \${newExp.title} بقيمة \${newExp.amount}\`,
      "CREATE",
    );
  }`;
content = content.replace(addExpRegex, addExpReplacement);

fs.writeFileSync(path, content);
console.log("Patched Mall Finance in erpStore.ts");
