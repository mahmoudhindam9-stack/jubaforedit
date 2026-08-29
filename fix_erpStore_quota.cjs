const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

const targetStr = `    if (typeof window !== "undefined" && typeof localStorage !== "undefined")
      localStorage.setItem("erp_store_state", JSON.stringify(this.state));
    this.notify();
  }`;

const newStr = `    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
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
    }
    this.notify();
  }`;

content = content.replace(targetStr, newStr);
fs.writeFileSync(path, content);
console.log("Fixed erpStore quota");
