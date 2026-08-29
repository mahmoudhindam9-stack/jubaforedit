const fs = require('fs');
const path = require('path');

const root = process.cwd();
function file(p){ return path.join(root,p); }
function read(p){ return fs.readFileSync(file(p),'utf8'); }
function write(p,s){ fs.writeFileSync(file(p),s,'utf8'); }
function mustReplace(s, re, replacement, label){
  if (!re.test(s)) throw new Error(`Patch target not found: ${label}`);
  return s.replace(re, replacement);
}

// 1) Shared table-order model already has notes per line; make the UI and persistence consistently use it.
{
  const p = 'src/components/TableOrderModal.tsx';
  let s = read(p);
  if (!s.includes('const updateItemNote = (id: string, notes: string)')) {
    s = mustReplace(s,
      /  const removeFromCart = \(id: string\) => \{[\s\S]*?\n  \};\n\n  const toggleAddition/,
      `  const removeFromCart = (id: string) => {\n    setCart((prev) => prev.filter((c) => c.item.id !== id));\n  };\n\n  const updateItemNote = (id: string, notes: string) => {\n    setCart((prev) =>\n      prev.map((c) => (c.item.id === id ? { ...c, notes } : c)),\n    );\n  };\n\n  const toggleAddition`,
      'table modal note helper');
  }

  // Remove the old order-wide notes box.
  s = s.replace(/\n\s*\/\*\* Order Notes \*\*\/[\s\S]*?<\/div>\n\n\s*\/\*\* Calculation Breakdown \*\*\//,
    `\n\n              {/* Calculation Breakdown */}`);

  // Per-item note field in the captain cart.
  if (!s.includes('placeholder={lang === "ar" ? "ملاحظة للصنف')) {
    s = mustReplace(s,
      /(\{\(\(line\.selectedAdditions[\s\S]*?\n\s*\}\)\}\n\s*<\/div>\n\s*\n\s*<div className="flex items-center gap-1 bg-white)/,
      `$1\n\n                      <textarea\n                        rows={1}\n                        value={line.notes || ""}\n                        onChange={(e) => updateItemNote(line.item.id, e.target.value)}\n                        onClick={(e) => e.stopPropagation()}\n                        placeholder={lang === "ar" ? "ملاحظة للصنف..." : "Item note..."}\n                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:border-indigo-500 resize-none"\n                      />\n                    </div>\n\n                    <div className="flex items-center gap-1 bg-white`,
      'captain per-item note UI');
  }

  // Never create a new order-wide note; item notes live inside cart lines.
  s = s.replace(/notes: orderNotes,/g, 'notes: "",');
  s = s.replace(/notes: orderNotes\n/g, 'notes: ""\n');
  write(p,s);
}

// 2) POS cashier: add an editable note to every cart line and persist it into order.items.
{
  const p = 'src/routes/pos.tsx';
  let s = read(p);
  s = s.replace(/type CartLine = \{ item: MenuItem; quantity: number \};/, 'type CartLine = { item: MenuItem; quantity: number; notes?: string };');

  if (!s.includes('const updateItemNote = (id: string, notes: string)')) {
    s = mustReplace(s,
      /  const removeFromCart = \(id: string\) => setCart\(\(prev\) => prev\.filter\(\(c\) => c\.item\.id !== id\)\);/,
      `  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.item.id !== id));\n\n  const updateItemNote = (id: string, notes: string) => {\n    setCart((prev) => prev.map((c) => (c.item.id === id ? { ...c, notes } : c)));\n  };`,
      'cashier note helper');
  }

  // Stop loading old order-wide notes into the new checkout note field.
  s = s.replace(/    setOrderNotes\(tableOrder\.notes \|\| ""\);\n/, '    setOrderNotes("");\n');

  // Remove the order-wide notes textarea from checkout.
  s = s.replace(/\n\s*\/\*\* Special Notes Section \*\*\/[\s\S]*?<\/div>\n\s*\n\s*\/\*\* Discount, Tax & Service Charges Section \*\*\//,
    `\n\n            {/* Discount, Tax & Service Charges Section */}`);

  // Make the order payload carry each line's note.
  s = s.replace(/quantity: c\.quantity,\n\s*requires_oven:/g, 'quantity: c.quantity,\n            notes: c.notes || "",\n            requires_oven:');

  // The old order-wide note should no longer be included in checkout notes.
  s = s.replace(/const combinedNotes = \[[\s\S]*?\]\n\s*\.filter\(Boolean\)\n\s*\.join\(" \| "\);/, `const combinedNotes = additionsText\n        ? \`${'${lang === "ar" ? "الإضافات: " : "Additions: "}'}${'${additionsText}'}\`\n        : "";`);

  // Per-item note field in the cashier cart.
  if (!s.includes('placeholder={lang === "ar" ? "ملاحظة للصنف..."')) {
    s = mustReplace(s,
      /(\s*<\/div>\n\s*<\/div>\n\s*\)\)\n\s*\}\n\s*<\/div>\n\s*\n\s*<div className="border-t border-border p-5)/,
      `$1`,
      'cashier cart anchor');
    const marker = `                  </div>\n                </div>\n              </div>\n            ))`;
    const replacement = `                  </div>\n                  <textarea\n                    rows={1}\n                    value={c.notes || ""}\n                    onChange={(e) => updateItemNote(c.item.id, e.target.value)}\n                    placeholder={lang === "ar" ? "ملاحظة للصنف..." : "Item note..."}\n                    className="w-full mt-2 bg-card border border-border rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-none focus:border-primary resize-none"\n                  />\n                </div>\n              </div>\n            ))`;
    if (s.includes(marker)) s = s.replace(marker, replacement);
    else throw new Error('cashier cart JSX marker not found');
  }
  write(p,s);
}

