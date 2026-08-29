const fs = require("fs");
const path = "src/routes/cashier-treasury.tsx";
let content = fs.readFileSync(path, "utf8");

const regex = /const targetName =[\s\S]*?erpStore\.addJournalEntry\([\s\S]*?\);/;

const replacement = `const target = erpState.treasuries.find((t) => t.id === transferTargetTreasury);
    const targetName = target?.name_ar || "";
    const source = erpState.treasuries.find((t) => t.id === cashierTreasuryId);
    
    const sourceAccountCode = source?.account_code || "101000";
    const targetAccountCode = target?.account_code || "101000";

    erpStore.addTreasuryTransaction(
      cashierTreasuryId,
      "transfer_out",
      transferAmount,
      transferCurrency,
      \`تحويل نقدية إلى \${targetName}\`,
      undefined,
      transferPaymentMethod,
      undefined,
    );
    erpStore.addTreasuryTransaction(
      transferTargetTreasury,
      "transfer_in",
      transferAmount,
      transferCurrency,
      \`استلام نقدية من \${cashierTreasury.name_ar}\`,
      undefined,
      transferPaymentMethod,
      undefined,
    );

    erpStore.addJournalEntry(
      \`إقفال شيفت / تحويل نقدية من \${cashierTreasury.name_ar} إلى \${targetName}\`,
      [
        { account_code: targetAccountCode, debit: transferAmount, credit: 0 },
        { account_code: sourceAccountCode, debit: 0, credit: transferAmount },
      ],
      "SHIFT-" + Date.now().toString().slice(-6),
      transferCurrency
    );`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
