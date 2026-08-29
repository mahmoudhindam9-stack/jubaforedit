const fs = require("fs");
const path = "src/routes/admin/mall.tsx";
let content = fs.readFileSync(path, "utf8");

// 1. Update contractForm
content = content.replace(
  /const \[contractForm, setContractForm\] = useState\(\{[\s\S]*?id_image: "",\n  \}\);/g,
  `const [contractForm, setContractForm] = useState({
    shop_id: "",
    custom_shop_name: "",
    custom_activity: "",
    tenant_name: "",
    phone: "",
    nationality: "مصري / Egyptian",
    id_number: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    monthly_rent: 1000,
    deposit_amount: 1000,
    advance_payment: 0,
    language: "ar" as "ar" | "en",
    treasury_account_id: "",
    terms: \`1. يسري هذا العقد للمدة المحددة ويتجدد تلقائياً بموافقة الطرفين.
2. يلتزم المستأجر بسداد القيمة الإيجارية في موعد أقصاه الخامس من كل شهر.
3. يتحمل المستأجر كافة فواتير الكهرباء والمياه والخدمات الخاصة بالوحدة.
4. لا يحق للمستأجر التنازل عن الوحدة أو تأجيرها من الباطن كلياً أو جزئياً دون موافقة كتابية مسبقة.
5. في حال الإخلال بأي من شروط العقد، يحق للإدارة فسخ العقد واتخاذ الإجراءات القانونية اللازمة.\`,
    new_clause: "",
    contract_image: "",
    id_image: "",
    // new fields
    authorized_representative: "",
    tenant_address: "",
    floor: "",
    area: "",
    lease_term: "",
    renewal_option: "",
    currency: "USD",
    payment_due_date: "",
    payment_method: "",
    service_charge: "",
    electricity_included: false,
    water_included: false,
    other_charges: "",
    annual_escalation: "",
    fit_out_period: "",
  });`,
);

fs.writeFileSync(path, content);
console.log("Updated contractForm");
