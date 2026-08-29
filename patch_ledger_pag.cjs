const fs = require("fs");
const path = "src/routes/admin/ledger.tsx";
let content = fs.readFileSync(path, "utf8");

const target = `                    </table>
                  </div>
                </CardContent>`;

const replacement = `                    </table>
                  </div>

                  {/* Ledger Pagination */}
                  {ledgerTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        الصفحة {ledgerCurrentPage} من {ledgerTotalPages} (الإجمالي: {ledgerLines.length} حركة)
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={ledgerCurrentPage === 1}
                          onClick={() => setLedgerCurrentPage(p => Math.max(1, p - 1))}
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={ledgerCurrentPage === ledgerTotalPages}
                          onClick={() => setLedgerCurrentPage(p => Math.min(ledgerTotalPages, p + 1))}
                        >
                          التالي
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log("Patched ledger UI");
