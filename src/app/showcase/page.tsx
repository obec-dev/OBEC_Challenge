"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Team = {
  id: string;
  team_name: string | null;
  status: string | null;
  pdf_url: string | null;
  video_url: string | null;
};

export default function ShowcasePage() {
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("project_teams")
        .select("id, team_name, status, pdf_url, video_url")
        .eq("status", "submitted")
        .order("created_at", { ascending: false });
      setTeams(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-100 text-secondary-blue px-4 py-1 rounded-full text-sm font-bold tracking-wide mb-4">
            🌟 แกลลอรีผลงาน
          </div>
          <h1 className="text-4xl font-extrabold text-[var(--secondary-blue)] tracking-tight sm:text-5xl">
            OBEC Showcase
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            รวบรวมผลงานนวัตกรรมที่ผ่านการคัดเลือกและส่งเข้าร่วมประกวดจากโรงเรียนทั่วประเทศ
          </p>
        </div>

        {/* Content Section */}
        {loading ? (
          // Loading Skeleton แบบสวยงาม
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
            <p className="text-gray-500 font-medium animate-pulse">กำลังโหลดผลงานสุดเจ๋ง...</p>
          </div>
        ) : teams.length === 0 ? (
          // Empty State แบบดูเป็นมิตร
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700">ยังไม่มีผลงานในขณะนี้</h3>
            <p className="mt-2 text-gray-500">ผลงานชิ้นแรกอาจเป็นของโรงเรียนคุณ! ส่งผลงานเลยวันนี้</p>
          </div>
        ) : (
          // Grid Layout เรียงการ์ดผลงาน (มือถือ 1 คอลัมน์, แท็บเล็ต 2, คอม 3)
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team, index) => (
              <div
                key={team.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-2 hover:shadow-xl border border-gray-100"
              >
                {/* ส่วนหัวของการ์ด (Cover Image แบบ Gradient) */}
                <div
                  className="h-32 w-full relative flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%)`
                  }}
                >
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white border border-white/30">
                    ลำดับที่ {teams.length - index}
                  </div>
                  <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform">
                    {team.pdf_url && team.video_url ? '🏆' : '💡'}
                  </span>
                </div>

                {/* ข้อมูลผลงาน */}
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-bold text-[var(--secondary-blue)] line-clamp-2">
                    {team.team_name ?? "ผลงานไม่ได้ตั้งชื่อ"}
                  </h2>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--accent-green)]"></span>
                    <span className="text-sm font-medium text-gray-500">
                      ส่งผลงานสมบูรณ์
                    </span>
                  </div>

                  {/* กลุ่มปุ่มกด (วางไว้ด้านล่างสุดของการ์ดเสมอด้วย mt-auto) */}
                  <div className="mt-auto pt-6 flex gap-3">
                    {team.pdf_url ? (
                      <a
                        href={team.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-50 text-red-700 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-red-100 border border-red-200"
                      >
                        📄 ดูเอกสาร
                      </a>
                    ) : (
                      <span className="flex-1 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 px-4 py-2.5 text-sm border border-gray-100 cursor-not-allowed">
                        ไม่มีเอกสาร
                      </span>
                    )}

                    {team.video_url ? (
                      <a
                        href={team.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-50 text-[var(--secondary-blue)] px-4 py-2.5 text-sm font-bold transition-colors hover:bg-blue-100 border border-blue-200"
                      >
                        🎬 ชมวิดีโอ
                      </a>
                    ) : (
                      <span className="flex-1 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 px-4 py-2.5 text-sm border border-gray-100 cursor-not-allowed">
                        ไม่มีวิดีโอ
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}