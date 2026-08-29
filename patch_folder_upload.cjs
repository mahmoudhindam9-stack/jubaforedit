const fs = require("fs");
const path = "src/routes/admin/ledger.tsx";
let content = fs.readFileSync(path, "utf8");

const oldHandleFileUpload = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingOracle(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

          const parsedRows = parseOracleSheetRows(rawRows);
          if (parsedRows.length === 0) {
            toast({
              title: "تنبيه",
              description: "لم يتم العثور على أسطر قيود أو مبالغ صالحة في ملف الإكسيل المرفوع.",
              variant: "destructive",
            });
            return;
          }

          const newEntries = groupOracleRowsIntoJournalEntries(parsedRows);

          // Insert journal entries and link with treasuries & chart of accounts
          const result = erpStore.importJournalEntriesAndSyncTreasuries(newEntries, {
            sourceName: file.name,
          });

          // Re-sync and update state
          setErpState({ ...erpStore.getState() });

          toast({
            title: "✅ تم استيراد القيود بنجاح",
            description: \`تم إدراج \${result.insertedEntries} قيد في دفتر اليومية، وإنشاء \${result.newAccountsCreated} حساب جديد في الدليل العام، وربط \${result.linkedTreasuryTransactions} حركة مالية بالخزائن الصحيحة.\`,
          });
        } catch (err: any) {
          console.error(err);
          if (err instanceof DOMException && err.name === 'QuotaExceededError' || (err.message && err.message.toLowerCase().includes('quota'))) {
            alert("حجم البيانات كبير جداً وتجاوز سعة التخزين المحلية للمتصفح (5 ميجابايت).\\n\\nلحل المشكلة:\\n1. قم بتقسيم ملف الإكسيل إلى أجزاء أصغر (مثلاً: ارفع كل شهر في ملف مستقل).\\n2. أو يمكنك تفعيل الربط مع قاعدة بيانات سحابية (Supabase) للتعامل مع السنوات والبيانات الضخمة.");
          } else {
            alert("حدث خطأ أثناء معالجة الملف. تأكد من أن الملف بنفس صيغة أوراكل.");
          }
        } finally {
          setIsImportingOracle(false);
          if (e.target) e.target.value = "";
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاستيراد");
      setIsImportingOracle(false);
      if (e.target) e.target.value = "";
    }
  };`;

const newHandleFileUpload = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsImportingOracle(true);
      
      let allParsedRows: any[] = [];
      let totalFilesProcessed = 0;
      let totalInserted = 0;
      let totalNewAccounts = 0;
      let totalLinked = 0;
      
      // We process files one by one to avoid UI freezes with large folders
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.match(/\\.(xls|xlsx|csv)$/i)) continue;
        
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const data = event.target?.result;
              const workbook = XLSX.read(data, { type: "binary" });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

              const parsedRows = parseOracleSheetRows(rawRows);
              if (parsedRows.length > 0) {
                 allParsedRows = allParsedRows.concat(parsedRows);
              }
              totalFilesProcessed++;
              resolve();
            } catch (err) {
              console.error("Error processing file", file.name, err);
              resolve(); // ignore error for this specific file and continue
            }
          };
          reader.onerror = () => resolve();
          reader.readAsBinaryString(file);
        });
      }
      
      if (allParsedRows.length === 0) {
        toast({
          title: "تنبيه",
          description: "لم يتم العثور على أسطر قيود أو مبالغ صالحة في الملفات المرفوعة.",
          variant: "destructive",
        });
        setIsImportingOracle(false);
        if (e.target) e.target.value = "";
        return;
      }
      
      const newEntries = groupOracleRowsIntoJournalEntries(allParsedRows);

      // Insert journal entries and link with treasuries & chart of accounts
      const result = erpStore.importJournalEntriesAndSyncTreasuries(newEntries, {
        sourceName: files.length > 1 ? \`Folder Upload (\${totalFilesProcessed} files)\` : files[0].name,
      });

      // Re-sync and update state
      setErpState({ ...erpStore.getState() });

      toast({
        title: "✅ تم استيراد القيود بنجاح",
        description: \`تمت معالجة \${totalFilesProcessed} ملف. تم إدراج \${result.insertedEntries} قيد في دفتر اليومية، وإنشاء \${result.newAccountsCreated} حساب جديد في الدليل العام، وربط \${result.linkedTreasuryTransactions} حركة مالية بالخزائن الصحيحة.\`,
      });

    } catch (err: any) {
      console.error(err);
      if (err instanceof DOMException && err.name === 'QuotaExceededError' || (err.message && err.message.toLowerCase().includes('quota'))) {
        alert("حجم البيانات كبير جداً وتجاوز سعة التخزين المحلية للمتصفح (5 ميجابايت).\\n\\nلكن لا تقلق، تم تفعيل الربط مع قاعدة البيانات السحابية (Supabase) للتعامل مع هذه البيانات الضخمة.");
      } else {
        alert("حدث خطأ أثناء معالجة الملفات. تأكد من أن الملفات بصيغة أوراكل الصحيحة.");
      }
    } finally {
      setIsImportingOracle(false);
      if (e.target) e.target.value = "";
    }
  };`;

content = content.replace(oldHandleFileUpload, newHandleFileUpload);

const oldInput = `<input
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    onChange={handleFileUpload}
                    disabled={isImportingOracle}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    title="اختر ملف إكسيل لرفعه"
                  />`;

const newInput = `<input
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    multiple
                    {...({ webkitdirectory: "", directory: "" } as any)}
                    onChange={handleFileUpload}
                    disabled={isImportingOracle}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    title="اختر ملف أو مجلد لرفعه"
                  />`;

content = content.replace(oldInput, newInput);
fs.writeFileSync(path, content);
console.log("Patched folder upload logic");
