const fs = require('fs');

function edit(path, replacements) {
  let s = fs.readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    if (!s.includes(from)) throw new Error(`Pattern not found in ${path}: ${from.slice(0,120)}`);
    s = s.replace(from, to);
  }
  fs.writeFileSync(path, s);
}

edit('src/shared/services/tableOrdersStore.ts', [
  [
    'export interface TableCartLine { item: MenuItem; quantity: number; notes?: string; selectedAdditions?: any[]; }',
    'export interface TableCartLine { item: MenuItem; quantity: number; notes?: string; selectedAdditions?: any[]; }',
  ],
]);

edit('src/components/TableOrderModal.tsx', [
  ['  const [orderNotes, setOrderNotes] = useState("");\n', ''],
  ['        setOrderNotes(existing.notes || "");\n', ''],
  ['        setOrderNotes("");\n', ''],
  [
    '      if (existing) {\n        setCart(existing.items || []);\n        setSelectedAdditions(existing.selectedAdditions || []);',
    '      if (existing) {\n        setCart(existing.items || []);\n        setSelectedAdditions(existing.selectedAdditions || []);',
  ],
  [
    '      const existing = prev.find((c) => c.item.id === item.id);\n      if (existing) {\n        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));\n      }\n      return [...prev, { item, quantity: 1 }];',
    '      const existing = prev.find((c) => c.item.id === item.id);\n      if (existing) {\n        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));\n      }\n      return [...prev, { item, quantity: 1, notes: "" }];',
  ],
  ['      notes: orderNotes,\n', '      notes: "",\n'],
  ['            notes: orderNotes\n              ? `طاولة #${table.number} - ${orderNotes}${currency && currency !== "EGP" ? ` | العملة: ${currency}` : ""}`\n              : `طاولة #${table.number}${currency && currency !== "EGP" ? ` | العملة: ${currency}` : ""}`,', '            notes: `طاولة #${table.number}`,'],
  [
    '              name_ar: c.item.name_ar,\n              price: c.item.price,\n              quantity: c.quantity,\n              requires_oven: c.item.requires_oven || false,',
    '              name_ar: c.item.name_ar,\n              price: c.item.price,\n              quantity: c.quantity,\n              notes: c.notes || "",\n              requires_oven: c.item.requires_oven || false,',
  ],
  ['      notes: orderNotes,\n', '      notes: "",\n'],
  [
    '              {((line.selectedAdditions && line.selectedAdditions.length > 0) ||\n                        line.notes) && (',
    '              {((line.selectedAdditions && line.selectedAdditions.length > 0) ||\n                        line.notes) && (',
  ],
  [
    '                      {line.notes && (\n                            <div>\n                              <span className="font-bold mr-1">ملاحظات:</span>\n                              {line.notes}\n                            </div>\n                          )}',
    '                      {line.notes && (\n                            <div>\n                              <span className="font-bold mr-1">ملاحظات:</span>\n                              {line.notes}\n                            </div>\n                          )}\n                      <textarea\n                        rows={2}\n                        value={line.notes || ""}\n                        onChange={(e) => setCart((prev) => prev.map((c) => c.item.id === line.item.id ? { ...c, notes: e.target.value } : c))}\n                        placeholder={lang === "ar" ? "ملاحظة خاصة بهذا الصنف..." : "Note for this item..."}\n                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold outline-none focus:border-indigo-500 resize-none"\n                      />',
  ],
  [
    '              {/* Order Notes */}\n              <div>\n                <label className="text-[11px] font-bold text-slate-600 block mb-0.5">\n                  {lang === "ar" ? "ملاحظات وتخصيص الطلب:" : "Order Notes & Requests:"}\n                </label>\n                <textarea\n                  rows={2}\n                  placeholder={\n                    lang === "ar"\n                      ? "مثال: بدون بصل، صوص إضافي..."\n                      : "e.g. No onions, extra sauce..."\n                  }\n                  value={orderNotes}\n                  onChange={(e) => setOrderNotes(e.target.value)}\n                  className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-xs font-semibold outline-none focus:border-indigo-500 transition resize-none"\n                />\n              </div>\n\n',
    '              {/* Per-item notes are entered directly on each cart line above. */}\n',
  ],
]);

