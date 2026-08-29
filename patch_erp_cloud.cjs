const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// 1. Add supabase import at the top
if (!content.includes("import { supabase }")) {
  content = content.replace(
    "import { Order",
    'import { supabase } from "@/integrations/supabase/client";\nimport { Order',
  );
}

// 2. Add loadFromCloud method
const loadFromCloudStr = `
  async loadFromCloud() {
    try {
      console.log("Fetching state from Supabase cloud...");
      const { data, error } = await supabase
        .from("app_settings")
        .select("data")
        .eq("id", "erp_state")
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn("Failed to load from cloud:", error);
      }
      
      if (data && data.data) {
        console.log("Cloud state loaded successfully!");
        this.state = data.data;
        this.recalculateAccountBalances();
        this.notify();
        return true;
      }
    } catch (err) {
      console.error("Cloud sync error:", err);
    }
    return false;
  }
`;

if (!content.includes("loadFromCloud()")) {
  content = content.replace("loadState() {", loadFromCloudStr + "\n  loadState() {");
}

// 3. Modify saveState to save to cloud in background
const oldSaveState = `  saveState() {
    if (this.state.journalEntries) this.state.journalEntries = [...this.state.journalEntries];
    if (this.state.accounts) this.state.accounts = [...this.state.accounts];
    if (this.state.treasuryTransactions)
      this.state.treasuryTransactions = [...this.state.treasuryTransactions];
    if (this.state.treasuries) this.state.treasuries = [...this.state.treasuries];

    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
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

const newSaveState = `  saveState() {
    if (this.state.journalEntries) this.state.journalEntries = [...this.state.journalEntries];
    if (this.state.accounts) this.state.accounts = [...this.state.accounts];
    if (this.state.treasuryTransactions)
      this.state.treasuryTransactions = [...this.state.treasuryTransactions];
    if (this.state.treasuries) this.state.treasuries = [...this.state.treasuries];

    // Background sync to Cloud (Supabase)
    if (typeof window !== "undefined") {
      supabase.from("app_settings").upsert({ id: "erp_state", data: this.state })
        .then(() => console.log("State synced to cloud"))
        .catch(err => console.error("Failed to sync to cloud", err));
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
    }
    this.notify();
  }`;

content = content.replace(oldSaveState, newSaveState);

fs.writeFileSync(path, content);
console.log("erpStore patched with cloud sync");
