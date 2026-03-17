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
  const [pageLoading, setPageLoading] = useState(true);
  
  // 🟢 State สำหรับปุ่มกดรีเฟรชเอง
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔐 แม่กุญแจ! ป้องกันการดึงข้อมูลซ้ำซ้อนตอนสลับ Tab
  const hasFetched = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || currentRole !== "school_admin") {
      router.push("/");
    }
  }, [user, currentRole, authLoading, router]);

  // 🛠️ แยกฟังก์ชันดึงข้อมูลออกมา เพื่อให้กดปุ่มเรียกใช้เองได้
  const fetchTeamsData = async (isManualRefresh = false) => {
    if (!profile?.school_id) return;

    // ถ้ากดปุ่มให้โชว์โหลดที่ปุ่ม ถ้าโหลดครั้งแรกให้โชว์โหลดเต็มจอ
    if (isManualRefresh) setIsRefreshing(true);
    else setPageLoading(true);

    try {
      const { data: schoolData } = await supabase
        .from("schools")
        .select("school_name, district_name")
        .eq("id", profile.school_id)
        .single();
      
      if (schoolData) {
        setSchoolName(`${schoolData.school_name} (${schoolData.district_name})`);
      }

      const { data: teamsData, error } = await supabase
        .from("project_teams")
        .select("*")
        .eq("school_id", profile.school_id)
        .order("id", { ascending: false });

      if (error) throw error;

      if (teamsData) {
        setTeams(teamsData as ProjectTeam[]);
      }
    } catch (error) {
      console.error("โหลดข้อมูล Review ผิดพลาด:", error);
      if (isManualRefresh) alert("❌ ไม่สามารถดึงข้อมูลใหม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setPageLoading(false);
      setIsRefreshing(false);
    }
  };

  // 🛠️ useEffect สำหรับดึงข้อมูลตอนเปิดหน้าครั้งแรก (ทำงานแค่รอบเดียว!)
  useEffect(() => {
    if (!authLoading) {
      if (profile) {
        // ตรวจสอบแม่กุญแจ ถ้ายังไม่เคยโหลด ให้โหลดแล้วล็อคทันที
        if (!hasFetched.current) {
          hasFetched.current = true;
          fetchTeamsData();
        }
      } else {
        setPageLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  if (authLoading || pageLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
        <p className="text-[var(--secondary-blue)] font-medium">กำลังโหลดข้อมูลผลงาน...</p>
      </main>
    );
  }

  if (currentRole !== "school_admin") return null;

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4 flex justify-center items-start relative pb-24">
      <div className="w-full max-w-4xl relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--secondary-blue)]">แดชบอร์ดผลงาน</h1>
            <p className="text-gray-500 mt-2">จัดการและตรวจสอบผลงานทั้งหมดของโรงเรียนคุณ</p>
          </div>
          
          {/* 🟢 เพิ่มปุ่มรีเฟรช วางคู่กับปุ่มสร้างผลงานใหม่ */}
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => fetchTeamsData(true)}
              disabled={isRefreshing}
              className="flex-1 md:flex-none bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-full font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRefreshing ? "⏳ กำลังโหลด..." : "🔄 รีเฟรช"}
            </button>
            <Link 
              href="/submission" 
              className="flex-1 md:flex-none bg-[var(--accent-red)] text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span> สร้างผลงานใหม่
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-[var(--primary-blue)] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl bg-white/20 p-3 rounded-xl backdrop-blur-sm">🏫</div>
              <div>
                <p className="text-sm font-medium text-blue-100 tracking-wide uppercase">ผลงานสังกัด</p>
                <h2 className="text-2xl font-bold">{schoolName || "ไม่พบข้อมูลโรงเรียน"}</h2>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-3xl font-bold">{teams.length}</div>
              <div className="text-sm text-blue-100">ผลงานทั้งหมด</div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50">
            {teams.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
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