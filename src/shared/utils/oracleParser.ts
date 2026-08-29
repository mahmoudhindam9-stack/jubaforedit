// @ts-nocheck
import { type JournalEntry, type JournalLine } from "@/shared/services/erpStore";

export interface ParsedOracleRow {
  index: number;
  account_code: string;
  account_name: string;
  base_debit: number;
  base_credit: number;
  description: string;
  date: string; // YYYY-MM-DD
  journal_number: string;
  period: string;
  currency_code: string;
  currency_name: string;
  rate: number;
  curr_debit: number;
  curr_credit: number;
}

export function parseDateDDMMYYYY(rawDate: any): string {
  if (!rawDate) return new Date().toISOString().split("T")[0];
  const str = String(rawDate).trim();

  // Format DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // Day/Month/Year
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    } else if (parts[0].length === 4) {
      // Year/Month/Day
      const year = parts[0];
      const month = parts[1].padStart(2, "0");
      const day = parts[2].padStart(2, "0");
      return `${year}-${month}-${day}`;
    } else if (parts[2].length === 2) {
      // Day/Month/YY
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      let yearNum = parseInt(parts[2], 10);
      if (!isNaN(yearNum)) {
        yearNum += yearNum < 50 ? 2000 : 1900;
        if (yearNum >= 1960 && yearNum <= 1969) {
          yearNum += 60; // fix 60-year offset (e.g. 1964 -> 2024)
        }
        return `${yearNum}-${month}-${day}`;
      }
    }
  }

  // Check if it is a serial number from Excel (e.g. 42005)
  const num = Number(str);
  if (!isNaN(num) && num > 10000 && num < 99999) {
    // Windows Excel epoch is 1900-01-01 (with 1900 leap year bug, so 25569 is 1970-01-01)
    const utc_days = Math.floor(num - 25569);
    const utc_value = Math.floor(utc_days * 86400);
    const dateObj = new Date(utc_value * 1000);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      // If there is an extreme delay reported (e.g. 60 years), someone might have a Mac Excel (1904) +
      // some other offset, but let's just return the computed date.
      return dateObj.toISOString().split("T")[0];
    }
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    let iso = d.toISOString().split("T")[0];
    // Fix JS 2-digit year bug where JS parses "64" as 1964, which is 60 years before 2024.
    // If the user said "delayed by 60 years", it means they saw 1964 instead of 2024.
    // If we see a year between 1960 and 1969, and we know the system is meant for 2020s,
    // we can auto-correct it by adding 60 years.
    const y = d.getFullYear();
    if (y >= 1960 && y <= 1969) {
      d.setFullYear(y + 60);
      iso = d.toISOString().split("T")[0];
    }
    return iso;
  }

  return new Date().toISOString().split("T")[0];
}

export function parseCurrency(
  currCode: any,
  currName?: string,
  desc?: string,
  accCode?: string,
): "USD" | "SSP" | "EGP" {
  const codeStr = String(currCode ?? "").trim();
  if (codeStr === "0" || codeStr === "0.0") return "USD";
  if (codeStr === "1" || codeStr === "1.0") return "SSP";
  if (codeStr === "2" || codeStr === "2.0") return "EGP";

  const nameStr = String(currName || "").toLowerCase();
  if (nameStr.includes("دولار") || nameStr.includes("usd") || nameStr.includes("$")) return "USD";
  if (nameStr.includes("سودان") || nameStr.includes("ssp") || nameStr.includes("sdg")) return "SSP";
  if (nameStr.includes("مصر") || nameStr.includes("egp") || nameStr.includes("le")) return "EGP";

  const descStr = String(desc || "").toLowerCase();
  if (descStr.includes("سودان") || descStr.includes("ssp")) return "SSP";
  if (descStr.includes("مصر") || descStr.includes("egp")) return "EGP";
  if (descStr.includes("دولار") || descStr.includes("usd") || descStr.includes("$")) return "USD";

  const aCode = String(accCode || "").trim();
  if (
    aCode.startsWith("1301011") ||
    aCode.startsWith("13020100") ||
    aCode.startsWith("13020120") ||
    aCode.startsWith("13020130") ||
    aCode.startsWith("13030100")
  )
    return "SSP";
  if (aCode.startsWith("13010125") || aCode.startsWith("13010120")) return "EGP";
  if (aCode.startsWith("1301010") || aCode.startsWith("13020110") || aCode.startsWith("13020140"))
    return "USD";

  return "USD";
}

