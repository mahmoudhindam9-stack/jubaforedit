import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RestocashLogo } from "@/components/RestocashLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { erpStore } from "@/shared/services/erpStore";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem("remember_me", "true");
    } else {
      localStorage.setItem("remember_me", "false");
    }

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    // 1. Direct verify against Super Admin and System users in erpStore
    const localUsers = erpStore.getUsers();
    const matchedUser = localUsers.find(
      (u: any) =>
        (u.username && u.username.toLowerCase() === trimmedUser) ||
        (u.full_name && u.full_name.toLowerCase() === trimmedUser),
    );

    const isSuperAdminMatch =
      (trimmedUser === "admin" ||
        trimmedUser === "admin@restocash.com" ||
        trimmedUser === "admin@restocash.local") &&
      (trimmedPass === "123456" || trimmedPass === "123");

    const isUserMatch =
      matchedUser &&
      (matchedUser.password
        ? matchedUser.password === trimmedPass
        : isSuperAdminMatch || trimmedPass === "123456" || trimmedPass === "123");

    if (isSuperAdminMatch || isUserMatch) {
      const activeUsername = matchedUser ? matchedUser.username : "admin";
      const activeEmail = `${activeUsername}@restocash.com`;

      localStorage.setItem("restocash_auth_user", activeEmail);
      localStorage.setItem("restocash_user_role", matchedUser ? matchedUser.role : "admin");
      erpStore.setCurrentUser(activeUsername);

      // Attempt background Supabase auth sync if available
      try {
        await supabase.auth.signInWithPassword({
          email: activeEmail,
          password: trimmedPass,
        });
      } catch (ignored) {
        // Continue with local ERP session
      }

      setLoading(false);
      navigate({ to: "/admin" });
      return;
    }

    // 2. Fallback to Supabase Auth if external email provided
    const emailToLogin = trimmedUser.includes("@") ? trimmedUser : `${trimmedUser}@restocash.com`;
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password: trimmedPass,
    });

    if (signInData?.session) {
      localStorage.setItem("restocash_auth_user", emailToLogin);
      erpStore.setCurrentUser(trimmedUser);
      setLoading(false);
      navigate({ to: "/admin" });
      return;
    }

    setLoading(false);
    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "اسم المستخدم أو كلمة المرور غير صحيحة"
          : signInError.message,
      );
      return;
    }

    setError("اسم المستخدم أو كلمة المرور غير صحيحة");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-sm space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex justify-center mb-2">
          <RestocashLogo size={32} />
        </div>
        <p className="text-sm text-muted-foreground text-center">تسجيل الدخول للإدارة</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>اسم المستخدم</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="admin"
              className="mt-1"
            />
          </div>
          <div>
            <Label>كلمة المرور</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••"
              dir="ltr"
              className="text-right mt-1"
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              تذكرني
            </Label>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 text-center font-bold">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full h-10 font-bold text-sm" disabled={loading}>
            {loading ? "جاري الدخول…" : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
