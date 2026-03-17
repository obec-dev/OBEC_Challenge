"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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
  const router = useRouter();
  const { user, profile, currentRole, loading: authLoading } = useAuth();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true); // ตัวการทำหมุนค้าง
  const [schoolName, setSchoolName] = useState<string>("");

  // 1. ตรวจสอบสิทธิ์ (Security Check) - แก้ไขให้เตะกลับแบบเงียบๆ ไม่ต้อง Alert
  useEffect(() => {
    if (authLoading) return;

    if (!user || currentRole !== "school_admin") {
      router.push("/"); // กลับหน้าโฮมทันที ไม่ต้องโวยวาย
    }
  }, [user, currentRole, authLoading, router]);

  // 2. โหลดข้อมูลสมาชิก - เพิ่ม Try...Catch...Finally แก้บั๊กหมุนค้าง
  useEffect(() => {
    async function loadTeam() {
      try {
        if (!profile?.school_id) {
          setLoading(false);
          return;
        }

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

        setProfiles(data ?? []);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      } finally {
        // สำคัญมาก: ไม่ว่าจะสำเร็จหรือพัง ต้องสั่งให้หยุดหมุนเสมอ!
        setLoading(false);
      }
    }

    if (!authLoading) {
      if (profile) {
        loadTeam();
      } else {
        setLoading(false); // ถ้าไม่มี profile ก็ต้องหยุดหมุน
      }
    }
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

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
        <p className="text-[var(--secondary-blue)] font-medium">กำลังรวบรวมรายชื่อสมาชิก...</p>
      </main>
    );
  }

  // ป้องกันกรณีหน้าจอแอบเรนเดอร์ตอนกำลังจะโดนเตะออก
  if (currentRole !== "school_admin") return null;

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4 flex justify-center items-start relative">
      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[var(--secondary-blue)]">จัดการสมาชิกทีม</h1>
          <p className="text-gray-500 mt-2">ตรวจสอบสถานะการอบรมของบุคลากรและนักเรียนในโรงเรียนของคุณ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-[var(--primary-blue)] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl bg-white/20 p-3 rounded-xl backdrop-blur-sm">🏫</div>
              <div>
                <p className="text-sm font-medium text-blue-100 tracking-wide uppercase">รายชื่อบุคลากรสังกัด</p>
                <h2 className="text-2xl font-bold">{schoolName || "ไม่พบข้อมูลสังกัด"}</h2>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-3xl font-bold">{profiles.length}</div>
              <div className="text-sm text-blue-100">สมาชิกรวม</div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50">
            {!profile?.school_id ? (
              <div className="text-center py-10 bg-white rounded-xl border border-orange-200">
                <p className="text-orange-600 font-bold mb-2">⚠️ ไม่พบข้อมูลสังกัดโรงเรียนของคุณ</p>
                <p className="text-sm text-gray-500">กรุณากลับไปหน้า Profile เพื่อเลือกโรงเรียนก่อนใช้งานหน้านี้</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {profiles.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">👻</div>
                    <h3 className="text-lg font-bold text-gray-700">ยังไม่มีสมาชิกคนอื่นในโรงเรียนนี้</h3>
                    <p className="text-gray-500 mt-2 text-sm">ให้นักเรียนและคุณครูท่านอื่น สมัครสมาชิกและเลือกโรงเรียนนี้เพื่อเข้าร่วมทีม</p>
                  </div>
                ) : (
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}