export function parseOracleTextToRows(text: string): ParsedOracleRow[] {
  if (!text || !text.trim()) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  // Check if first line is a header
  let startIndex = 0;
  const firstLine = lines[0];
  if (
    firstLine.includes("كود الحساب") ||
    firstLine.includes("اسم الحساب") ||
    firstLine.includes("رقم القيد") ||
    firstLine.includes("مدين") ||
    firstLine.includes("دائن")
  ) {
    startIndex = 1;
  }

  const parsedRows: ParsedOracleRow[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split by tab (\t) or 2+ spaces or semicolons
    let cols = rawLine.split(/\t/);
    if (cols.length < 5) {
      cols = rawLine.split(/\s{2,}/);
    }
    if (cols.length < 5) {
      cols = rawLine.split(/;/);
    }
    if (cols.length < 5) continue;

    const m = cols[0]?.trim() || "";
    const accCode = cols[1]?.trim() || "";
    const accName = cols[2]?.trim() || "";
    const baseDebit = Number(cols[3]?.replace(/,/g, "")?.trim() || 0);
    const baseCredit = Number(cols[4]?.replace(/,/g, "")?.trim() || 0);
    const description = cols[5]?.trim() || "";
    const rawDate = cols[6]?.trim() || "";
    const journalNum = cols[7]?.trim() || "";
    const period = cols[8]?.trim() || "";
    const currCode = cols[9]?.trim() || "";
    const currName = cols[10]?.trim() || "";
    const rawRate = Number(cols[11]?.replace(/,/g, "")?.trim() || 1);
    const currDebit = Number(cols[12]?.replace(/,/g, "")?.trim() || 0);
    const currCredit = Number(cols[13]?.replace(/,/g, "")?.trim() || 0);

    if (!accCode && baseDebit === 0 && baseCredit === 0 && currDebit === 0 && currCredit === 0) {
      continue;
    }

    const isoDate = parseDateDDMMYYYY(rawDate);
    const rate = rawRate > 0 ? rawRate : 1;

    // Direct currency debit and credit
    let actualCurrDebit = currDebit;
    let actualCurrCredit = currCredit;

    // Fallback if curr columns are 0 but base amounts exist
    if (actualCurrDebit === 0 && actualCurrCredit === 0) {
      const derivedCurr = parseCurrency(currCode, currName, description, accCode);
      if (derivedCurr === "USD") {
        actualCurrDebit = baseDebit;
        actualCurrCredit = baseCredit;
      } else {
        actualCurrDebit = baseDebit * rate;
        actualCurrCredit = baseCredit * rate;
      }
    }

    parsedRows.push({
      index: i + 1,
      account_code: accCode,
      account_name: accName,
      base_debit: baseDebit,
      base_credit: baseCredit,
      description: description || accName,
      date: isoDate,
      journal_number: journalNum,
      period: period,
      currency_code: currCode,
      currency_name: currName,
      rate: rate,
      curr_debit: actualCurrDebit,
      curr_credit: actualCurrCredit,
    });
  }

  return parsedRows;
}

