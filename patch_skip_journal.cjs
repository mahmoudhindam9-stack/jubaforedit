const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

const regex =
  /addTreasuryTransaction\([\s\S]*?containerId,\n\s*\) \{[\s\S]*?this\.postTreasuryJournal\(tx, tr\);\n\s*\}/;

const replacement = `addTreasuryTransaction(
    treasuryId,
    type,
    amount,
    currency,
    note,
    relatedId,
    paymentMethod,
    containerId,
    skipJournal = false
  ) {
    const tr = this.state.treasuries.find((t) => t.id === treasuryId);
    if (!tr) return;
    const beforeBal = tr.balance;
    if (type === "deposit" || type === "sales" || type === "transfer_in") {
      tr.balance += amount;
      tr.available_balance = tr.balance;
      if (containerId && tr.containers) {
        const cnt = tr.containers.find((c) => c.id === containerId);
        if (cnt) cnt.balance += amount;
      }
    } else {
      tr.balance -= amount;
      tr.available_balance = tr.balance;
      if (containerId && tr.containers) {
        const cnt = tr.containers.find((c) => c.id === containerId);
        if (cnt) cnt.balance -= amount;
      }
    }
    const tx = {
      id: "tx-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      branch_id: this.state.currentBranchId,
      treasury_id: treasuryId,
      type,
      amount,
      currency,
      payment_method: paymentMethod || "cash",
      note,
      related_entity_id: relatedId,
      created_at: new Date().toISOString(),
    };
    this.state.treasuryTransactions.unshift(tx);
    this.saveState();
    
    if (!skipJournal) {
      this.postTreasuryJournal(tx, tr);
    }
  }`;

content = content.replace(regex, replacement);

// Since all occurrences of addTreasuryTransaction already have manual journal entries (POS, Purchases, Rent, Vouchers, etc)
// except paySalary, wait, I can just append `true` to the calls in erpStore.ts
// I'll manually replace the POS sales call specifically if the global replace fails.
content = content.replace(/this\.addTreasuryTransaction\(([\s\S]*?)\);/g, (match, args) => {
  if (args.includes("true")) return match;
  // Just append true. But args can have commas.
  return `this.addTreasuryTransaction(${args}, true);`;
});

fs.writeFileSync(path, content);
console.log("Patched addTreasuryTransaction");
