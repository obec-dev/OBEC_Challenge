"use client";

import { useEffect, useMemo, useState, Suspense, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

type ProjectTeam = {
  id: string;
  team_name: string | null;
  status: string | null;
  pdf_url: string | null;
  video_url: string | null;
  school_id: string | null;
};

function SubmissionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id"); 
  const isEditMode = !!editId;

  const { user, profile, currentRole, loading: authLoading } = useAuth();
  
  const [team, setTeam] = useState<ProjectTeam | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // 🟢 แยก State Loading ควบคุมเฉพาะส่วน Form
  const [pageLoading, setPageLoading] = useState(true);
  const hasInit = useRef(false); // 🔐 แม่กุญแจกันสลับ Tab

  const [draft, setDraft] = useState({ team_name: "", video_url: "" });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [videoError, setVideoError] = useState<string>("");

  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; action: () => void }>({ show: false, action: () => {} });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const validateVideoUrl = (url: string) => {
    if (!url) { setVideoError(""); return false; }
    if (url.includes("drive.google.com/drive/folders") || url.includes("/folders/")) {
      setVideoError("❌ ไม่อนุญาตให้แชร์เป็น 'โฟลเดอร์'");
      return false;
    }
    const isDriveFile = url.includes("drive.google.com/file/d/") || url.includes("drive.google.com/open?id=");
    const isYouTube = url.includes("youtube.com/watch") || url.includes("youtu.be/");
    
    if (!isDriveFile && !isYouTube) {
      setVideoError("⚠️ กรุณาใส่ลิงก์ Google Drive หรือ YouTube ที่ถูกต้อง");
      return false;
    }
    setVideoError("");
    return true;
  };

  const canSubmit = useMemo(() => {
    return (
      draft.team_name.trim().length > 0 && 
      (pdfFile !== null || team?.pdf_url) && 
      draft.video_url.trim().length > 0 &&
      videoError === ""
    );
  }, [draft, pdfFile, team, videoError]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || currentRole !== "school_admin") router.push("/");
  }, [user, currentRole, authLoading, router]);

  // 🛠️ โหลดข้อมูลครั้งแรกและล็อคกุญแจทันที
  useEffect(() => {
    if (authLoading || !profile) return;
    
    // กัน Re-render และการสลับ Tab
    if (hasInit.current) return;
    hasInit.current = true;

    async function loadData() {
      try {
        if (!profile?.school_id) return;

        const { data: schoolData } = await supabase.from("schools").select("school_name, district_name").eq("id", profile.school_id).single();
        if (schoolData) setSchoolName(`${schoolData.school_name} (${schoolData.district_name})`);

        if (isEditMode) {
          const { data: teamData } = await supabase.from("project_teams").select("*").eq("id", editId).eq("school_id", profile.school_id).single();
          if (teamData) {
            setTeam(teamData as ProjectTeam);
            setDraft({ team_name: teamData.team_name ?? "", video_url: teamData.video_url ?? "" });
          }
        }
      } catch (error) {
        console.error("โหลดข้อมูลผิดพลาด:", error);
      } finally {
        setPageLoading(false);
      }
    }

    loadData();
  }, [profile, authLoading, editId, isEditMode]);

  useEffect(() => {
    if (isEditMode) return;
    let timer: NodeJS.Timeout;
    if (draft.team_name || draft.video_url) {
      timer = setTimeout(() => { handleAutoSave(false); }, 3000);
    }
    return () => { if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isEditMode]);

  async function handleAutoSave(showNotification = false) {
    if (!profile?.school_id || videoError) return;
    setSaving(true);
    const payload = {
      school_id: profile.school_id,
      team_name: draft.team_name,
      video_url: draft.video_url,
      status: team?.status || "draft",
    };

    let result;
    if (team?.id) {
      result = await supabase.from("project_teams").update(payload).eq("id", team.id).select().single();
    } else {
      result = await supabase.from("project_teams").insert(payload).select().single();
    }

    if (result.data) {
      setTeam({ ...team, ...result.data } as ProjectTeam);
      setLastSaved(new Date());

      if (!team?.id && result.data.id) {
        window.history.replaceState(null, '', `?id=${result.data.id}`);
      }
      if (showNotification) showToast("💾 บันทึกแบบร่างเรียบร้อยแล้ว", "success");
    } else if (result.error && showNotification) {
      showToast("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
    setSaving(false);
  }

  const triggerSubmit = () => {
    setConfirmModal({
      show: true,
      action: async () => {
        setConfirmModal({ show: false, action: () => {} });
        await processSubmit();
      }
    });
  };

  async function processSubmit() {
    let finalPdfUrl = team?.pdf_url;
    if (pdfFile) {
      showToast(`เตรียมอัปโหลดไฟล์ PDF...`, "success");
      finalPdfUrl = "https://mock-r2-url.com/" + pdfFile.name; 
    }

    setSaving(true);
    const payload = { 
      status: "submitted",
      pdf_url: finalPdfUrl,
      team_name: draft.team_name,
      video_url: draft.video_url,
      school_id: profile?.school_id
    };

    let result;
    if (team?.id || isEditMode) {
      result = await supabase.from("project_teams").update(payload).eq("id", team?.id || editId).select().single();
    } else {
      result = await supabase.from("project_teams").insert(payload).select().single();
    }

    if (result.error) {
      showToast("❌ เกิดข้อผิดพลาด: " + result.error.message, "error");
    } else {
      setTeam(result.data as ProjectTeam);
      showToast("🎉 บันทึกผลงานสำเร็จ!", "success");
      setTimeout(() => router.push("/review"), 1500);
    }
    setSaving(false);
  }

  // 🔴 Loading เฉพาะระบบ Auth เท่านั้น
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
        <p className="text-[var(--secondary-blue)] font-medium">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  if (currentRole !== "school_admin") return null;

  return (
    <div className="relative overflow-hidden pb-24">
      {/* Toast & Modal (โค้ดเดิม) */}
      <div className={`fixed top-24 right-4 z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded-xl shadow-lg border font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'}`}>
          <span className="text-xl">{toast.type === 'success' ? '✅' : '⚠️'}</span>
          {toast.msg}
        </div>
      </div>

      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-blue-50 text-[var(--primary-blue)] rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🚀</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isEditMode ? "ยืนยันการบันทึกการแก้ไข" : "ยืนยันการส่งผลงาน"}
            </h3>
            <p className="text-gray-500 mb-8">ข้อมูลนี้จะถูกอัปเดตเข้าระบบการประกวด</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmModal({ show: false, action: () => {} })} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">ยกเลิก</button>
              <button onClick={confirmModal.action} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] shadow-md transition-colors">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 เริ่มเรนเดอร์โครงสร้างหลักทันที (ไม่โดน Loading บัง) */}
      <div className="w-full max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[var(--secondary-blue)]">
            {isEditMode ? "แก้ไขผลงาน" : "สร้างผลงานใหม่"}
          </h1>
          <p className="text-gray-500 mt-2">กรุณาตรวจสอบข้อมูลและแนบไฟล์ให้ครบถ้วนก่อนกดยืนยัน</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[500px]">
          <div className="bg-blue-50 border-b border-blue-100 p-6 flex items-start gap-4">
            <div className="text-4xl">🏫</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--primary-blue)] uppercase tracking-wide">กำลังดำเนินการในนาม</p>
              <h2 className="text-xl font-bold text-[var(--secondary-blue)]">{schoolName || "กำลังโหลดข้อมูล..."}</h2>
            </div>
            <div className="text-right text-sm">
              {saving ? <span className="text-orange-500 animate-pulse font-medium">⏳ กำลังบันทึก...</span> : (lastSaved && !isEditMode) ? <span className="text-green-600 font-medium">✅ ร่างอัตโนมัติล่าสุด {lastSaved.toLocaleTimeString('th-TH')}</span> : null}
            </div>
          </div>

          {/* 🟢 Loading ซ่อนอยู่แค่ตรงพื้นที่ฟอร์ม */}
          {pageLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-blue)] mb-4"></div>
              <p className="text-[var(--secondary-blue)] font-medium">กำลังเตรียมแบบฟอร์ม...</p>
            </div>
          ) : (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
              <div>
                <label className="block text-base font-bold text-[var(--secondary-blue)] mb-2">1. ชื่อโครงงาน / นวัตกรรม <span className="text-red-500">*</span></label>
                <input type="text" placeholder="ระบุชื่อผลงานของทีม" value={draft.team_name} onChange={(e) => setDraft({ ...draft, team_name: e.target.value })} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:bg-white focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all" />
              </div>

              <div>
                <label className="block text-base font-bold text-[var(--secondary-blue)] mb-2">2. เอกสารรูปเล่ม (ไฟล์ PDF) <span className="text-red-500">*</span></label>
                <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 hover:bg-gray-50 transition-colors relative group">
                  <div className="text-center">
                    <div className="text-4xl mb-3">{pdfFile || team?.pdf_url ? "📄" : "📁"}</div>
                    <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                      <label className="relative cursor-pointer rounded-md bg-white font-semibold text-[var(--primary-blue)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--primary-blue)] hover:text-blue-500">
                        <span>อัปโหลดไฟล์ PDF</span>
                        <input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type === "application/pdf") {
                            setPdfFile(file);
                            showToast(`เลือกไฟล์ ${file.name} แล้ว`, "success");
                          } else {
                            showToast("กรุณาอัปโหลดเฉพาะไฟล์นามสกุล .pdf เท่านั้น", "error");
                            e.target.value = "";
                          }
                        }} />
                      </label>
                    </div>
                    <p className="text-xs leading-5 text-gray-500 mt-2">
                      {pdfFile ? <span className="font-bold text-[var(--secondary-blue)]">เตรียมอัปโหลด: {pdfFile.name}</span> : team?.pdf_url ? <span className="font-bold text-green-600">✅ อัปโหลดไฟล์ไว้แล้ว (กดเลือกใหม่เพื่อเปลี่ยนไฟล์)</span> : "ขนาดไฟล์ไม่เกิน 50MB (PDF เท่านั้น)"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-[var(--secondary-blue)] mb-2">3. ลิงก์คลิปวิดีโอนำเสนอ <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-500 mb-2">อัปโหลดลง Google Drive (แชร์เป็นไฟล์เท่านั้น) หรือ YouTube</p>
                <input type="url" placeholder="https://drive.google.com/file/d/... หรือ https://youtu.be/..." value={draft.video_url} onChange={(e) => {
                  const url = e.target.value;
                  setDraft({ ...draft, video_url: url });
                  validateVideoUrl(url);
                }} className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-gray-800 focus:bg-white focus:outline-none transition-all ${videoError ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-300 focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-blue-100"}`} />
                {videoError && <p className="mt-2 text-sm font-bold text-red-500 animate-in fade-in zoom-in duration-300">{videoError}</p>}
              </div>

              <div className="pt-8 mt-4 border-t border-gray-100">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
                  <h3 className="font-bold text-slate-800 mb-2">จัดการผลงาน</h3>
                  <p className="text-sm text-slate-600 mb-6">กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนกดยืนยัน</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {isEditMode ? (
                      <>
                        <button onClick={() => router.push('/review')} className="w-full sm:w-auto min-w-[150px] rounded-xl bg-white border-2 border-gray-300 px-8 py-4 text-gray-600 font-bold text-lg shadow-sm hover:bg-gray-50 transition-all flex justify-center items-center gap-2">
                          ❌ ยกเลิก
                        </button>
                        <button onClick={triggerSubmit} disabled={!canSubmit || saving} className="w-full sm:w-auto min-w-[200px] rounded-xl bg-[var(--primary-blue)] px-8 py-4 text-white font-bold text-lg shadow-md hover:bg-[var(--secondary-blue)] transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                          {saving ? "กำลังประมวลผล..." : "💾 บันทึกการแก้ไข"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleAutoSave(true)} disabled={saving || (!draft.team_name && !draft.video_url)} className="w-full sm:w-auto min-w-[200px] rounded-xl bg-white border-2 border-[var(--primary-blue)] px-8 py-4 text-[var(--primary-blue)] font-bold text-lg shadow-sm hover:bg-blue-50 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                          {saving ? "กำลังประมวลผล..." : "💾 บันทึกแบบร่าง"}
                        </button>
                        <button onClick={triggerSubmit} disabled={!canSubmit || saving} className="w-full sm:w-auto min-w-[200px] rounded-xl bg-[var(--accent-green)] px-8 py-4 text-white font-bold text-lg shadow-md hover:bg-green-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                          {saving ? "กำลังประมวลผล..." : "🚀 ยืนยันการส่งผลงาน"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubmissionPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4 flex justify-center items-start">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mb-4"></div>
          <p className="text-[var(--secondary-blue)] font-medium">กำลังเตรียมโหลดข้อมูล...</p>
        </div>
      }>
        <SubmissionForm />
      </Suspense>
    </main>
  );
}