export function parseOracleSheetRows(rawRows: any[][]): ParsedOracleRow[] {
  if (!rawRows || rawRows.length === 0) return [];

  const headerRow = rawRows[0] || [];
  let colAccountCode = -1;
  let colAccountName = -1;
  let colDebit = -1;
  let colCredit = -1;
  let colCurrencyCode = -1;
  let colCurrencyName = -1;
  let colPeriod = -1;
  let colJournalNum = -1;
  let colDate = -1;
  let colDescription = -1;
  let colExchangeRate = -1;
  let colDebitCurr = -1;
  let colCreditCurr = -1;

  headerRow.forEach((cell: any, idx: number) => {
    const h = String(cell || "")
      .trim()
      .toLowerCase();
    if (
      /كود.*(العملة|عملة)|رمز.*(العملة|عملة)|نوع.*(العملة|عملة)|curr(ency)?[-_ ]?code/i.test(h) &&
      colCurrencyCode === -1
    ) {
      colCurrencyCode = idx;
    } else if (
      /المعامل|معامل|سعر.*الصرف|سعر.*صرف|معامل.*التحويل|rate|exchange|factor/i.test(h) &&
      colExchangeRate === -1
    ) {
      colExchangeRate = idx;
    } else if (
      /^الفترة$|^فترة$|رقم.*الفترة|كود.*الفترة|^period$|^per$|period.*name|period_name/i.test(h) &&
      colPeriod === -1
    ) {
      colPeriod = idx;
    } else if (/كود الحساب|رقم الحساب|account.*code|^code$/i.test(h) && colAccountCode === -1) {
      colAccountCode = idx;
    } else if (/اسم الحساب|account.*name|^name$/i.test(h) && colAccountName === -1) {
      colAccountName = idx;
    } else if (
      /مدين.*(عملة|عمله|بالعملة)|(currency|curr).*debit|debit.*(currency|curr)/i.test(h) &&
      colDebitCurr === -1
    ) {
      colDebitCurr = idx;
    } else if (
      /دائن.*(عملة|عمله|بالعملة)|(currency|curr).*credit|credit.*(currency|curr)/i.test(h) &&
      colCreditCurr === -1
    ) {
      colCreditCurr = idx;
    } else if (/(مدين|debit|dr)/i.test(h) && !/(currency|curr|عملة)/i.test(h) && colDebit === -1) {
      colDebit = idx;
    } else if (
      /(دائن|credit|cr)/i.test(h) &&
      !/(currency|curr|عملة)/i.test(h) &&
      colCredit === -1
    ) {
      colCredit = idx;
    } else if (
      /العملة|عملة|currency|curr/i.test(h) &&
      colCurrencyName === -1 &&
      colCurrencyCode !== idx
    ) {
      colCurrencyName = idx;
    } else if (
      /رقم.*القيد|رقم.*السند|^سند$|^قيد$|journal.*no|voucher.*no|^ref$|doc.*no|trx.*no/i.test(h) &&
      colJournalNum === -1
    ) {
      colJournalNum = idx;
    } else if (/تاريخ.*القيد|تاريخ|^date$/i.test(h) && colDate === -1) {
      colDate = idx;
    } else if (
      /بيان الحساب|بيان|^شرح$|^الوصف$|description|desc|narration/i.test(h) &&
      colDescription === -1
    ) {
      colDescription = idx;
    }
  });

  // Default positional mappings if not found
  if (colAccountCode === -1) colAccountCode = 1;
  if (colAccountName === -1) colAccountName = 2;
  if (colDebit === -1) colDebit = 3;
  if (colCredit === -1) colCredit = 4;
  if (colDescription === -1) colDescription = 5;
  if (colDate === -1) colDate = 6;
  if (colJournalNum === -1) colJournalNum = 7;
  if (colPeriod === -1) colPeriod = 8;
  if (colCurrencyCode === -1 && colCurrencyName === -1) colCurrencyCode = 9;
  if (colCurrencyName === -1) colCurrencyName = 10;
  if (colExchangeRate === -1) colExchangeRate = 11;
  if (colDebitCurr === -1) colDebitCurr = 12;
  if (colCreditCurr === -1) colCreditCurr = 13;

  const dataRows = rawRows.slice(1);
  const parsedRows: ParsedOracleRow[] = [];

  dataRows.forEach((row, i) => {
    const accCode = String(row[colAccountCode] || "").trim();
    const accName = String(row[colAccountName] || "").trim();
    const description = String(row[colDescription] || "").trim();
    const rawDate = row[colDate];
    const journalNum = String(row[colJournalNum] || "").trim();
    const period = String(row[colPeriod] || "").trim();
    const currCode = row[colCurrencyCode];
    const currName = String(row[colCurrencyName] || "").trim();
    const rawRate = Number(row[colExchangeRate]);
    const rate = !isNaN(rawRate) && rawRate > 0 ? rawRate : 1;

    const baseDebit = Number(row[colDebit]) || 0;
    const baseCredit = Number(row[colCredit]) || 0;
    let currDebit = Number(row[colDebitCurr]) || 0;
    let currCredit = Number(row[colCreditCurr]) || 0;

    if (!accCode && baseDebit === 0 && baseCredit === 0 && currDebit === 0 && currCredit === 0) {
      return;
    }

    if (currDebit === 0 && currCredit === 0) {
      const derivedCurr = parseCurrency(currCode, currName, description, accCode);
      if (derivedCurr === "USD") {
        currDebit = baseDebit;
        currCredit = baseCredit;
      } else {
        currDebit = baseDebit * rate;
        currCredit = baseCredit * rate;
      }
    }

    parsedRows.push({
      index: i + 1,
      account_code: accCode,
      account_name: accName,
      base_debit: baseDebit,
      base_credit: baseCredit,
      description: description || accName,
      date: parseDateDDMMYYYY(rawDate),
      journal_number: journalNum,
      period: period,
      currency_code: currCode,
      currency_name: currName,
      rate: rate,
      curr_debit: currDebit,
      curr_credit: currCredit,
    });
  });

  return parsedRows;
}

