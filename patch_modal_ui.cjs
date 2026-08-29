const fs = require("fs");
const path = "src/routes/admin/mall.tsx";
let content = fs.readFileSync(path, "utf8");

// Section 1.1 additions (floor, area)
const shopDetailsSectionRegex =
  /<Input\n\s*value=\{contractForm\.custom_activity\}[\s\S]*?className="rounded-xl font-bold"\n\s*\/>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/;
const shopDetailsSectionReplacement = `
                  <Input
                    value={contractForm.custom_activity}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, custom_activity: e.target.value })
                    }
                    placeholder={
                      contractForm.language === "en"
                        ? "e.g., Clothing & Fashion"
                        : "مثال: ملابس وأزياء نسائية"
                    }
                    className="rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Floor" : "الطابق"}
                  </label>
                  <Input
                    value={contractForm.floor}
                    onChange={(e) => setContractForm({ ...contractForm, floor: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Area (sqm)" : "المساحة (متر مربع)"}
                  </label>
                  <Input
                    value={contractForm.area}
                    onChange={(e) => setContractForm({ ...contractForm, area: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>`;

content = content.replace(shopDetailsSectionRegex, shopDetailsSectionReplacement);

// Section 2 additions (authorized_representative, tenant_address)
const tenantDetailsSectionRegex =
  /<Input\n\s*value=\{contractForm\.id_number\}[\s\S]*?className="rounded-xl"\n\s*\/>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/;
const tenantDetailsSectionReplacement = `
                  <Input
                    value={contractForm.id_number}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, id_number: e.target.value })
                    }
                    placeholder={
                      contractForm.language === "en"
                        ? "National ID / Passport"
                        : "رقم القومي / الهوية"
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Authorized Rep." : "الممثل المفوض"}
                  </label>
                  <Input
                    value={contractForm.authorized_representative}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, authorized_representative: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Address" : "العنوان"}
                  </label>
                  <Input
                    value={contractForm.tenant_address}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, tenant_address: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>`;

content = content.replace(tenantDetailsSectionRegex, tenantDetailsSectionReplacement);

// Section 3 additions (currency, payment_due_date, payment_method, service_charge, other_charges, etc.)
const leaseFinancialsRegex =
  /<Input\n\s*type="number"\n\s*value=\{contractForm\.advance_payment\}[\s\S]*?className="rounded-xl font-bold text-emerald-600"\n\s*\/>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/;

const leaseFinancialsReplacement = `
                  <Input
                    type="number"
                    value={contractForm.advance_payment}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, advance_payment: Number(e.target.value) })
                    }
                    className="rounded-xl font-bold text-emerald-600"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Currency" : "العملة"}
                  </label>
                  <Select
                    value={contractForm.currency}
                    onValueChange={(v: any) => setContractForm({ ...contractForm, currency: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir={contractForm.language === "en" ? "ltr" : "rtl"}>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="SSP">SSP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Payment Due Date" : "تاريخ الاستحقاق"}
                  </label>
                  <Input
                    value={contractForm.payment_due_date}
                    onChange={(e) => setContractForm({ ...contractForm, payment_due_date: e.target.value })}
                    placeholder={contractForm.language === "en" ? "e.g., 5th of month" : "مثال: 5 من كل شهر"}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Payment Method" : "طريقة السداد"}
                  </label>
                  <Input
                    value={contractForm.payment_method}
                    onChange={(e) => setContractForm({ ...contractForm, payment_method: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Lease Term" : "مدة الإيجار"}
                  </label>
                  <Input
                    value={contractForm.lease_term}
                    onChange={(e) => setContractForm({ ...contractForm, lease_term: e.target.value })}
                    placeholder={contractForm.language === "en" ? "e.g., 1 Year" : "مثال: سنة واحدة"}
                    className="rounded-xl"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Renewal Option" : "خيار التجديد"}
                  </label>
                  <Input
                    value={contractForm.renewal_option}
                    onChange={(e) => setContractForm({ ...contractForm, renewal_option: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Service Charge" : "رسوم الخدمات"}
                  </label>
                  <Input
                    value={contractForm.service_charge}
                    onChange={(e) => setContractForm({ ...contractForm, service_charge: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Annual Escalation" : "الزيادة السنوية"}
                  </label>
                  <Input
                    value={contractForm.annual_escalation}
                    onChange={(e) => setContractForm({ ...contractForm, annual_escalation: e.target.value })}
                    placeholder="%"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Fit-out Period (Days)" : "فترة التجهيز (أيام)"}
                  </label>
                  <Input
                    value={contractForm.fit_out_period}
                    onChange={(e) => setContractForm({ ...contractForm, fit_out_period: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Utilities Included" : "المرافق المشمولة"}
                  </label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={contractForm.electricity_included} 
                        onChange={(e) => setContractForm({ ...contractForm, electricity_included: e.target.checked })} 
                      />
                      {contractForm.language === "en" ? "Electricity" : "الكهرباء"}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={contractForm.water_included} 
                        onChange={(e) => setContractForm({ ...contractForm, water_included: e.target.checked })} 
                      />
                      {contractForm.language === "en" ? "Water" : "المياه"}
                    </label>
                  </div>
                </div>
                
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-foreground">
                    {contractForm.language === "en" ? "Other Charges" : "رسوم أخرى"}
                  </label>
                  <Input
                    value={contractForm.other_charges}
                    onChange={(e) => setContractForm({ ...contractForm, other_charges: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

              </div>
            </div>`;

content = content.replace(leaseFinancialsRegex, leaseFinancialsReplacement);
fs.writeFileSync(path, content);
console.log("Updated Modal UI");
