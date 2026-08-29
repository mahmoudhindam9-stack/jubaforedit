const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// 1. Patch postSalesInvoiceJournal
const posSalesRegex =
  /postSalesInvoiceJournal\([\s\S]*?this\.addJournalEntry\([\s\S]*?`INV-\$\{orderNumber\}`,\n\s*\);/;

const posSalesReplacement = `postSalesInvoiceJournal(
    orderNumber,
    total,
    subtotal,
    tax,
    paymentMethod = "cash",
    branchId,
    currency = "EGP",
    treasuryId = "tr-1",
    containerId,
  ) {
    const treasury = this.state.treasuries.find(t => t.id === treasuryId);
    let treasuryAccount = treasury?.account_code || "101000";
    // Ensure POS specific overrides if needed, but usually we use treasury's account
    // If it's a specific payment method not mapping to main treasury:
    if (paymentMethod === "card" && !treasury) treasuryAccount = "102000";
    else if (paymentMethod === "wallet" && !treasury) treasuryAccount = "103000";

    const lines = [
      {
        account_code: treasuryAccount,
        debit: total,
        credit: 0,
      },
      {
        account_code: "401000",
        debit: 0,
        credit: subtotal,
      },
      {
        account_code: "202000",
        debit: 0,
        credit: tax,
      },
    ];

    this.addJournalEntry(
      \`فاتورة مبيعات POS - طلب رقم #\${orderNumber}\`,
      lines,
      \`INV-\${orderNumber}\`,
      currency
    );`;

content = content.replace(posSalesRegex, posSalesReplacement);

// 2. Patch postSalesReturnJournal
const posReturnRegex =
  /postSalesReturnJournal\([\s\S]*?this\.addJournalEntry\(`مرتجع مبيعات POS - طلب رقم #\$\{orderNumber\}`,\s*lines,\s*`SRT-\$\{orderNumber\}`\);/;

const posReturnReplacement = `postSalesReturnJournal(
    orderNumber,
    total,
    paymentMethod = "cash",
    branchId,
    currency = "EGP",
    treasuryId = "tr-1",
    containerId,
  ) {
    const treasury = this.state.treasuries.find(t => t.id === treasuryId);
    let treasuryAccount = treasury?.account_code || "101000";
    if (paymentMethod === "card" && !treasury) treasuryAccount = "102000";
    else if (paymentMethod === "wallet" && !treasury) treasuryAccount = "103000";

    const lines = [
      {
        account_code: "401000",
        debit: total,
        credit: 0,
      },
      {
        account_code: treasuryAccount,
        debit: 0,
        credit: total,
      },
    ];

    this.addJournalEntry(\`مرتجع مبيعات POS - طلب رقم #\${orderNumber}\`, lines, \`SRT-\${orderNumber}\`, currency);`;

content = content.replace(posReturnRegex, posReturnReplacement);

fs.writeFileSync(path, content);
console.log("Patched POS Journal in erpStore.ts");
