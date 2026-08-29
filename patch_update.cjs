const fs = require("fs");
const path = "src/routes/admin/mall.tsx";
let content = fs.readFileSync(path, "utf8");

const regex =
  /erpStore\.updateMallShop\(contractForm\.shop_id, \{[\s\S]*?created_at: new Date\(\)\.toISOString\(\),\n      \},\n    \}\);/g;

const replacement = `erpStore.updateMallShop(contractForm.shop_id, {
      tenant_name: contractForm.tenant_name,
      phone: contractForm.phone,
      monthly_rent: contractForm.monthly_rent,
      status: "rented",
      contract: {
        start_date: contractForm.start_date,
        end_date: contractForm.end_date,
        deposit_amount: contractForm.deposit_amount,
        advance_payment: contractForm.advance_payment,
        nationality: contractForm.nationality,
        id_number: contractForm.id_number,
        terms: contractForm.terms,
        contract_image: contractForm.contract_image,
        id_image: contractForm.id_image,
        language: contractForm.language,
        created_at: new Date().toISOString(),
        
        authorized_representative: contractForm.authorized_representative,
        tenant_address: contractForm.tenant_address,
        floor: contractForm.floor,
        area: contractForm.area,
        lease_term: contractForm.lease_term,
        renewal_option: contractForm.renewal_option,
        currency: contractForm.currency,
        payment_due_date: contractForm.payment_due_date,
        payment_method: contractForm.payment_method,
        service_charge: contractForm.service_charge,
        electricity_included: contractForm.electricity_included,
        water_included: contractForm.water_included,
        other_charges: contractForm.other_charges,
        annual_escalation: contractForm.annual_escalation,
        fit_out_period: contractForm.fit_out_period,
        custom_shop_name: contractForm.custom_shop_name,
        custom_activity: contractForm.custom_activity,
      },
    });`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log("Updated updateMallShop call");
