const fs = require("fs");
const path = "src/routes/admin/ledger.tsx";
let content = fs.readFileSync(path, "utf8");

const target = `                  })
                )}
              </div>
            </CardContent>`;

const replacement = `                  })
                )}

                {/* Journal Pagination */}
                {journalTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 p-4 border rounded-xl bg-muted/10">
                    <div className="text-sm text-muted-foreground">
                      الصفحة {journalCurrentPage} من {journalTotalPages} (الإجمالي: {filteredJournal.length} قيد)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={journalCurrentPage === 1}
                        onClick={() => setJournalCurrentPage(p => Math.max(1, p - 1))}
                      >
                        السابق
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={journalCurrentPage === journalTotalPages}
                        onClick={() => setJournalCurrentPage(p => Math.min(journalTotalPages, p + 1))}
                      >
                        التالي
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log("Patched journal UI");
