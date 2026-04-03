"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from '@supabase/supabase-js';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        router.push('/profile');
      }
      setLoading(false);
    }
    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        router.push('/profile');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const signInWithGoogle = async () => {
    setErrorMsg(null);
    await supabase.auth.signInWithOAuth({
      provider: "google"
    });
  };

  const signInWithEmail = async () => {
    setErrorMsg(null);
    setSaving(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailForm.email,
      password: emailForm.password,
    });
    if (error) {
      setErrorMsg("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    } else {
      router.push('/profile');
    }
    setSaving(false);
  };

  const signUpWithEmail = async () => {
    setErrorMsg(null);
    if (emailForm.password.length < 6) {
      setErrorMsg("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.signUp({
      email: emailForm.email,
      password: emailForm.password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      alert("✅ ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี");
      setAuthMode("signin"); // สลับกลับมาหน้า login
      setEmailForm({ email: "", password: "" });
    }
    setSaving(false);
  };

  if (loading || user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
        <p className="text-[var(--secondary-blue)] font-medium">
          {user ? "กำลังพาท่านเข้าสู่ระบบ..." : "กำลังโหลด..."}
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">

      {/* วงกลมตกแต่งฉากหลัง (ย้ายไปรวมที่ layout.tsx แล้ว) */}

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl bg-white shadow-2xl p-8 sm:p-10 border border-gray-100">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-[var(--primary-blue)] mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-[var(--secondary-blue)]">เข้าสู่ระบบ</h1>
            <p className="mt-2 text-gray-500 text-sm">OBEC School Challenge</p>
          </div>

          {/* แจ้งเตือน Error */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-start gap-3 animate-in fade-in duration-300">
              <span className="text-red-500">⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="space-y-6">

            {/* ปุ่ม Google Auth (UI ดูน่ากดขึ้น) */}
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white border border-gray-300 px-4 py-3 text-gray-700 font-bold shadow-sm hover:bg-gray-50 transition-all focus:ring-2 focus:ring-gray-200 focus:outline-none"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              ดำเนินการต่อด้วย Google
            </button>

            {/* เส้นคั่น */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">หรือใช้อีเมล</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* สลับ Sign In / Sign Up แบบล้ำๆ */}
            <div className="flex justify-center rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => { setAuthMode("signin"); setErrorMsg(null); }}
                className={`w-full px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === "signin" ? "bg-white text-[var(--secondary-blue)] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => { setAuthMode("signup"); setErrorMsg(null); }}
                className={`w-full px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === "signup" ? "bg-white text-[var(--secondary-blue)] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                สมัครสมาชิก
              </button>
            </div>

            {/* ฟอร์มกรอกอีเมล */}
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="อีเมลของคุณ"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:bg-white focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="รหัสผ่าน"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:bg-white focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                />
              </div>

              <button
                onClick={authMode === "signin" ? signInWithEmail : signUpWithEmail}
                disabled={saving || !emailForm.email || !emailForm.password}
                className="w-full rounded-xl bg-[var(--primary-blue)] px-4 py-3.5 text-white font-bold text-lg shadow-md hover:bg-opacity-90 transition-all disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none flex justify-center items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    กำลังประมวลผล...
                  </>
                ) : authMode === "signin" ? "เข้าสู่ระบบ" : "ลงทะเบียน"}
              </button>
            </div>

          </div>
        </div>

        {/* Footer ของหน้า Login */}
        <p className="text-center text-sm text-gray-400 mt-8">
          มีปัญหาการเข้าสู่ระบบ? <a href="https://www.google.com" className="text-[var(--primary-blue)] hover:underline">ติดต่อผู้ดูแลระบบ</a>
        </p>

      </div>
    </main>
  );
}