const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

const targetStr = `    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("erp_store_state", JSON.stringify(this.state));
      } catch (err: any) {
        if (err instanceof DOMException && err.name === 'QuotaExceededError' || (err.message && err.message.toLowerCase().includes('quota'))) {
           console.error("LocalStorage Quota Exceeded. The application will continue using memory state, but changes will be lost on refresh.");
           // We intentionally re-throw it so that importing functions can warn the user.
           throw new Error("QuotaExceededError: LocalStorage limit reached.");
        } else {
           throw err;
        }
      }
    }`;

const newStr = `    // Background sync to Cloud (Supabase)
    if (typeof window !== "undefined") {
      try {
        supabase.from("app_settings").upsert({ id: "erp_state", data: this.state })
          .then(() => console.log("State synced to cloud"))
          .catch(err => console.error("Failed to sync to cloud", err));
      } catch(e) {}
    }

    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("erp_store_state", JSON.stringify(this.state));
      } catch (err: any) {
        if (err instanceof DOMException && err.name === 'QuotaExceededError' || (err.message && err.message.toLowerCase().includes('quota'))) {
           console.warn("LocalStorage Quota Exceeded! But don't worry, the state is being synced to the Cloud Database (Supabase) automatically.");
        } else {
           console.error(err);
        }
      }
    }`;

content = content.replace(targetStr, newStr);
fs.writeFileSync(path, content);
console.log("Fixed erpStore quota properly");
