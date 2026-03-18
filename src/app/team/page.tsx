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
  const { user, profile, currentRole, loading: authLoading } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [schoolName, setSchoolName] = useState<string>("");

  // 🟢 แยก State สำหรับควบคุม UI
  const [pageLoading, setPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasInit = useRef(false); // 🔐 แม่กุญแจกันสลับ Tab

  useEffect(() => {
    if (authLoading) return;
    if (!user || currentRole !== "school_admin") {
      router.push("/");
    }
  }, [user, currentRole, authLoading, router]);

  /// 🛠️ ฟังก์ชันดึงข้อมูล (แบบมีระบบ Cache และ Timeout)
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

      let currentSchoolName = "";
      if (schoolData) {
        currentSchoolName = schoolData.school_name;
        setSchoolName(currentSchoolName);
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
          schoolName: currentSchoolName,
          profiles: data
        }));
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      if (isManualRefresh) alert("❌ ไม่สามารถดึงข้อมูลใหม่ได้");
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

      // ดึงอัปเดตเบื้องหลังแบบเงียบๆ
      fetchTeamData(false);
    } else {
      setPageLoading(true);
      fetchTeamData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, authLoading]);

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'student': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">👨‍🎓 นักเรียน</span>;
      case 'teacher': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">👨‍🏫 ครูผู้สอน</span>;
      case 'director': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">👔 ผู้อำนวยการ</span>;
      case 'vice_director': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">👔 รอง ผอ.</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">👤 ไม่ระบุ</span>;
    }
  };

  // 🔴 หน้าจอหมุนโหลดเฉพาะตอนเช็คสิทธิ์ (Auth)
  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
        <p className="text-[var(--secondary-blue)] font-medium">กำลังตรวจสอบข้อมูล...</p>
      </main>
    );
  }

  if (currentRole !== "school_admin") return null;

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4 flex justify-center items-start relative pb-24">
      <div className="w-full max-w-4xl relative z-10">

        {/* หัวข้อและปุ่มรีเฟรช (แสดงตลอด ไม่หาย) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-[var(--secondary-blue)]">จัดการสมาชิกทีม</h1>
            <p className="text-gray-500 mt-2">ตรวจสอบสถานะการอบรมของบุคลากรและนักเรียนในโรงเรียนของคุณ</p>
          </div>

          <button
            onClick={() => fetchTeamData(true)}
            disabled={isRefreshing}
            className="w-full md:w-auto bg-white border-2 border-[var(--primary-blue)] text-[var(--primary-blue)] px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRefreshing ? "⏳ กำลังอัปเดต..." : "🔄 รีเฟรชข้อมูล"}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-[var(--primary-blue)] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl bg-white/20 p-3 rounded-xl backdrop-blur-sm">🏫</div>
              <div>
                <p className="text-sm font-medium text-blue-100 tracking-wide uppercase">รายชื่อบุคลากรสังกัด</p>
                <h2 className="text-2xl font-bold">{schoolName || "กำลังโหลดข้อมูล..."}</h2>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-3xl font-bold">{profiles.length}</div>
              <div className="text-sm text-blue-100">สมาชิกรวม</div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50 min-h-[300px]">
            {/* 🟢 ย้าย Loading มาไว้ในกล่อง */}
            {pageLoading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-70">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-blue)] mb-4"></div>
                <p className="text-[var(--secondary-blue)] font-medium">กำลังรวบรวมรายชื่อสมาชิก...</p>
              </div>
            ) : !profile?.school_id ? (
              <div className="text-center py-10 bg-white rounded-xl border border-orange-200">
                <p className="text-orange-600 font-bold mb-2">⚠️ ไม่พบข้อมูลสังกัดโรงเรียนของคุณ</p>
                <p className="text-sm text-gray-500">กรุณากลับไปหน้า Profile เพื่อเลือกโรงเรียนก่อนใช้งานหน้านี้</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="text-6xl mb-4">👻</div>
                <h3 className="text-lg font-bold text-gray-700">ยังไม่มีสมาชิกคนอื่นในโรงเรียนนี้</h3>
                <p className="text-gray-500 mt-2 text-sm">ให้นักเรียนและคุณครูท่านอื่น สมัครสมาชิกและเลือกโรงเรียนนี้เพื่อเข้าร่วมทีม</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {profiles.map((p) => (
                    <li key={p.id} className={`p-4 sm:p-6 transition-colors hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${p.id === user?.id ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${p.training_flag ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.full_name ? p.full_name.charAt(0) : "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-lg">{p.full_name ?? "(ไม่ระบุชื่อ)"}</span>
                            {p.id === user?.id && <span className="text-xs bg-[var(--primary-blue)] text-white px-2 py-0.5 rounded-full">คุณ</span>}
                          </div>
                          <div className="mt-1">{getRoleBadge(p.sub_role)}</div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 border-gray-100 pt-3 sm:pt-0">
                        <span className="text-sm text-gray-500 sm:mb-1 block">สถานะการอบรมกติกา</span>
                        {p.training_flag ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">✅ ผ่านการอบรม</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">⏳ รอการเข้าชม</span>
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