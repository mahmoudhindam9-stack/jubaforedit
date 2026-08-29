const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// 1. Remove the misplaced factoryResetTransactions (it's between 3315 and 3348)
const misplacedRegex = /\n\s*factoryResetTransactions\(\) \{[\s\S]*?\},/g;
content = content.replace(misplacedRegex, "");

// 2. Put it before addJournalEntry(
const method = `
  factoryResetTransactions() {
    this.state.journalEntries = [];
    this.state.treasuryTransactions = [];
    
    // Reset mall transactions
    this.state.mallPayments = [];
    this.state.mallGardenRevenues = [];
    this.state.mallGardenExpenses = [];
    this.state.mallTerminatedContractsArchive = [];
    
    // Reset accounts to opening balance
    if (this.state.accounts) {
      this.state.accounts.forEach(acc => {
        acc.balance = acc.initial_balance || 0;
      });
    }

    // Reset treasuries to opening balance
    if (this.state.treasuries) {
      this.state.treasuries.forEach(tr => {
        tr.balance = tr.opening_balance || 0;
        tr.available_balance = tr.opening_balance || 0;
      });
    }

    if (this.state.suppliers) {
      this.state.suppliers.forEach(sup => {
        sup.balance = 0;
      });
    }

    this.saveState();
    this.logAction("ADMIN", "مسح جميع الحركات المحاسبية والمالية", "تم تصفير جميع الحركات بنجاح استعداداً للمزامنة.", "UPDATE");
  },
`;

content = content.replace(/(\s*)(addJournalEntry\([^)]*\)\s*\{)/, (match, spaces, funcDef) => {
  return spaces + method + spaces + funcDef;
});

fs.writeFileSync(path, content);
console.log("Fixed factoryResetTransactions 2");
