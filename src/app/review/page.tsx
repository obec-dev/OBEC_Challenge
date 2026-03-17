"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";

type ProjectTeam = {
  id: string;
  team_name: string | null;
  status: string | null;
  pdf_url: string | null;
  video_url: string | null;
  updated_at?: string;
};

export default function ReviewPage() {
  const router = useRouter();
  const { user, profile, currentRole, loading: authLoading } = useAuth();
  
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [schoolName, setSchoolName] = useState("");
  
  // 🟢 แยก State สำหรับ Loading กล่องข้อความ กับ Loading ของปุ่ม
  const [pageLoading, setPageLoading] = useState(true); 
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasInit = useRef(false); // ตัวล็อคกัน useEffect รันซ้ำซ้อน

  // 1. ตรวจสอบสิทธิ์
  useEffect(() => {
    if (authLoading) return;
    if (!user || currentRole !== "school_admin") {
      router.push("/");
    }
  }, [user, currentRole, authLoading, router]);

  // 2. ฟังก์ชันดึงข้อมูลหลัก (สั่งได้ว่าให้ดึงแบบมีปุ่มหมุน หรือดึงเงียบๆ)
  const fetchTeamsData = async (isManualRefresh = false) => {
    if (!profile?.school_id) return;

    if (isManualRefresh) setIsRefreshing(true); // ถ้ากดปุ่ม ให้หมุนที่ปุ่ม

    try {
      const { data: schoolData } = await supabase
        .from("schools")
        .select("school_name, district_name")
        .eq("id", profile.school_id)
        .single();
      
      let currentSchoolName = "";
      if (schoolData) {
        currentSchoolName = `${schoolData.school_name} (${schoolData.district_name})`;
        setSchoolName(currentSchoolName);
      }

      const { data: teamsData, error } = await supabase
        .from("project_teams")
        .select("*")
        .eq("school_id", profile.school_id)
        .order("id", { ascending: false });

      if (error) throw error;

      if (teamsData) {
        setTeams(teamsData as ProjectTeam[]);
        
        // 💾 SAVE TO CACHE: เซฟข้อมูลล่าสุดลงความจำเบราว์เซอร์
        sessionStorage.setItem(`review_cache_${profile.school_id}`, JSON.stringify({
          schoolName: currentSchoolName,
          teams: teamsData
        }));
      }
    } catch (error) {
      console.error("โหลดข้อมูล Review ผิดพลาด:", error);
      if (isManualRefresh) alert("❌ ไม่สามารถดึงข้อมูลใหม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setIsRefreshing(false);
      setPageLoading(false); // ปิดตัวหมุนในกล่องเสมอเมื่อทำงานเสร็จ
    }
  };

  // 3. ควบคุมการโหลดตอนเปิดหน้าเว็บครั้งแรก
  useEffect(() => {
    if (authLoading || !profile) return;
    
    // กันไม่ให้มันทำงานซ้ำตอน React เรนเดอร์
    if (hasInit.current) return;
    hasInit.current = true;

    const cacheKey = `review_cache_${profile.school_id}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      // ⚡ กรณีมี Cache: โหลดปุ๊บ โชว์ปั๊บ! ไม่ต้องมีจอหมุนเลย
      const parsed = JSON.parse(cached);
      setTeams(parsed.teams);
      setSchoolName(parsed.schoolName);
      setPageLoading(false); // สั่งปิด Loading กลางกล่องทันที

      // 🕵️ แอบดึงข้อมูลเงียบๆ เผื่อพี่ไปแก้ผลงานมา แล้วลืมกด Refresh
      fetchTeamsData(false); 
    } else {
      // ⏳ กรณีไม่มี Cache (เข้าครั้งแรก): ให้กล่องขึ้นตัวหมุนไปก่อน
      setPageLoading(true);
      fetchTeamsData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, authLoading]);

  // 🔴 Loading เฉพาะระบบ Auth เท่านั้น (หน้าจอขาวหมุนติ้วๆ จะเกิดแค่ช่วงนี้)
  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
        <p className="text-[var(--secondary-blue)] font-medium">กำลังตรวจสอบสิทธิ์...</p>
      </main>
    );
  }

  if (currentRole !== "school_admin") return null;

  // 🟢 เริ่มเรนเดอร์โครงสร้าง UI ทันที (ปุ่มต่างๆ จะโชว์ตลอดเวลา ไม่หายไปไหนแล้ว)
  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4 flex justify-center items-start relative pb-24">
      <div className="w-full max-w-4xl relative z-10">
        
        {/* ส่วนหัวและปุ่มกด (รอดพ้นจากการโดน Loading บังแล้ว!) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--secondary-blue)]">แดชบอร์ดผลงาน</h1>
            <p className="text-gray-500 mt-2">จัดการและตรวจสอบผลงานทั้งหมดของโรงเรียนคุณ</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => fetchTeamsData(true)}
              disabled={isRefreshing}
              className="flex-1 md:flex-none bg-white border-2 border-[var(--primary-blue)] text-[var(--primary-blue)] px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRefreshing ? "⏳ อัปเดตข้อมูล..." : "🔄 รีเฟรชข้อมูล"}
            </button>
            <Link 
              href="/submission" 
              className="flex-1 md:flex-none bg-[var(--accent-red)] text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span> สร้างผลงานใหม่
            </Link>
          </div>
        </div>

        {/* ส่วนกล่องตารางผลงาน */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-[var(--primary-blue)] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl bg-white/20 p-3 rounded-xl backdrop-blur-sm">🏫</div>
              <div>
                <p className="text-sm font-medium text-blue-100 tracking-wide uppercase">ผลงานสังกัด</p>
                <h2 className="text-2xl font-bold">{schoolName || "กำลังโหลดข้อมูล..."}</h2>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-3xl font-bold">{teams.length}</div>
              <div className="text-sm text-blue-100">ผลงานทั้งหมด</div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50 min-h-[300px]">
            {/* 🟢 ย้าย Loading Spinner มาไว้ในกล่องตารางแทน */}
            {pageLoading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-70">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-blue)] mb-4"></div>
                <p className="text-[var(--secondary-blue)] font-medium">กำลังรวบรวมข้อมูลผลงาน...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-700">โรงเรียนของคุณยังไม่มีผลงาน</h3>
                <p className="text-gray-500 mt-2 mb-6">คลิกปุ่ม "สร้างผลงานใหม่" ด้านบนเพื่อเริ่มต้นส่งโครงงานแรกของคุณ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map((t) => (
                  <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${t.status === 'submitted' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {t.status === 'submitted' ? '✅ ยืนยันส่งแล้ว' : '📝 แบบร่าง'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xl text-gray-800 mb-3 line-clamp-2">
                        {t.team_name || <span className="text-gray-400 italic">(ยังไม่ได้ระบุชื่อโครงงาน)</span>}
                      </h4>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        {t.pdf_url ? (
                          <a href={t.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 font-medium hover:underline bg-blue-50 px-3 py-1.5 rounded-lg">
                            📄 ตรวจสอบ PDF
                          </a>
                        ) : (
                          <span className="flex items-center gap-1.5 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">📄 ขาดไฟล์ PDF</span>
                        )}
                        
                        {t.video_url ? (
                          <a href={t.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-red-600 font-medium hover:underline bg-red-50 px-3 py-1.5 rounded-lg">
                            🎬 ดูวิดีโอ
                          </a>
                        ) : (
                          <span className="flex items-center gap-1.5 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">🎬 ขาดลิงก์วิดีโอ</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end md:border-l md:border-gray-100 md:pl-6">
                      <Link 
                        href={`/submission?id=${t.id}`} 
                        className="w-full md:w-auto text-center px-6 py-3 bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
                      >
                        ✏️ เปิด/แก้ไข
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}