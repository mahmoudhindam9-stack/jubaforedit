// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import {
  erpStore,
  type Employee,
  type AttendanceRecord,
  type EmployeeLoan,
  type PayrollRecord,
} from "@/shared/services/erpStore";
import {
  Users,
  UserPlus,
  CalendarDays,
  Coins,
  FileSpreadsheet,
  PlusCircle,
  Briefcase,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit2,
  DollarSign,
  Filter,
  Check,
  UserCheck,
  HandCoins,
  CreditCard,
  Building2,
  Search,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/hr")({
  head: () => ({ meta: [{ title: "إدارة الموارد البشرية وشؤون الموظفين" }] }),
  component: HRPage,
});

function HRPage() {
  const { toast } = useToast();
  const { formatPrice, formatTreasuryCurrency } = useSettings();

  // ERP Store subscription
  const [erpState, setErpState] = useState(erpStore.getState());
  useEffect(() => {
    return erpStore.subscribe((state) => {
      setErpState(state);
    });
  }, []);

  const employees = useMemo(() => erpState.employees || [], [erpState.employees]);
  const attendance = useMemo(() => erpState.attendance || [], [erpState.attendance]);
  const loans = useMemo(() => erpState.loans || [], [erpState.loans]);
  const payrolls = useMemo(() => erpState.payrolls || [], [erpState.payrolls]);

  // Active Tab state
  const [activeTab, setActiveTab] = useState("employees");

  // Search & Filter States
  const [empSearch, setEmpSearch] = useState("");
  const [empDeptFilter, setEmpDeptFilter] = useState("all");

  // Attendance Date
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Payroll Month
  const [payrollMonth, setPayrollMonth] = useState<string>("2026-07");

  // Dialog States
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [isEditEmpOpen, setIsEditEmpOpen] = useState(false);
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [isPaySalaryOpen, setIsPaySalaryOpen] = useState(false);

  // Selected Elements for Edit/Pay
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [paySalaryTreasuryId, setPaySalaryTreasuryId] = useState<string>("");

  // Employee Form State
  const [empForm, setEmpForm] = useState({
    name: "",
    job_title: "",
    department: "المطبخ",
    phone: "",
    email: "",
    hire_date: new Date().toISOString().split("T")[0],
    salary: 5000,
    currency: "EGP",
    status: "active" as Employee["status"],
  });

  // Loan Form State
  const [loanForm, setLoanForm] = useState({
    employee_id: "",
    amount: 1000,
    currency: "EGP",
    repayment_months: 2,
    notes: "",
  });

  // Reset forms helper
  const resetEmpForm = () => {
    setEmpForm({
      name: "",
      job_title: "",
      department: "المطبخ",
      phone: "",
      email: "",
      hire_date: new Date().toISOString().split("T")[0],
      salary: 5000,
      currency: "EGP",
      status: "active",
    });
  };

  const resetLoanForm = () => {
    setLoanForm({
      employee_id: "",
      amount: 1000,
      currency: "EGP",
      repayment_months: 2,
      notes: "",
    });
  };

  // HR Executive Stats
  const activeEmployeesCount = employees.filter((e) => e.status === "active").length;
  const totalPayrollCost = useMemo(() => {
    return employees.filter((e) => e.status === "active").reduce((sum, emp) => sum + emp.salary, 0); // note: simplified visual total in raw values
  }, [employees]);

  const activeLoansCount = loans.filter((l) => l.status === "active").length;
  const activeLoansAmount = loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.amount - l.paid_amount), 0);

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
        emp.job_title.toLowerCase().includes(empSearch.toLowerCase()) ||
        emp.phone.includes(empSearch);
      const matchDept = empDeptFilter === "all" || emp.department === empDeptFilter;
      return matchSearch && matchDept;
    });
  }, [employees, empSearch, empDeptFilter]);

  // Handle Employee Actions
  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name.trim() || !empForm.job_title.trim() || !empForm.phone.trim()) {
      toast({
        title: "خطأ في الإدخال",
        description: "يرجى ملء جميع الحقول الإلزامية.",
        variant: "destructive",
      });
      return;
    }
    erpStore.addEmployee(empForm);
    toast({
      title: "تم الحفظ بنجاح",
      description: `تم تسجيل الموظف: ${empForm.name}`,
    });
    setIsAddEmpOpen(false);
    resetEmpForm();
  };

  const handleEditEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    if (!empForm.name.trim() || !empForm.job_title.trim() || !empForm.phone.trim()) {
      toast({
        title: "خطأ في الإدخال",
        description: "يرجى ملء جميع الحقول الإلزامية.",
        variant: "destructive",
      });
      return;
    }
    erpStore.updateEmployee(selectedEmp.id, empForm);
    toast({
      title: "تم التحديث بنجاح",
      description: `تم حفظ تعديلات الموظف: ${empForm.name}`,
    });
    setIsEditEmpOpen(false);
    setSelectedEmp(null);
    resetEmpForm();
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الموظف: ${name}؟`)) {
      erpStore.deleteEmployee(id);
      toast({
        title: "تم الحذف",
        description: `تم إزالة الموظف ${name} من النظام.`,
      });
    }
  };

  const openEditDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    setEmpForm({
      name: emp.name,
      job_title: emp.job_title,
      department: emp.department,
      phone: emp.phone,
      email: emp.email || "",
      hire_date: emp.hire_date,
      salary: emp.salary,
      currency: emp.currency,
      status: emp.status,
    });
    setIsEditEmpOpen(true);
  };

  // Handle Attendance
  const getEmployeeAttendanceStatus = (empId: string) => {
    const record = attendance.find((r) => r.employee_id === empId && r.date === attendanceDate);
    return record ? record.status : "unrecorded";
  };

  const handleRecordAttendance = (empId: string, status: AttendanceRecord["status"]) => {
    erpStore.recordAttendance(empId, attendanceDate, status);
    toast({
      title: "تم تسجيل الحضور",
      description: "تم تحديث حالة الموظف بنجاح.",
    });
  };

  // Handle Loans
  const handleAddLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.employee_id || !loanForm.amount || loanForm.amount <= 0) {
      toast({
        title: "خطأ في الإدخال",
        description: "يرجى اختيار الموظف وتحديد مبلغ السلفة.",
        variant: "destructive",
      });
      return;
    }
    const emp = employees.find((e) => e.id === loanForm.employee_id);
    if (!emp) return;

    erpStore.addLoan(
      loanForm.employee_id,
      loanForm.amount,
      emp.currency, // auto use employee currency
      loanForm.repayment_months,
      loanForm.notes,
    );

    toast({
      title: "تم تسجيل السلفة",
      description: `تم قيد السلفة بقيمة ${loanForm.amount} ${emp.currency} بنجاح.`,
    });
    setIsAddLoanOpen(false);
    resetLoanForm();
  };

  // Handle Payroll
  const handleGeneratePayroll = () => {
    erpStore.generatePayroll(payrollMonth);
    toast({
      title: "توليد مسير الرواتب",
      description: `تم احتساب رواتب الموظفين لشهر ${payrollMonth} بنجاح.`,
    });
  };

  const openPaySalaryDialog = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    // Find active cash treasuries that match the salary currency
    const matchingTreasuries = erpState.treasuries.filter(
      (t) => !t.deleted && (t.currency === "MULTI" || t.currency === payroll.currency),
    );
    if (matchingTreasuries.length > 0) {
      setPaySalaryTreasuryId(matchingTreasuries[0].id);
    } else {
      setPaySalaryTreasuryId("");
    }
    setIsPaySalaryOpen(true);
  };

  const handlePaySalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayroll || !paySalaryTreasuryId) return;

    erpStore.paySalary(selectedPayroll.id, paySalaryTreasuryId);

    toast({
      title: "تم صرف الراتب",
      description: "تم صرف الراتب بنجاح، وخصم المبلغ من الخزينة وتسجيل الحركة.",
    });
    setIsPaySalaryOpen(false);
    setSelectedPayroll(null);
  };

  // Statistics for Attendance Tab
  const attendanceStatsForDate = useMemo(() => {
    const records = attendance.filter((r) => r.date === attendanceDate);
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const leave = records.filter((r) => r.status === "leave").length;
    const total = employees.length;
    const unrecorded = total - records.length;

    return { present, absent, late, leave, total, unrecorded };
  }, [attendance, attendanceDate, employees]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Visual Header */}
      <div className="bg-card border border-border p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-right">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users size={28} className="text-primary" />
            شؤون الموظفين والموارد البشرية (HR)
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            متابعة الحضور والانصراف، احتساب مسيرات الرواتب الشهرية وصرفها نقداً من الخزينة، وإدارة
            السلف والقروض
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddEmpOpen(true)}
            className="gap-2 rounded-xl font-bold px-5 py-6"
          >
            <UserPlus size={18} />
            إضافة موظف جديد
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setLoanForm((prev) => ({ ...prev, employee_id: employees[0]?.id || "" }));
              setIsAddLoanOpen(true);
            }}
            className="gap-2 rounded-xl font-bold px-5 py-6"
          >
            <Coins size={18} />
            صرف سلفة لموظف
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border shadow-sm rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Users size={14} />
              إجمالي الكادر الوظيفي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {employees.length} موظفين
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              منهم {activeEmployeesCount} نشطين حالياً في الفروع
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Building2 size={14} />
              الأجور الشهرية الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {formatPrice(totalPayrollCost)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              مجموع الرواتب بعد التحويل لعملة العرض الحالية
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Coins size={14} />
              القروض والسلف الجارية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {formatPrice(activeLoansAmount)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              موزعة على {activeLoansCount} سلف جاري سدادها
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock size={14} />
              انضباط الحضور والدوام اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {attendanceStatsForDate.total > 0
                ? Math.round(
                    ((attendanceStatsForDate.present + attendanceStatsForDate.late) /
                      attendanceStatsForDate.total) *
                      100,
                  )
                : 0}
              %
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              معدل حضور الدوام والتواجد لليوم الحالي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl flex flex-wrap gap-1 h-auto w-full md:w-auto">
          <TabsTrigger value="employees" className="rounded-lg font-bold py-2.5 px-5">
            <Users size={16} className="ml-1.5 inline" />
            دليل الكادر الوظيفي
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg font-bold py-2.5 px-5">
            <CalendarDays size={16} className="ml-1.5 inline" />
            حضور وانصراف اليوم
          </TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-lg font-bold py-2.5 px-5">
            <FileSpreadsheet size={16} className="ml-1.5 inline" />
            مسيرات الأجور والرواتب
          </TabsTrigger>
          <TabsTrigger value="loans" className="rounded-lg font-bold py-2.5 px-5">
            <Coins size={16} className="ml-1.5 inline" />
            القروض والسلف المالية
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: EMPLOYEE DIRECTORY */}
        <TabsContent value="employees" className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl">
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-3 text-muted-foreground" size={16} />
              <Input
                placeholder="ابحث باسم الموظف أو وظيفته أو هاتفه..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="pr-10 bg-card rounded-xl text-xs"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Badge variant="outline" className="text-[10px] py-1 px-3">
                تصفية القسم:
              </Badge>
              <select
                value={empDeptFilter}
                onChange={(e) => setEmpDeptFilter(e.target.value)}
                className="bg-card border border-border text-xs rounded-xl px-3 py-1.5 font-bold outline-none"
              >
                <option value="all">كل الأقسام والمطابخ</option>
                <option value="المطبخ">المطبخ (Kitchen)</option>
                <option value="الصالة والتوصيل">الصالة والتوصيل (Floor)</option>
                <option value="الإدارة">الإدارة (Administration)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredEmployees.length === 0 ? (
              <div className="col-span-1 md:col-span-3 text-center py-12 text-muted-foreground">
                لا يوجد موظفين يطابقون خيارات البحث حالياً.
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <Card key={emp.id} className="border border-border shadow-sm rounded-2xl bg-card">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-base text-slate-800 dark:text-slate-100">
                            {emp.name}
                          </h3>
                          <Badge
                            className={
                              emp.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }
                            variant="outline"
                          >
                            {emp.status === "active"
                              ? "نشط"
                              : emp.status === "inactive"
                                ? "غير نشط"
                                : "موقوف"}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-primary flex items-center gap-1">
                          <Briefcase size={12} />
                          {emp.job_title} • {emp.department}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <span className="text-muted-foreground block font-bold text-[10px]">
                          الهاتف
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Phone size={11} />
                          {emp.phone}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block font-bold text-[10px]">
                          تاريخ التعيين
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Calendar size={11} />
                          {emp.hire_date}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground block font-bold text-[10px]">
                          الراتب الأساسي
                        </span>
                        <span className="font-black text-sm text-slate-800 dark:text-slate-200">
                          {formatTreasuryCurrency(emp.salary, emp.currency)}
                        </span>
                      </div>
                      <div className="text-left space-y-0.5">
                        <span className="text-muted-foreground block font-bold text-[10px]">
                          الراتب المقوم
                        </span>
                        <span className="font-bold text-xs text-slate-500">
                          {formatPrice(emp.salary, emp.currency as any)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-border/50 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(emp)}
                        className="rounded-lg text-xs gap-1 h-8"
                      >
                        <Edit2 size={12} />
                        تعديل
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs gap-1 h-8"
                      >
                        <Trash2 size={12} />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: DAILY ATTENDANCE */}
        <TabsContent value="attendance" className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-primary" size={20} />
              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-muted-foreground font-bold block">
                  تاريخ رصد الحضور
                </span>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-card border border-border text-xs rounded-xl px-3 h-9 py-1 font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 py-1.5 px-3">
                حاضر: {attendanceStatsForDate.present}
              </Badge>
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 py-1.5 px-3">
                متأخر: {attendanceStatsForDate.late}
              </Badge>
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 py-1.5 px-3">
                غائب: {attendanceStatsForDate.absent}
              </Badge>
              <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 py-1.5 px-3">
                إجازة: {attendanceStatsForDate.leave}
              </Badge>
              {attendanceStatsForDate.unrecorded > 0 && (
                <Badge className="bg-slate-100 text-slate-700 py-1.5 px-3">
                  غير مرصود: {attendanceStatsForDate.unrecorded}
                </Badge>
              )}
            </div>
          </div>

          <Card className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/70 text-muted-foreground text-xs border-b border-border font-bold">
                  <tr>
                    <th className="p-3.5 pr-6">اسم الموظف</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">المسمى الوظيفي</th>
                    <th className="p-3.5">حالة اليوم</th>
                    <th className="p-3.5 text-center pl-6">تسجيل وتعديل الدوام اليومي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {employees
                    .filter((e) => e.status === "active")
                    .map((emp) => {
                      const currentStatus = getEmployeeAttendanceStatus(emp.id);
                      return (
                        <tr key={emp.id} className="hover:bg-muted/30 transition">
                          <td className="p-3.5 pr-6 font-bold text-slate-800">{emp.name}</td>
                          <td className="p-3.5 text-xs text-muted-foreground font-bold">
                            {emp.department}
                          </td>
                          <td className="p-3.5 text-xs font-bold text-slate-700">
                            {emp.job_title}
                          </td>
                          <td className="p-3.5">
                            {currentStatus === "present" && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                حاضر
                              </Badge>
                            )}
                            {currentStatus === "late" && (
                              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                متأخر
                              </Badge>
                            )}
                            {currentStatus === "absent" && (
                              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                غائب
                              </Badge>
                            )}
                            {currentStatus === "leave" && (
                              <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                إجازة
                              </Badge>
                            )}
                            {currentStatus === "unrecorded" && (
                              <Badge variant="outline" className="text-slate-400 border-dashed">
                                لم يسجل بعد
                              </Badge>
                            )}
                          </td>
                          <td className="p-3.5 text-center pl-6">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant={currentStatus === "present" ? "default" : "outline"}
                                onClick={() => handleRecordAttendance(emp.id, "present")}
                                className="h-7 text-[10px] rounded-lg font-bold px-2.5"
                              >
                                <CheckCircle2 size={12} className="ml-1" /> حاضر
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === "late" ? "default" : "outline"}
                                onClick={() => handleRecordAttendance(emp.id, "late")}
                                className="h-7 text-[10px] rounded-lg font-bold px-2.5 bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                              >
                                <Clock size={12} className="ml-1" /> متأخر
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === "absent" ? "destructive" : "outline"}
                                onClick={() => handleRecordAttendance(emp.id, "absent")}
                                className="h-7 text-[10px] rounded-lg font-bold px-2.5"
                              >
                                <XCircle size={12} className="ml-1" /> غائب
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === "leave" ? "default" : "outline"}
                                onClick={() => handleRecordAttendance(emp.id, "leave")}
                                className="h-7 text-[10px] rounded-lg font-bold px-2.5 bg-sky-500 hover:bg-sky-600 text-white border-sky-500"
                              >
                                <Calendar size={12} className="ml-1" /> إجازة
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: PAYROLL SHEETS */}
        <TabsContent value="payroll" className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-primary" size={20} />
              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-muted-foreground font-bold block">
                  شهر صرف الرواتب
                </span>
                <Input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="bg-card border border-border text-xs rounded-xl px-3 h-9 py-1 font-bold outline-none"
                />
              </div>
            </div>

            <Button onClick={handleGeneratePayroll} className="gap-2 rounded-xl font-bold px-5">
              <PlusCircle size={16} />
              توليد واحتساب مسير الرواتب للشهر
            </Button>
          </div>

          <Card className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/70 text-muted-foreground text-xs border-b border-border font-bold">
                  <tr>
                    <th className="p-3.5 pr-6">اسم الموظف</th>
                    <th className="p-3.5">الراتب الأساسي</th>
                    <th className="p-3.5 text-rose-600">خصومات الحضور والغياب</th>
                    <th className="p-3.5 text-amber-600">خصم قسط السلفة</th>
                    <th className="p-3.5 text-emerald-600">صافي المستحق للقبض</th>
                    <th className="p-3.5">العملة الأساسية</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center pl-6">صرف النقدية والإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {payrolls.filter((p) => p.month === payrollMonth).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        لم يتم توليد مسير رواتب لهذا الشهر بعد. يرجى الضغط على زر توليد مسير الرواتب
                        أعلاه.
                      </td>
                    </tr>
                  ) : (
                    payrolls
                      .filter((p) => p.month === payrollMonth)
                      .map((p) => {
                        const emp = employees.find((e) => e.id === p.employee_id);
                        return (
                          <tr key={p.id} className="hover:bg-muted/30 transition">
                            <td className="p-3.5 pr-6 font-bold text-slate-800">
                              {emp ? emp.name : "موظف محذوف"}
                            </td>
                            <td className="p-3.5 font-mono font-bold">
                              {formatTreasuryCurrency(p.basic_salary, p.currency)}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-rose-600">
                              -{formatTreasuryCurrency(p.deductions, p.currency)}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-amber-600">
                              -{formatTreasuryCurrency(p.loan_deduction, p.currency)}
                            </td>
                            <td className="p-3.5 font-mono font-black text-emerald-600">
                              {formatTreasuryCurrency(p.net_salary, p.currency)}
                            </td>
                            <td className="p-3.5 text-xs text-muted-foreground font-black">
                              {p.currency}
                            </td>
                            <td className="p-3.5">
                              {p.status === "paid" ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  تم الصرف
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-400 border-dashed">
                                  بانتظار الصرف
                                </Badge>
                              )}
                            </td>
                            <td className="p-3.5 text-center pl-6">
                              {p.status === "paid" ? (
                                <div className="text-xs text-slate-400 font-bold font-mono">
                                  تاريخ الدفع: {p.payment_date}
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => openPaySalaryDialog(p)}
                                  className="h-7 text-xs rounded-lg font-bold px-4 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 gap-1"
                                >
                                  <CreditCard size={12} />
                                  صرف الراتب نقداً
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: EMPLOYEES LOANS AND ADVANCES */}
        <TabsContent value="loans" className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl">
            <h3 className="font-bold text-sm text-slate-700 flex items-center gap-1.5">
              <Coins className="text-primary" size={18} />
              متابعة تسديد السلف من رواتب الموظفين
            </h3>
            <Button
              onClick={() => {
                setLoanForm((prev) => ({ ...prev, employee_id: employees[0]?.id || "" }));
                setIsAddLoanOpen(true);
              }}
              className="gap-2 rounded-xl font-bold px-5"
            >
              <PlusCircle size={16} />
              طلب سلفة نقدية جديدة لموظف
            </Button>
          </div>

          <Card className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/70 text-muted-foreground text-xs border-b border-border font-bold">
                  <tr>
                    <th className="p-3.5 pr-6">اسم الموظف</th>
                    <th className="p-3.5">تاريخ السلفة</th>
                    <th className="p-3.5">مبلغ السلفة الأصلي</th>
                    <th className="p-3.5">شهور السداد</th>
                    <th className="p-3.5">القسط الشهري</th>
                    <th className="p-3.5 text-emerald-600">المبلغ المسدد حتى الآن</th>
                    <th className="p-3.5 text-rose-600">المبلغ المتبقي للتحصيل</th>
                    <th className="p-3.5">الحالة العامة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        لا يوجد سلف أو قروض مسجلة في هذا الحساب حالياً.
                      </td>
                    </tr>
                  ) : (
                    loans.map((l) => {
                      const emp = employees.find((e) => e.id === l.employee_id);
                      const monthlyInstallment = l.amount / l.repayment_months;
                      const remainingAmount = l.amount - l.paid_amount;
                      return (
                        <tr key={l.id} className="hover:bg-muted/30 transition">
                          <td className="p-3.5 pr-6 font-bold text-slate-800">
                            {emp ? emp.name : "موظف محذوف"}
                          </td>
                          <td className="p-3.5 font-mono text-xs">{l.date}</td>
                          <td className="p-3.5 font-mono font-bold">
                            {formatTreasuryCurrency(l.amount, l.currency)}
                          </td>
                          <td className="p-3.5 font-mono text-xs font-bold">
                            {l.repayment_months} أشهر
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-600">
                            {formatTreasuryCurrency(Math.round(monthlyInstallment), l.currency)} /
                            شهر
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-600">
                            {formatTreasuryCurrency(l.paid_amount, l.currency)}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-rose-600">
                            {formatTreasuryCurrency(remainingAmount, l.currency)}
                          </td>
                          <td className="p-3.5">
                            {l.status === "paid" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                مسددة بالكامل
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                جاري التحصيل
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG 1: ADD EMPLOYEE */}
      <Dialog open={isAddEmpOpen} onOpenChange={setIsAddEmpOpen}>
        <DialogContent className="max-w-md bg-card border border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black text-right">إضافة موظف جديد</DialogTitle>
            <DialogDescription className="text-right">
              أدخل البيانات الأساسية والمالية للموظف لتسجيله في الدليل
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <Label className="font-bold text-xs">الاسم بالكامل *</Label>
              <Input
                value={empForm.name}
                onChange={(e) => setEmpForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="أدخل الاسم الرباعي للموظف"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">المسمى الوظيفي *</Label>
                <Input
                  value={empForm.job_title}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, job_title: e.target.value }))}
                  placeholder="مثال: شيف معجنات، كاشير"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">القسم الإداري *</Label>
                <select
                  value={empForm.department}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, department: e.target.value }))}
                  className="w-full bg-card border border-border text-xs rounded-xl h-10 px-3 font-bold outline-none"
                >
                  <option value="المطبخ">المطبخ (Kitchen)</option>
                  <option value="الصالة والتوصيل">الصالة والتوصيل (Floor)</option>
                  <option value="الإدارة">الإدارة (Administration)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">رقم الهاتف *</Label>
                <Input
                  value={empForm.phone}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="أدخل رقم الجوال"
                  className="rounded-xl font-mono text-left"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">تاريخ التعيين *</Label>
                <Input
                  type="date"
                  value={empForm.hire_date}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, hire_date: e.target.value }))}
                  className="rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">الراتب الأساسي *</Label>
                <Input
                  type="number"
                  value={empForm.salary}
                  onChange={(e) =>
                    setEmpForm((prev) => ({ ...prev, salary: Number(e.target.value) }))
                  }
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">عملة الراتب وصرف الراتب *</Label>
                <select
                  value={empForm.currency}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, currency: e.target.value }))}
                  className="w-full bg-card border border-border text-xs rounded-xl h-10 px-3 font-bold outline-none"
                >
                  <option value="EGP">EGP - جنيه مصري</option>
                  <option value="USD">USD - دولار أمريكي</option>
                  <option value="SSP">SSP - جنيه جنوب سوداني</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddEmpOpen(false)}
                className="rounded-xl font-bold"
              >
                إلغاء
              </Button>
              <Button type="submit" className="rounded-xl font-bold">
                تسجيل وحفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: EDIT EMPLOYEE */}
      <Dialog open={isEditEmpOpen} onOpenChange={setIsEditEmpOpen}>
        <DialogContent className="max-w-md bg-card border border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black text-right">تعديل بيانات الموظف</DialogTitle>
            <DialogDescription className="text-right">
              تحديث المعلومات الأساسية والرواتب للموظف المحدد
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEmployeeSubmit} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <Label className="font-bold text-xs">الاسم بالكامل *</Label>
              <Input
                value={empForm.name}
                onChange={(e) => setEmpForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="أدخل الاسم الرباعي للموظف"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">المسمى الوظيفي *</Label>
                <Input
                  value={empForm.job_title}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, job_title: e.target.value }))}
                  placeholder="مثال: شيف معجنات، كاشير"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">القسم الإداري *</Label>
                <select
                  value={empForm.department}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, department: e.target.value }))}
                  className="w-full bg-card border border-border text-xs rounded-xl h-10 px-3 font-bold outline-none"
                >
                  <option value="المطبخ">المطبخ (Kitchen)</option>
                  <option value="الصالة والتوصيل">الصالة والتوصيل (Floor)</option>
                  <option value="الإدارة">الإدارة (Administration)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">رقم الهاتف *</Label>
                <Input
                  value={empForm.phone}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="أدخل رقم الجوال"
                  className="rounded-xl font-mono text-left"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">حالة الموظف *</Label>
                <select
                  value={empForm.status}
                  onChange={(e) =>
                    setEmpForm((prev) => ({
                      ...prev,
                      status: e.target.value as Employee["status"],
                    }))
                  }
                  className="w-full bg-card border border-border text-xs rounded-xl h-10 px-3 font-bold outline-none"
                >
                  <option value="active">نشط (Active)</option>
                  <option value="inactive">غير نشط (Inactive)</option>
                  <option value="suspended">موقوف مؤقتاً (Suspended)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">الراتب الأساسي *</Label>
                <Input
                  type="number"
                  value={empForm.salary}
                  onChange={(e) =>
                    setEmpForm((prev) => ({ ...prev, salary: Number(e.target.value) }))
                  }
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">عملة الراتب *</Label>
                <select
                  value={empForm.currency}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, currency: e.target.value }))}
                  className="w-full bg-card border border-border text-xs rounded-xl h-10 px-3 font-bold outline-none"
                >
                  <option value="EGP">EGP - جنيه مصري</option>
                  <option value="USD">USD - دولار أمريكي</option>
                  <option value="SSP">SSP - جنيه جنوب سوداني</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditEmpOpen(false)}
                className="rounded-xl font-bold"
              >
                إلغاء
              </Button>
              <Button type="submit" className="rounded-xl font-bold">
                حفظ التعديلات
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: REQUEST LOAN / ADVANCE */}
      <Dialog open={isAddLoanOpen} onOpenChange={setIsAddLoanOpen}>
        <DialogContent className="max-w-md bg-card border border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black text-right">صرف سلفة لموظف</DialogTitle>
            <DialogDescription className="text-right">
              تسجيل وصرف سلفة نقدية ويتم خصم قسطها تلقائياً من رواتب الموظف المبرمة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLoanSubmit} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <Label className="font-bold text-xs">اختر الموظف المستفيد *</Label>
              <select
                value={loanForm.employee_id}
                onChange={(e) => setLoanForm((prev) => ({ ...prev, employee_id: e.target.value }))}
                className="w-full bg-card border border-border text-xs rounded-xl h-10 px-3 font-bold outline-none"
              >
                <option value="">-- اختر موظف من القائمة --</option>
                {employees
                  .filter((e) => e.status === "active")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.job_title} - عملته {e.currency})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">مبلغ السلفة الجملي *</Label>
                <Input
                  type="number"
                  value={loanForm.amount}
                  onChange={(e) =>
                    setLoanForm((prev) => ({ ...prev, amount: Number(e.target.value) }))
                  }
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">مدة السداد (بالأشهر) *</Label>
                <select
                  value={loanForm.repayment_months}
                  onChange={(e) =>
                    setLoanForm((prev) => ({ ...prev, repayment_months: Number(e.target.value) }))
                  }
                  className="w-full bg-card border border-border text-xs rounded-xl h-10 px-3 font-bold outline-none"
                >
                  <option value={1}>شهر واحد</option>
                  <option value={2}>شهرين</option>
                  <option value={3}>3 أشهر</option>
                  <option value={4}>4 أشهر</option>
                  <option value={6}>6 أشهر</option>
                  <option value={12}>12 شهر</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="font-bold text-xs">ملاحظات إضافية</Label>
              <Input
                value={loanForm.notes}
                onChange={(e) => setLoanForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="أدخل مبررات السلفة أو تفاصيل الضامن"
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddLoanOpen(false)}
                className="rounded-xl font-bold"
              >
                إلغاء
              </Button>
              <Button type="submit" className="rounded-xl font-bold">
                اعتماد وصرف السلفة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: PAY SALARY */}
      <Dialog open={isPaySalaryOpen} onOpenChange={setIsPaySalaryOpen}>
        <DialogContent className="max-w-md bg-card border border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black text-right">صرف رواتب ومستحقات الموظف</DialogTitle>
            <DialogDescription className="text-right">
              حدد الخزينة النقدية لإتمام صرف الراتب وصرف السند المالي المبرم
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaySalarySubmit} className="space-y-4">
            {selectedPayroll && (
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl text-right space-y-2">
                <div className="text-xs text-muted-foreground font-bold">الموظف المستحق:</div>
                <div className="text-base font-black text-slate-800 dark:text-slate-200">
                  {employees.find((e) => e.id === selectedPayroll.employee_id)?.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/40">
                  <div>
                    <span className="text-muted-foreground block">راتب الشهر:</span>
                    <span className="font-bold font-mono">{selectedPayroll.month}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-emerald-600">
                      صافي المستحق:
                    </span>
                    <span className="font-black font-mono text-emerald-600">
                      {formatTreasuryCurrency(selectedPayroll.net_salary, selectedPayroll.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-right">
              <Label className="font-bold text-xs">اختر خزينة الصرف *</Label>
              <select
                value={paySalaryTreasuryId}
                onChange={(e) => setPaySalaryTreasuryId(e.target.value)}
                className="w-full bg-card border border-border text-xs rounded-xl h-10 px-3 font-bold outline-none"
              >
                <option value="">-- اختر خزينة الصرف --</option>
                {erpState.treasuries
                  .filter(
                    (t) =>
                      !t.deleted &&
                      (t.currency === "MULTI" ||
                        (selectedPayroll && t.currency === selectedPayroll.currency)),
                  )
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.account_code ? `[رقم الحساب: ${t.account_code}] ` : ""}
                      {t.name_ar} (العملة: {t.currency} - المتاح:{" "}
                      {formatTreasuryCurrency(
                        t.balance,
                        t.currency === "MULTI" ? selectedPayroll?.currency : t.currency,
                      )}
                      )
                    </option>
                  ))}
              </select>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaySalaryOpen(false)}
                className="rounded-xl font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={!paySalaryTreasuryId}
                className="rounded-xl font-bold"
              >
                إتمام الصرف وتسجيل السند
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
