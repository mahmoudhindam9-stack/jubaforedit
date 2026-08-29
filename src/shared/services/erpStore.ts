// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { Order, MenuItem, InventoryItem } from "../types";
import { localWarehouseStore } from "../../features/inventory/services/warehouseStore";
import { inventoryService } from "../../features/inventory/services/inventoryService";
import { ORACLE_MIGRATION_ACCOUNTS } from "../data/oracleAccounts";

export interface Branch {
  id: string;
  name: string;
  name_ar: string;
  code: string;
}

export interface TreasuryContainer {
  id: string;
  name: string;
  currency: string;
  balance?: number;
}

export interface TreasuryAccount {
  id: string;
  account_code?: string;
  containers?: TreasuryContainer[];
  linked_to_restaurant?: boolean;
  branch_id: string;
  name_ar: string;
  type: "cash" | "bank";
  currency: string;
  balance: number;
  is_open: boolean;
  opening_balance: number;
  available_balance?: number;
  responsible_employee?: string;
  status?: "active" | "inactive" | "closed";
  deleted?: boolean;
}

export interface Supplier {
  id: string;
  name_ar: string;
  phone?: string;
  balance: number; // supplier ledger balance
  account_code?: string; // Linked Chart of Accounts code (e.g. 24010100)
  currency?: string;
  deleted?: boolean;
}

export interface InventorySettings {
  allowNegativeStock: boolean;
  defaultUnit: string;
}

export interface ExtendedInventoryItem {
  id: string;
  item_code: string;
  barcode: string;
  name_en: string;
  category: string;
  preferred_supplier_id?: string;
  average_cost: number;
  last_purchase_price: number;
  status: "active" | "inactive";
  max_level?: number;
  storage_location?: string;
  notes?: string;
}

export interface MenuItemQualitySpecs {
  menu_item_id: string;
  shelf_life_hours: number;
  storage_condition: "chilled_4c" | "frozen_18c" | "hot_hold_60c" | "room_temp";
  storage_condition_label?: string;
  prep_instructions?: string;
  allergens?: string[];
  quality_checklist?: string[];
  max_display_hours?: number;
}

export interface InventoryDocumentItem {
  inventory_id: string;
  quantity: number;
  unit_cost: number;
  counted_quantity?: number;
  difference?: number;
}

export interface InventoryDocument {
  id: string;
  doc_number: string;
  type:
    | "goods_receipt"
    | "goods_issue"
    | "stock_transfer"
    | "stock_adjustment"
    | "inventory_count"
    | "opening_balance";
  date: string;
  branch_id: string;
  to_branch_id?: string;
  supplier_id?: string;
  items: InventoryDocumentItem[];
  notes?: string;
  status: "draft" | "approved" | "cancelled";
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  branch_id: string;
  supplier_id: string;
  order_date: string;
  status: "draft" | "sent" | "received" | "returned" | "cancelled";
  items: {
    inventory_id: string;
    quantity: number;
    unit_cost: number;
    received_quantity?: number;
    returned_quantity?: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  currency?: "USD" | "SSP" | string;
  exchange_rate?: number;
  total_base_usd?: number;
  notes?: string;
  received_date?: string;
}

export interface TreasuryTransaction {
  id: string;
  branch_id: string;
  treasury_id: string;
  type:
    | "deposit"
    | "withdrawal"
    | "transfer_in"
    | "transfer_out"
    | "sales"
    | "purchase"
    | "expense"
    | "reconciliation";
  amount: number;
  currency: string;
  related_entity_id?: string; // Order ID, Purchase ID, Voucher ID
  payment_method?: string; // cash | card | wallet
  note: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  branch_id: string;
  type: "receipt" | "payment" | "transfer";
  category: string; // e.g., Rent, Salaries, Electricity, Water
  amount: number;
  currency: string;
  payment_method: string;
  treasury_id: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  cost_center?: string;
  attachment?: string;
  deleted?: boolean;
}

export interface Account {
  code: string;
  name_ar: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  balance: number;
  parent_code?: string;
  level: number;
  status: "active" | "inactive";
  initial_balance?: number;
  system_binding?:
    | "none"
    | "treasury_main"
    | "treasury_cib"
    | "treasury_extra"
    | "treasury_usd"
    | "suppliers_payable"
    | "sales_revenue"
    | "operating_expenses"
    | "warehouse_main_value"
    | "warehouse_kitchen_value"
    | "expired_inventory_value"
    | "disposed_waste_value"
    | string;
  currency?: string;
  sync_status?: "pending" | "synced";
}

export interface JournalLine {
  account_code: string;
  debit: number;
  credit: number;
  currency?: string;
  rate?: number;
  cost_center?: string;
  description?: string;
  id?: string;
}

export interface JournalEntry {
  id: string;
  branch_id: string;
  date: string;
  description: string;
  lines: JournalLine[];
  created_at: string;
  reference?: string;
  currency: string;
  created_by: string;
  is_approved: boolean;
  sequence?: number;
  attachments?: string[];
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  details: string;
  created_at: string;
  before_value?: string;
  after_value?: string;
  ip_address?: string;
  action_type: "CREATE" | "UPDATE" | "DELETE" | "TRANSACTION" | "SYSTEM";
}

export interface TreasuryReconciliation {
  id: string;
  treasury_id: string;
  date: string;
  ledger_balance: number;
  actual_balance: number;
  difference: number;
  reconciled_by: string;
  notes: string;
}

export interface SystemUser {
  id: string;
  full_name: string;
  username: string; // Used for login (email or plain text)
  phone: string;
  role: string;
  password?: string;
  created_at: string;
}

export interface UserPermission {
  // Legacy / top-level permissions
  orders?: boolean;
  pos?: boolean;
  captain?: boolean;
  kitchen?: boolean;
  delivery?: boolean;
  inventory?: boolean;
  hr?: boolean;
  purchasing?: boolean;
  production?: boolean;
  treasury?: boolean;
  accounting?: boolean;
  journal_approval?: boolean;
  expense_approval?: boolean;
  revenue_approval?: boolean;
  reports?: boolean;
  cost_centers?: boolean;
  branch_mgmt?: boolean;
  audit_logs?: boolean;
  users_roles?: boolean;

  // Granular Sub-permissions & Super Admin Controls
  // 1. Orders & Sales
  orders_view?: boolean;
  orders_create_custom?: boolean;
  orders_cancel_modify?: boolean;
  orders_manage_carts?: boolean;
  orders_generate_qr?: boolean;

  // 2. POS
  pos_access?: boolean;
  pos_create_custom_order?: boolean;
  pos_apply_discounts?: boolean;
  pos_void_items?: boolean;

  // 3. Captain Order
  captain_access?: boolean;
  captain_create_order?: boolean;
  captain_transfer_tables?: boolean;
  captain_modify_items?: boolean;

  // 4. Kitchen / KDS & Oven
  kitchen_view?: boolean;
  kitchen_change_status?: boolean;
  kitchen_modify_order?: boolean;

  // 5. Delivery
  delivery_view?: boolean;
  delivery_update_status?: boolean;

  // 6. Inventory
  inventory_view?: boolean;
  inventory_adjust_transfer?: boolean;
  inventory_waste_dispose?: boolean;

  // 7. Purchasing
  purchasing_view?: boolean;
  purchasing_add_invoice?: boolean;
  purchasing_returns?: boolean;

  // 8. Production
  production_view?: boolean;
  production_execute?: boolean;

  // 9. HR
  hr_view_attendance?: boolean;
  hr_manage_payroll_loans?: boolean;

  // 10. Treasury
  treasury_view?: boolean;
  treasury_open_close?: boolean;
  treasury_transfer_reconcile?: boolean;

  // 11. Accounting & General Ledger
  accounting_view?: boolean;
  accounting_post_journal?: boolean;
  accounting_lock_period?: boolean;

  // 12. Approvals
  approval_journals?: boolean;
  approval_expenses?: boolean;
  approval_revenues?: boolean;

  // 13. Mall & Garden
  mall_manage_shops?: boolean;
  mall_garden_finance?: boolean;

  // 14. Reports
  reports_view_sales?: boolean;
  reports_view_financials?: boolean;

  // 15. Super Admin & System
  super_admin_full_access?: boolean;
  system_manage_users?: boolean;
  system_backup_update?: boolean;
  system_audit_logs?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  job_title: string;
  department: string;
  phone: string;
  email?: string;
  hire_date: string;
  salary: number;
  currency: string;
  status: "active" | "inactive" | "suspended";
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status: "present" | "absent" | "leave" | "late";
  check_in?: string;
  check_out?: string;
  notes?: string;
}

export interface EmployeeLoan {
  id: string;
  employee_id: string;
  amount: number;
  date: string;
  currency: string;
  repayment_months: number;
  paid_amount: number;
  status: "active" | "paid";
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  month: string;
  basic_salary: number;
  currency: string;
  bonuses: number;
  deductions: number;
  loan_deduction: number;
  net_salary: number;
  payment_date?: string;
  payment_treasury_id?: string;
  status: "draft" | "paid";
  notes?: string;
}

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    name: "وليد أحمد محمد دويك",
    job_title: "رئيس الطهاة (Chef)",
    department: "المطبخ",
    phone: "01023456789",
    hire_date: "2024-01-15",
    salary: 8000,
    currency: "EGP",
    status: "active",
  },
  {
    id: "emp-2",
    name: "هشام نور",
    job_title: "مدير التشغيل العام",
    department: "الإدارة",
    phone: "01124578963",
    hire_date: "2023-05-10",
    salary: 15000,
    currency: "EGP",
    status: "active",
  },
  {
    id: "emp-3",
    name: "جمال عطا الله",
    job_title: "المحاسب المالي",
    department: "الإدارة",
    phone: "01235689741",
    hire_date: "2024-03-01",
    salary: 12000,
    currency: "EGP",
    status: "active",
  },
  {
    id: "emp-4",
    name: "محمد شريف",
    job_title: "كاشير الصالة",
    department: "الصالة والتوصيل",
    phone: "01547896321",
    hire_date: "2024-06-15",
    salary: 7000,
    currency: "EGP",
    status: "active",
  },
  {
    id: "emp-5",
    name: "أحمد حسام",
    job_title: "مشرف الفروع",
    department: "الإدارة",
    phone: "01098765432",
    hire_date: "2023-11-01",
    salary: 10000,
    currency: "EGP",
    status: "active",
  },
];

export interface MallShop {
  id: string;
  shop_number: string;
  name_ar: string;
  account_number: string;
  tenant_name: string;
  phone: string;
  monthly_rent: number;
  status: "rented" | "vacant" | "maintenance";
  space_sqm?: number;
  notes?: string;
  contract?: {
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
  };
}

export interface TerminatedContractRecord {
  id: string;
  shop_id: string;
  shop_number: string;
  shop_name: string;
  tenant_name: string;
  phone: string;
  monthly_rent: number;
  deposit_amount: number;
  refund_amount: number;
  start_date: string;
  end_date: string;
  termination_date: string;
  contract_image?: string;
  termination_image: string;
  notes?: string;
}

export interface MallRentalPayment {
  id: string;
  shop_id: string;
  year: number;
  month: number;
  amount_due: number;
  amount_paid: number;
  status: "paid" | "partial" | "unpaid";
  payment_date?: string;
  payment_method?: string;
  receipt_number?: string;
  notes?: string;
}

export interface MallGardenRevenue {
  id: string;
  year: number;
  month: number;
  category: "garden_ticket" | "garden_event" | "parking" | "other";
  description: string;
  amount: number;
  date: string;
  receipt_number?: string;
  notes?: string;
}

export interface MallGardenExpense {
  id: string;
  year: number;
  month: number;
  category: "maintenance" | "electricity" | "water" | "security" | "cleaning" | "salary" | "other";
  title: string;
  amount: number;
  date: string;
  paid_to?: string;
  notes?: string;
}

const DEFAULT_GARDEN_REVENUES: MallGardenRevenue[] = [
  {
    id: "rev-1",
    year: 2026,
    month: 1,
    category: "garden_ticket",
    description: "تذاكر دخول الحديقة - يناير",
    amount: 4500,
    date: "2026-01-31",
    receipt_number: "REC-G-101",
  },
  {
    id: "rev-2",
    year: 2026,
    month: 2,
    category: "garden_ticket",
    description: "تذاكر دخول الحديقة - فبراير",
    amount: 5200,
    date: "2026-02-28",
    receipt_number: "REC-G-102",
  },
  {
    id: "rev-3",
    year: 2026,
    month: 3,
    category: "garden_event",
    description: "حفل عائلي وتأجير مساحة بالحديقة",
    amount: 8000,
    date: "2026-03-15",
    receipt_number: "REC-G-103",
  },
];

const DEFAULT_GARDEN_EXPENSES: MallGardenExpense[] = [
  {
    id: "exp-1",
    year: 2026,
    month: 1,
    category: "maintenance",
    title: "صيانة إنارة الحديقة والممرات",
    amount: 1200,
    date: "2026-01-10",
    paid_to: "شركة الصيانة الحديثة",
  },
  {
    id: "exp-2",
    year: 2026,
    month: 1,
    category: "electricity",
    title: "فاتورة كهرباء المول والحديقة",
    amount: 2500,
    date: "2026-01-15",
    paid_to: "شركة الكهرباء",
  },
  {
    id: "exp-3",
    year: 2026,
    month: 2,
    category: "cleaning",
    title: "أدوات ومواد تنظيف المول",
    amount: 800,
    date: "2026-02-05",
    paid_to: "توريدات النظافة",
  },
  {
    id: "exp-4",
    year: 2026,
    month: 2,
    category: "security",
    title: "رواتب أمن وحراسة المول",
    amount: 3500,
    date: "2026-02-28",
    paid_to: "فريق الأمن",
  },
];

const DEFAULT_MALL_SHOPS: MallShop[] = [
  {
    id: "shop-d1",
    shop_number: "D1",
    name_ar: "ملابس أطفال M/Akok atak akol",
    account_number: "14030102",
    tenant_name: "M/Akok atak akol",
    phone: "-",
    monthly_rent: 800,
    status: "rented",
    space_sqm: 40,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d2",
    shop_number: "D2",
    name_ar: "صيدلية Abdalla Majok",
    account_number: "14030111",
    tenant_name: "Abdalla Majok",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 45,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d3",
    shop_number: "D3",
    name_ar: "Mr / Thabo patrick Macagala",
    account_number: "14030124",
    tenant_name: "Thabo patrick",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 35,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d4",
    shop_number: "D4",
    name_ar: "عطور Achail mabok lang",
    account_number: "14030122",
    tenant_name: "Achail mabok lang",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 30,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d5",
    shop_number: "D5",
    name_ar: "عطور Achail mabok lang (نفس العميل)",
    account_number: "14030122",
    tenant_name: "Achail mabok lang",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 30,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d6",
    shop_number: "D6",
    name_ar: "عطور Achail mabok lang",
    account_number: "14030142",
    tenant_name: "Achail mabok lang",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 35,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d7",
    shop_number: "D7",
    name_ar: "ملابس أطفال Niting marin abwak",
    account_number: "14030152",
    tenant_name: "Niting marin",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 40,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d8",
    shop_number: "D8",
    name_ar: "عطور Mrs / Sara enoch machiex",
    account_number: "14030162",
    tenant_name: "Sara enoch",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 30,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d9",
    shop_number: "D9",
    name_ar: "عطور Mrs / Sara enoch machiex",
    account_number: "14030171",
    tenant_name: "Sara enoch",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 30,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d10",
    shop_number: "D10",
    name_ar: "وكالة طبية M/Erik danial dot",
    account_number: "14030192",
    tenant_name: "Erik danial",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 50,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d11",
    shop_number: "D11",
    name_ar: "konoro enterprises co",
    account_number: "14030411",
    tenant_name: "konoro enterprises",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 60,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d12",
    shop_number: "D12",
    name_ar: "مخزن الشركة",
    account_number: "14030201",
    tenant_name: "مخزن الشركة",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 80,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d13",
    shop_number: "D13",
    name_ar: "استيراد وتصدير Wanloi Ktl Invesment",
    account_number: "14030198",
    tenant_name: "Wanloi Ktl Invesment",
    phone: "-",
    monthly_rent: 700,
    status: "rented",
    space_sqm: 55,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d14",
    shop_number: "D14",
    name_ar: "مغسلة Mrs / Aluel Deng Awoul",
    account_number: "14030230",
    tenant_name: "Aluel Deng Awoul",
    phone: "-",
    monthly_rent: 500,
    status: "rented",
    space_sqm: 50,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d15",
    shop_number: "D15",
    name_ar: "مغسلة Mrs / Aluel Deng Awoul (نفس العميل)",
    account_number: "14030230",
    tenant_name: "Aluel Deng Awoul",
    phone: "-",
    monthly_rent: 500,
    status: "rented",
    space_sqm: 50,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d16",
    shop_number: "D16",
    name_ar: "مغسلة Mrs / Aluel Deng Awoul (نفس العميل)",
    account_number: "14030230",
    tenant_name: "Aluel Deng Awoul",
    phone: "-",
    monthly_rent: 500,
    status: "rented",
    space_sqm: 50,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d17",
    shop_number: "D17",
    name_ar: "شركة سياحه M/S Awar athuai akok (سيميا)",
    account_number: "14030240",
    tenant_name: "M/S Awar athuai",
    phone: "-",
    monthly_rent: 600,
    status: "rented",
    space_sqm: 65,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d18",
    shop_number: "D18",
    name_ar: "Hafza Cur Deng",
    account_number: "14030250",
    tenant_name: "Hafza Cur Deng",
    phone: "-",
    monthly_rent: 900,
    status: "rented",
    space_sqm: 70,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d19",
    shop_number: "D19",
    name_ar: "نظارات Mr / Harish Koudula",
    account_number: "14030300",
    tenant_name: "Harish Koudula",
    phone: "-",
    monthly_rent: 500,
    status: "rented",
    space_sqm: 40,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d20",
    shop_number: "D20",
    name_ar: "نظارات Mr / Harish Koudula (نفس العميل)",
    account_number: "14030300",
    tenant_name: "Harish Koudula",
    phone: "-",
    monthly_rent: 500,
    status: "rented",
    space_sqm: 40,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d21",
    shop_number: "D21",
    name_ar: "مكتبة internet International Trade",
    account_number: "14030320",
    tenant_name: "internet International Trade",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 45,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d30",
    shop_number: "D30",
    name_ar: "شركة سياحه easy travel and tours ltd",
    account_number: "14030432",
    tenant_name: "easy travel",
    phone: "-",
    monthly_rent: 550,
    status: "rented",
    space_sqm: 50,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d31",
    shop_number: "D31",
    name_ar: "شركة سياحه easy travel and tours ltd",
    account_number: "14030442",
    tenant_name: "easy travel",
    phone: "-",
    monthly_rent: 550,
    status: "rented",
    space_sqm: 50,
    notes: "سنتر بوب",
  },
  {
    id: "shop-d32",
    shop_number: "D32",
    name_ar: "John Juma Peter Alphonse",
    account_number: "14030451",
    tenant_name: "John Juma Peter",
    phone: "-",
    monthly_rent: 550,
    status: "rented",
    space_sqm: 50,
    notes: "سنتر بوب",
  },
  {
    id: "shop-b1",
    shop_number: "B1",
    name_ar: "مطعم Maged Gorg Ado",
    account_number: "14010651",
    tenant_name: "Maged Gorg Ado",
    phone: "-",
    monthly_rent: 0,
    status: "rented",
    space_sqm: 120,
    notes: "المول",
  },
  {
    id: "shop-b2",
    shop_number: "B2",
    name_ar: "lilico engineering service",
    account_number: "25030200",
    tenant_name: "lilico engineering",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 60,
    notes: "المول",
  },
  {
    id: "shop-b3",
    shop_number: "B3",
    name_ar: "lilico engineering service",
    account_number: "14010470",
    tenant_name: "lilico engineering",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 60,
    notes: "المول",
  },
  {
    id: "shop-b4",
    shop_number: "B4",
    name_ar: "بنك ايدين",
    account_number: "25030110",
    tenant_name: "بنك ايدين",
    phone: "-",
    monthly_rent: 1200,
    status: "rented",
    space_sqm: 150,
    notes: "المول",
  },
  {
    id: "shop-b5",
    shop_number: "B5",
    name_ar: "بنك ايدين",
    account_number: "25030110",
    tenant_name: "بنك ايدين",
    phone: "-",
    monthly_rent: 1200,
    status: "rented",
    space_sqm: 150,
    notes: "المول",
  },
  {
    id: "shop-b6",
    shop_number: "B6",
    name_ar: "وحدة تجارية B6",
    account_number: "14010450-B6",
    tenant_name: "-",
    phone: "-",
    monthly_rent: 750,
    status: "vacant",
    space_sqm: 65,
    notes: "المول",
  },
  {
    id: "shop-b7",
    shop_number: "B7",
    name_ar: "مطعم Aluel Deng Awoul",
    account_number: "14010450",
    tenant_name: "Aluel Deng Awoul",
    phone: "-",
    monthly_rent: 750,
    status: "rented",
    space_sqm: 90,
    notes: "المول",
  },
  {
    id: "shop-b8",
    shop_number: "B8",
    name_ar: "مطعم Aluel Deng Awoul (نفس العميل)",
    account_number: "14010450",
    tenant_name: "Aluel Deng Awoul",
    phone: "-",
    monthly_rent: 750,
    status: "rented",
    space_sqm: 90,
    notes: "المول",
  },
  {
    id: "shop-b9",
    shop_number: "B9",
    name_ar: "مطعم Aluel Deng Awoul (نفس العميل)",
    account_number: "14010450",
    tenant_name: "Aluel Deng Awoul",
    phone: "-",
    monthly_rent: 750,
    status: "rented",
    space_sqm: 90,
    notes: "المول",
  },
  {
    id: "shop-b10",
    shop_number: "B10",
    name_ar: "مطعم Aluel Deng Awoul (نفس العميل)",
    account_number: "14010450",
    tenant_name: "Aluel Deng Awoul",
    phone: "-",
    monthly_rent: 750,
    status: "rented",
    space_sqm: 90,
    notes: "المول",
  },
  {
    id: "shop-g2",
    shop_number: "G2",
    name_ar: "تصوير وطباعة image world",
    account_number: "14010280",
    tenant_name: "image world",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 40,
    notes: "المول",
  },
  {
    id: "shop-g3",
    shop_number: "G3",
    name_ar: "شركة سياحه Steven + sara Nile travel",
    account_number: "14010140",
    tenant_name: "Steven + sara",
    phone: "-",
    monthly_rent: 550,
    status: "rented",
    space_sqm: 50,
    notes: "المول",
  },
  {
    id: "shop-g4",
    shop_number: "G4",
    name_ar: "شركة سياحه Steven + sara Nile travel",
    account_number: "14010140",
    tenant_name: "Steven + sara",
    phone: "-",
    monthly_rent: 500,
    status: "rented",
    space_sqm: 50,
    notes: "المول",
  },
  {
    id: "shop-g5",
    shop_number: "G5",
    name_ar: "اتليه teraza daniel lado",
    account_number: "14010313",
    tenant_name: "teraza daniel lado",
    phone: "-",
    monthly_rent: 500,
    status: "rented",
    space_sqm: 45,
    notes: "المول",
  },
  {
    id: "shop-g6",
    shop_number: "G6",
    name_ar: "كوافير حريمي Wiaamramadan",
    account_number: "14010316",
    tenant_name: "Wiaamramadan",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 50,
    notes: "المول",
  },
  {
    id: "shop-g7",
    shop_number: "G7",
    name_ar: "كوافير رجالي Wiaamramadan",
    account_number: "14010316",
    tenant_name: "Wiaamramadan",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 50,
    notes: "المول",
  },
  {
    id: "shop-g8",
    shop_number: "G8",
    name_ar: "eagle enterprise",
    account_number: "14010330",
    tenant_name: "eagle enterprise",
    phone: "-",
    monthly_rent: 0,
    status: "vacant",
    space_sqm: 55,
    notes: "المول",
  },
  {
    id: "shop-g9",
    shop_number: "G9",
    name_ar: "سوبر ماركت Market china",
    account_number: "14010340",
    tenant_name: "Market china",
    phone: "-",
    monthly_rent: 625,
    status: "rented",
    space_sqm: 140,
    notes: "المول",
  },
];

