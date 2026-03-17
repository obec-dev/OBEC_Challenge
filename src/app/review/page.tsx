"use client";

import { useEffect, useState } from "react";
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

  // 1. ตรวจสอบสิทธิ์ 
  useEffect(() => {
    if (authLoading) return;
    // 🛡️ เช็คจาก user?.id แทน user ทั้งก้อน ป้องกัน useEffect ทำงานซ้ำตอน Token Refreshed
    if (!user?.id || currentRole !== "school_admin") {
      router.push("/");
    }
  }, [user?.id, currentRole, authLoading, router]);

  // 2. ดึงข้อมูลแบบคลีนๆ (กันหมุนค้าง 100%)
  useEffect(() => {
    let isMounted = true;
    
    // 🛡️ ก๊อกสุดท้าย: ถ้าอะไรก็ตามทำให้โหลดเกิน 8 วินาที ให้บังคับหยุดหมุนทันที
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setPageLoading(false);
    }, 8000);

    async function loadData() {
      if (!profile?.school_id) {
        if (isMounted) setPageLoading(false);
        return;
      }

      try {
        // ดึงชื่อโรงเรียน
        const { data: schoolData } = await supabase
          .from("schools")
          .select("school_name, district_name")
          .eq("id", profile.school_id)
          .single();
        
        if (schoolData && isMounted) {
          setSchoolName(`${schoolData.school_name} (${schoolData.district_name})`);
        }

        // ดึงข้อมูลผลงาน
        const { data: teamsData, error } = await supabase
          .from("project_teams")
          .select("*")
          .eq("school_id", profile.school_id)
          .order("id", { ascending: false });

        if (error) throw error;

        if (isMounted && teamsData) {
          setTeams(teamsData as ProjectTeam[]);
        }
      } catch (error) {
        console.error("โหลดข้อมูล Review ผิดพลาด:", error);
      } finally {
        if (isMounted) {
          setPageLoading(false); // หยุดหมุน
          clearTimeout(fallbackTimer); // ยกเลิกตัวจับเวลาฉุกเฉิน
        }
      }
    }

    if (!authLoading) {
      if (profile?.school_id) {
        loadData();
      } else {
        setPageLoading(false);
        clearTimeout(fallbackTimer);
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  // 🛡️ เช็คจาก profile?.school_id แทน profile ทั้งก้อน
  }, [profile?.school_id, authLoading]);

  // UI ส่วน Loading
  if (authLoading || pageLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
        <p className="text-[var(--secondary-blue)] font-medium">กำลังโหลดข้อมูลผลงาน...</p>
      </main>
    );
  }

  if (currentRole !== "school_admin") return null;

  // UI ส่วนแสดงผลหลัก
  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4 flex justify-center items-start relative pb-24">
      <div className="w-full max-w-4xl relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--secondary-blue)]">แดชบอร์ดผลงาน</h1>
            <p className="text-gray-500 mt-2">จัดการและตรวจสอบผลงานทั้งหมดของโรงเรียนคุณ</p>
          </div>
          <Link 
            href="/submission" 
            className="bg-[var(--accent-red)] text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className="text-xl">+</span> สร้างผลงานใหม่
          </Link>
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