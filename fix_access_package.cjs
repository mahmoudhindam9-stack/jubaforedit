const fs = require("fs");
const path = "src/lib/accessPackage.ts";
let content = fs.readFileSync(path, "utf8");

const targetStr = `      localStorage.setItem("erp_store_state", JSON.stringify(newState));
      // Also persist to Supabase if app_settings available
      try {
        await supabase.from("app_settings" as any).upsert({ id: "erp_state", data: newState });
      } catch (err) {
        console.warn("Could not sync imported state to Supabase:", err);
      }`;

const newStr = `      try {
        localStorage.setItem("erp_store_state", JSON.stringify(newState));
      } catch(e) {
        console.warn("Local storage quota exceeded, but will save to Supabase");
      }
      // Also persist to Supabase if app_settings available
      try {
        await supabase.from("app_settings" as any).upsert({ id: "erp_state", data: newState });
      } catch (err) {
        console.warn("Could not sync imported state to Supabase:", err);
      }`;

content = content.replace(targetStr, newStr);
fs.writeFileSync(path, content);
console.log("Fixed accessPackage.ts quota issue");
