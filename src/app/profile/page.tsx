"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from '@supabase/supabase-js';
import Link from "next/link";

type Profile = {
  id: string;
  full_name: string | null;
  sub_role: string | null;
  training_flag: boolean;
  school_id: string | null;
  district_id: string | null;
  personal_role: string;
};

type School = {
  id: string;
  school_code: string;
  school_name: string;
  district_name: string;
  province: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    full_name: "",
    sub_role: "",
    school_id: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth");
        return;
      }
      setUser(userData.user);

      const { data: schoolsData } = await supabase
        .from("schools")
        .select("id, school_code, school_name, district_name, province")
        .order("school_name");
      
      const loadedSchools = schoolsData ?? [];
      setSchools(loadedSchools);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
        setForm({
          full_name: profileData.full_name || "",
          sub_role: profileData.sub_role || "",
          school_id: profileData.school_id || "",
        });

        if (profileData.school_id) {
          const mySchool = loadedSchools.find(s => s.id === profileData.school_id);
          if (mySchool) {
            setSearchQuery(mySchool.school_name);
          }
        }
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const filteredSchools = useMemo(() => {
    if (!searchQuery) return schools.slice(0, 50);
    
    return schools
      .filter((s) => 
        s.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.district_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 50);
  }, [schools, searchQuery]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const saveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);

    const selectedSchool = schools.find(s => s.id === form.school_id);
    const districtId = selectedSchool?.district_name ?? null;

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: form.full_name,
        sub_role: form.sub_role,
        school_id: form.school_id,
        district_id: districtId,
        personal_role: 'personal',
      })
      .select()
      .single();

    if (data) {
      setProfile(data as Profile);
      alert("✅ บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!");
    } else if (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
        <p className="text-[var(--secondary-blue)] font-medium">กำลังเตรียมข้อมูลโรงเรียนทั่วประเทศ...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4 flex justify-center items-start relative">
      {/* 🛠️ แก้ที่ 1: เอา z-10 ออกจากกล่องหลัก เพื่อปลดล็อกเลเยอร์ทั้งหมด */}
      <div className="w-full max-w-2xl relative">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[var(--secondary-blue)]">
            จัดการโปรไฟล์ส่วนตัว
          </h1>
          <p className="text-gray-500 mt-2">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อรับสิทธิ์ส่งผลงาน</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          
          <div className={`rounded-t-2xl p-4 border-b ${profile?.training_flag ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{profile?.training_flag ? '✅' : '⚠️'}</span>
                <div>
                  <h3 className={`font-bold ${profile?.training_flag ? 'text-green-800' : 'text-orange-800'}`}>
                    {profile?.training_flag ? 'ผ่านการอบรมกติกาแล้ว' : 'คุณยังไม่ได้ผ่านการอบรม'}
                  </h3>
                  <p className={`text-sm ${profile?.training_flag ? 'text-green-600' : 'text-orange-600'}`}>
                    {profile?.training_flag 
                      ? 'คุณสามารถสร้างทีมและส่งผลงานได้ทันที' 
                      : 'กรุณาดูวิดีโอกติกาให้จบเพื่อรับสิทธิ์ส่งผลงาน'}
                  </p>
                </div>
              </div>
              {!profile?.training_flag && (
                <Link 
                  href="/training" 
                  className="shrink-0 bg-[var(--accent-orange)] hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                  ไปหน้าอบรม ➔
                </Link>
              )}
            </div>
          </div>

          <div className="p-8 space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-[var(--secondary-blue)] mb-2">
                👤 ชื่อ-นามสกุลจริง
              </label>
              <input
                type="text"
                placeholder="เช่น นายใจดี เรียนเก่ง"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:bg-white focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--secondary-blue)] mb-2">
                🎭 บทบาท / ตำแหน่ง
              </label>
              <select
                value={form.sub_role}
                onChange={(e) => setForm({ ...form, sub_role: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:bg-white focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>-- เลือกบทบาทของคุณ --</option>
                <option value="student">👨‍🎓 นักเรียน</option>
                <option value="teacher">👨‍🏫 ครู / ผู้ควบคุมทีม</option>
                <option value="director">👔 ผู้อำนวยการโรงเรียน</option>
                <option value="vice_director">👔 รองผู้อำนวยการโรงเรียน</option>
              </select>
            </div>

            {/* --- ส่วน Combobox สำหรับโรงเรียน --- */}
            <div className="relative z-40">
              <label className="block text-sm font-bold text-[var(--secondary-blue)] mb-2">
                🏫 สังกัดโรงเรียน
              </label>
              
              {/* 🛠️ แก้ที่ 2: ย้ายแผ่นกระจกใส (Backdrop) มาไว้ตรงนี้ เพื่อให้มันอยู่ "ใต้" input แต่ทับส่วนอื่น */}
              {isDropdownOpen && (
                <div 
                  className="fixed inset-0 z-30 cursor-default" 
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
              )}

              {/* 🛠️ แก้ที่ 3: ยก Input และ Dropdown ให้มี z-40 เพื่อให้มันลอยอยู่ "บน" แผ่นกระจกใส */}
              <div className="relative z-40">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อโรงเรียน หรือ เขตพื้นที่ เพื่อค้นหา..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    setForm({ ...form, school_id: "" });
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className={`w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:bg-white focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all ${isDropdownOpen ? 'rounded-b-none border-b-0' : ''}`}
                />
                
                <div className="absolute right-4 top-3.5 text-gray-400 pointer-events-none">
                  {isDropdownOpen ? '▲' : '▼'}
                </div>

                {isDropdownOpen && (
                  <ul className="absolute left-0 right-0 top-full z-50 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-b-xl shadow-2xl custom-scrollbar">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school) => (
                        <li
                          key={school.id}
                          onClick={() => {
                            setForm({ ...form, school_id: school.id });
                            setSearchQuery(school.school_name);
                            setIsDropdownOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <div className="font-bold text-gray-800">{school.school_name}</div>
                          <div className="text-xs text-gray-500">เขต: {school.district_name} | จ.{school.province}</div>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-4 text-center text-gray-500 text-sm">
                        ไม่พบชื่อโรงเรียนที่ค้นหา
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                *แสดงผลการค้นหาสูงสุด 50 รายการ กรุณาพิมพ์ชื่อให้ชัดเจน
              </p>
            </div>

            <div className="pt-4 relative z-10">
              <button
                onClick={saveProfile}
                disabled={saving || !form.full_name || !form.sub_role || !form.school_id}
                className="w-full rounded-xl bg-[var(--primary-blue)] px-4 py-4 text-white font-bold text-lg shadow-md hover:bg-opacity-90 hover:-translate-y-0.5 transition-all disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none flex justify-center items-center gap-2"
              >
                {saving ? "กำลังบันทึกข้อมูล..." : "💾 บันทึกโปรไฟล์"}
              </button>
            </div>
            
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white text-gray-500 font-medium hover:bg-gray-50 hover:text-[var(--accent-red)] border border-gray-200 transition-colors shadow-sm"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>
    </main>
  );
}