const DEFAULT_MALL_PAYMENTS: MallRentalPayment[] = [
  {
    id: "pay-d1-2",
    shop_id: "shop-d1",
    year: 2026,
    month: 2,
    amount_due: 800,
    amount_paid: 800,
    status: "paid",
    payment_date: "2026-02-10",
    payment_method: "cash",
    receipt_number: "REC-2001",
  },
  {
    id: "pay-d13-2",
    shop_id: "shop-d13",
    year: 2026,
    month: 2,
    amount_due: 700,
    amount_paid: 800,
    status: "paid",
    payment_date: "2026-02-12",
    payment_method: "bank_transfer",
    receipt_number: "REC-2002",
  },
  {
    id: "pay-d14-4",
    shop_id: "shop-d14",
    year: 2026,
    month: 4,
    amount_due: 500,
    amount_paid: 1500,
    status: "paid",
    payment_date: "2026-04-10",
    payment_method: "cash",
    receipt_number: "REC-2003",
  },
  {
    id: "pay-d17-1",
    shop_id: "shop-d17",
    year: 2026,
    month: 1,
    amount_due: 600,
    amount_paid: 600,
    status: "paid",
    payment_date: "2026-01-05",
    payment_method: "cash",
    receipt_number: "REC-2004",
  },
  {
    id: "pay-d17-2",
    shop_id: "shop-d17",
    year: 2026,
    month: 2,
    amount_due: 600,
    amount_paid: 600,
    status: "paid",
    payment_date: "2026-02-05",
    payment_method: "cash",
    receipt_number: "REC-2005",
  },
  {
    id: "pay-d17-6",
    shop_id: "shop-d17",
    year: 2026,
    month: 6,
    amount_due: 600,
    amount_paid: 600,
    status: "paid",
    payment_date: "2026-06-05",
    payment_method: "cash",
    receipt_number: "REC-2006",
  },
  {
    id: "pay-d17-7",
    shop_id: "shop-d17",
    year: 2026,
    month: 7,
    amount_due: 600,
    amount_paid: 600,
    status: "paid",
    payment_date: "2026-07-05",
    payment_method: "cash",
    receipt_number: "REC-2007",
  },
  {
    id: "pay-d18-5",
    shop_id: "shop-d18",
    year: 2026,
    month: 5,
    amount_due: 900,
    amount_paid: 9600,
    status: "paid",
    payment_date: "2026-05-10",
    payment_method: "bank_transfer",
    receipt_number: "REC-2008",
  },
  {
    id: "pay-d19-3",
    shop_id: "shop-d19",
    year: 2026,
    month: 3,
    amount_due: 500,
    amount_paid: 2000,
    status: "paid",
    payment_date: "2026-03-10",
    payment_method: "cash",
    receipt_number: "REC-2009",
  },
  {
    id: "pay-d19-5",
    shop_id: "shop-d19",
    year: 2026,
    month: 5,
    amount_due: 500,
    amount_paid: 1000,
    status: "paid",
    payment_date: "2026-05-10",
    payment_method: "cash",
    receipt_number: "REC-2010",
  },
  {
    id: "pay-d21-3",
    shop_id: "shop-d21",
    year: 2026,
    month: 3,
    amount_due: 0,
    amount_paid: 3000,
    status: "paid",
    payment_date: "2026-03-15",
    payment_method: "cash",
    receipt_number: "REC-2011",
  },
  {
    id: "pay-d30-7",
    shop_id: "shop-d30",
    year: 2026,
    month: 7,
    amount_due: 550,
    amount_paid: 3300,
    status: "paid",
    payment_date: "2026-07-10",
    payment_method: "bank_transfer",
    receipt_number: "REC-2012",
  },
  {
    id: "pay-d32-2",
    shop_id: "shop-d32",
    year: 2026,
    month: 2,
    amount_due: 550,
    amount_paid: 3300,
    status: "paid",
    payment_date: "2026-02-15",
    payment_method: "bank_transfer",
    receipt_number: "REC-2013",
  },
  {
    id: "pay-b1-6",
    shop_id: "shop-b1",
    year: 2026,
    month: 6,
    amount_due: 0,
    amount_paid: 5000,
    status: "paid",
    payment_date: "2026-06-10",
    payment_method: "cash",
    receipt_number: "REC-2014",
  },
  {
    id: "pay-b7-1",
    shop_id: "shop-b7",
    year: 2026,
    month: 1,
    amount_due: 750,
    amount_paid: 4500,
    status: "paid",
    payment_date: "2026-01-10",
    payment_method: "cash",
    receipt_number: "REC-2015",
  },
  {
    id: "pay-b7-3",
    shop_id: "shop-b7",
    year: 2026,
    month: 3,
    amount_due: 750,
    amount_paid: 3000,
    status: "paid",
    payment_date: "2026-03-10",
    payment_method: "cash",
    receipt_number: "REC-2016",
  },
  {
    id: "pay-b7-4",
    shop_id: "shop-b7",
    year: 2026,
    month: 4,
    amount_due: 750,
    amount_paid: 6500,
    status: "paid",
    payment_date: "2026-04-10",
    payment_method: "cash",
    receipt_number: "REC-2017",
  },
  {
    id: "pay-b7-5",
    shop_id: "shop-b7",
    year: 2026,
    month: 5,
    amount_due: 750,
    amount_paid: -1500,
    status: "partial",
    payment_date: "2026-05-10",
    payment_method: "cash",
    receipt_number: "REC-2018",
    notes: "تسوية",
  },
  {
    id: "pay-g9-1",
    shop_id: "shop-g9",
    year: 2026,
    month: 1,
    amount_due: 625,
    amount_paid: 5000,
    status: "paid",
    payment_date: "2026-01-05",
    payment_method: "bank_transfer",
    receipt_number: "REC-2019",
  },
  {
    id: "pay-g9-2",
    shop_id: "shop-g9",
    year: 2026,
    month: 2,
    amount_due: 625,
    amount_paid: 5000,
    status: "paid",
    payment_date: "2026-02-05",
    payment_method: "bank_transfer",
    receipt_number: "REC-2020",
  },
  {
    id: "pay-g9-3",
    shop_id: "shop-g9",
    year: 2026,
    month: 3,
    amount_due: 625,
    amount_paid: 5000,
    status: "paid",
    payment_date: "2026-03-05",
    payment_method: "bank_transfer",
    receipt_number: "REC-2021",
  },
  {
    id: "pay-g9-4",
    shop_id: "shop-g9",
    year: 2026,
    month: 4,
    amount_due: 625,
    amount_paid: 5000,
    status: "paid",
    payment_date: "2026-04-05",
    payment_method: "bank_transfer",
    receipt_number: "REC-2022",
  },
  {
    id: "pay-g9-5",
    shop_id: "shop-g9",
    year: 2026,
    month: 5,
    amount_due: 625,
    amount_paid: 3000,
    status: "paid",
    payment_date: "2026-05-05",
    payment_method: "bank_transfer",
    receipt_number: "REC-2023",
  },
  {
    id: "pay-g9-6",
    shop_id: "shop-g9",
    year: 2026,
    month: 6,
    amount_due: 625,
    amount_paid: 6000,
    status: "paid",
    payment_date: "2026-06-05",
    payment_method: "bank_transfer",
    receipt_number: "REC-2024",
  },
  {
    id: "pay-g9-7",
    shop_id: "shop-g9",
    year: 2026,
    month: 7,
    amount_due: 625,
    amount_paid: 5000,
    status: "paid",
    payment_date: "2026-07-05",
    payment_method: "bank_transfer",
    receipt_number: "REC-2025",
  },
];

