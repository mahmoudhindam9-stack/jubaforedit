const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

const resetFunc = `
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

    // Reset suppliers balances to initial balances (assuming 0 for now)
    if (this.state.suppliers) {
      this.state.suppliers.forEach(sup => {
        sup.balance = 0;
      });
    }

    this.saveState();
    this.logAction("ADMIN", "مسح جميع الحركات المحاسبية والمالية", "تم تصفير جميع الحركات بنجاح استعداداً للمزامنة.", "UPDATE");
  },
`;

if (!content.includes("factoryResetTransactions() {")) {
  content = content.replace(/addJournalEntry\(/, resetFunc + "\n  addJournalEntry(");
  fs.writeFileSync(path, content);
  console.log("Added factoryResetTransactions to erpStore.ts");
}