edit('src/routes/pos.tsx', [
  ['type CartLine = { item: MenuItem; quantity: number };', 'type CartLine = { item: MenuItem; quantity: number; notes?: string };'],
  ['  const [orderNotes, setOrderNotes] = useState("");\n', ''],
  ['    setOrderNotes(tableOrder.notes || "");\n', ''],
  ['    setOrderNotes("");\n', ''],
  [
    '      if (existing) {\n        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));\n      }\n      return [...prev, { item, quantity: 1 }];',
    '      if (existing) {\n        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));\n      }\n      return [...prev, { item, quantity: 1, notes: "" }];',
  ],
  [
    '        orderNotes\n          ? `${lang === "ar" ? "الطلبات الخاصة: " : "Special Requests: "}${orderNotes}`\n          : "",\n',
    '',
  ],
  [
    '            price: c.item.price,\n            quantity: c.quantity,\n            requires_oven: (c.item as any).requires_oven || false,',
    '            price: c.item.price,\n            quantity: c.quantity,\n            notes: c.notes || "",\n            requires_oven: (c.item as any).requires_oven || false,',
  ],
  ['      if (activeTableKitchenOrderId) {', '      if (activeTableKitchenOrderId) {'],
  [
    '            status: activeTableOrderSentToKitchen ? "served" : "pending",\n        notes: finalNotes || null,',
    '            status: activeTableOrderSentToKitchen ? "served" : "pending",\n        notes: finalNotes || null,',
  ],
  [
    '            <div className="mb-4">\n              <Label className="text-sm font-bold">{t.order_notes}</Label>\n              <textarea\n                className="w-full mt-1 rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:border-primary"\n                rows={2}\n                value={orderNotes}\n                onChange={(e) => setOrderNotes(e.target.value)}\n                placeholder={t.notes_placeholder}\n              />\n            </div>\n\n',
    '            <div className="mb-4 p-3 rounded-2xl bg-muted/40 border border-border/70">\n              <Label className="text-sm font-bold block mb-2">{lang === "ar" ? "ملاحظات كل صنف" : "Notes per item"}</Label>\n              <div className="space-y-2">\n                {cart.map((c) => (\n                  <div key={c.item.id} className="rounded-xl border border-border bg-background p-2">\n                    <div className="text-xs font-bold mb-1">{c.item.name_ar}</div>\n                    <textarea\n                      rows={2}\n                      value={c.notes || ""}\n                      onChange={(e) => setCart((prev) => prev.map((x) => x.item.id === c.item.id ? { ...x, notes: e.target.value } : x))}\n                      placeholder={lang === "ar" ? "ملاحظة خاصة بهذا الصنف..." : "Note for this item..."}\n                      className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:border-primary resize-none"\n                    />\n                  </div>\n                ))}\n              </div>\n            </div>\n\n',
  ],
  [
    '            <div className="flex items-center justify-between mt-2">\n                    <span className="text-sm font-black text-primary">\n                      {formatPrice(c.item.price * c.quantity)}\n                    </span>',
    '            <div className="flex items-center justify-between mt-2">\n                    <span className="text-sm font-black text-primary">\n                      {formatPrice(c.item.price * c.quantity)}\n                    </span>\n                    <textarea rows={2} value={c.notes || ""} onChange={(e) => setCart((prev) => prev.map((x) => x.item.id === c.item.id ? { ...x, notes: e.target.value } : x))} placeholder={lang === "ar" ? "ملاحظة للصنف..." : "Item note..."} className="flex-1 mx-2 rounded-lg border border-border bg-card px-2 py-1 text-[10px] resize-none" />',
  ],
]);

edit('src/routes/oven.tsx', [
  ['  const [editTotal, setEditTotal] = useState("");\n', ''],
  ['  const getOrderCurrency = (notes: string | null) => {', '  const getOrderCurrency = (notes: string | null) => {'],
  ['  const formatOrderPrice = (amount: number, notes: string | null) => {', '  const formatOrderPrice = (amount: number, notes: string | null) => {'],
  [
    '          total: lo.total || 0,\n',
    '',
  ],
  [
    '                requires_oven: i?.item?.requires_oven || i?.requires_oven || false,\n              }))',
    '                notes: i?.item?.notes || i?.notes || "",\n                requires_oven: i?.item?.requires_oven || i?.requires_oven || false,\n              }))',
  ],
  [
    '      const newTotal = Number(editTotal) || 0;\n      if (!editingOrder.isLocalStore && editingOrder.id) {\n        const { error } = await supabase\n          .from("orders")\n          .update({ notes: editNotes, total: newTotal })\n',
    '      if (!editingOrder.isLocalStore && editingOrder.id) {\n        const { error } = await supabase\n          .from("orders")\n          .update({ notes: editNotes })\n',
  ],
  [
    '                  <div className="mb-3 p-2 bg-amber-50 rounded-lg text-xs font-bold border border-amber-200 text-amber-900">\n                    {order.notes}\n                  </div>\n                )}',
    '                  <div className="mb-3 p-2 bg-amber-50 rounded-lg text-xs font-bold border border-amber-200 text-amber-900">\n                    {order.notes}\n                  </div>\n                )}',
  ],
  [
    '                        <span>{item.name_ar || item.name}</span>\n                      </div>',
    '                        <div className="flex flex-col gap-1">\n                          <span>{item.name_ar || item.name}</span>\n                          {item.notes && (\n                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">ملاحظة: {item.notes}</span>\n                          )}\n                        </div>\n                      </div>',
  ],
  [
    '              <div className="p-3 bg-slate-50 border-t border-slate-100 mt-auto flex items-center justify-between gap-2">\n                <div className="font-black text-sm text-emerald-600">\n                  {formatOrderPrice(order.total, order.notes)}\n                </div>\n                <div className="flex items-center gap-1.5">',
    '              <div className="p-3 bg-slate-50 border-t border-slate-100 mt-auto flex items-center justify-end gap-2">\n                <div className="flex items-center gap-1.5">',
  ],
  ['                      setEditTotal(order.total ? order.total.toString() : "0");\n', ''],
  [
    '              <div className="space-y-1.5">\n                <Label className="text-xs font-bold">الإجمالي</Label>\n                <Input\n                  type="number"\n                  value={editTotal}\n                  onChange={(e) => setEditTotal(e.target.value)}\n                  placeholder="0.00"\n                />\n              </div>\n',
    '',
  ],
]);

console.log('per-item notes patch applied');
