const fs = require("fs");
const path = "src/routes/admin/ledger.tsx";
let content = fs.readFileSync(path, "utf8");

const insertStates = `  const [isAutoBalanceConfirmOpen, setIsAutoBalanceConfirmOpen] = useState(false);
  const [journalCurrentPage, setJournalCurrentPage] = useState(1);
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1);
  const itemsPerPage = 50;`;
content = content.replace(
  "  const [isAutoBalanceConfirmOpen, setIsAutoBalanceConfirmOpen] = useState(false);",
  insertStates,
);

const insertPaginatedLedger = `  }, [journalEntries, selectedAccountCode, currentAccount]);

  const paginatedLedger = useMemo(() => {
    const start = (ledgerCurrentPage - 1) * itemsPerPage;
    return ledgerLines.slice(start, start + itemsPerPage);
  }, [ledgerLines, ledgerCurrentPage]);

  const ledgerTotalPages = Math.ceil(ledgerLines.length / itemsPerPage);`;
content = content.replace(
  "  }, [journalEntries, selectedAccountCode, currentAccount]);",
  insertPaginatedLedger,
);

const insertPaginatedJournal = `  }, [
    journalEntries,
    journalSearch,
    journalCurrencyFilter,
    journalBalanceFilter,
    journalStartDate,
    journalEndDate,
    journalSortOrder,
    accounts,
  ]);

  const paginatedJournal = useMemo(() => {
    const start = (journalCurrentPage - 1) * itemsPerPage;
    return filteredJournal.slice(start, start + itemsPerPage);
  }, [filteredJournal, journalCurrentPage]);

  const journalTotalPages = Math.ceil(filteredJournal.length / itemsPerPage);`;

content = content.replace(
  `  }, [
    journalEntries,
    journalSearch,
    journalCurrencyFilter,
    journalBalanceFilter,
    journalStartDate,
    journalEndDate,
    journalSortOrder,
    accounts,
  ]);`,
  insertPaginatedJournal,
);

content = content.replace(
  "filteredJournal.map((entry, entryIndex) => {",
  "paginatedJournal.map((entry, entryIndex) => {",
);
content = content.replace("ledgerLines.map((line) => (", "paginatedLedger.map((line) => (");

fs.writeFileSync(path, content);
console.log("Patched states and lists");
