const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

const regex = /contract\?: \{[\s\S]*?created_at: string;\n  \};/g;
const replacement = `contract?: {
    start_date: string;
    end_date: string;
    deposit_amount: number;
    advance_payment?: number;
    nationality?: string;
    id_number?: string;
    terms?: string;
    contract_image?: string;
    id_image?: string;
    language: "ar" | "en";
    created_at: string;
    // New fields
    authorized_representative?: string;
    tenant_address?: string;
    floor?: string;
    area?: string;
    lease_term?: string;
    renewal_option?: string;
    currency?: string;
    payment_due_date?: string;
    payment_method?: string;
    service_charge?: string;
    electricity_included?: boolean;
    water_included?: boolean;
    other_charges?: string;
    annual_escalation?: string;
    fit_out_period?: string;
    custom_shop_name?: string;
    custom_activity?: string;
  };`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log("Updated MallShop type");