// 3) Oven KDS: show only item names/quantities/notes; no prices or currency anywhere in the order card.
{
  const p = 'src/routes/oven.tsx';
  let s = read(p);
  s = s.replace(/\n\s*const getOrderCurrency = \([\s\S]*?\n\s*};\n\n\s*const formatOrderPrice = \([\s\S]*?\n\s*};\n/, '\n');
  s = s.replace(/\n\s*const \[editTotal, setEditTotal\] = useState\(""\);/, '');
  s = s.replace(/\n\s*setEditTotal\(order\.total \? order\.total\.toString\(\) : "0"\);/, '');
  s = s.replace(/\n\s*const newTotal = Number\(editTotal\) \|\| 0;/, '');
  s = s.replace(/\.update\(\{ notes: editNotes, total: newTotal \}\)/, '.update({ notes: editNotes })');
  s = s.replace(/\n\s*<div className="space-y-1\.5">\n\s*<Label className="text-xs font-bold">الإجمالي<\/Label>[\s\S]*?<\/div>\n\s*<div className="flex justify-end gap-2 pt-3 border-t">/, '\n              <div className="flex justify-end gap-2 pt-3 border-t">');

  // Preserve item notes when converting local TableOrdersStore entries to KDS rows.
  s = s.replace(/quantity: i\?\.quantity \|\| 1,\n\s*requires_oven:/g, 'quantity: i?.quantity || 1,\n                notes: i?.notes || i?.item?.notes || "",\n                requires_oven:');

  // Render each item note under the item name.
  if (!s.includes('item.notes &&')) {
    s = mustReplace(s,
      /(\s*<span>\{item\.name_ar \|\| item\.name\}<\/span>\n\s*<\/div>)/,
      `$1\n                        {item.notes && (\n                          <div className="mt-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-full">\n                            <span className="font-black">ملاحظة:</span> {item.notes}\n                          </div>\n                        )}`,
      'oven item note display');
  }

  // Remove the monetary total from the card footer.
  s = s.replace(/\s*<div className="font-black text-sm text-emerald-600">\s*\{formatOrderPrice\(order\.total, order\.notes\)\}\s*<\/div>/, '');
  write(p,s);
}

console.log('Item-notes patch applied successfully.');
