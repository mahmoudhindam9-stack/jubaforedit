const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

const regex =
  /if \(treasury\) \{\s*this\.addTreasuryTransaction\([\s\S]*?skipJournal = false\n\s*\) \{/m;

const replacement = `if (treasury) {
        this.addTreasuryTransaction(
          treasury.id,
          "purchase",
          rawAmount,
          curr,
          \`سداد للمورد: \${supplier.name_ar} - \${params.note || ""}\`,
          ref,
          "cash",
          undefined,
          true
        );
      }
      supplier.balance -= rawAmount;
    } else if (params.type === "invoice") {
      ref = \`SUP-INV-\${refSeq}\`;
      lines.push({
        account_code: "103000",
        debit: rawAmount,
        credit: 0,
        currency: curr,
        rate: rate,
        description: params.note || \`فاتورة استحقاق بضاعة للمورد \${supplier.name_ar}\`,
      });
      lines.push({
        account_code: supAccCode,
        debit: 0,
        credit: rawAmount,
        currency: curr,
        rate: rate,
        description: params.note || \`فاتورة استحقاق بضاعة للمورد \${supplier.name_ar}\`,
      });
      supplier.balance += rawAmount;
    } else {
      ref = \`SUP-ADJ-\${refSeq}\`;
      lines.push({
        account_code: supAccCode,
        debit: rawAmount > 0 ? rawAmount : 0,
        credit: rawAmount < 0 ? Math.abs(rawAmount) : 0,
        currency: curr,
        rate: rate,
        description: params.note || \`تسوية رصيد حساب المورد \${supplier.name_ar}\`,
      });
      lines.push({
        account_code: "17010100",
        debit: rawAmount < 0 ? Math.abs(rawAmount) : 0,
        credit: rawAmount > 0 ? rawAmount : 0,
        currency: curr,
        rate: rate,
        description: params.note || \`تسوية رصيد حساب المورد \${supplier.name_ar}\`,
      });
      supplier.balance -= rawAmount;
    }
    this.addJournalEntry(
      \`حركة مورد (\${supplier.name_ar}) - \${params.note || ref}\`,
      lines,
      ref,
      curr,
      targetDate,
    );
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "تسجيل حركة مورد",
      \`تم تسجيل حركة \${params.type} بمبلغ \${rawAmount.toLocaleString()} \${curr} للمورد \${supplier.name_ar} (حساب #\${supAccCode}) برقم مرجعي \${ref}\`,
      "TRANSACTION",
    );
    this.notify();
    return {
      success: true,
      reference: ref,
      account_code: supAccCode,
      supplier_name: supplier.name_ar,
      amount: rawAmount,
      currency: curr,
      base_usd_amount: baseUsd,
    };
  }

  addTreasury(
    name_ar,
    type,
    currency,
    openingBalance = 0,
    employee = "غير محدد",
    containers = [],
    linked_to_restaurant = false,
    account_code,
  ) {
    const treasury = {
      id: "tr-" + Date.now(),
      branch_id: this.state.currentBranchId,
      name_ar,
      type,
      currency,
      balance: openingBalance,
      is_open: true,
      account_code: account_code || undefined,
      opening_balance: openingBalance,
      available_balance: openingBalance,
      responsible_employee: employee,
      status: "active",
      deleted: false,
      containers,
      linked_to_restaurant,
    };
    this.state.treasuries.push(treasury);
    this.saveState();
    this.logAction(
      "ADMIN",
      "إضافة حساب خزينة/بنك",
      \`تم إنشاء حساب \${name_ar} برصيد إفتتاحي \${openingBalance} \${currency}\`,
      "CREATE",
    );
    return treasury;
  }
  updateTreasury(id, payload) {
    const tr = this.state.treasuries.find((t) => t.id === id);
    if (tr) {
      Object.assign(tr, payload);
      this.saveState();
      this.logAction("ADMIN", "تعديل حساب خزينة/بنك", \`تم تعديل حساب: \${tr.name_ar}\`, "UPDATE");
    }
  }
  setTreasuryOpenStatus(treasuryId, isOpen) {
    const tr = this.state.treasuries.find((t) => t.id === treasuryId);
    if (tr) {
      const oldState = tr.is_open;
      tr.is_open = isOpen;
      tr.status = isOpen ? "active" : "closed";
      this.saveState();
      this.logAction(
        "ADMIN",
        isOpen ? "فتح الخزينة اليومي" : "إغلاق الخزينة اليومي",
        \`تم تغيير حالة خزينة \${tr.name_ar} إلى \${isOpen ? "مفتوحة" : "مغلقة"}\`,
        "UPDATE",
        \`isOpen: \${oldState}\`,
        \`isOpen: \${isOpen}\`,
      );
    }
  }
  deleteTreasury(id) {
    const trIndex = this.state.treasuries.findIndex((t) => t.id === id);
    const tr = this.state.treasuries[trIndex];
    if (tr) {
      if (Math.abs(tr.balance) > 0.001)
        throw new Error(
          \`لا يمكن حذف الخزينة وهي تحتوي على رصيد مالي نشط (\${tr.balance.toLocaleString()} \${tr.currency}).\`,
        );
      tr.deleted = true;
      tr.is_open = false;
      this.state.treasuries.splice(trIndex, 1);
      this.saveState();
      this.logAction("ADMIN", "حذف خزينة", \`تم حذف الخزينة \${tr.name_ar}\`, "DELETE");
    }
  }
  reconcileTreasury(treasuryId, actualCount, notes) {
    const tr = this.state.treasuries.find((t) => t.id === treasuryId);
    if (!tr) throw new Error("الخزينة غير موجودة");
    const ledgerBalance = tr.balance;
    const difference = actualCount - ledgerBalance;
    const recon = {
      id: "rec-" + Date.now(),
      treasury_id: treasuryId,
      date: new Date().toISOString(),
      ledger_balance: ledgerBalance,
      actual_balance: actualCount,
      difference,
      reconciled_by: this.state.currentUser,
      notes,
    };
    if (!this.state.reconciliations) this.state.reconciliations = [];
    this.state.reconciliations.unshift(recon);
    tr.balance = actualCount;
    tr.available_balance = actualCount;
    this.postReconciliationJournal(recon, tr);
    this.saveState();
    this.logAction(
      "ADMIN",
      "تسوية ومطابقة خزينة",
      \`تم تسوية خزينة \${tr.name_ar} بفارق \${difference.toFixed(2)} ج.م (جرد فعلي: \${actualCount})\`,
      "TRANSACTION",
    );
  }
  postReconciliationJournal(recon, tr) {
    const treasuryAccountCode =
      tr.type === "bank" ? "102000" : tr.branch_id === "branch-2" ? "101001" : "101000";
    const diff = recon.difference;
    const lines = [];
    if (diff > 0) {
      lines.push({
        account_code: treasuryAccountCode,
        debit: diff,
        credit: 0,
      });
      lines.push({
        account_code: "401000",
        debit: 0,
        credit: diff,
      });
    } else if (diff < 0) {
      lines.push({
        account_code: "506000",
        debit: Math.abs(diff),
        credit: 0,
      });
      lines.push({
        account_code: treasuryAccountCode,
        debit: 0,
        credit: Math.abs(diff),
      });
    }
    if (lines.length > 0)
      this.addJournalEntry(
        \`تسوية جرد مالي لخزينة \${tr.name_ar}\`,
        lines,
        \`REC-\${recon.id.substring(4, 9).toUpperCase()}\`,
      );
  }

  addTreasuryTransaction(
    treasuryId,
    type,
    amount,
    currency,
    note,
    relatedId,
    paymentMethod,
    containerId,
    skipJournal = false
  ) {`;

content = content.replace(regex, replacement);

fs.writeFileSync(path, content);
console.log("Restored missing code!");