export interface ERPStoreState {
  branches: Branch[];
  currentBranchId: string;
  treasuries: TreasuryAccount[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  treasuryTransactions: TreasuryTransaction[];
  vouchers: Voucher[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  auditLogs: AuditLog[];
  inventoryExpiry: {
    id: string;
    inventory_id: string;
    branch_id: string;
    warehouse_id?: string;
    storage_condition?: string;
    batch_no: string;
    quantity: number;
    expiry_date: string;
    created_at?: string;
  }[];
  menuQualitySpecs?: Record<string, MenuItemQualitySpecs>;
  costCenters: string[];
  isAccountingPeriodLocked: boolean;
  extendedInventoryItems: Record<string, ExtendedInventoryItem>;
  inventoryDocuments: InventoryDocument[];
  reconciliations: TreasuryReconciliation[];
  userPermissions: Record<string, UserPermission>;
  currentUser: string;
  users: SystemUser[];
  fiscalYearStatus: "open" | "closed";
  inventorySettings?: InventorySettings;
  totalDisposedExpiryValue?: number;
  mock_data_cleared_v6?: boolean;
  employees?: Employee[];
  attendance?: AttendanceRecord[];
  loans?: EmployeeLoan[];
  payrolls?: PayrollRecord[];
  mallShops: MallShop[];
  mallPayments: MallRentalPayment[];
  mallGardenRevenues: MallGardenRevenue[];
  mallGardenExpenses: MallGardenExpense[];
  mallTerminatedContractsArchive: TerminatedContractRecord[];
}

const DEFAULT_BRANCHES: Branch[] = [
  { id: "branch-1", name: "Main Branch", name_ar: "الفرع الرئيسي", code: "MAIN" },
];

const DEFAULT_COST_CENTERS = [
  "المطبخ (Kitchen)",
  "البار (Bar)",
  "التوصيل (Delivery)",
  "الإدارة (Administration)",
  "التسويق (Marketing)",
  "المستودع (Warehouse)",
];

const getOffsetISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const USD_SEED_TRANSACTIONS: TreasuryTransaction[] = [];
const EGP_SEED_TRANSACTIONS: TreasuryTransaction[] = [];

const DEFAULT_EXPIRY_SEED = [];

const DEFAULT_ACCOUNTS: Account[] = ORACLE_MIGRATION_ACCOUNTS as any;

export const SEED_AH_JOURNAL_ENTRIES: JournalEntry[] = [];

const DEFAULT_TREASURIES: TreasuryAccount[] = [
  {
    id: "tr-1",
    account_code: "13010130",
    branch_id: "branch-1",
    name_ar: "خزينة الكاشير",
    type: "cash",
    currency: "MULTI",
    linked_to_restaurant: true,
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "كاشير المطعم",
    status: "active",
    deleted: false,
    containers: [
      { id: "cnt-cash-egp", name: "كاش مصري", currency: "EGP", balance: 0 },
      { id: "cnt-card-egp", name: "فيزا مصري", currency: "EGP", balance: 0 },
      { id: "cnt-wallet-egp", name: "محفظة مصري", currency: "EGP", balance: 0 },
      { id: "cnt-cash-usd", name: "كاش دولار", currency: "USD", balance: 0 },
      { id: "cnt-card-usd", name: "فيزا دولار", currency: "USD", balance: 0 },
      { id: "cnt-wallet-usd", name: "محفظة دولار", currency: "USD", balance: 0 },
      { id: "cnt-cash-ssp", name: "كاش سوداني", currency: "SSP", balance: 0 },
      { id: "cnt-wallet-ssp", name: "محفظة سوداني", currency: "SSP", balance: 0 },
      { id: "cnt-card-ssp", name: "فيزا سوداني", currency: "SSP", balance: 0 },
    ],
  },
  {
    id: "tr-oracle-13010100",
    account_code: "13010100",
    branch_id: "branch-1",
    name_ar: "خزينة بالدولار",
    type: "cash",
    currency: "USD",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13010101",
    account_code: "13010101",
    branch_id: "branch-1",
    name_ar: "خزينة دولار - كينيدي",
    type: "cash",
    currency: "USD",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "كينيدي",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13010102",
    account_code: "13010102",
    branch_id: "branch-1",
    name_ar: "خزينة دولار - 501",
    type: "cash",
    currency: "USD",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13010103",
    account_code: "13010103",
    branch_id: "branch-1",
    name_ar: "خزينة دولار - الادارة",
    type: "cash",
    currency: "USD",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13010105",
    account_code: "13010105",
    branch_id: "branch-1",
    name_ar: "خزينة بالدولار سنترال بوب",
    type: "cash",
    currency: "USD",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13010110",
    account_code: "13010110",
    branch_id: "branch-1",
    name_ar: "خزينة بالسوداني",
    type: "cash",
    currency: "SSP",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13010111",
    account_code: "13010111",
    branch_id: "branch-1",
    name_ar: "خزينة سوداني - كينيدي",
    type: "cash",
    currency: "SSP",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "كينيدي",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13010115",
    account_code: "13010115",
    branch_id: "branch-1",
    name_ar: "خزينة بالسوداني - سنترال بوب",
    type: "cash",
    currency: "SSP",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13010120",
    account_code: "13010120",
    branch_id: "branch-1",
    name_ar: "خزينه FM",
    type: "cash",
    currency: "MULTI",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
    containers: [
      { id: "cnt-cash-egp-13010120", name: "كاش مصري", currency: "EGP", balance: 0 },
      { id: "cnt-card-egp-13010120", name: "فيزا مصري", currency: "EGP", balance: 0 },
      { id: "cnt-cash-usd-13010120", name: "كاش دولار", currency: "USD", balance: 0 },
      { id: "cnt-card-usd-13010120", name: "فيزا دولار", currency: "USD", balance: 0 },
      { id: "cnt-cash-ssp-13010120", name: "كاش سوداني", currency: "SSP", balance: 0 },
      { id: "cnt-card-ssp-13010120", name: "فيزا سوداني", currency: "SSP", balance: 0 },
    ],
  },
  {
    id: "tr-oracle-13010125",
    account_code: "13010125",
    branch_id: "branch-1",
    name_ar: "خزينة مصري - الادارة",
    type: "cash",
    currency: "EGP",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13010135",
    account_code: "13010135",
    branch_id: "branch-1",
    name_ar: "خزينه تذاكر الدخول",
    type: "cash",
    currency: "MULTI",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
    containers: [
      { id: "cnt-cash-egp-13010135", name: "كاش مصري", currency: "EGP", balance: 0 },
      { id: "cnt-card-egp-13010135", name: "فيزا مصري", currency: "EGP", balance: 0 },
      { id: "cnt-cash-usd-13010135", name: "كاش دولار", currency: "USD", balance: 0 },
      { id: "cnt-card-usd-13010135", name: "فيزا دولار", currency: "USD", balance: 0 },
      { id: "cnt-cash-ssp-13010135", name: "كاش سوداني", currency: "SSP", balance: 0 },
      { id: "cnt-card-ssp-13010135", name: "فيزا سوداني", currency: "SSP", balance: 0 },
    ],
  },
  {
    id: "tr-oracle-13020100",
    account_code: "13020100",
    branch_id: "branch-1",
    name_ar: "CHARTER SSP",
    type: "bank",
    currency: "SSP",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13020110",
    account_code: "13020110",
    branch_id: "branch-1",
    name_ar: "CHARTER usd",
    type: "bank",
    currency: "USD",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13020120",
    account_code: "13020120",
    branch_id: "branch-1",
    name_ar: "EDEN SSP",
    type: "bank",
    currency: "SSP",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13020130",
    account_code: "13020130",
    branch_id: "branch-1",
    name_ar: "Equity ssp",
    type: "bank",
    currency: "SSP",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13020140",
    account_code: "13020140",
    branch_id: "branch-1",
    name_ar: "Equity usd",
    type: "bank",
    currency: "USD",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13020150",
    account_code: "13020150",
    branch_id: "branch-1",
    name_ar: "kcb SSP",
    type: "bank",
    currency: "SSP",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13020160",
    account_code: "13020160",
    branch_id: "branch-1",
    name_ar: "kcb usd",
    type: "bank",
    currency: "USD",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
  {
    id: "tr-oracle-13030100",
    account_code: "13030100",
    branch_id: "branch-1",
    name_ar: "Equity SSP FM",
    type: "bank",
    currency: "SSP",
    balance: 0,
    is_open: true,
    opening_balance: 0,
    available_balance: 0,
    responsible_employee: "غير محدد",
    status: "active",
    deleted: false,
  },
];

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    name_ar: "شركة الهدى للأغذية والدواجن",
    phone: "01023456789",
    balance: 0,
    account_code: "24010100",
    currency: "USD",
    deleted: false,
  },
  {
    id: "sup-2",
    name_ar: "المتحدون للخضروات والفاكهة",
    phone: "01123456789",
    balance: 0,
    account_code: "24010150",
    currency: "USD",
    deleted: false,
  },
  {
    id: "sup-3",
    name_ar: "توب كواليتي لمستلزمات التعبئة",
    phone: "01223456789",
    balance: 0,
    account_code: "24010160",
    currency: "USD",
    deleted: false,
  },
];

const DEFAULT_USERS: SystemUser[] = [
  {
    id: "u-admin",
    full_name: "مدير النظام (Super Admin)",
    username: "admin",
    password: "123456",
    phone: "01000000000",
    role: "admin",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-manager",
    full_name: "مشرف الفرع",
    username: "manager",
    password: "123456",
    phone: "01000000001",
    role: "manager",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-cashier",
    full_name: "كاشير الصالة",
    username: "cashier",
    password: "123456",
    phone: "01000000002",
    role: "cashier",
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_PERMISSIONS: Record<string, UserPermission> = {
  admin: {
    orders: true,
    pos: true,
    captain: true,
    kitchen: true,
    delivery: true,
    inventory: true,
    hr: true,
    purchasing: true,
    production: true,
    treasury: true,
    accounting: true,
    journal_approval: true,
    expense_approval: true,
    revenue_approval: true,
    reports: true,
    cost_centers: true,
    branch_mgmt: true,
    audit_logs: true,
    users_roles: true,
  },
  manager: {
    orders: true,
    pos: true,
    captain: true,
    kitchen: true,
    delivery: true,
    inventory: true,
    hr: true,
    purchasing: true,
    production: true,
    treasury: false,
    accounting: true,
    journal_approval: false,
    expense_approval: true,
    revenue_approval: true,
    reports: true,
    cost_centers: true,
    branch_mgmt: false,
    audit_logs: false,
    users_roles: false,
  },
  cashier: {
    orders: true,
    pos: true,
    captain: true,
    kitchen: true,
    delivery: true,
    inventory: false,
    hr: false,
    purchasing: false,
    production: false,
    treasury: false,
    accounting: false,
    journal_approval: false,
    expense_approval: false,
    revenue_approval: false,
    reports: false,
    cost_centers: false,
    branch_mgmt: false,
    audit_logs: false,
    users_roles: false,
  },
  "": {
    orders: true,
    pos: true,
    captain: true,
    kitchen: true,
    delivery: true,
    inventory: true,
    hr: true,
    purchasing: true,
    production: true,
    treasury: true,
    accounting: true,
    journal_approval: true,
    expense_approval: true,
    revenue_approval: true,
    reports: true,
    cost_centers: true,
    branch_mgmt: true,
    audit_logs: true,
    users_roles: true,
  },
  "": {
    orders: false,
    pos: false,
    captain: false,
    kitchen: false,
    delivery: false,
    inventory: true,
    hr: true,
    purchasing: true,
    production: true,
    treasury: false,
    accounting: true,
    journal_approval: false,
    expense_approval: true,
    revenue_approval: true,
    reports: true,
    cost_centers: true,
    branch_mgmt: false,
    audit_logs: false,
    users_roles: false,
  },
};

// @ts-nocheck
export class ERPStore {
  state;
  listeners = [];
  constructor() {
    this.state = this.loadState();
    this.recalculateAccountBalances();
  }
  async loadFromCloud() {
    try {
      console.log("Fetching state from Supabase cloud...");
      const { data, error } = await supabase
        .from("app_settings")
        .select("data")
        .eq("id", "erp_state")
        .single();

      if (error && error.code !== "PGRST116") {
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
  loadState() {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return this.getDefaultState();
    const raw = localStorage.getItem("erp_store_state");
    if (raw)
      try {
        const parsed = JSON.parse(raw);
        let treasuries =
          parsed.treasuries?.map((t) => {
            const currency = t.currency;
            return {
              ...t,
              currency: currency || "EGP",
              branch_id: "branch-1",
              name_ar: t.id === "tr-3" ? "خزينة الكاش الإضافية" : t.name_ar,
              available_balance: t.available_balance ?? t.balance,
              responsible_employee: t.responsible_employee ?? "غير محدد",
              status: t.status ?? "active",
              deleted: !!t.deleted,
            };
          }) || DEFAULT_TREASURIES;
        const t225 = treasuries.find((t) => t.name_ar && t.name_ar.includes("225"));
        if (t225) {
          treasuries = treasuries.filter((t) => t.id !== t225.id);
          if (parsed.treasuryTransactions)
            parsed.treasuryTransactions = parsed.treasuryTransactions.filter(
              (tx) => tx.treasury_id !== t225.id,
            );
        }
        treasuries = treasuries.filter(
          (t) => t.id !== "tr-300" && t.name_ar !== "300" && !t.name_ar?.includes("300"),
        );
        treasuries = treasuries.filter(
          (t) =>
            t.id !== "tr-admin-usd" &&
            t.name_ar !== "خزينة الإدارة دولار" &&
            t.name_ar !== "خزينة دولار الإدارة" &&
            !t.name_ar?.includes("الإدارة دولار") &&
            !t.name_ar?.includes("دولار الإدارة"),
        );
        if (parsed.treasuryTransactions)
          parsed.treasuryTransactions = parsed.treasuryTransactions.filter(
            (tx) => tx.treasury_id !== "tr-admin-usd",
          );
        if (parsed.treasuryTransactions)
          parsed.treasuryTransactions.forEach((tx) => {
            if (tx.treasury_id === "tr-300") tx.treasury_id = "tr-1";
          });
        const defaultSalesContainers = [
          {
            id: "cnt-cash-egp",
            name: "كاش مصري",
            currency: "EGP",
            balance: 0,
          },
          ,
          {
            id: "cnt-card-egp",
            name: "فيزا مصري",
            currency: "EGP",
            balance: 0,
          },
          ,
          {
            id: "cnt-wallet-egp",
            name: "محفظة مصري",
            currency: "EGP",
            balance: 0,
          },
          ,
          {
            id: "cnt-cash-usd",
            name: "كاش دولار",
            currency: "USD",
            balance: 0,
          },
          ,
          {
            id: "cnt-card-usd",
            name: "فيزا دولار",
            currency: "USD",
            balance: 0,
          },
          ,
          {
            id: "cnt-wallet-usd",
            name: "محفظة دولار",
            currency: "USD",
            balance: 0,
          },
          ,
          {
            id: "cnt-cash-ssp",
            name: "كاش سوداني",
            currency: "SSP",
            balance: 0,
          },
          ,
          {
            id: "cnt-card-ssp",
            name: "فيزا سوداني",
            currency: "SSP",
            balance: 0,
          },
          ,
          {
            id: "cnt-wallet-ssp",
            name: "محفظة سوداني",
            currency: "SSP",
            balance: 0,
          },
        ];
        const validSalesContainerIds = new Set(defaultSalesContainers.map((c) => c.id));
        let mainCashier = treasuries.find(
          (t) =>
            t.id === "tr-1" ||
            t.linked_to_restaurant ||
            (t.name_ar && t.name_ar.includes("الكاشير")),
        );
        if (!mainCashier) {
          mainCashier = {
            id: "tr-1",
            branch_id: "branch-1",
            name_ar: "خزينة الكاشير",
            type: "cash",
            currency: "MULTI",
            linked_to_restaurant: true,
            balance: 15e3,
            is_open: true,
            account_code: void 0,
            opening_balance: 15e3,
            available_balance: 15e3,
            responsible_employee: "أحمد علي",
            status: "active",
            deleted: false,
            containers: defaultSalesContainers,
          };
          treasuries.push(mainCashier);
        } else {
          mainCashier.id = "tr-1";
          mainCashier.name_ar = "خزينة الكاشير";
          mainCashier.linked_to_restaurant = true;
          mainCashier.deleted = false;
          mainCashier.currency = "MULTI";
          const cleanedContainers = (mainCashier.containers || []).filter((c) =>
            validSalesContainerIds.has(c.id),
          );
          defaultSalesContainers.forEach((dc) => {
            if (!cleanedContainers.some((c) => c.id === dc.id)) cleanedContainers.push({ ...dc });
          });
          mainCashier.containers = cleanedContainers;
        }
        treasuries.forEach((t) => {
          if (t.id !== "tr-1") t.linked_to_restaurant = false;
        });
        const seenTreasuryIds = /* @__PURE__ */ new Set();
        treasuries = treasuries.filter((t) => {
          if (!t.id || seenTreasuryIds.has(t.id)) return false;
          seenTreasuryIds.add(t.id);
          return true;
        });
        const loadedAccounts =
          parsed.accounts !== void 0 && Array.isArray(parsed.accounts)
            ? parsed.accounts.map((a) => ({
                ...a,
                level: a.level ?? 2,
                status: a.status ?? "active",
              }))
            : [...DEFAULT_ACCOUNTS];
        ORACLE_MIGRATION_ACCOUNTS.forEach((oracleAcc) => {
          if (!loadedAccounts.some((a) => a.code === oracleAcc.code))
            loadedAccounts.push({
              ...oracleAcc,
              balance: 0,
              initial_balance: 0,
              status: "active",
              system_binding: "none",
            });
        });

        const standardAccounts = [
          {
            code: "101000",
            name_ar: "خزينة الكاشير الرئيسية",
            name_en: "Main Cashier Treasury",
            type: "asset",
            level: 4,
            parent_code: "13010",
          },
          {
            code: "102000",
            name_ar: "حساب البنك / فيزا",
            name_en: "Bank / Card",
            type: "asset",
            level: 4,
            parent_code: "13010",
          },
          {
            code: "103000",
            name_ar: "محافظ إلكترونية",
            name_en: "E-Wallets",
            type: "asset",
            level: 4,
            parent_code: "13010",
          },
          {
            code: "201100",
            name_ar: "تأمينات مستأجرين",
            name_en: "Tenant Deposits",
            type: "liability",
            level: 4,
            parent_code: "2",
          },
          {
            code: "202000",
            name_ar: "الضرائب المستحقة",
            name_en: "Taxes Payable",
            type: "liability",
            level: 4,
            parent_code: "2",
          },
          {
            code: "401000",
            name_ar: "إيرادات المبيعات / المطعم",
            name_en: "Sales / Restaurant Revenue",
            type: "revenue",
            level: 4,
            parent_code: "4",
          },
          {
            code: "501000",
            name_ar: "تكلفة البضاعة المباعة",
            name_en: "COGS",
            type: "expense",
            level: 4,
            parent_code: "5",
          },
        ];

        standardAccounts.forEach((acc) => {
          if (!loadedAccounts.some((a) => a.code === acc.code)) {
            loadedAccounts.push({
              ...acc,
              id: "acc-" + acc.code,
              balance: 0,
              balance_egp: 0,
              balance_usd: 0,
              initial_balance: 0,
              status: "active",
              system_binding: "none",
            });
          }
        });
        const loadedSuppliers =
          parsed.suppliers?.map((s) => ({
            ...s,
            deleted: !!s.deleted,
          })) || DEFAULT_SUPPLIERS;
        const loadedTreasuries = treasuries;
        DEFAULT_TREASURIES.forEach((dt) => {
          if (
            dt.id !== "tr-admin-usd" &&
            !loadedTreasuries.some((lt) => lt.id === dt.id || lt.deleted)
          )
            loadedTreasuries.push({ ...dt });
        });
        const loadedJournalEntries = Array.isArray(parsed.journalEntries)
          ? parsed.journalEntries
          : [];
        const loadedTreasuryTransactions = Array.isArray(parsed.treasuryTransactions)
          ? parsed.treasuryTransactions
          : [];
        const loadedVouchers = Array.isArray(parsed.vouchers) ? parsed.vouchers : [];
        const loadedReconciliations = Array.isArray(parsed.reconciliations)
          ? parsed.reconciliations
          : [];

        return {
          branches: DEFAULT_BRANCHES,
          currentBranchId: "branch-1",
          treasuries: loadedTreasuries,
          suppliers: loadedSuppliers,
          purchaseOrders: (parsed.purchaseOrders || []).map((po) => ({
            ...po,
            branch_id: "branch-1",
          })),
          treasuryTransactions: loadedTreasuryTransactions.map((tx) => ({
            ...tx,
            branch_id: "branch-1",
          })),
          vouchers: loadedVouchers.map((v) => ({
            ...v,
            branch_id: "branch-1",
            deleted: !!v.deleted,
          })),
          accounts: loadedAccounts,
          journalEntries: loadedJournalEntries,
          auditLogs: parsed.auditLogs || [],
          inventoryExpiry:
            parsed.inventoryExpiry && parsed.inventoryExpiry.length > 0
              ? parsed.inventoryExpiry
              : DEFAULT_EXPIRY_SEED,
          menuQualitySpecs: parsed.menuQualitySpecs || {},
          costCenters: parsed.costCenters || DEFAULT_COST_CENTERS,
          isAccountingPeriodLocked: !!parsed.isAccountingPeriodLocked,
          extendedInventoryItems: parsed.extendedInventoryItems || {},
          inventoryDocuments: (parsed.inventoryDocuments || []).map((doc) => ({
            ...doc,
            branch_id: "branch-1",
          })),
          reconciliations: loadedReconciliations,
          userPermissions: parsed.userPermissions || DEFAULT_PERMISSIONS,
          currentUser: parsed.currentUser || "admin",
          users: parsed.users || DEFAULT_USERS,
          fiscalYearStatus: parsed.fiscalYearStatus || "open",
          inventorySettings: parsed.inventorySettings || {
            allowNegativeStock: true,
            defaultUnit: "كيلو",
          },
          totalDisposedExpiryValue: Number(parsed.totalDisposedExpiryValue || 0),
          hard_reset_2026_08_18_final: true,
          mock_data_cleared_v6: true,
          wipe_journal_entries_2026_08_18_v3: true,
          employees: parsed.employees || DEFAULT_EMPLOYEES,
          attendance: parsed.attendance || [],
          loans: parsed.loans || [],
          payrolls: parsed.payrolls || [],
          mallShops:
            parsed.mallShops && parsed.mallShops.length > 0 ? parsed.mallShops : DEFAULT_MALL_SHOPS,
          mallPayments:
            parsed.mallPayments && parsed.mallPayments.length > 0
              ? parsed.mallPayments
              : DEFAULT_MALL_PAYMENTS,
          mallGardenRevenues:
            parsed.mallGardenRevenues && parsed.mallGardenRevenues.length > 0
              ? parsed.mallGardenRevenues
              : DEFAULT_GARDEN_REVENUES,
          mallGardenExpenses:
            parsed.mallGardenExpenses && parsed.mallGardenExpenses.length > 0
              ? parsed.mallGardenExpenses
              : DEFAULT_GARDEN_EXPENSES,
          mallTerminatedContractsArchive: parsed.mallTerminatedContractsArchive || [],
        };
      } catch (e) {
        console.error("Error parsing ERP state:", e);
      }
    return this.getDefaultState();
  }
  clearAllJournalEntries() {
    this.state.journalEntries = [];
    if (Array.isArray(this.state.treasuryTransactions)) {
      this.state.treasuryTransactions = this.state.treasuryTransactions.filter(
        (tx) =>
          !tx.id?.startsWith("tx-import-") &&
          !tx.related_entity_id?.startsWith("ORACLE-") &&
          !tx.related_entity_id?.startsWith("je-"),
      );
    }
    this.state.accounts.forEach((a) => {
      a.balance = Number(a.initial_balance || 0);
    });
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "مسح قيود اليومية",
      "تم مسح جميع قيود اليومية العامة من الذاكرة بالكامل",
      "DELETE",
    );
    this.notify();
  }
  deleteAllSystemData() {
    const s = this.getDefaultState();
    s.hard_reset_2026_08_18_final = true;
    s.wipe_journal_entries_2026_08_18_v3 = true;
    s.treasuryTransactions = [];
    s.journalEntries = [];
    s.vouchers = [];
    s.purchaseOrders = [];
    s.inventoryDocuments = [];
    s.orders = [];
    s.mallShops = [];
    s.mallPayments = [];
    s.mallGardenRevenues = [];
    s.mallGardenExpenses = [];
    s.mallTerminatedContractsArchive = [];
    s.treasuries = JSON.parse(JSON.stringify(DEFAULT_TREASURIES));
    s.treasuries.forEach((t) => {
      t.balance = 0;
      t.opening_balance = 0;
      t.available_balance = 0;
      if (t.containers) t.containers.forEach((c) => (c.balance = 0));
    });
    s.accounts.forEach((a) => {
      a.balance = 0;
      a.opening_balance = 0;
    });
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("pos_local_orders");
      localStorage.removeItem("erp_store_state");
    }
    this.state = s;
    this.recalculateAccountBalances();
    this.saveState();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
    this.notify();
  }
  getDefaultState() {
    return {
      branches: DEFAULT_BRANCHES,
      currentBranchId: "branch-1",
      treasuries: DEFAULT_TREASURIES,
      suppliers: DEFAULT_SUPPLIERS,
      purchaseOrders: [],
      treasuryTransactions: [],
      vouchers: [],
      accounts: DEFAULT_ACCOUNTS,
      journalEntries: [],
      auditLogs: [],
      inventoryExpiry: DEFAULT_EXPIRY_SEED,
      menuQualitySpecs: {},
      costCenters: DEFAULT_COST_CENTERS,
      isAccountingPeriodLocked: false,
      extendedInventoryItems: {},
      inventoryDocuments: [],
      reconciliations: [],
      userPermissions: DEFAULT_PERMISSIONS,
      currentUser: "admin",
      users: DEFAULT_USERS,
      fiscalYearStatus: "open",
      inventorySettings: {
        allowNegativeStock: true,
        defaultUnit: "كيلو",
      },
      totalDisposedExpiryValue: 0,
      employees: DEFAULT_EMPLOYEES,
      attendance: [],
      loans: [],
      payrolls: [],
      mallShops: DEFAULT_MALL_SHOPS,
      mallPayments: DEFAULT_MALL_PAYMENTS,
      mallGardenRevenues: DEFAULT_GARDEN_REVENUES,
      mallGardenExpenses: DEFAULT_GARDEN_EXPENSES,
      mallTerminatedContractsArchive: [],
    };
  }
  saveState() {
    if (this.state.journalEntries) this.state.journalEntries = [...this.state.journalEntries];
    if (this.state.accounts) this.state.accounts = [...this.state.accounts];
    if (this.state.treasuryTransactions)
      this.state.treasuryTransactions = [...this.state.treasuryTransactions];
    if (this.state.treasuries) this.state.treasuries = [...this.state.treasuries];
    // Background sync to Cloud (Supabase)
    if (typeof window !== "undefined") {
      try {
        supabase
          .from("app_settings")
          .upsert({ id: "erp_state", data: this.state })
          .then(() => console.log("State synced to cloud"))
          .catch((err) => console.error("Failed to sync to cloud", err));
      } catch (e) {}
    }

    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("erp_store_state", JSON.stringify(this.state));
      } catch (err: any) {
        if (
          (err instanceof DOMException && err.name === "QuotaExceededError") ||
          (err.message && err.message.toLowerCase().includes("quota"))
        ) {
          console.warn(
            "LocalStorage Quota Exceeded! But don't worry, the state is being synced to the Cloud Database (Supabase) automatically.",
          );
        } else {
          console.error(err);
        }
      }
    }
    this.notify();
  }
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
  notify() {
    this.listeners.forEach((l) => l());
  }
  resetRestaurantSales() {
    this.state.sales_invoices = [];
    this.state.treasuryTransactions = this.state.treasuryTransactions.filter(
      (t) => t.type !== "sale" && t.type !== "income",
    );
    this.state.journalEntries = this.state.journalEntries.filter(
      (j) => !j.description?.includes("فاتورة مبيعات"),
    );
    const linkedTreasury = this.state.treasuries.find((t) => t.linked_to_restaurant);
    if (linkedTreasury) linkedTreasury.balance = 0;
    this.saveState();
  }
  getState() {
    return this.state;
  }
  getCurrentBranch() {
    return (
      this.state.branches.find((b) => b.id === this.state.currentBranchId) || this.state.branches[0]
    );
  }
  setCurrentBranch(branchId) {
    this.state.currentBranchId = branchId;
    this.saveState();
    this.logAction(
      "SYSTEM",
      "تغيير الفرع الحالي",
      `تم الانتقال إلى الفرع ذو المعرف ${branchId}`,
      "SYSTEM",
    );
  }
  logAction(user, action, details, actionType = "SYSTEM", beforeValue, afterValue) {
    const log = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      user_email: user,
      action,
      details,
      created_at: /* @__PURE__ */ new Date().toISOString(),
      action_type: actionType,
      before_value: beforeValue,
      after_value: afterValue,
      ip_address: "127.0.0.1",
    };
    this.state.auditLogs.unshift(log);
    this.saveState();
  }
  getUsers() {
    return this.state.users || [];
  }
  upsertUser(user) {
    if (!this.state.users) this.state.users = [];
    const idx = this.state.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) this.state.users[idx] = user;
    else this.state.users.push(user);
    this.saveState();
  }
  deleteUser(id) {
    if (!this.state.users) return;
    this.state.users = this.state.users.filter((u) => u.id !== id);
    this.saveState();
  }
  setCurrentUser(email) {
    this.state.currentUser = email;
    this.saveState();
    this.logAction("SYSTEM", "تغيير المستخدم النشط", `تم تسجيل دخول المستخدم: ${email}`, "SYSTEM");
  }
  updateUserPermission(email, permissions) {
    const existing = this.state.userPermissions[email] || {
      treasury: false,
      accounting: false,
      journal_approval: false,
      expense_approval: false,
      revenue_approval: false,
      reports: false,
      cost_centers: false,
      branch_mgmt: false,
      audit_logs: false,
    };
    this.state.userPermissions[email] = {
      ...existing,
      ...permissions,
    };
    this.saveState();
    this.logAction("ADMIN", "تحديث صلاحيات مستخدم", `تم تحديث صلاحيات ${email}`, "UPDATE");
  }
  addBranch(name, name_ar, code) {
    const branch = {
      id: "branch-" + Date.now(),
      name,
      name_ar,
      code,
    };
    this.state.branches.push(branch);
    this.saveState();
    this.logAction("ADMIN", "إضافة فرع جديد", `تم إنشاء فرع جديد: ${name_ar} (${code})`, "CREATE");
    return branch;
  }
  clearAllAccountsAndTransactions() {
    this.state.accounts = [];
    this.state.treasuryTransactions = [];
    this.state.journalEntries = [];
    this.state.vouchers = [];
    this.state.purchaseOrders = [];
    this.state.inventoryDocuments = [];
    if (typeof window !== "undefined" && typeof localStorage !== "undefined")
      localStorage.removeItem("pos_local_orders");
    this.saveState();
    this.logAction(
      "ADMIN",
      "مسح كامل الحسابات والحركات",
      "تم تفريغ جميع الحسابات والحركات المالية لإعادة البدء بدليل نظيف",
      "DELETE",
    );
  }
  addSupplier(
    name_ar: string,
    phone?: string,
    openingBalance: number = 0,
    account_code?: string,
    currency: string = "USD",
  ) {
    let targetAccountCode = account_code ? String(account_code).trim() : "";
    let isNewAccount = false;

    // If no account code is provided, auto-create a dedicated supplier account in Chart of Accounts under 24010
    if (!targetAccountCode) {
      const existingSupplierCodes = this.state.accounts
        .map((a) => a.code)
        .filter((c) => c.startsWith("24010") && c.length === 8);

      let maxSuffix = 390;
      existingSupplierCodes.forEach((code) => {
        const suffix = parseInt(code.substring(5), 10);
        if (!isNaN(suffix) && suffix > maxSuffix) {
          maxSuffix = suffix;
        }
      });

      const nextSuffix = maxSuffix + 1;
      targetAccountCode = `24010${String(nextSuffix).padStart(3, "0")}`;
      isNewAccount = true;

      if (!this.state.accounts.some((a) => a.code === targetAccountCode)) {
        const newAcc: Account = {
          code: targetAccountCode,
          name_ar: `مورد - ${name_ar}`,
          type: "liability",
          level: 4,
          parent_code: "24010",
          balance: openingBalance,
          initial_balance: openingBalance,
          status: "active",
          currency: currency || "USD",
          system_binding: "none",
        };
        this.state.accounts.push(newAcc);
      }
    } else {
      const existing = this.state.accounts.find((a) => a.code === targetAccountCode);
      if (!existing) {
        this.state.accounts.push({
          code: targetAccountCode,
          name_ar: `مورد - ${name_ar}`,
          type: "liability",
          level: 4,
          parent_code: "24010",
          balance: openingBalance,
          initial_balance: openingBalance,
          status: "active",
          currency: currency || "USD",
          system_binding: "none",
        });
        isNewAccount = true;
      }
    }

    const supplier: Supplier = {
      id: "sup-" + Date.now(),
      name_ar,
      phone: phone || "",
      balance: openingBalance,
      account_code: targetAccountCode,
      currency: currency || "USD",
      deleted: false,
    };

    this.state.suppliers.push(supplier);
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "إضافة مورد جديد",
      `تم تسجيل المورد: ${name_ar} وربطه بالحساب المحاسبي رقم (${targetAccountCode})`,
      "CREATE",
    );
    this.notify();
    return { supplier, account_code: targetAccountCode, isNewAccount };
  }
  deleteSupplier(id: string) {
    const sup = this.state.suppliers.find((s) => s.id === id);
    if (sup) {
      sup.deleted = true;
      this.saveState();
      this.logAction("ADMIN", "حذف مورد (حذف مؤقت)", `تم حذف المورد #${id} مؤقتاً`, "DELETE");
      this.notify();
    }
  }
  updateSupplier(id: string, payload: Partial<Supplier>) {
    const sup = this.state.suppliers.find((s) => s.id === id);
    if (sup) {
      Object.assign(sup, payload);
      // If account_code changed, sync
      if (payload.account_code) {
        const acc = this.state.accounts.find((a) => a.code === payload.account_code);
        if (acc && payload.name_ar) {
          acc.name_ar = `مورد - ${payload.name_ar}`;
        }
      }
      this.saveState();
      this.logAction("ADMIN", "تعديل بيانات مورد", `تم تعديل المورد: ${sup.name_ar}`, "UPDATE");
      this.notify();
    }
  }
  updateSupplierBalance(id: string, amount: number) {
    const sup = this.state.suppliers.find((s) => s.id === id);
    if (sup) {
      sup.balance += amount;
      this.saveState();
      this.notify();
    }
  }
  recordSupplierTransaction(params: {
    supplier_id: string;
    type: "payment" | "invoice" | "adjustment";
    amount: number;
    currency?: "USD" | "SSP" | string;
    exchange_rate?: number;
    treasury_id?: string;
    note?: string;
    date?: string;
  }) {
    const supplier = this.state.suppliers.find((s) => s.id === params.supplier_id);
    if (!supplier) throw new Error("المورد غير موجود");

    const supAccCode = supplier.account_code || "201000";
    const curr = params.currency || "USD";
    const rate = Number(params.exchange_rate) || 1;
    const rawAmount = Number(params.amount) || 0;
    const baseUsd = curr === "USD" ? rawAmount : rate > 1 ? rawAmount / rate : rawAmount * rate;
    const targetDate = params.date || new Date().toISOString().split("T")[0];

    const refSeq = Math.floor(Math.random() * 8999) + 1000;
    let ref = `SUP-TX-${refSeq}`;
    const lines: JournalLine[] = [];

    if (params.type === "payment") {
      // Payment to Supplier: Debit Supplier, Credit Treasury
      const treasury =
        this.state.treasuries.find((t) => t.id === params.treasury_id) || this.state.treasuries[0];
      const treasuryAccCode =
        treasury?.account_code || (treasury?.type === "bank" ? "13020140" : "13010100");
      ref = `SUP-PAY-${refSeq}`;

      lines.push({
        account_code: supAccCode,
        debit: rawAmount,
        credit: 0,
        currency: curr,
        rate: rate,
        description: params.note || `سداد دفعة نقدية للمورد ${supplier.name_ar}`,
      });

      lines.push({
        account_code: treasuryAccCode,
        debit: 0,
        credit: rawAmount,
        currency: curr,
        rate: rate,
        description: params.note || `سداد دفعة نقدية للمورد ${supplier.name_ar}`,
      });

      if (treasury) {
        this.addTreasuryTransaction(
          treasury.id,
          "purchase",
          rawAmount,
          curr,
          `سداد للمورد: ${supplier.name_ar} - ${params.note || ""}`,
          ref,
          "cash",
          undefined,
          true,
        );
      }
      supplier.balance -= rawAmount;
    } else if (params.type === "invoice") {
      ref = `SUP-INV-${refSeq}`;
      lines.push({
        account_code: "103000",
        debit: rawAmount,
        credit: 0,
        currency: curr,
        rate: rate,
        description: params.note || `فاتورة استحقاق بضاعة للمورد ${supplier.name_ar}`,
      });
      lines.push({
        account_code: supAccCode,
        debit: 0,
        credit: rawAmount,
        currency: curr,
        rate: rate,
        description: params.note || `فاتورة استحقاق بضاعة للمورد ${supplier.name_ar}`,
      });
      supplier.balance += rawAmount;
    } else {
      ref = `SUP-ADJ-${refSeq}`;
      lines.push({
        account_code: supAccCode,
        debit: rawAmount > 0 ? rawAmount : 0,
        credit: rawAmount < 0 ? Math.abs(rawAmount) : 0,
        currency: curr,
        rate: rate,
        description: params.note || `تسوية رصيد حساب المورد ${supplier.name_ar}`,
      });
      lines.push({
        account_code: "17010100",
        debit: rawAmount < 0 ? Math.abs(rawAmount) : 0,
        credit: rawAmount > 0 ? rawAmount : 0,
        currency: curr,
        rate: rate,
        description: params.note || `تسوية رصيد حساب المورد ${supplier.name_ar}`,
      });
      supplier.balance -= rawAmount;
    }
    this.addJournalEntry(
      `حركة مورد (${supplier.name_ar}) - ${params.note || ref}`,
      lines,
      ref,
      curr,
      targetDate,
    );
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "تسجيل حركة مورد",
      `تم تسجيل حركة ${params.type} بمبلغ ${rawAmount.toLocaleString()} ${curr} للمورد ${supplier.name_ar} (حساب #${supAccCode}) برقم مرجعي ${ref}`,
      "TRANSACTION",
    );
    this.notify();
    return {
      success: true,
      reference: ref,
      account_code: supAccCode,
      supplier_name: supplier.name_ar,
      amount: rawAmount,
      currency: curr,
      base_usd_amount: baseUsd,
    };
  }
  addTreasury(
    name_ar,
    type,
    currency,
    openingBalance = 0,
    employee = "غير محدد",
    containers = [],
    linked_to_restaurant = false,
    account_code,
  ) {
    const treasury = {
      id: "tr-" + Date.now(),
      branch_id: this.state.currentBranchId,
      name_ar,
      type,
      currency,
      balance: openingBalance,
      is_open: true,
      account_code: account_code || undefined,
      opening_balance: openingBalance,
      available_balance: openingBalance,
      responsible_employee: employee,
      status: "active",
      deleted: false,
      containers,
      linked_to_restaurant,
    };
    this.state.treasuries.push(treasury);
    this.saveState();
    this.logAction(
      "ADMIN",
      "إضافة حساب خزينة/بنك",
      `تم إنشاء حساب ${name_ar} برصيد إفتتاحي ${openingBalance} ${currency}`,
      "CREATE",
    );
    return treasury;
  }
  updateTreasury(id, payload) {
    const tr = this.state.treasuries.find((t) => t.id === id);
    if (tr) {
      Object.assign(tr, payload);
      this.saveState();
      this.logAction("ADMIN", "تعديل حساب خزينة/بنك", `تم تعديل حساب: ${tr.name_ar}`, "UPDATE");
    }
  }
  setTreasuryOpenStatus(treasuryId, isOpen) {
    const tr = this.state.treasuries.find((t) => t.id === treasuryId);
    if (tr) {
      const oldState = tr.is_open;
      tr.is_open = isOpen;
      tr.status = isOpen ? "active" : "closed";
      this.saveState();
      this.logAction(
        "ADMIN",
        isOpen ? "فتح الخزينة اليومي" : "إغلاق الخزينة اليومي",
        `تم تغيير حالة خزينة ${tr.name_ar} إلى ${isOpen ? "مفتوحة" : "مغلقة"}`,
        "UPDATE",
        `isOpen: ${oldState}`,
        `isOpen: ${isOpen}`,
      );
    }
  }
  deleteTreasury(id) {
    const trIndex = this.state.treasuries.findIndex((t) => t.id === id);
    const tr = this.state.treasuries[trIndex];
    if (tr) {
      if (Math.abs(tr.balance) > 0.001)
        throw new Error(
          `لا يمكن حذف الخزينة وهي تحتوي على رصيد مالي نشط (${tr.balance.toLocaleString()} ${tr.currency}).`,
        );
      tr.deleted = true;
      tr.is_open = false;
      this.state.treasuries.splice(trIndex, 1);
      this.saveState();
      this.logAction("ADMIN", "حذف خزينة", `تم حذف الخزينة ${tr.name_ar}`, "DELETE");
    }
  }
  reconcileTreasury(treasuryId, actualCount, notes) {
    const tr = this.state.treasuries.find((t) => t.id === treasuryId);
    if (!tr) throw new Error("الخزينة غير موجودة");
    const ledgerBalance = tr.balance;
    const difference = actualCount - ledgerBalance;
    const recon = {
      id: "rec-" + Date.now(),
      treasury_id: treasuryId,
      date: new Date().toISOString(),
      ledger_balance: ledgerBalance,
      actual_balance: actualCount,
      difference,
      reconciled_by: this.state.currentUser,
      notes,
    };
    if (!this.state.reconciliations) this.state.reconciliations = [];
    this.state.reconciliations.unshift(recon);
    tr.balance = actualCount;
    tr.available_balance = actualCount;
    this.postReconciliationJournal(recon, tr);
    this.saveState();
    this.logAction(
      "ADMIN",
      "تسوية ومطابقة خزينة",
      `تم تسوية خزينة ${tr.name_ar} بفارق ${difference.toFixed(2)} ج.م (جرد فعلي: ${actualCount})`,
      "TRANSACTION",
    );
  }
  postReconciliationJournal(recon, tr) {
    const treasuryAccountCode =
      tr.type === "bank" ? "102000" : tr.branch_id === "branch-2" ? "101001" : "101000";
    const diff = recon.difference;
    const lines = [];
    if (diff > 0) {
      lines.push({
        account_code: treasuryAccountCode,
        debit: diff,
        credit: 0,
      });
      lines.push({
        account_code: "41010",
        debit: 0,
        credit: diff,
      });
    } else if (diff < 0) {
      lines.push({
        account_code: "506000",
        debit: Math.abs(diff),
        credit: 0,
      });
      lines.push({
        account_code: treasuryAccountCode,
        debit: 0,
        credit: Math.abs(diff),
      });
    }
    if (lines.length > 0)
      this.addJournalEntry(
        `تسوية جرد مالي لخزينة ${tr.name_ar}`,
        lines,
        `REC-${recon.id.substring(4, 9).toUpperCase()}`,
      );
  }
  addTreasuryTransaction(
    treasuryId,
    type,
    amount,
    currency,
    note,
    relatedId,
    paymentMethod,
    containerId,
    skipJournal = false,
  ) {
    const tr = this.state.treasuries.find((t) => t.id === treasuryId, true);
    if (!tr) return;
    const beforeBal = tr.balance;
    if (type === "deposit" || type === "sales" || type === "transfer_in") {
      tr.balance += amount;
      tr.available_balance = tr.balance;
      if (containerId && tr.containers) {
        const cnt = tr.containers.find((c) => c.id === containerId);
        if (cnt) cnt.balance += amount;
      }
    } else {
      tr.balance -= amount;
      tr.available_balance = tr.balance;
      if (containerId && tr.containers) {
        const cnt = tr.containers.find((c) => c.id === containerId);
        if (cnt) cnt.balance -= amount;
      }
    }
    const tx = {
      id: "tx-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      branch_id: this.state.currentBranchId,
      treasury_id: treasuryId,
      type,
      amount,
      currency,
      payment_method: paymentMethod || "cash",
      note,
      related_entity_id: relatedId,
      created_at: new Date().toISOString(),
    };
    this.state.treasuryTransactions.unshift(tx);
    this.saveState();

    if (!skipJournal) {
      this.postTreasuryJournal(tx, tr);
    }
  }
  postTreasuryJournal(tx, tr) {
    let debitAccount = "101000";
    let creditAccount = "301000";
    if (this.state.currentBranchId === "branch-2") debitAccount = "101001";
    else if (tr.type === "bank") debitAccount = "102000";
    if (tx.type === "sales") creditAccount = "401000";
    else if (tx.type === "expense") creditAccount = "504000";
    else if (tx.type === "purchase") creditAccount = "103000";
    const lines = [];
    if (tx.type === "deposit" || tx.type === "sales" || tx.type === "transfer_in") {
      lines.push({
        account_code: debitAccount,
        debit: tx.amount,
        credit: 0,
      });
      lines.push({
        account_code: creditAccount,
        debit: 0,
        credit: tx.amount,
      });
    } else if (
      tx.type === "withdrawal" ||
      tx.type === "purchase" ||
      tx.type === "expense" ||
      tx.type === "transfer_out"
    ) {
      lines.push({
        account_code: creditAccount,
        debit: tx.amount,
        credit: 0,
      });
      lines.push({
        account_code: debitAccount,
        debit: 0,
        credit: tx.amount,
      });
    }
    if (lines.length > 0)
      this.addJournalEntry(tx.note, lines, `TX-${tx.id.substring(3, 8).toUpperCase()}`);
  }
  addAccount(
    code,
    name_ar,
    type,
    parentCode,
    level = 2,
    initial_balance = 0,
    system_binding = "none",
    currency = "EGP",
  ) {
    if (this.state.accounts.some((a) => a.code === code))
      throw new Error("كود الحساب موجود بالفعل");
    const account = {
      code,
      name_ar,
      type,
      balance: initial_balance,
      parent_code: parentCode,
      level,
      status: "active",
      initial_balance,
      system_binding,
      currency,
      sync_status: system_binding && system_binding !== "none" ? "pending" : "synced",
    };
    this.state.accounts.push(account);
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "إضافة حساب محاسبي",
      `تم تسجيل الحساب الجديد في الدليل: ${name_ar} (${code})`,
      "CREATE",
    );
    return account;
  }
  updateAccountStatus(code, status) {
    const acc = this.state.accounts.find((a) => a.code === code);
    if (acc) {
      acc.status = status;
      this.saveState();
      this.logAction(
        "ADMIN",
        "تحديث حالة حساب",
        `تم تغيير حالة حساب ${acc.name_ar} إلى ${status}`,
        "UPDATE",
      );
    }
  }
  updateAccount(code, payload) {
    const acc = this.state.accounts.find((a) => a.code === code);
    if (!acc) throw new Error("الحساب غير موجود");
    if (payload.code && payload.code !== code) {
      if (this.state.accounts.some((a) => a.code === payload.code))
        throw new Error("كود الحساب الجديد مستخدم بالفعل لحساب آخر");
      this.state.accounts.forEach((a) => {
        if (a.parent_code === code) a.parent_code = payload.code;
      });
      this.state.journalEntries.forEach((je) => {
        je.lines?.forEach((l) => {
          if (l.account_code === code) l.account_code = payload.code;
        });
      });
    }
    const oldBinding = acc.system_binding;
    Object.assign(acc, payload);
    if (payload.system_binding !== void 0 && payload.system_binding !== oldBinding)
      acc.sync_status = payload.system_binding !== "none" ? "pending" : "synced";
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "تعديل حساب محاسبي",
      `تم تعديل بيانات الحساب المحاسبي: ${acc.name_ar} (${acc.code})`,
      "UPDATE",
    );
    return acc;
  }
  activateAccountSync(code) {
    const acc = this.state.accounts.find((a) => a.code === code);
    if (acc) {
      acc.sync_status = "synced";
      this.recalculateAccountBalances();
      this.saveState();
      this.logAction(
        "ADMIN",
        "تنشيط مزامنة رصيد الحساب",
        `تم تنشيط مزامنة الرصيد وتحديثه للحساب: ${acc.name_ar} (${acc.code})`,
        "UPDATE",
      );
    }
  }
  deleteAccount(code) {
    const index = this.state.accounts.findIndex((a) => a.code === code);
    if (index === -1) throw new Error("الحساب غير موجود");
    const acc = this.state.accounts[index];
    if (this.state.accounts.some((a) => a.parent_code === code))
      throw new Error(
        "لا يمكن حذف حساب رئيسي يمتلك حسابات فرعية. قم بحذف أو نقل الحسابات الفرعية أولاً.",
      );
    if (this.state.journalEntries.some((je) => je.lines?.some((l) => l.account_code === code))) {
      acc.status = "inactive";
      this.saveState();
      this.logAction(
        "ADMIN",
        "تعطيل حساب مرتبط بقيود",
        `الحساب ${acc.name_ar} (${acc.code}) مرتبط بقيود محاسبية، تم تحويل حالته إلى معطل بدلاً من الحذف الفيزيائي لحفظ الشجرة والنزاهة المالية.`,
        "UPDATE",
      );
      return {
        softDeleted: true,
        message: "الحساب مرتبط بقيود محاسبية، تم تعطيله بدلاً من الحذف لحفظ النزاهة المالية.",
      };
    }
    this.state.accounts.splice(index, 1);
    this.saveState();
    this.logAction(
      "ADMIN",
      "حذف حساب محاسبي",
      `تم حذف الحساب المحاسبي من الدليل: ${acc.name_ar} (${code})`,
      "DELETE",
    );
    return {
      softDeleted: false,
      message: "تم حذف الحساب بنجاح!",
    };
  }
  recalculateAccountBalances() {
    const balanceMap = {};
    this.state.accounts.forEach((acc) => {
      balanceMap[acc.code] = acc.initial_balance || 0;
    });
    this.state.journalEntries.forEach((entry) => {
      if (!entry.lines) return;
      entry.lines.forEach((line) => {
        const acc = this.state.accounts.find((a) => a.code === line.account_code);
        if (acc) {
          if (balanceMap[acc.code] === void 0) balanceMap[acc.code] = acc.initial_balance || 0;
          const debit = Number(line.debit || 0);
          const credit = Number(line.credit || 0);
          if (acc.type === "asset" || acc.type === "expense")
            balanceMap[acc.code] += debit - credit;
          else balanceMap[acc.code] += credit - debit;
        }
      });
    });
    this.state.accounts.forEach((acc) => {
      if (acc.system_binding && acc.system_binding !== "none" && acc.sync_status !== "pending") {
        let liveBalance = acc.initial_balance || 0;
        if (acc.system_binding.startsWith("treasury_")) {
          const tId = acc.system_binding.replace("treasury_", "");
          let t = this.state.treasuries.find((x) => x.id === tId);
          if (!t) {
            if (tId === "main") t = this.state.treasuries.find((x) => x.id === "tr-1");
            else if (tId === "cib") t = this.state.treasuries.find((x) => x.id === "tr-2");
            else if (tId === "extra") t = this.state.treasuries.find((x) => x.id === "tr-3");
            else if (tId === "usd") t = this.state.treasuries.find((x) => x.id === "tr-4");
            else if (tId === "management_egp")
              t = this.state.treasuries.find((x) => x.id === "tr-5");
          }
          if (t) liveBalance = t.balance || 0;
        } else
          switch (acc.system_binding) {
            case "suppliers_payable":
              liveBalance = this.state.suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
              break;
            case "sales_revenue":
              liveBalance =
                this.state.vouchers
                  ?.filter((v) => !v.deleted && v.type === "receipt")
                  ?.reduce((sum, v) => sum + Number(v.amount || 0), 0) || 0;
              break;
            case "operating_expenses":
              liveBalance =
                this.state.vouchers
                  ?.filter((v) => !v.deleted && v.type === "payment")
                  ?.reduce((sum, v) => sum + Number(v.amount || 0), 0) || 0;
              break;
            case "warehouse_main_value": {
              const items = localWarehouseStore.getInventory();
              liveBalance = localWarehouseStore
                .getWarehouseInventory("wh-main-default")
                .reduce((sum, row) => {
                  const item = items.find((i) => i.id === row.inventory_id);
                  if (item) return sum + Number(row.quantity || 0) * Number(item.cost || 0);
                  return sum;
                }, 0);
              break;
            }
            case "warehouse_kitchen_value": {
              const items = localWarehouseStore.getInventory();
              liveBalance = localWarehouseStore
                .getWarehouseInventory("wh-sub-kitchen")
                .reduce((sum, row) => {
                  const item = items.find((i) => i.id === row.inventory_id);
                  if (item) return sum + Number(row.quantity || 0) * Number(item.cost || 0);
                  return sum;
                }, 0);
              break;
            }
            case "expired_inventory_value": {
              const nowStr = /* @__PURE__ */ new Date().toISOString().split("T")[0];
              const expiredBatches = this.state.inventoryExpiry.filter(
                (b) => b.expiry_date <= nowStr,
              );
              const items = localWarehouseStore.getInventory();
              liveBalance = expiredBatches.reduce((sum, batch) => {
                const item = items.find((i) => i.id === batch.inventory_id);
                if (item) return sum + Number(batch.quantity || 0) * Number(item.cost || 0);
                return sum;
              }, 0);
              break;
            }
            case "disposed_waste_value":
              liveBalance = this.state.totalDisposedExpiryValue || 0;
              break;
            default:
              break;
          }
        balanceMap[acc.code] = liveBalance;
      }
    });
    this.state.accounts.forEach((acc) => {
      if (balanceMap[acc.code] !== void 0) acc.balance = balanceMap[acc.code];
    });
    if (this.state.treasuries && this.state.treasuries.length > 0) {
      this.state.treasuries.forEach((tr) => {
        const opening = Number(tr.opening_balance || 0);
        const matchedCode = String(tr.account_code || "").trim();

        // Real-time calculation of treasury balance directly from General Ledger Journal Entries
        let totalDebit = 0;
        let totalCredit = 0;

        (this.state.journalEntries || []).forEach((je) => {
          (je.lines || []).forEach((line) => {
            const lineAccCode = String(line.account_code || "").trim();
            let isMatch = false;

            if (matchedCode && lineAccCode === matchedCode) {
              isMatch = true;
            } else {
              const resolved = this.resolveTreasuryForAccount(
                lineAccCode,
                line.currency || je.currency,
                line.description || je.description,
              );
              if (resolved && resolved.id === tr.id) {
                isMatch = true;
              }
            }

            if (isMatch) {
              totalDebit += Number(line.debit || 0);
              totalCredit += Number(line.credit || 0);
            }
          });
        });

        const glCalculatedBalance = opening + (totalDebit - totalCredit);
        tr.balance = glCalculatedBalance;
        tr.available_balance = glCalculatedBalance;

        // Update multi-currency sub-containers if any
        if (tr.containers && tr.containers.length > 0) {
          tr.containers.forEach((cnt) => {
            let cntDebit = 0;
            let cntCredit = 0;
            const targetCurr = (cnt.currency || "").toUpperCase();

            (this.state.journalEntries || []).forEach((je) => {
              (je.lines || []).forEach((line) => {
                const lineAccCode = String(line.account_code || "").trim();
                const lineCurr = (line.currency || je.currency || "").toUpperCase();

                if (lineCurr === targetCurr) {
                  let isMatch = false;
                  if (matchedCode && lineAccCode === matchedCode) {
                    isMatch = true;
                  } else {
                    const resolved = this.resolveTreasuryForAccount(
                      lineAccCode,
                      line.currency || je.currency,
                      line.description || je.description,
                    );
                    if (resolved && resolved.id === tr.id) {
                      isMatch = true;
                    }
                  }

                  if (isMatch) {
                    cntDebit += Number(line.debit || 0);
                    cntCredit += Number(line.credit || 0);
                  }
                }
              });
            });

            cnt.balance = cntDebit - cntCredit;
          });
        }
      });
    }
    this.saveState();
  }
  resolveTreasuryForAccount(accountCode, currency, movementNote) {
    if (!this.state.treasuries || this.state.treasuries.length === 0) return void 0;
    const directMatch = this.state.treasuries.find(
      (t) => !t.deleted && t.account_code && t.account_code === accountCode,
    );
    if (directMatch) return directMatch;
    const code = String(accountCode || "").trim();
    const curr = (currency || "").toUpperCase();
    const note = (movementNote || "").toLowerCase();
    if (code === "15010100" || code === "150101" || code.startsWith("150101")) {
      const usdTr = this.state.treasuries.find(
        (t) => !t.deleted && (t.id === "tr-4" || (t.currency === "USD" && t.type === "cash")),
      );
      if (usdTr) return usdTr;
    }
    if (code === "15010200" || code === "150102" || (code.startsWith("1501") && curr === "EGP")) {
      const egpTr = this.state.treasuries.find(
        (t) =>
          !t.deleted && (t.id === "tr-5" || (t.currency === "EGP" && t.name_ar.includes("مصري"))),
      );
      if (egpTr) return egpTr;
    }
    if (code === "101000" || code === "1010" || code.startsWith("101000")) {
      if (curr === "USD") {
        const usdTr = this.state.treasuries.find((t) => !t.deleted && t.currency === "USD");
        if (usdTr) return usdTr;
      } else if (curr === "SSP") {
        const sspTr = this.state.treasuries.find((t) => !t.deleted && t.currency === "SSP");
        if (sspTr) return sspTr;
      }
      const cashierTr = this.state.treasuries.find(
        (t) => !t.deleted && (t.id === "tr-1" || t.linked_to_restaurant),
      );
      if (cashierTr) return cashierTr;
    }
    if (code === "101001" || code.includes("juba") || note.includes("جوبا")) {
      const jubaTr = this.state.treasuries.find(
        (t) =>
          !t.deleted &&
          (t.id === "tr-juba" || t.branch_id === "branch-2" || t.name_ar.includes("جوبا")),
      );
      if (jubaTr) return jubaTr;
    }
    if (
      code === "102000" ||
      code.startsWith("1502") ||
      code.startsWith("1020") ||
      note.includes("بنك") ||
      note.includes("cib")
    ) {
      const bankTr = this.state.treasuries.find(
        (t) => !t.deleted && (t.type === "bank" || t.id === "tr-2" || t.id === "tr-cib"),
      );
      if (bankTr) return bankTr;
    }
    const acc = this.state.accounts.find((a) => a.code === code);
    if (acc) {
      const accName = acc.name_ar.toLowerCase();
      if (accName.includes("دولار") || accName.includes("usd")) {
        const t = this.state.treasuries.find((tr) => !tr.deleted && tr.currency === "USD");
        if (t) return t;
      }
      if (accName.includes("بنك") || accName.includes("cib") || accName.includes("ايدين")) {
        const t = this.state.treasuries.find((tr) => !tr.deleted && tr.type === "bank");
        if (t) return t;
      }
      if (accName.includes("كاشير") || accName.includes("صالة") || accName.includes("مطعم")) {
        const t = this.state.treasuries.find(
          (tr) => !tr.deleted && (tr.id === "tr-1" || tr.linked_to_restaurant),
        );
        if (t) return t;
      }
      if (accName.includes("مصري") || accName.includes("ادارة") || accName.includes("إدارة")) {
        const t = this.state.treasuries.find(
          (tr) => !tr.deleted && (tr.id === "tr-5" || tr.currency === "EGP"),
        );
        if (t) return t;
      }
    }
    if (curr) {
      const fallbackByCurr = this.state.treasuries.find((t) => !t.deleted && t.currency === curr);
      if (fallbackByCurr) return fallbackByCurr;
    }
    return this.state.treasuries.find((t) => !t.deleted);
  }
  inferMovementTypeFromLine(line, mainDesc = "", otherLines = []) {
    const isDebit = Number(line.debit || 0) > 0;
    const isCredit = Number(line.credit || 0) > 0;
    const desc = (line.description || " " + mainDesc).toLowerCase();
    const hasRevenueAccount = otherLines.some((l) => l.account_code.startsWith("4"));
    const hasExpenseAccount = otherLines.some(
      (l) =>
        l.account_code.startsWith("5") ||
        l.account_code.startsWith("6") ||
        l.account_code.startsWith("3"),
    );
    const hasTreasuryAccount = otherLines.some(
      (l) =>
        l.account_code.startsWith("1501") ||
        l.account_code.startsWith("1010") ||
        l.account_code.startsWith("1020"),
    );
    const hasSupplierOrInv = otherLines.some(
      (l) =>
        l.account_code.startsWith("103") ||
        l.account_code.startsWith("202") ||
        l.account_code.startsWith("140"),
    );
    if (isDebit) {
      if (desc.includes("تحويل") || desc.includes("تمويل") || hasTreasuryAccount)
        return "transfer_in";
      if (
        desc.includes("مبيعات") ||
        desc.includes("ايراد") ||
        desc.includes("إيراد") ||
        hasRevenueAccount
      )
        return "sales";
      if (desc.includes("تسوية") || desc.includes("فارق")) return "reconciliation";
      return "deposit";
    }
    if (isCredit) {
      if (desc.includes("تحويل") || desc.includes("تمويل") || hasTreasuryAccount)
        return "transfer_out";
      if (
        desc.includes("شراء") ||
        desc.includes("مشتريات") ||
        desc.includes("خامات") ||
        hasSupplierOrInv
      )
        return "purchase";
      if (
        desc.includes("مصروف") ||
        desc.includes("مرتب") ||
        desc.includes("اجور") ||
        desc.includes("أجور") ||
        desc.includes("بنزين") ||
        desc.includes("صيانة") ||
        desc.includes("بوفيه") ||
        desc.includes("ايجار") ||
        desc.includes("إيجار") ||
        desc.includes("سلف") ||
        hasExpenseAccount
      )
        return "expense";
      if (desc.includes("تسوية") || desc.includes("عجز")) return "reconciliation";
      return "withdrawal";
    }
    return "deposit";
  }
  importJournalEntriesAndSyncTreasuries(entries, options = {}) {
    let insertedEntries = 0;
    let newAccountsCreated = 0;
    let linkedTreasuryTransactions = 0;

    const existingEntryIds = new Set(this.state.journalEntries.map((je) => je.id));
    const existingEntryRefs = new Set(
      this.state.journalEntries.map(
        (je) => `${je.reference || ""}_${je.date || ""}_${je.description || ""}`,
      ),
    );
    const existingAccountCodes = new Set(this.state.accounts.map((a) => a.code));
    const existingTxIds = new Set(this.state.treasuryTransactions.map((tx) => tx.id));
    const existingTxRefs = new Set(
      this.state.treasuryTransactions.map(
        (tx) => `${tx.related_entity_id || ""}_${tx.treasury_id}_${tx.amount}_${tx.type}`,
      ),
    );
    (entries || []).forEach((entry) => {
      const entryKey = `${entry.reference || ""}_${entry.date || ""}_${entry.description || ""}`;
      let entryToProcess = entry;
      if (!existingEntryIds.has(entry.id) && !existingEntryRefs.has(entryKey)) {
        this.state.journalEntries.unshift(entry);
        existingEntryIds.add(entry.id);
        existingEntryRefs.add(entryKey);
        insertedEntries++;
      } else {
        const found = this.state.journalEntries.find(
          (j) =>
            j.id === entry.id ||
            `${j.reference || ""}_${j.date || ""}_${j.description || ""}` === entryKey,
        );
        if (found) entryToProcess = found;
      }
      (entryToProcess.lines || []).forEach((line, lineIndex) => {
        const code = String(line.account_code || "").trim();
        if (!code) return;
        if (!existingAccountCodes.has(code)) {
          let type = "asset";
          if (code.startsWith("1")) type = "asset";
          else if (code.startsWith("2")) type = "liability";
          else if (code.startsWith("3")) type = "equity";
          else if (code.startsWith("4")) type = "revenue";
          else if (code.startsWith("5") || code.startsWith("6")) type = "expense";
          let level = 3;
          if (code.length <= 1) level = 1;
          else if (code.length <= 3) level = 2;
          else if (code.length <= 5) level = 3;
          else level = 4;
          const accDisplayName =
            (line.account_name && line.account_name.trim()) ||
            (line.description && !line.description.startsWith("قيد")
              ? line.description
              : `حساب محاسبي (${code})`);
          const newAcc = {
            code,
            name_ar: accDisplayName,
            type,
            level,
            balance: 0,
            initial_balance: 0,
            status: "active",
            currency: line.currency || entryToProcess.currency || "EGP",
            system_binding: "none",
          };
          this.state.accounts.push(newAcc);
          existingAccountCodes.add(code);
          newAccountsCreated++;
        }
        const isTreasuryAccount =
          code.startsWith("130") ||
          code.startsWith("1501") ||
          code.startsWith("1010") ||
          code.startsWith("1502") ||
          code.startsWith("1020") ||
          this.state.treasuries.some((t) => t.account_code === code);
        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);
        const amount = debit > 0 ? debit : credit;
        if (isTreasuryAccount && amount > 0) {
          const matchedTreasury = this.resolveTreasuryForAccount(
            code,
            line.currency || entryToProcess.currency,
            line.description || entryToProcess.description,
          );
          if (matchedTreasury) {
            const otherLines = (entryToProcess.lines || []).filter((_, idx) => idx !== lineIndex);
            const movementType = this.inferMovementTypeFromLine(
              line,
              entryToProcess.description,
              otherLines,
            );
            const txCurrency =
              line.currency || entryToProcess.currency || matchedTreasury.currency || "EGP";
            const txNote =
              line.description ||
              entryToProcess.description ||
              `قيد رقم ${entryToProcess.reference || entryToProcess.id}`;
            const txKey = `${entryToProcess.id}_${matchedTreasury.id}_${amount}_${movementType}_${lineIndex}`;
            if (!existingTxRefs.has(txKey)) {
              const txId = `tx-import-${entryToProcess.id}-L${lineIndex}-${Math.random().toString(36).substr(2, 4)}`;
              const txDate = entryToProcess.date
                ? new Date(entryToProcess.date).toISOString()
                : /* @__PURE__ */ new Date().toISOString();
              const newTx = {
                id: txId,
                branch_id: matchedTreasury.branch_id || "branch-1",
                treasury_id: matchedTreasury.id,
                type: movementType,
                amount,
                currency: txCurrency,
                payment_method: matchedTreasury.type === "bank" ? "bank_transfer" : "cash",
                note: txNote,
                related_entity_id: entryToProcess.id,
                created_at: txDate,
              };
              this.state.treasuryTransactions.unshift(newTx);
              existingTxIds.add(txId);
              existingTxRefs.add(txKey);
              linkedTreasuryTransactions++;
            }
          }
        }
      });
    });
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "استيراد ومعالجة قيود Excel",
      `تم استيراد ومعالجة ${insertedEntries} قيد، وإنشاء ${newAccountsCreated} حساب جديد، وربط ${linkedTreasuryTransactions} حركة بالخزائن المقابلة.`,
      "IMPORT",
    );
    return {
      insertedEntries,
      newAccountsCreated,
      linkedTreasuryTransactions,
    };
  }
  mergeAndSyncAllData() {
    const existingAccountCodes = new Set(this.state.accounts.map((a) => a.code));
    let newAccountsCreated = 0;
    this.state.journalEntries.forEach((entry) => {
      (entry.lines || []).forEach((line) => {
        const code = String(line.account_code || "").trim();
        if (code && !existingAccountCodes.has(code)) {
          let type = "asset";
          if (code.startsWith("1")) type = "asset";
          else if (code.startsWith("2")) type = "liability";
          else if (code.startsWith("3")) type = "equity";
          else if (code.startsWith("4")) type = "revenue";
          else if (code.startsWith("5") || code.startsWith("6")) type = "expense";
          let level = 3;
          if (code.length <= 1) level = 1;
          else if (code.length <= 3) level = 2;
          else if (code.length <= 5) level = 3;
          else level = 4;
          this.state.accounts.push({
            code,
            name_ar: line.description
              ? `حساب (${code}) - ${line.description}`
              : `حساب محاسبي (${code})`,
            type,
            level,
            balance: 0,
            initial_balance: 0,
            status: "active",
            currency: line.currency || entry.currency || "EGP",
            system_binding: "none",
          });
          existingAccountCodes.add(code);
          newAccountsCreated++;
        }
      });
    });
    const existingTxRefs = new Set(
      (this.state.treasuryTransactions || []).map(
        (tx) => `${tx.related_entity_id || ""}_${tx.treasury_id}_${tx.amount}_${tx.type}`,
      ),
    );
    this.state.journalEntries.forEach((entry) => {
      (entry.lines || []).forEach((line, idx) => {
        const code = String(line.account_code || "").trim();
        const isTreasuryAccount =
          code.startsWith("130") ||
          code.startsWith("1501") ||
          code.startsWith("1010") ||
          code.startsWith("1502") ||
          code.startsWith("1020") ||
          this.state.treasuries.some((t) => t.account_code === code);
        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);
        const amount = debit > 0 ? debit : credit;
        if (isTreasuryAccount && amount > 0) {
          const matchedTreasury = this.resolveTreasuryForAccount(
            code,
            line.currency || entry.currency,
            line.description || entry.description,
          );
          if (matchedTreasury) {
            const otherLines = (entry.lines || []).filter((_, i) => i !== idx);
            const movementType = this.inferMovementTypeFromLine(
              line,
              entry.description,
              otherLines,
            );
            const txKey = `${entry.id}_${matchedTreasury.id}_${amount}_${movementType}_${idx}`;
            if (!existingTxRefs.has(txKey)) {
              const newTx = {
                id: `tx-sync-${entry.id}-L${idx}-${Math.random().toString(36).substr(2, 4)}`,
                branch_id: matchedTreasury.branch_id || "branch-1",
                treasury_id: matchedTreasury.id,
                type: movementType,
                amount,
                currency: line.currency || entry.currency || matchedTreasury.currency || "EGP",
                payment_method: matchedTreasury.type === "bank" ? "bank_transfer" : "cash",
                note:
                  line.description || entry.description || `قيد رقم ${entry.reference || entry.id}`,
                related_entity_id: entry.id,
                created_at: entry.date
                  ? new Date(entry.date).toISOString()
                  : /* @__PURE__ */ new Date().toISOString(),
              };
              this.state.treasuryTransactions.unshift(newTx);
              existingTxRefs.add(txKey);
            }
          }
        }
      });
    });
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "دمج وتحديث البيانات المالية",
      `تم فحص ومطابقة شجرة الحسابات (${this.state.accounts.length} حساب) والقيود (${this.state.journalEntries.length} قيد) وتحديث كافة الخزائن والأرصدة.`,
      "UPDATE",
    );
    return {
      accountsCount: this.state.accounts.length,
      entriesCount: this.state.journalEntries.length,
      treasuriesUpdated: this.state.treasuries.length,
      transactionsCount: this.state.treasuryTransactions.length,
    };
  }
  persistAllJournalsToDatabase() {
    const existingAccountCodes = new Set(this.state.accounts.map((a) => a.code));
    const newlyCreatedAccounts: Account[] = [];
    let newAccountsCreated = 0;

    // 1. Ensure all accounts in all journal lines exist
    this.state.journalEntries.forEach((entry) => {
      (entry.lines || []).forEach((line) => {
        const code = String(line.account_code || "").trim();
        if (code && !existingAccountCodes.has(code)) {
          let type = "asset";
          if (code.startsWith("1")) type = "asset";
          else if (code.startsWith("2")) type = "liability";
          else if (code.startsWith("3")) type = "equity";
          else if (code.startsWith("4")) type = "revenue";
          else if (code.startsWith("5") || code.startsWith("6")) type = "expense";

          let level = 3;
          if (code.length <= 1) level = 1;
          else if (code.length <= 3) level = 2;
          else if (code.length <= 5) level = 3;
          else level = 4;

          const newAcc: Account = {
            code,
            name_ar:
              (line.account_name && line.account_name.trim()) ||
              (line.description && !line.description.startsWith("قيد")
                ? line.description
                : `حساب محاسبي (${code})`),
            type,
            level,
            balance: 0,
            initial_balance: 0,
            status: "active",
            currency: line.currency || entry.currency || "USD",
            system_binding: "none",
          };
          this.state.accounts.push(newAcc);
          newlyCreatedAccounts.push(newAcc);
          existingAccountCodes.add(code);
          newAccountsCreated++;
        }
      });
    });

    // 2. Link & Sync Treasury movements
    const existingTxRefs = new Set(
      (this.state.treasuryTransactions || []).map(
        (tx) => `${tx.related_entity_id || ""}_${tx.treasury_id}_${tx.amount}_${tx.type}`,
      ),
    );
    let linkedTreasuryTransactions = 0;

    this.state.journalEntries.forEach((entry) => {
      (entry.lines || []).forEach((line, idx) => {
        const code = String(line.account_code || "").trim();
        const isTreasuryAccount =
          code.startsWith("130") ||
          code.startsWith("1501") ||
          code.startsWith("1010") ||
          code.startsWith("1502") ||
          code.startsWith("1020") ||
          this.state.treasuries.some((t) => t.account_code === code);
        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);
        const amount = debit > 0 ? debit : credit;

        if (isTreasuryAccount && amount > 0) {
          const matchedTreasury = this.resolveTreasuryForAccount(
            code,
            line.currency || entry.currency,
            line.description || entry.description,
          );
          if (matchedTreasury) {
            const otherLines = (entry.lines || []).filter((_, i) => i !== idx);
            const movementType = this.inferMovementTypeFromLine(
              line,
              entry.description,
              otherLines,
            );
            const txKey = `${entry.id}_${matchedTreasury.id}_${amount}_${movementType}_${idx}`;
            if (!existingTxRefs.has(txKey)) {
              const newTx = {
                id: `tx-sync-${entry.id}-L${idx}-${Math.random().toString(36).substr(2, 4)}`,
                branch_id: matchedTreasury.branch_id || "branch-1",
                treasury_id: matchedTreasury.id,
                type: movementType,
                amount,
                currency: line.currency || entry.currency || matchedTreasury.currency || "USD",
                payment_method: matchedTreasury.type === "bank" ? "bank_transfer" : "cash",
                note:
                  line.description || entry.description || `قيد رقم ${entry.reference || entry.id}`,
                related_entity_id: entry.id,
                created_at: entry.date
                  ? new Date(entry.date).toISOString()
                  : /* @__PURE__ */ new Date().toISOString(),
              };
              this.state.treasuryTransactions.unshift(newTx);
              existingTxRefs.add(txKey);
              linkedTreasuryTransactions++;
            }
          }
        }
      });
    });

    // 3. Recalculate balances
    this.recalculateAccountBalances();

    // 4. Calculate stats for report
    let totalBaseUSD = 0;
    let balancedEntriesCount = 0;
    let unbalancedEntriesCount = 0;

    this.state.journalEntries.forEach((je) => {
      const entryCurrencies = Array.from(
        new Set(je.lines.map((l) => l.currency || je.currency || "USD")),
      );
      const isSingleCurr = entryCurrencies.length <= 1;

      const tDebit = je.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const tCredit = je.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

      const baseDebit = je.lines.reduce((s, l) => {
        const r = Number(l.rate) || 1;
        const v = Number(l.debit) || 0;
        if (l.currency === "USD") return s + v;
        return s + (r >= 1 ? v / r : v * r);
      }, 0);

      const baseCredit = je.lines.reduce((s, l) => {
        const r = Number(l.rate) || 1;
        const v = Number(l.credit) || 0;
        if (l.currency === "USD") return s + v;
        return s + (r >= 1 ? v / r : v * r);
      }, 0);

      totalBaseUSD += baseDebit;

      const isBalanced = isSingleCurr
        ? Math.abs(tDebit - tCredit) < 0.01
        : Math.abs(baseDebit - baseCredit) < 0.05;
      if (isBalanced) balancedEntriesCount++;
      else unbalancedEntriesCount++;
    });

    // 5. Commit to durable storage
    this.saveState();
    this.logAction(
      "ADMIN",
      "حفظ وتثبيت القيود في قاعدة البيانات",
      `تم حفظ وتثبيت ${this.state.journalEntries.length} قيد محاسبي (${balancedEntriesCount} متزن، ${unbalancedEntriesCount} غير متزن)، وإنشاء ${newAccountsCreated} حساب جديد، وربط ${linkedTreasuryTransactions} حركة خزينة.`,
      "UPDATE",
    );

    return {
      success: true,
      savedEntriesCount: this.state.journalEntries.length,
      savedEntries: [...this.state.journalEntries],
      newAccountsCreated,
      newlyCreatedAccounts,
      totalAccountsCount: this.state.accounts.length,
      linkedTreasuryTransactions,
      totalBaseUSD,
      balancedEntriesCount,
      unbalancedEntriesCount,
      savedAt: new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  }
  checkCanModifyJournalEntry(entryDateOrEntry: any): { allowed: boolean; reason?: string } {
    const dateStr =
      typeof entryDateOrEntry === "string" ? entryDateOrEntry : entryDateOrEntry?.date;
    const currentYear = new Date().getFullYear(); // 2026
    let entryYear = currentYear;
    if (dateStr) {
      const parsedYear = new Date(dateStr).getFullYear();
      if (!isNaN(parsedYear) && parsedYear > 1970) {
        entryYear = parsedYear;
      }
    }

    // Previous years restriction check (e.g. 2025, 2024, etc.)
    if (entryYear < currentYear) {
      if (this.state.isAccountingPeriodLocked) {
        return {
          allowed: false,
          reason:
            "You cannot edit restrictions in a closed year. (لا يمكنك تعديل أو حذف القيود في سنة أو فترة مالية مغلقة)",
        };
      }
    } else if (entryYear === currentYear) {
      // Current fiscal year check (e.g. 2026)
      if (this.state.fiscalYearStatus === "closed") {
        return {
          allowed: false,
          reason:
            "السنة المالية 2026 مغلقة ومقفلة حالياً، لا يمكن تعديل أو حذف القيود إلا بعد إعادة فتح السنة المالية.",
        };
      }
    }

    return { allowed: true };
  }
  deleteSingleJournalEntry(entryId: string): { success: boolean; error?: string } {
    const targetEntry = this.state.journalEntries.find((je) => je.id === entryId);
    if (!targetEntry) return { success: false, error: "القيد غير موجود" };

    const check = this.checkCanModifyJournalEntry(targetEntry.date);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    this.state.journalEntries = this.state.journalEntries.filter((je) => je.id !== entryId);
    if (Array.isArray(this.state.treasuryTransactions)) {
      this.state.treasuryTransactions = this.state.treasuryTransactions.filter(
        (tx) => tx.related_entity_id !== entryId,
      );
    }
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "حذف قيد محاسبي فردي",
      `تم حذف القيد رقم ${targetEntry.reference || targetEntry.id} (${targetEntry.description}) وإعادة احتساب الأرصدة.`,
      "DELETE",
    );
    this.notify();
    return { success: true };
  }
  updateExistingJournalEntry(
    entryId: string,
    updated: {
      description?: string;
      date?: string;
      reference?: string;
      currency?: string;
      lines?: any[];
    },
  ): { success: boolean; error?: string } {
    const targetEntry = this.state.journalEntries.find((je) => je.id === entryId);
    if (!targetEntry) return { success: false, error: "القيد غير موجود" };

    const check = this.checkCanModifyJournalEntry(targetEntry.date);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    if (updated.date && updated.date !== targetEntry.date) {
      const newDateCheck = this.checkCanModifyJournalEntry(updated.date);
      if (!newDateCheck.allowed) {
        return { success: false, error: newDateCheck.reason };
      }
    }

    if (updated.description !== undefined) targetEntry.description = updated.description;
    if (updated.date !== undefined) targetEntry.date = updated.date;
    if (updated.reference !== undefined) targetEntry.reference = updated.reference;
    if (updated.currency !== undefined) targetEntry.currency = updated.currency;
    if (updated.lines !== undefined) targetEntry.lines = updated.lines;

    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "تعديل قيد محاسبي",
      `تم تعديل القيد المحاسبي رقم ${targetEntry.reference || targetEntry.id} (${targetEntry.description}) بنجاح.`,
      "UPDATE",
    );
    this.notify();
    return { success: true };
  }
  getAccountLedgerEntries(accountCode) {
    const entries = [];
    const acc = this.state.accounts.find((a) => a.code === accountCode);
    if (!acc)
      return {
        account: null,
        entries: [],
      };
    let currentBalance = acc.initial_balance || 0;
    const sortedEntries = [...this.state.journalEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    for (const je of sortedEntries)
      for (const line of je.lines || [])
        if (line.account_code === accountCode) {
          const debit = Number(line.debit || 0);
          const credit = Number(line.credit || 0);
          if (acc.type === "asset" || acc.type === "expense") currentBalance += debit - credit;
          else currentBalance += credit - debit;
          entries.push({
            id: je.id,
            date: je.date,
            description: je.description,
            reference: je.reference,
            debit,
            credit,
            runningBalance: currentBalance,
            created_by: je.created_by,
          });
        }
    return {
      account: acc,
      entries,
    };
  }
  getLineBaseValue(amount, rate) {
    const val = Number(amount) || 0;
    const r = Number(rate) || 1;
    if (r <= 0) return val;
    return r > 1 ? val / r : val * r;
  }
  generateJournalReference(
    dateStr?: string,
    providedRef?: string,
    pendingEntries: any[] = [],
    periodVal?: any,
    journalNumVal?: any,
  ) {
    if (providedRef && String(providedRef).trim()) {
      const trimmed = String(providedRef).trim();
      if (/^\d{2}\/\d{2,}$/.test(trimmed)) {
        const parts = trimmed.split("/");
        const pClean = parts[0].trim().padStart(2, "0");
        const jClean = parts[1].trim().padStart(2, "0");
        return `${pClean}/${jClean}`;
      }
    }

    // 1. Extract Period (01) from periodVal or from date's month
    let periodStr = "";
    if (periodVal !== undefined && periodVal !== null && String(periodVal).trim() !== "") {
      const pTrim = String(periodVal).trim();
      const pNum = parseInt(pTrim, 10);
      if (!isNaN(pNum)) {
        periodStr = String(pNum).padStart(2, "0");
      } else {
        periodStr = pTrim.padStart(2, "0");
      }
    }

    const d = dateStr ? new Date(dateStr) : new Date();
    if (!periodStr) {
      const m = isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
      periodStr = String(m).padStart(2, "0");
    }

    // 2. Extract Journal Number (02) from journalNumVal or calculate sequential order in period
    if (
      journalNumVal !== undefined &&
      journalNumVal !== null &&
      String(journalNumVal).trim() !== "" &&
      String(journalNumVal).trim() !== "0"
    ) {
      const jTrim = String(journalNumVal).trim();
      if (jTrim.includes("/")) {
        const parts = jTrim.split("/");
        return `${parts[0].trim().padStart(2, "0")}/${parts[1].trim().padStart(2, "0")}`;
      }
      const jNum = parseInt(jTrim, 10);
      const journalStr = !isNaN(jNum) ? String(jNum).padStart(2, "0") : jTrim.padStart(2, "0");
      return `${periodStr}/${journalStr}`;
    }

    let maxSeq = 0;
    const targetYear = dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear();
    const checkEntry = (je: any) => {
      if (!je || !je.reference) return;

      const jeYear = je.date ? new Date(je.date).getFullYear() : new Date().getFullYear();
      if (jeYear !== targetYear) return;

      const ref = String(je.reference).trim();
      if (ref.includes("/")) {
        const parts = ref.split("/");
        if (parts[0] === periodStr) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    };

    if (Array.isArray(this.state.journalEntries)) {
      this.state.journalEntries.forEach(checkEntry);
    }
    if (Array.isArray(pendingEntries)) {
      pendingEntries.forEach(checkEntry);
    }

    const seq = maxSeq + 1;
    return `${periodStr}/${String(seq).padStart(2, "0")}`;
  }
  factoryResetTransactions() {
    this.state.journalEntries = [];
    this.state.treasuryTransactions = [];

    // Reset mall transactions
    this.state.mallPayments = [];
    this.state.mallGardenRevenues = [];
    this.state.mallGardenExpenses = [];
    this.state.mallTerminatedContractsArchive = [];

    // Reset accounts to opening balance
    if (this.state.accounts) {
      this.state.accounts.forEach((acc) => {
        acc.balance = acc.initial_balance || 0;
      });
    }

    // Reset treasuries to opening balance
    if (this.state.treasuries) {
      this.state.treasuries.forEach((tr) => {
        tr.balance = tr.opening_balance || 0;
        tr.available_balance = tr.opening_balance || 0;
      });
    }

    if (this.state.suppliers) {
      this.state.suppliers.forEach((sup) => {
        sup.balance = 0;
      });
    }

    this.saveState();
    this.logAction(
      "ADMIN",
      "مسح جميع الحركات المحاسبية والمالية",
      "تم تصفير جميع الحركات بنجاح استعداداً للمزامنة.",
      "UPDATE",
    );
  }
  addJournalEntry(description, lines, reference, currency = "USD", date, customId) {
    const targetDate = date || /* @__PURE__ */ new Date().toISOString().split("T")[0];
    const check = this.checkCanModifyJournalEntry(targetDate);
    if (!check.allowed && !customId?.startsWith("ORACLE")) {
      console.warn("Accounting period / year is locked:", check.reason);
      throw new Error(check.reason || "You cannot edit restrictions in a closed year.");
    }
    const totalDebit = lines.reduce(
      (sum, l) => sum + this.getLineBaseValue(l.debit, l.rate || 1),
      0,
    );
    const totalCredit = lines.reduce(
      (sum, l) => sum + this.getLineBaseValue(l.credit, l.rate || 1),
      0,
    );
    if (Math.abs(totalDebit - totalCredit) > 0.5) {
      console.error(
        `Double-entry balance mismatch error: Debit (Base): ${totalDebit}, Credit (Base): ${totalCredit}`,
      );
      if (!customId?.startsWith("ORACLE")) return;
      else console.warn("Bypassing strict double-entry validation for legacy Oracle import.");
    }
    if (reference && !/^\d{2}\/\d{2,}$/.test(String(reference).trim())) {
      description = description + " - المرجع: " + String(reference).trim();
    }
    const entry = {
      id:
        customId && customId.trim()
          ? customId.trim()
          : "je-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      branch_id: this.state.currentBranchId,
      date: targetDate,
      description,
      lines,
      created_at: /* @__PURE__ */ new Date().toISOString(),
      reference: this.generateJournalReference(targetDate, reference),
      currency: currency || lines[0]?.currency || "EGP",
      created_by: this.state.currentUser,
      is_approved: true,
    };
    this.state.journalEntries.unshift(entry);
    this.recalculateAccountBalances();
    this.saveState();
    this.notify();
  }
  postSalesInvoiceJournal(
    orderNumber,
    total,
    subtotal,
    tax,
    paymentMethod = "cash",
    branchId,
    currency = "EGP",
    treasuryId = "tr-1",
    containerId,
  ) {
    const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
    let treasuryAccount = treasury?.account_code || "101000";
    // Ensure POS specific overrides if needed, but usually we use treasury's account
    // If it's a specific payment method not mapping to main treasury:
    if (paymentMethod === "card" && !treasury) treasuryAccount = "102000";
    else if (paymentMethod === "wallet" && !treasury) treasuryAccount = "103000";

    const revenueCredit = total - tax;
    const lines = [
      {
        account_code: treasuryAccount,
        debit: total,
        credit: 0,
      },
      {
        account_code: "43020300",
        debit: 0,
        credit: Number(revenueCredit.toFixed(2)),
      },
      {
        account_code: "25010150",
        debit: 0,
        credit: tax,
      },
    ];

    this.addJournalEntry(
      `فاتورة مبيعات POS - طلب رقم #${orderNumber}`,
      lines,
      `INV-${orderNumber}`,
      currency,
    );
    try {
      this.addTreasuryTransaction(
        treasuryId,
        "sales",
        total,
        currency,
        `إيرادات مبيعات المطعم - طلب رقم #${orderNumber}`,
        `INV-${orderNumber}`,
        paymentMethod,
        containerId,
        true,
      );
    } catch (err) {
      console.error("Error adding treasury transaction for order:", err);
    }
  }
  syncOperationalSalesWithTreasury(orders, targetTreasuryId) {
    let syncedCount = 0;
    let totalAmountSynced = 0;
    let alreadySyncedCount = 0;
    const trId =
      targetTreasuryId ||
      this.state.treasuries.find((t) => t.linked_to_restaurant && !t.deleted)?.id ||
      "tr-1";
    const targetTreasury = this.state.treasuries.find((t) => t.id === trId);
    if (!targetTreasury) {
      console.warn("Target cashier treasury not found for sync");
      return {
        syncedCount: 0,
        totalAmountSynced: 0,
        alreadySyncedCount: 0,
      };
    }
    const validOrders = (orders || []).filter(
      (o) => o && o.order_number && o.status !== "cancelled",
    );
    for (const order of validOrders) {
      const orderRef = `INV-${order.order_number}`;
      if (this.state.treasuryTransactions.find((tx) => tx.related_entity_id === orderRef)) {
        alreadySyncedCount++;
        continue;
      }
      let orderCurrency = "EGP";
      if (order.currency) orderCurrency = order.currency;
      else if (order.notes) {
        const match = String(order.notes).match(/العملة:\s*([A-Za-z]+)/);
        if (match && match[1]) orderCurrency = match[1];
      }
      const totalAmt = Number(order.total || 0);
      const subtotalAmt = Number(order.subtotal || totalAmt);
      const taxAmt = Number(order.tax || 0);
      const paymentMethod = order.payment_method || "cash";
      let containerId = "";
      if (targetTreasury.containers && targetTreasury.containers.length > 0) {
        const matchedCnt =
          targetTreasury.containers.find(
            (c) =>
              c.currency === orderCurrency &&
              ((paymentMethod === "cash" && c.id.includes("cash")) ||
                (paymentMethod === "card" && c.id.includes("card")) ||
                (paymentMethod === "wallet" && c.id.includes("wallet"))),
          ) || targetTreasury.containers.find((c) => c.currency === orderCurrency);
        if (matchedCnt) containerId = matchedCnt.id;
      }
      try {
        this.postSalesInvoiceJournal(
          order.order_number,
          totalAmt,
          subtotalAmt,
          taxAmt,
          paymentMethod,
          this.state.currentBranchId || "BR-001",
          orderCurrency,
          trId,
          containerId,
        );
        syncedCount++;
        totalAmountSynced += totalAmt;
      } catch (err) {
        console.error(`Error syncing order #${order.order_number}:`, err);
      }
    }
    if (syncedCount > 0) {
      this.recalculateAccountBalances();
      this.saveState();
      this.logAction(
        "CASHIER",
        "مزامنة مبيعات اليوم التشغيلية",
        `تمت مزامنة ${syncedCount} طلب مبيعات بقيمة إجمالية ${totalAmountSynced.toLocaleString()} مع خزينة الكاشير (${targetTreasury.name_ar})`,
        "TRANSACTION",
      );
    }
    return {
      syncedCount,
      totalAmountSynced,
      alreadySyncedCount,
    };
  }
  postSalesReturnJournal(
    orderNumber,
    total,
    paymentMethod = "cash",
    branchId,
    currency = "EGP",
    treasuryId = "tr-1",
    containerId,
  ) {
    const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
    let treasuryAccount = treasury?.account_code || "101000";
    if (paymentMethod === "card" && !treasury) treasuryAccount = "102000";
    else if (paymentMethod === "wallet" && !treasury) treasuryAccount = "103000";

    const lines = [
      {
        account_code: "401000",
        debit: total,
        credit: 0,
      },
      {
        account_code: treasuryAccount,
        debit: 0,
        credit: total,
      },
    ];

    this.addJournalEntry(
      `مرتجع مبيعات POS - طلب رقم #${orderNumber}`,
      lines,
      `SRT-${orderNumber}`,
      currency,
    );
    try {
      this.addTreasuryTransaction(
        treasuryId,
        "withdrawal",
        total,
        currency,
        `مرتجع مبيعات المطعم - طلب رقم #${orderNumber}`,
        `SRT-${orderNumber}`,
        paymentMethod,
        containerId,
        true,
      );
    } catch (err) {
      console.error("Error adding treasury transaction for refund:", err);
    }
  }
  postPurchaseInvoiceJournal(
    poId: string,
    supplierId: string,
    total: number,
    branchId: string,
    currency: string = "USD",
    rate: number = 1,
    supplierAccountCode?: string,
  ) {
    const supplier = this.state.suppliers.find((s) => s.id === supplierId);
    const targetSupAcc = supplierAccountCode || supplier?.account_code || "201000";

    const lines = [
      {
        account_code: "103000",
        debit: total,
        credit: 0,
        currency: currency || "USD",
        rate: rate,
        description: `استلام مخزون بضاعة - أمر شراء #${poId.substring(3, 8)}`,
      },
      {
        account_code: targetSupAcc,
        debit: 0,
        credit: total,
        currency: currency || "USD",
        rate: rate,
        description: `استحقاق المورد (${supplier?.name_ar || "مورد"}) - أمر شراء #${poId.substring(3, 8)}`,
      },
    ];
    this.addJournalEntry(
      `فاتورة مشتريات للمورد ${supplier?.name_ar || ""} - أمر شراء #${poId.substring(3, 8)}`,
      lines,
      `PO-${poId.substring(3, 8).toUpperCase()}`,
      currency,
    );
  }
  postPurchaseReturnJournal(
    poId: string,
    amount: number,
    branchId: string,
    currency: string = "USD",
    rate: number = 1,
    supplierAccountCode?: string,
  ) {
    const supplier = this.state.suppliers.find(
      (s) => s.id === this.state.purchaseOrders.find((p) => p.id === poId)?.supplier_id,
    );
    const targetSupAcc = supplierAccountCode || supplier?.account_code || "201000";

    const lines = [
      {
        account_code: targetSupAcc,
        debit: amount,
        credit: 0,
        currency: currency || "USD",
        rate: rate,
        description: `مرتجع بضائع للمورد (${supplier?.name_ar || "مورد"}) - أمر شراء #${poId.substring(3, 8)}`,
      },
      {
        account_code: "103000",
        debit: 0,
        credit: amount,
        currency: currency || "USD",
        rate: rate,
        description: `تخفيض مخزون بضاعة مرتجعة - أمر شراء #${poId.substring(3, 8)}`,
      },
    ];
    this.addJournalEntry(
      `مرتجع بضائع مشتريات للمورد - أمر شراء #${poId.substring(3, 8)}`,
      lines,
      `PRT-${poId.substring(3, 8).toUpperCase()}`,
      currency,
    );
  }
  postExpenseJournal(voucherId, amount, accountCode, costCenter, branchId) {
    const lines = [
      {
        account_code: accountCode,
        debit: amount,
        credit: 0,
        cost_center: costCenter,
      },
      {
        account_code: branchId === "branch-2" ? "101001" : "101000",
        debit: 0,
        credit: amount,
      },
    ];
    this.addJournalEntry(
      `سند صرف مصروفات - رقم #${voucherId.substring(4, 9)}`,
      lines,
      `EXP-${voucherId.substring(4, 9).toUpperCase()}`,
    );
  }
  postRevenueJournal(voucherId, amount, accountCode, costCenter, branchId) {
    const lines = [
      {
        account_code: branchId === "branch-2" ? "101001" : "101000",
        debit: amount,
        credit: 0,
      },
      {
        account_code: accountCode,
        debit: 0,
        credit: amount,
        cost_center: costCenter,
      },
    ];
    this.addJournalEntry(
      `سند قبض إيرادات متنوعة - رقم #${voucherId.substring(4, 9)}`,
      lines,
      `REV-${voucherId.substring(4, 9).toUpperCase()}`,
    );
  }
  postTreasuryTransferJournal(fromTreasuryId, toTreasuryId, amount, branchId) {
    const fromT = this.state.treasuries.find((t) => t.id === fromTreasuryId);
    const toT = this.state.treasuries.find((t) => t.id === toTreasuryId);
    if (!fromT || !toT) return;
    const fromAcc =
      fromT.type === "bank" ? "102000" : fromT.branch_id === "branch-2" ? "101001" : "101000";
    const lines = [
      {
        account_code:
          toT.type === "bank" ? "102000" : toT.branch_id === "branch-2" ? "101001" : "101000",
        debit: amount,
        credit: 0,
      },
      {
        account_code: fromAcc,
        debit: 0,
        credit: amount,
      },
    ];
    this.addJournalEntry(
      `حركة تحويل مالي بين الخزائن - من ${fromT.name_ar} إلى ${toT.name_ar}`,
      lines,
      `TRF-${Math.floor(Math.random() * 8999) + 1e3}`,
    );
  }
  postCashDepositJournal(treasuryId, amount, branchId) {
    const lines = [
      {
        account_code: branchId === "branch-2" ? "101001" : "101000",
        debit: amount,
        credit: 0,
      },
      {
        account_code: "301000",
        debit: 0,
        credit: amount,
      },
    ];
    this.addJournalEntry(
      `إيداع تمويل مالي مباشر بالخزينة`,
      lines,
      `DEP-${Math.floor(Math.random() * 8999) + 1e3}`,
    );
  }
  postCashWithdrawalJournal(treasuryId, amount, branchId) {
    const lines = [
      {
        account_code: "301000",
        debit: amount,
        credit: 0,
      },
      {
        account_code: branchId === "branch-2" ? "101001" : "101000",
        debit: 0,
        credit: amount,
      },
    ];
    this.addJournalEntry(
      `سحب نقدي مباشر تمويلي من الخزينة`,
      lines,
      `WDL-${Math.floor(Math.random() * 8999) + 1e3}`,
    );
  }
  postInventoryAdjustmentJournal(docNumber, amount, branchId) {
    const lines = [
      {
        account_code: "506000",
        debit: Math.abs(amount),
        credit: 0,
      },
      {
        account_code: "103000",
        debit: 0,
        credit: Math.abs(amount),
      },
    ];
    this.addJournalEntry(
      `تسوية جرد مخزني - هدر وخسائر - مستند #${docNumber}`,
      lines,
      `ADJ-${docNumber.substring(4)}`,
    );
  }
  postInventoryConsumptionJournal(orderNumber, totalCost, branchId) {
    const lines = [
      {
        account_code: "501000",
        debit: totalCost,
        credit: 0,
      },
      {
        account_code: "103000",
        debit: 0,
        credit: totalCost,
      },
    ];
    this.addJournalEntry(
      `قيد استهلاك بوم المطبخ (Recipe Consumption) - طلب #${orderNumber}`,
      lines,
      `CON-${orderNumber}`,
    );
  }
  createPurchaseOrder(
    supplierId: string,
    items: any[],
    notes?: string,
    currency: "USD" | "SSP" | string = "USD",
    exchange_rate: number = 1,
  ) {
    let subtotal = 0;
    items.forEach((i) => {
      subtotal += i.quantity * i.unit_cost;
    });
    const tax = subtotal * 0.14;
    const total = subtotal + tax;
    const rate = Number(exchange_rate) || 1;
    const total_base_usd = currency === "USD" ? total : rate > 1 ? total / rate : total * rate;

    const po: PurchaseOrder = {
      id: "po-" + Date.now(),
      branch_id: this.state.currentBranchId,
      supplier_id: supplierId,
      order_date: /* @__PURE__ */ new Date().toISOString().split("T")[0],
      status: "draft",
      items,
      subtotal,
      tax,
      total,
      currency: currency || "USD",
      exchange_rate: rate,
      total_base_usd,
      notes,
    };
    this.state.purchaseOrders.unshift(po);
    this.saveState();
    this.logAction(
      "ADMIN",
      "إنشاء أمر شراء",
      `تم عمل مسودة أمر شراء بمجموع ${total.toLocaleString()} ${po.currency} للمورد`,
      "CREATE",
    );
    this.notify();
    return po;
  }
  receivePurchaseOrder(poId: string, treasuryId?: string) {
    const po = this.state.purchaseOrders.find((p) => p.id === poId);
    if (!po || po.status === "received") return;
    po.status = "received";
    po.received_date = new Date().toISOString().split("T")[0];

    const supplier = this.state.suppliers.find((s) => s.id === po.supplier_id);
    const supAccCode = supplier?.account_code || "201000";
    const currency = po.currency || "USD";
    const rate = Number(po.exchange_rate) || 1;

    const treasury =
      this.state.treasuries.find((t) => t.id === treasuryId) || this.state.treasuries[0];
    if (treasury) {
      this.addTreasuryTransaction(
        treasury.id,
        "purchase",
        po.total,
        currency,
        `شراء بضاعة - أمر شراء #${po.id.substring(3, 8)} (${supplier?.name_ar || ""})`,
        po.id,
        true,
      );
    }
    this.updateSupplierBalance(po.supplier_id, po.total);
    this.postPurchaseInvoiceJournal(
      po.id,
      po.supplier_id,
      po.total,
      this.state.currentBranchId,
      currency,
      rate,
      supAccCode,
    );
    this.logAction(
      "ADMIN",
      "استلام أمر شراء ودفع القيمة",
      `تم تسليم الطلبية #${poId.substring(3, 8)} وإجراء القيد المحاسبي على حساب المورد (${supAccCode}) بمبلغ ${po.total.toLocaleString()} ${currency}`,
      "TRANSACTION",
    );
    this.saveState();
    this.notify();
  }
  receivePurchaseOrderPartial(poId, receivedItems, treasuryId) {
    const po = this.state.purchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error("أمر الشراء غير موجود");
    let newlyReceivedTotal = 0;
    let isFullyReceived = true;
    po.items = po.items.map((item) => {
      const match = receivedItems.find((r) => r.inventory_id === item.inventory_id);
      const currentReceived = item.received_quantity || 0;
      const newlyReceived = match ? match.received_quantity : 0;
      const updatedReceived = currentReceived + newlyReceived;
      if (updatedReceived < item.quantity) isFullyReceived = false;
      newlyReceivedTotal += newlyReceived * item.unit_cost;
      return {
        ...item,
        received_quantity: updatedReceived,
      };
    });
    const newlyReceivedTax = newlyReceivedTotal * 0.14;
    const grandReceivedTotal = newlyReceivedTotal + newlyReceivedTax;
    if (isFullyReceived) po.status = "received";
    const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
    if (treasury && grandReceivedTotal > 0)
      this.addTreasuryTransaction(
        treasuryId,
        "purchase",
        grandReceivedTotal,
        treasury.currency,
        `استلام جزئي/كامل بضائع - أمر شراء #${po.id.substring(3, 8)}`,
        po.id,
        true,
      );
    this.updateSupplierBalance(po.supplier_id, grandReceivedTotal);
    if (grandReceivedTotal > 0)
      this.postPurchaseInvoiceJournal(
        po.id,
        po.supplier_id,
        grandReceivedTotal,
        this.state.currentBranchId,
      );
    this.logAction(
      "ADMIN",
      "استلام بضائع أمر شراء",
      `تم استلام بضائع من الأمر #${po.id.substring(3, 8)} بقيمة ${grandReceivedTotal.toFixed(2)} ج.م (مكتمل: ${isFullyReceived ? "نعم" : "لا"})`,
      "TRANSACTION",
    );
    this.saveState();
    return {
      receivedTotal: grandReceivedTotal,
      isFullyReceived,
    };
  }
  returnPurchaseOrderItems(poId, returnedItems) {
    const po = this.state.purchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error("أمر الشراء غير موجود");
    let returnedTotal = 0;
    po.items = po.items.map((item) => {
      const match = returnedItems.find((r) => r.inventory_id === item.inventory_id);
      const currentReturned = item.returned_quantity || 0;
      const newlyReturned = match ? match.returned_quantity : 0;
      const updatedReturned = currentReturned + newlyReturned;
      returnedTotal += newlyReturned * item.unit_cost;
      return {
        ...item,
        returned_quantity: updatedReturned,
      };
    });
    const returnedTax = returnedTotal * 0.14;
    const grandReturnedTotal = returnedTotal + returnedTax;
    po.status = "returned";
    this.updateSupplierBalance(po.supplier_id, -grandReturnedTotal);
    this.postPurchaseReturnJournal(po.id, grandReturnedTotal, this.state.currentBranchId);
    this.logAction(
      "ADMIN",
      "إرجاع بضائع للمورد",
      `تم إرجاع مرتجعات من الأمر #${po.id.substring(3, 8)} بقيمة ${grandReturnedTotal.toFixed(2)} ج.م خصماً من حساب المورد`,
      "TRANSACTION",
    );
    this.saveState();
    return grandReturnedTotal;
  }
  cancelPurchaseOrder(poId) {
    const po = this.state.purchaseOrders.find((p) => p.id === poId);
    if (!po || po.status === "cancelled") return false;
    const oldStatus = po.status;
    po.status = "cancelled";
    if (oldStatus === "received") {
      const tx = this.state.treasuryTransactions.find(
        (t) => t.related_entity_id === poId && t.type === "purchase",
      );
      if (tx) {
        const treasury = this.state.treasuries.find((t) => t.id === tx.treasury_id);
        if (treasury) {
          treasury.balance += tx.amount;
          treasury.available_balance = treasury.balance;
          this.logAction(
            "SYSTEM",
            "عكس حركة الخزينة",
            `استرجاع مبلغ ${tx.amount} ج.م إلى خزينة ${treasury.name_ar}`,
            "TRANSACTION",
          );
        }
      }
      this.updateSupplierBalance(po.supplier_id, -po.total);
      const lines = [
        {
          account_code: "103000",
          debit: 0,
          credit: po.total,
        },
        {
          account_code: "201000",
          debit: po.total,
          credit: 0,
        },
      ];
      this.addJournalEntry(
        `إلغاء وعكس قيد أمر شراء #${poId.substring(3, 8)}`,
        lines,
        `REV-${poId.substring(3, 8).toUpperCase()}`,
      );
    }
    this.saveState();
    this.logAction(
      "ADMIN",
      "إلغاء أمر الشراء",
      `تم إلغاء أمر الشراء #${poId.substring(3, 8)} بالكامل وتصفية القيود المرتبطة`,
      "TRANSACTION",
    );
    return true;
  }
  createVoucher(
    type,
    category,
    amount,
    treasuryId,
    description,
    costCenter = "الإدارة (Administration)",
    attachment,
  ) {
    const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
    const voucher = {
      id: "vch-" + Date.now(),
      branch_id: this.state.currentBranchId,
      type,
      category,
      amount,
      currency: treasury?.currency || "EGP",
      payment_method: treasury?.type || "cash",
      treasury_id: treasuryId,
      description,
      status: "approved",
      created_at: /* @__PURE__ */ new Date().toISOString(),
      cost_center: costCenter,
      attachment,
      deleted: false,
    };
    this.state.vouchers.unshift(voucher);
    this.saveState();
    if (treasury) {
      const txType = type === "receipt" ? "deposit" : "withdrawal";
      this.addTreasuryTransaction(
        treasuryId,
        txType,
        amount,
        treasury.currency,
        `${type === "receipt" ? "سند قبض" : "سند صرف"} (${category}) - ${description}`,
        voucher.id,
        true,
      );
      const accountCode =
        {
          "رواتب الموظفين": "502000",
          "إيجار الفروع": "503000",
          "الكهرباء والمياه والطاقة": "504000",
          "التسويق والإعلانات": "505000",
          "الهدر والمفقودات": "506000",
        }[category] || "600000";
      if (type === "payment")
        this.postExpenseJournal(
          voucher.id,
          amount,
          accountCode,
          costCenter,
          this.state.currentBranchId,
        );
      else
        this.postRevenueJournal(
          voucher.id,
          amount,
          "401000",
          costCenter,
          this.state.currentBranchId,
        );
    }
    this.logAction(
      "ADMIN",
      "إنشاء سند مالي",
      `تم تسجيل ${type === "receipt" ? "سند قبض" : "سند صرف"} فئة ${category} بمبلغ ${amount} ج.م بمركز تكلفة ${costCenter}`,
      "CREATE",
    );
    return voucher;
  }
  deleteVoucher(id) {
    const vch = this.state.vouchers.find((v) => v.id === id);
    if (vch) {
      vch.deleted = true;
      this.saveState();
      this.logAction(
        "ADMIN",
        "حذف سند مالي (حذف مؤقت)",
        `تم حذف السند المالي #${id} مؤقتاً`,
        "DELETE",
      );
    }
  }
  addExpiryBatch(inventoryId, batchNo, qty, expiryDate, warehouseId, storageCondition) {
    this.state.inventoryExpiry.push({
      id: "exp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      inventory_id: inventoryId,
      branch_id: this.state.currentBranchId,
      warehouse_id: warehouseId || "wh-main-default",
      storage_condition: storageCondition || "chilled_4c",
      batch_no: batchNo,
      quantity: qty,
      expiry_date: expiryDate,
      created_at: /* @__PURE__ */ new Date().toISOString(),
    });
    this.saveState();
    this.logAction(
      "ADMIN",
      "إضافة دفعة تاريخ صلاحية",
      `إضافة الدفعة ${batchNo} للكمية ${qty} صالحة حتى ${expiryDate}`,
      "CREATE",
    );
  }
  async disposeExpiryBatch(batchId, reason) {
    const idx = this.state.inventoryExpiry.findIndex((b) => b.id === batchId);
    if (idx !== -1) {
      const batch = this.state.inventoryExpiry[idx];
      const item = localWarehouseStore.getInventory().find((i) => i.id === batch.inventory_id);
      const cost = item ? Number(item.cost || 0) : 0;
      const qty = Number(batch.quantity || 0);
      const batchValue = qty * cost;
      this.state.totalDisposedExpiryValue = (this.state.totalDisposedExpiryValue || 0) + batchValue;
      if (batch.inventory_id && qty > 0)
        try {
          await inventoryService.addTransaction({
            inventory_id: batch.inventory_id,
            warehouse_id: batch.warehouse_id || "wh-main-default",
            type: "out",
            quantity: qty,
            note: `إعدام وهدر دفعة رقم ${batch.batch_no} - السبب: ${reason}`,
          });
        } catch (err) {
          console.error("Failed to add inventory transaction for batch disposal:", err);
          localWarehouseStore.addTransaction({
            inventory_id: batch.inventory_id,
            warehouse_id: batch.warehouse_id || "wh-main-default",
            type: "out",
            quantity: qty,
            note: `إعدام وهدر دفعة رقم ${batch.batch_no} - السبب: ${reason}`,
          });
        }
      if (batchValue > 0)
        this.postInventoryAdjustmentJournal(
          batch.batch_no || batch.id.slice(0, 8),
          batchValue,
          this.state.currentBranchId,
        );
      this.state.inventoryExpiry.splice(idx, 1);
      this.saveState();
      this.logAction(
        "ADMIN",
        "إعدام دفعة منتهية الصلاحية",
        `تم إعدام الدفعة ${batch.batch_no} بالكمية ${batch.quantity} (بقيمة ${batchValue} ج.م) بسبب: ${reason}، وتم الخصم من المخزن وإنشاء قيد المحاسبي تلقائياً`,
        "DELETE",
      );
    }
  }
  getMenuItemQualitySpecs(menuItemId) {
    if (!this.state.menuQualitySpecs) this.state.menuQualitySpecs = {};
    if (!this.state.menuQualitySpecs[menuItemId])
      this.state.menuQualitySpecs[menuItemId] = {
        menu_item_id: menuItemId,
        shelf_life_hours: 24,
        storage_condition: "chilled_4c",
        storage_condition_label: "ثلاجة مبردة (4°م)",
        prep_instructions:
          "يتم التحضير والتسخين وفق معايير النظافة والطهي الآمن على درجة حرارة 75°م على الأقل.",
        allergens: ["جلوتين", "ألبان"],
        quality_checklist: [
          "فحص الرائحة والقوام قبل التقديم",
          "التأكد من سلامة التغليف وتاريخ التجهيز",
          "قياس درجة الحرارة عند الحفظ (أقل من 5°م للمبرد)",
        ],
        max_display_hours: 4,
      };
    return this.state.menuQualitySpecs[menuItemId];
  }
  saveMenuItemQualitySpecs(menuItemId, specs) {
    if (!this.state.menuQualitySpecs) this.state.menuQualitySpecs = {};
    const current = this.getMenuItemQualitySpecs(menuItemId);
    this.state.menuQualitySpecs[menuItemId] = {
      ...current,
      ...specs,
    };
    this.saveState();
    this.logAction(
      "ADMIN",
      "تحديث معايير جودة وصلاحية الوجبة",
      `تم تحديث مواصفات جودة وصلاحية الوجبة #${menuItemId}`,
      "UPDATE",
    );
  }
  setPeriodLock(isLocked: boolean) {
    this.state.isAccountingPeriodLocked = isLocked;
    this.saveState();
    this.logAction(
      "ADMIN",
      isLocked ? "إغلاق الفترة المحاسبية" : "فتح الفترة المحاسبية",
      "تم تحديث قفل الفترة المحاسبية لمنع تعديل القيود التاريخية",
      "SYSTEM",
    );
    this.notify();
  }
  setFiscalYearStatus(status: "open" | "closed") {
    this.state.fiscalYearStatus = status;
    this.saveState();
    this.logAction(
      "ADMIN",
      status === "closed" ? "إغلاق السنة المالية" : "فتح السنة المالية الجديدة",
      `تم تحديث حالة السنة المالية الحالية إلى ${status === "closed" ? "مغلقة" : "مفتوحة"}`,
      "SYSTEM",
    );
    this.notify();
  }
  getExtendedItem(itemId, defaultVals) {
    if (!this.state.extendedInventoryItems) this.state.extendedInventoryItems = {};
    if (!this.state.extendedInventoryItems[itemId]) {
      const generatedCode = "INV-" + itemId.substring(0, 5).toUpperCase();
      const generatedBarcode =
        "622" +
        Math.abs(itemId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0))
          .toString()
          .padEnd(10, "0")
          .substring(0, 10);
      this.state.extendedInventoryItems[itemId] = {
        id: itemId,
        item_code: generatedCode,
        barcode: generatedBarcode,
        name_en: "Raw Material Item",
        category: "خامات ومواد أولية",
        preferred_supplier_id: "sup-1",
        average_cost: 0,
        last_purchase_price: 0,
        status: "active",
        ...defaultVals,
      };
      this.saveState();
    }
    return this.state.extendedInventoryItems[itemId];
  }
  saveExtendedItem(itemId, details) {
    if (!this.state.extendedInventoryItems) this.state.extendedInventoryItems = {};
    const old = { ...this.getExtendedItem(itemId) };
    this.state.extendedInventoryItems[itemId] = {
      ...this.getExtendedItem(itemId),
      ...details,
    };
    this.saveState();
    const changes = [];
    Object.keys(details).forEach((key) => {
      const valOld = old[key];
      const valNew = details[key];
      if (valOld !== valNew) changes.push(`[${key}]: ${valOld} -> ${valNew}`);
    });
    if (changes.length > 0)
      this.logAction(
        "ADMIN",
        "تعديل تفاصيل الصنف المتقدمة",
        `تم تعديل الصنف #${itemId.substring(0, 5)}: ${changes.join(", ")}`,
        "UPDATE",
      );
  }
  getExtendedItems() {
    return this.state.extendedInventoryItems || {};
  }
  addInventoryDocument(doc) {
    if (!this.state.inventoryDocuments) this.state.inventoryDocuments = [];
    const docCount = this.state.inventoryDocuments.length + 1;
    const docNumber = `DOC-2026-${String(docCount).padStart(4, "0")}`;
    const newDoc = {
      ...doc,
      id: "doc-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      doc_number: docNumber,
      created_at: /* @__PURE__ */ new Date().toISOString(),
    };
    this.state.inventoryDocuments.unshift(newDoc);
    this.saveState();
    this.logAction(
      "ADMIN",
      `إنشاء مستند مخزني: ${doc.type}`,
      `تم تسجيل مستند ${doc.type} برقم ${docNumber} ويحتوي على ${doc.items.length} أصناف`,
      "CREATE",
    );
    if (doc.type === "stock_adjustment") {
      let adjustmentVal = 0;
      doc.items.forEach((it) => {
        const diff = (it.counted_quantity ?? 0) - it.quantity;
        adjustmentVal += diff * it.unit_cost;
      });
      if (Math.abs(adjustmentVal) > 0)
        this.postInventoryAdjustmentJournal(docNumber, adjustmentVal, doc.branch_id);
    }
    return newDoc;
  }
  cancelInventoryDocument(docId) {
    if (!this.state.inventoryDocuments) return false;
    const doc = this.state.inventoryDocuments.find((d) => d.id === docId);
    if (!doc || doc.status === "cancelled") return false;
    doc.status = "cancelled";
    this.saveState();
    this.logAction(
      "ADMIN",
      "إلغاء مستند مخزني",
      `تم إلغاء المستند المخزني رقم ${doc.doc_number} بنجاح`,
      "UPDATE",
    );
    return true;
  }
  saveInventorySettings(settings) {
    this.state.inventorySettings = settings;
    this.saveState();
    this.logAction(
      "ADMIN",
      "تحديث إعدادات المخزن",
      `تم تحديث إعدادات المخزن: السماح بالبيع بالسالب (${settings.allowNegativeStock})`,
      "UPDATE",
    );
  }
  addEmployee(emp) {
    const newEmp = {
      ...emp,
      id: "emp-" + Date.now(),
    };
    if (!this.state.employees) this.state.employees = [];
    this.state.employees.push(newEmp);
    this.saveState();
    this.logAction("HR", "إضافة موظف جديد", `تم تسجيل الموظف: ${emp.name}`, "CREATE");
    return newEmp;
  }
  updateEmployee(id, payload) {
    if (!this.state.employees) this.state.employees = [];
    const emp = this.state.employees.find((e) => e.id === id);
    if (emp) {
      Object.assign(emp, payload);
      this.saveState();
      this.logAction("HR", "تعديل بيانات موظف", `تم تعديل الموظف: ${emp.name}`, "UPDATE");
    }
  }
  deleteEmployee(id) {
    if (!this.state.employees) this.state.employees = [];
    const index = this.state.employees.findIndex((e) => e.id === id);
    if (index !== -1) {
      const emp = this.state.employees[index];
      this.state.employees.splice(index, 1);
      this.saveState();
      this.logAction("HR", "حذف موظف", `تم حذف الموظف: ${emp.name}`, "DELETE");
    }
  }
  recordAttendance(employeeId, date, status, checkIn, checkOut, notes) {
    if (!this.state.attendance) this.state.attendance = [];
    this.state.attendance = this.state.attendance.filter(
      (r) => !(r.employee_id === employeeId && r.date === date),
    );
    const record = {
      id: "att-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      employee_id: employeeId,
      date,
      status,
      check_in: checkIn,
      check_out: checkOut,
      notes,
    };
    this.state.attendance.push(record);
    this.saveState();
  }
  addLoan(employeeId, amount, currency, repaymentMonths, notes) {
    if (!this.state.loans) this.state.loans = [];
    const loan = {
      id: "loan-" + Date.now(),
      employee_id: employeeId,
      amount,
      date: /* @__PURE__ */ new Date().toISOString().split("T")[0],
      currency,
      repayment_months: repaymentMonths,
      paid_amount: 0,
      status: "active",
      notes,
    };
    this.state.loans.push(loan);
    this.saveState();
    const emp = this.state.employees?.find((e) => e.id === employeeId);
    this.logAction(
      "HR",
      "طلب سلفة موظف",
      `تم تسجيل سلفة للموظف ${emp?.name || ""} بقيمة ${amount} ${currency}`,
      "CREATE",
    );
    return loan;
  }
  repayLoan(loanId, amount) {
    if (!this.state.loans) this.state.loans = [];
    const loan = this.state.loans.find((l) => l.id === loanId);
    if (loan) {
      loan.paid_amount += amount;
      if (loan.paid_amount >= loan.amount) loan.status = "paid";
      this.saveState();
    }
  }
  generatePayroll(month) {
    if (!this.state.payrolls) this.state.payrolls = [];
    if (!this.state.employees) this.state.employees = [];
    if (!this.state.loans) this.state.loans = [];
    if (!this.state.attendance) this.state.attendance = [];
    this.state.payrolls = this.state.payrolls.filter(
      (p) => p.month !== month || p.status === "paid",
    );
    this.state.employees
      .filter((e) => e.status === "active")
      .forEach((emp) => {
        if (
          this.state.payrolls?.some(
            (p) => p.employee_id === emp.id && p.month === month && p.status === "paid",
          )
        )
          return;
        const empAttendance =
          this.state.attendance?.filter(
            (r) => r.employee_id === emp.id && r.date.startsWith(month),
          ) || [];
        const absentDays = empAttendance.filter((r) => r.status === "absent").length;
        const lateDays = empAttendance.filter((r) => r.status === "late").length;
        const dailyRate = emp.salary / 30;
        const deductions = Math.round(absentDays * dailyRate + lateDays * dailyRate * 0.25);
        const activeLoan = this.state.loans?.find(
          (l) => l.employee_id === emp.id && l.status === "active" && l.currency === emp.currency,
        );
        let loanDeduction = 0;
        if (activeLoan) {
          const monthlyInstallment = activeLoan.amount / activeLoan.repayment_months;
          const remainingLoan = activeLoan.amount - activeLoan.paid_amount;
          loanDeduction = Math.round(Math.min(monthlyInstallment, remainingLoan));
        }
        const netSalary = Math.max(0, emp.salary - deductions - loanDeduction);
        const record = {
          id: "pay-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          employee_id: emp.id,
          month,
          basic_salary: emp.salary,
          currency: emp.currency,
          bonuses: 0,
          deductions,
          loan_deduction: loanDeduction,
          net_salary: netSalary,
          status: "draft",
        };
        this.state.payrolls?.push(record);
      });
    this.saveState();
  }
  paySalary(payrollId, treasuryId) {
    if (!this.state.payrolls) return;
    const record = this.state.payrolls.find((p) => p.id === payrollId);
    if (!record || record.status === "paid") return;
    const emp = this.state.employees?.find((e) => e.id === record.employee_id);
    if (!emp) return;
    this.addTreasuryTransaction(
      treasuryId,
      "withdrawal",
      record.net_salary,
      record.currency,
      `صرف راتب شهر ${record.month} للموظف ${emp.name}`,
      `PAY-${record.id.substring(4, 9).toUpperCase()}`,
      true,
    );
    if (record.loan_deduction > 0 && this.state.loans) {
      const activeLoan = this.state.loans.find(
        (l) => l.employee_id === emp.id && l.status === "active" && l.currency === record.currency,
      );
      if (activeLoan) this.repayLoan(activeLoan.id, record.loan_deduction);
    }
    record.status = "paid";
    record.payment_date = /* @__PURE__ */ new Date().toISOString().split("T")[0];
    record.payment_treasury_id = treasuryId;
    this.saveState();
    this.logAction(
      "HR",
      "صرف راتب موظف",
      `تم صرف راتب الموظف ${emp.name} بقيمة ${record.net_salary} ${record.currency}`,
      "TRANSACTION",
    );
  }
  importOracleBatchData(newAccounts, newJournalEntries) {
    this.state.accounts = newAccounts.map((acc) => ({
      ...acc,
      balance: acc.initial_balance || 0,
    }));
    if (this.state.treasuries && this.state.treasuries.length > 0)
      this.state.treasuries = this.state.treasuries.map((tr) => {
        const matchedAcc = newAccounts.find(
          (acc) =>
            acc.name_ar.includes(tr.name_ar) ||
            tr.name_ar.includes(acc.name_ar) ||
            acc.name_ar.includes("خزينة") ||
            acc.name_ar.includes("صندوق") ||
            acc.name_ar.includes("ارض المول"),
        );
        return {
          ...tr,
          account_code: matchedAcc ? matchedAcc.code : tr.account_code || "101000",
        };
      });
    if (newJournalEntries && newJournalEntries.length > 0)
      this.state.journalEntries = [...newJournalEntries, ...(this.state.journalEntries || [])];
    this.recalculateAccountBalances();
    this.saveState();
    this.logAction(
      "ADMIN",
      "استيراد بيانات أوراكل الشاملة",
      `تم استيراد ${newAccounts.length} حساب من أوراكل (عبر المستويات الأربعة) وحذف الحسابات القديمة، مع الاحتفاظ بالخزائن ومطابقة أكوادها حسب شجرة الحسابات المرسلة، واستيراد ${newJournalEntries.length} قيد وحركة مالية بنجاح.`,
      "IMPORT",
    );
  }
  addMallShop(shop) {
    const newShop = {
      ...shop,
      id: "shop-" + Date.now(),
    };
    this.state.mallShops = [...(this.state.mallShops || []), newShop];
    this.saveState();
    this.logAction(
      "ADMIN",
      "إضافة محلات المول",
      `تم إضافة المحل ${newShop.name_ar} (رقم ${newShop.shop_number}) بنجاح`,
      "CREATE",
    );
  }
  createMallContract(shopId, updates, treasuryId) {
    this.updateMallShop(shopId, updates);
    const contract = updates.contract;
    if (contract && treasuryId) {
      const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
      if (treasury) {
        const treasuryAccountCode =
          treasury.type === "bank"
            ? "102000"
            : treasury.branch_id === "branch-2"
              ? "101001"
              : "101000";
        const totalCollected = (contract.deposit_amount || 0) + (contract.advance_payment || 0);
        if (totalCollected > 0) {
          const lines = [
            {
              account_code: treasuryAccountCode,
              debit: totalCollected,
              credit: 0,
            },
          ];
          if (contract.deposit_amount > 0)
            lines.push({
              account_code: "201100",
              debit: 0,
              credit: contract.deposit_amount,
            });
          if (contract.advance_payment > 0)
            lines.push({
              account_code: "201200",
              debit: 0,
              credit: contract.advance_payment,
            });
          this.addJournalEntry(
            `تحصيل تأمين ومقدم عقد إيجار لمحل #${shopId}`,
            lines,
            `CNTR-${Date.now().toString().slice(-6)}`,
            "USD",
            contract.start_date,
          );
          this.addTreasuryTransaction(
            treasuryId,
            "sales",
            totalCollected,
            "USD",
            `تحصيل تأمين ومقدم لعقد إيجار محل #${shopId}`,
            `CNTR-${Date.now().toString().slice(-6)}`,
            "cash",
            null,
            true,
          );
        }
      }
    }
  }
  updateMallShop(id, updates) {
    this.state.mallShops = (this.state.mallShops || []).map((s) =>
      s.id === id
        ? {
            ...s,
            ...updates,
          }
        : s,
    );
    this.saveState();
    this.logAction("ADMIN", "تعديل بيانات المحل", `تم تحديث بيانات المحل رقم ${id}`, "UPDATE");
  }
  deleteMallShop(id) {
    this.state.mallShops = (this.state.mallShops || []).filter((s) => s.id !== id);
    this.state.mallPayments = (this.state.mallPayments || []).filter((p) => p.shop_id !== id);
    this.saveState();
    this.logAction("ADMIN", "حذف محل من المول", `تم حذف المحل وسجل مدفوعاته`, "DELETE");
  }
  recordMallPayment(payment, treasuryId) {
    const existingIndex = (this.state.mallPayments || []).findIndex(
      (p) => p.shop_id === payment.shop_id && p.year === payment.year && p.month === payment.month,
    );
    if (existingIndex >= 0)
      this.state.mallPayments[existingIndex] = {
        ...this.state.mallPayments[existingIndex],
        ...payment,
      };
    else {
      const newPayment = {
        ...payment,
        id: "pay-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      };
      this.state.mallPayments = [...(this.state.mallPayments || []), newPayment];
    }
    this.saveState();
    this.logAction(
      "ADMIN",
      "تسجيل دفعة إيجار",
      `تم تسجيل دفعة إيجار للمحل لشهر ${payment.month}/${payment.year} بقيمة ${payment.amount_paid}`,
      "TRANSACTION",
    );
    if (treasuryId && payment.amount_paid !== 0) {
      const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
      if (treasury) {
        const treasuryAccountCode =
          treasury.type === "bank"
            ? "102000"
            : treasury.branch_id === "branch-2"
              ? "101001"
              : "101000";
        const isRefund = payment.amount_paid < 0;
        const absAmount = Math.abs(payment.amount_paid);
        const lines = [
          {
            account_code: treasuryAccountCode,
            debit: isRefund ? 0 : absAmount,
            credit: isRefund ? absAmount : 0,
          },
          ,
          {
            account_code: "41010130",
            debit: isRefund ? absAmount : 0,
            credit: isRefund ? 0 : absAmount,
          },
        ];
        this.addJournalEntry(
          isRefund
            ? `رد مقدم/دفعة إيجار للمحل (شهر ${payment.month}/${payment.year})`
            : `تحصيل دفعة إيجار للمحل (شهر ${payment.month}/${payment.year})`,
          lines,
          payment.receipt_number || `REC-${Date.now()}`,
          "USD",
          payment.payment_date || /* @__PURE__ */ new Date().toISOString().split("T")[0],
        );
        this.addTreasuryTransaction(
          treasuryId,
          isRefund ? "withdrawal" : "sales",
          absAmount,
          "USD",
          isRefund ? `رد مقدم/دفعة إيجار للمحل` : `تحصيل دفعة إيجار للمحل`,
          payment.receipt_number || `REC-${Date.now()}`,
          payment.payment_method === "cash" ? "cash" : "bank_transfer",
          null,
          true,
        );
      }
    }
  }
  deleteMallPayment(id) {
    this.state.mallPayments = (this.state.mallPayments || []).filter((p) => p.id !== id);
    this.saveState();
    this.logAction("ADMIN", "حذف دفعة إيجار", `تم حذف دفعة الإيجار رقم ${id}`, "DELETE");
  }
  addMallGardenRevenue(rev, treasuryId, paymentMethod = "cash") {
    const newRev = {
      ...rev,
      id: "rev-" + Date.now(),
    };
    this.state.mallGardenRevenues = [...(this.state.mallGardenRevenues || []), newRev];

    if (treasuryId && newRev.amount > 0) {
      const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
      if (treasury) {
        const treasuryAccountCode =
          treasury.type === "bank"
            ? "102000"
            : treasury.branch_id === "branch-2"
              ? "101001"
              : "101000";
        const lines = [
          { account_code: treasuryAccountCode, debit: newRev.amount, credit: 0 },
          { account_code: "430", debit: 0, credit: newRev.amount }, // 430: ايرادات السنترال بوب (الحديقة)
        ];
        this.addJournalEntry(`إيراد حديقة: ${newRev.title}`, lines, newRev.id, "EGP", newRev.date);
        this.addTreasuryTransaction(
          treasuryId,
          "sales",
          newRev.amount,
          "EGP",
          `إيراد حديقة: ${newRev.title}`,
          newRev.id,
          paymentMethod,
          null,
          true,
        );
      }
    }

    this.saveState();
    this.logAction("ADMIN", "إضافة إيراد حديقة", `تم إضافة إيراد بقيمة ${newRev.amount}`, "CREATE");
  }
  deleteMallGardenRevenue(id) {
    this.state.mallGardenRevenues = (this.state.mallGardenRevenues || []).filter(
      (r) => r.id !== id,
    );
    this.saveState();
    this.logAction("ADMIN", "حذف إيراد حديقة", `تم حذف الإيراد رقم ${id}`, "DELETE");
  }
  addMallGardenExpense(exp, treasuryId, paymentMethod = "cash") {
    const newExp = {
      ...exp,
      id: "exp-" + Date.now(),
    };
    this.state.mallGardenExpenses = [...(this.state.mallGardenExpenses || []), newExp];

    if (treasuryId && newExp.amount > 0) {
      const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
      if (treasury) {
        const treasuryAccountCode =
          treasury.type === "bank"
            ? "102000"
            : treasury.branch_id === "branch-2"
              ? "101001"
              : "101000";
        const lines = [
          { account_code: "31010", debit: newExp.amount, credit: 0 }, // 31010: مصروفات تشغيل المول/الحديقة
          { account_code: treasuryAccountCode, debit: 0, credit: newExp.amount },
        ];
        this.addJournalEntry(
          `مصروف حديقة/مول: ${newExp.title}`,
          lines,
          newExp.id,
          "EGP",
          newExp.date,
        );
        this.addTreasuryTransaction(
          treasuryId,
          "withdrawal",
          newExp.amount,
          "EGP",
          `مصروف حديقة/مول: ${newExp.title}`,
          newExp.id,
          paymentMethod,
          null,
          true,
        );
      }
    }

    this.saveState();
    this.logAction(
      "ADMIN",
      "إضافة مصروف مول/حديقة",
      `تم إضافة مصروف ${newExp.title} بقيمة ${newExp.amount}`,
      "CREATE",
    );
  }
  deleteMallGardenExpense(id) {
    this.state.mallGardenExpenses = (this.state.mallGardenExpenses || []).filter(
      (e) => e.id !== id,
    );
    this.saveState();
    this.logAction("ADMIN", "حذف مصروف", `تم حذف المصروف رقم ${id}`, "DELETE");
  }
  resetMallData() {
    this.state.mallShops = DEFAULT_MALL_SHOPS;
    this.state.mallPayments = DEFAULT_MALL_PAYMENTS;
    this.state.mallGardenRevenues = DEFAULT_GARDEN_REVENUES;
    this.state.mallGardenExpenses = DEFAULT_GARDEN_EXPENSES;
    this.state.mallTerminatedContractsArchive = [];
    this.saveState();
    this.logAction(
      "ADMIN",
      "إعادة ضبط بيانات المول",
      "تم إعادة تحميل بيانات المحلات والإيجارات الافتراضية بنجاح",
      "UPDATE",
    );
  }
  terminateMallContract(record, treasuryId) {
    const termRecord = {
      ...record,
      id: "term-" + Date.now(),
    };
    this.state.mallTerminatedContractsArchive = [
      termRecord,
      ...(this.state.mallTerminatedContractsArchive || []),
    ];
    const shop = (this.state.mallShops || []).find((s) => s.id === record.shop_id);
    if (shop) {
      shop.status = "vacant";
      shop.tenant_name = "";
      shop.phone = "";
      shop.contract = void 0;
    }
    let treasuryAccountCode = "101000";
    if (treasuryId) {
      const treasury = this.state.treasuries.find((t) => t.id === treasuryId);
      if (treasury)
        treasuryAccountCode =
          treasury.type === "bank"
            ? "102000"
            : treasury.branch_id === "branch-2"
              ? "101001"
              : "101000";
    }
    if (record.refund_amount > 0 && treasuryId)
      this.addTreasuryTransaction(
        treasuryId,
        "withdrawal",
        record.refund_amount,
        "USD",
        `رد تأمين لفسخ عقد إيجار المحل #${record.shop_number}`,
        `TERM-${record.shop_number}`,
        "cash",
        null,
        true,
      );
    if (record.deposit_amount > 0 || record.refund_amount > 0) {
      const lines = [];
      const depositAmount = record.deposit_amount || 0;
      const refundAmount = record.refund_amount || 0;
      if (depositAmount > 0)
        lines.push({
          account_code: "201100",
          debit: depositAmount,
          credit: 0,
        });
      if (refundAmount > 0)
        lines.push({
          account_code: treasuryAccountCode,
          debit: 0,
          credit: refundAmount,
        });
      const diff = depositAmount - refundAmount;
      if (diff > 0)
        lines.push({
          account_code: "41010",
          debit: 0,
          credit: diff,
        });
      else if (diff < 0)
        lines.push({
          account_code: "31020",
          debit: Math.abs(diff),
          credit: 0,
        });
      this.addJournalEntry(
        `إثبات فسخ عقد إيجار المحل #${record.shop_number} وتسوية التأمين`,
        lines,
        `TERM-${record.shop_number}`,
        "USD",
        record.termination_date,
      );
    }
    this.saveState();
    this.logAction(
      "ADMIN",
      "فسخ عقد إيجار محل",
      `تم فسخ عقد المحل #${record.shop_number} وأرشفة العقد ورد التأمين بقيمة ${record.refund_amount} USD`,
      "UPDATE",
    );
  }
}
export const erpStore = new ERPStore();

if (typeof window !== "undefined") {
  erpStore.loadFromCloud();
}
