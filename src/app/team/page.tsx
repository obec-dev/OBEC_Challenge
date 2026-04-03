"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

type Profile = {
  id: string;
  full_name: string | null;
  sub_role: string | null;
  training_flag: boolean;
  school_id?: string | null;
};

export default function TeamBuilderPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [schoolName, setSchoolName] = useState<string>("");
  const [pageLoading, setPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasInit = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchTeamData = async (isManualRefresh = false) => {
    const fallbackTimer = setTimeout(() => {
      setPageLoading(false);
      setIsRefreshing(false);
    }, 8000);

    try {
      if (!profile?.school_id) return;
      if (isManualRefresh) setIsRefreshing(true);

      const { data: schoolData } = await supabase
        .from("schools")
        .select("school_name")
        .eq("id", profile.school_id)
        .single();

      if (schoolData) {
        setSchoolName(schoolData.school_name);
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, sub_role, training_flag")
        .eq("school_id", profile.school_id)
        .order("training_flag", { ascending: false })
        .order("full_name", { ascending: true });

      if (data) {
        setProfiles(data);
        sessionStorage.setItem(`team_cache_${profile.school_id}`, JSON.stringify({
          schoolName: schoolData?.school_name || "",
          profiles: data
        }));
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);
    } finally {
      clearTimeout(fallbackTimer);
      setIsRefreshing(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !profile) return;
    if (hasInit.current) return;
    hasInit.current = true;

    const cacheKey = `team_cache_${profile.school_id}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);
      setProfiles(parsed.profiles);
      setSchoolName(parsed.schoolName);
      setPageLoading(false);
      fetchTeamData(false);
    } else {
      setPageLoading(true);
      fetchTeamData(false);
    }
  }, [profile, authLoading]);

  // 🛠️ ฟังก์ชัน Badge แบบใช้ Icon แทน Emoji
  const getRoleBadge = (role: string | null) => {
    const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm";

    switch (role) {
      case 'student':
        return <span className={`${baseClass} bg-blue-100 text-blue-800`}><i className="fi fi-sr-graduation-cap pt-0.5"></i> นักเรียน</span>;
      case 'teacher':
        return <span className={`${baseClass} bg-purple-100 text-purple-800`}><i className="fi fi-sr-chalkboard-user pt-0.5"></i> ครูผู้สอน</span>;
      case 'director':
        return <span className={`${baseClass} bg-amber-100 text-amber-800`}><i className="fi fi-sr-user-tie pt-0.5"></i> ผู้อำนวยการ</span>;
      case 'vice_director':
        return <span className={`${baseClass} bg-orange-100 text-orange-800`}><i className="fi fi-sr-users pt-0.5"></i> รอง ผอ.</span>;
      default:
        return <span className={`${baseClass} bg-gray-100 text-gray-800`}><i className="fi fi-sr-user pt-0.5"></i> ไม่ระบุ</span>;
    }
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
        <p className="text-[var(--secondary-blue)] font-medium">กำลังตรวจสอบข้อมูล...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 flex justify-center items-start relative pb-24">
      <div className="w-full max-w-4xl relative z-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-[var(--secondary-blue)] flex items-center gap-3">
              จัดการสมาชิกทีม
            </h1>
            <p className="text-gray-500 mt-2">ตรวจสอบสถานะการอบรมของบุคลากรในโรงเรียนของคุณ</p>
          </div>

          <button
            onClick={() => fetchTeamData(true)}
            disabled={isRefreshing}
            className="w-full md:w-auto bg-white border-2 border-[var(--primary-blue)] text-[var(--primary-blue)] px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <i className={`fi ${isRefreshing ? 'fi-sr-spinner animate-spin' : 'fi-sr-refresh'}`}></i>
            {isRefreshing ? "กำลังอัปเดต..." : "รีเฟรชข้อมูล"}
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header with School Icon */}
          <div className="bg-[var(--primary-blue)] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <i className="fi fi-sr-school text-3xl text-white"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100 tracking-wide uppercase">รายชื่อบุคลากรสังกัด</p>
                <h2 className="text-2xl font-bold leading-tight">{schoolName || "กำลังโหลดข้อมูล..."}</h2>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-3xl font-bold">{profiles.length}</div>
              <div className="text-sm text-blue-100">สมาชิกรวม</div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50 min-h-[300px]">
            {pageLoading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-70">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-blue)] mb-4"></div>
                <p className="text-[var(--secondary-blue)] font-medium">กำลังรวบรวมรายชื่อสมาชิก...</p>
              </div>
            ) : !profile?.school_id ? (
              <div className="text-center py-10 bg-white rounded-xl border border-orange-200">
                <i className="fi fi-sr-exclamation text-4xl text-orange-500 mb-4 block"></i>
                <p className="text-orange-600 font-bold mb-2">ไม่พบข้อมูลสังกัดโรงเรียนของคุณ</p>
                <p className="text-sm text-gray-500">กรุณากลับไปหน้า Profile เพื่อเลือกโรงเรียน</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="text-6xl mb-4 grayscale opacity-30">🏫</div>
                <h3 className="text-lg font-bold text-gray-700">ยังไม่มีสมาชิกคนอื่นในโรงเรียนนี้</h3>
                <p className="text-gray-500 mt-2 text-sm">เชิญชวนครูและนักเรียนสมัครสมาชิกเพื่อเข้าร่วมทีม</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {profiles.map((p) => (
                    <li key={p.id} className={`p-4 sm:p-6 transition-all hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${p.id === user?.id ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${p.training_flag ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {p.full_name ? p.full_name.charAt(0) : "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-lg">{p.full_name ?? "(ไม่ระบุชื่อ)"}</span>
                            {p.id === user?.id && <span className="text-[10px] bg-[var(--primary-blue)] text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">YOU</span>}
                          </div>
                          <div className="mt-1">{getRoleBadge(p.sub_role)}</div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 border-gray-100 pt-3 sm:pt-0">
                        <span className="text-xs text-gray-400 sm:mb-1 block uppercase font-semibold">Training Status</span>
                        {p.training_flag ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                            <i className="fi fi-sr-check-circle pt-0.5"></i> ผ่านการอบรม
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                            <i className="fi fi-sr-clock pt-0.5"></i> รอการเข้าชม
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}