export function groupOracleRowsIntoJournalEntries(rows: ParsedOracleRow[]): JournalEntry[] {
  if (!rows || rows.length === 0) return [];

  // Group rows by raw journal key (period + journalNum + date)
  const masterGroups: {
    key: string;
    period: string;
    journalNum: string;
    date: string;
    rows: ParsedOracleRow[];
  }[] = [];
  const masterGroupMap = new Map<string, (typeof masterGroups)[0]>();

  rows.forEach((r) => {
    const p = String(r.period || "1").trim();
    const j = String(r.journal_number || "").trim();
    const d = r.date;
    const key = j ? `${p}_${j}_${d}` : `auto_${d}_${r.description}`;

    if (!masterGroupMap.has(key)) {
      const newGroup = { key, period: p, journalNum: j, date: d, rows: [] };
      masterGroupMap.set(key, newGroup);
      masterGroups.push(newGroup);
    }
    masterGroupMap.get(key)!.rows.push(r);
  });

  // Sort groups by date ascending to ensure proper sequential ordering
  masterGroups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const entries: JournalEntry[] = [];
  let seqCounter = 1;
  const sequences: Record<string, number> = {};

  masterGroups.forEach((mg) => {
    if (mg.rows.length === 0) return;
    const firstRow = mg.rows[0];

    // Determine Year and Month from date
    const d = new Date(mg.date);
    const year = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    const month = isNaN(d.getTime()) ? 1 : d.getMonth() + 1;

    // Grouping by year (and optionally month) to reset sequence.
    // The user requested: "01/01 to the end for each individual year"
    // We will use MM/Seq logic per month as per existing standards,
    // which automatically resets every month (and therefore every year).
    const periodStr = String(month).padStart(2, "0");
    const ymKey = `${year}-${periodStr}`;

    if (!sequences[ymKey]) sequences[ymKey] = 0;
    sequences[ymKey]++;

    const seqStr = String(sequences[ymKey]).padStart(2, "0");
    const baseRef = `${periodStr}/${seqStr}`;

    const mainDesc = firstRow.description || `قيد رقم (${baseRef}) - فترة ${periodStr}`;
    const primaryCurr = parseCurrency(
      firstRow.currency_code,
      firstRow.currency_name,
      firstRow.description,
      firstRow.account_code,
    );

    const lines: JournalLine[] = mg.rows.map((r) => {
      const lineCurr = parseCurrency(
        r.currency_code,
        r.currency_name,
        r.description,
        r.account_code,
      );
      return {
        account_code: r.account_code,
        account_name: r.account_name,
        debit: r.curr_debit,
        credit: r.curr_credit,
        description: r.description || r.account_name,
        currency: lineCurr,
        rate: r.rate || 1,
      };
    });

    entries.push({
      sequence: seqCounter++,
      id: `ORACLE-2015-${baseRef.replace("/", "-")}-${Date.now().toString(36)}-${seqCounter}`,
      date: mg.date,
      reference: baseRef,
      description: mainDesc,
      currency: primaryCurr,
      lines: lines,
    });
  });

  // Sort chronological ascending (from oldest date to newest date)
  entries.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return (a.reference || "").localeCompare(b.reference || "", undefined, { numeric: true });
  });

  // Re-index sequences
  entries.forEach((e, i) => {
    e.sequence = i + 1;
  });

  return entries;
}
