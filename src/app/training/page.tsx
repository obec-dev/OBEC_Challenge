"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation"; // 🛠️ เพิ่ม useRouter

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function TrainingPage() {
  const router = useRouter(); // 🛠️ เรียกใช้งาน router
  const playerRef = useRef<any>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [shownQuestions, setShownQuestions] = useState<number[]>([]);
  
  const isEndedRef = useRef(false);

  const triggerVideoEnd = useCallback(async () => {
    if (isEndedRef.current) return;
    isEndedRef.current = true;
    setVideoEnded(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ training_flag: true }).eq("id", user.id);
        console.log("บันทึกสถานะลง Supabase สำเร็จ!");
      }
    } catch (err) {
      console.error("Error saving progress:", err);
    }
  }, []);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player("youtube-player", {
        videoId: "YaG5SAw1n0c", 
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          disablekb: 1,
          origin: window.location.origin,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED || event.data === 0) {
              triggerVideoEnd();
            } else if (event.data === window.YT.PlayerState.PLAYING || event.data === 1) {
              setVideoStarted(true);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player && !playerRef.current) {
      window.onYouTubeIframeAPIReady();
    }
  }, [triggerVideoEnd]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        if (playerRef.current && typeof playerRef.current.getPlayerState === "function") {
          const state = playerRef.current.getPlayerState();
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || 0;

          if (state === 1 && currentTime >= 2 && !shownQuestions.includes(2)) {
            playerRef.current.pauseVideo();
            setShownQuestions((prev) => [...prev, 2]);
            setShowQuestion(true);
          }

          if (duration > 0 && currentTime >= duration - 0.5 && !isEndedRef.current) {
            triggerVideoEnd();
          }
        }
      } catch (error) {}
    }, 500);

    return () => clearInterval(interval);
  }, [shownQuestions, showQuestion, triggerVideoEnd]);

  const handleAnswer = () => {
    setShowQuestion(false);
    if (playerRef.current && typeof playerRef.current.playVideo === "function") {
      playerRef.current.playVideo();
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="mx-auto max-w-4xl relative z-10">
        
        <div className="text-center mb-8">
          <span className="inline-block bg-blue-100 text-[var(--secondary-blue)] px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-4 shadow-sm border border-blue-200">
            📚 หลักสูตรปฐมนิเทศ
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--primary-blue)]">
            อบรมกติกาการส่งผลงาน
          </h1>
          <p className="text-gray-500 mt-2 text-lg">กรุณารับชมวิดีโอให้จบเพื่อรับสิทธิ์เข้าร่วมโครงการ</p>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl border-4 border-white">
          
          <div className={videoEnded ? "hidden" : "h-full w-full"} id="youtube-player"></div>

          {/* 🟢 หน้าจอแสดงความยินดีตอนจบ (ดีไซน์ใหม่) */}
          {videoEnded && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[var(--primary-blue)] text-white p-10 text-center">
              <div>
                <div className="text-6xl mb-6">⭐</div>
                <h2 className="text-4xl font-bold text-[var(--accent-green)] mb-3">อบรมเรียบร้อยแล้ว!</h2>
                <p className="text-xl text-blue-100 mb-8">ระบบได้บันทึกสถานะการผ่านการอบรมของคุณเรียบร้อยแล้ว</p>
                
                {/* 🛠️ แก้ไขปุ่มเป็น กลับสู่หน้าแรก */}
                <button 
                  onClick={() => router.push('/')}
                  className="rounded-full bg-[var(--accent-red)] px-12 py-4 text-white font-bold text-lg shadow-xl hover:bg-red-700 hover:-translate-y-1 transition-all"
                >
                  🏠 กลับสู่หน้าแรก
                </button>
              </div>
            </div>
          )}

          {/* 🔴 หน้าคำถาม Overlay */}
          {showQuestion && !videoEnded && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--primary-blue)]/95 backdrop-blur-sm p-6 text-white text-center">
              <div className="max-w-md">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">❓</div>
                <h2 className="text-2xl font-bold mb-2">ยืนยันการรับชม</h2>
                <p className="mt-2 text-blue-100 mb-8 text-lg">คลิกปุ่มด้านล่างเพื่อเล่นวิดีโอต่อให้จบ</p>
                <button 
                  onClick={handleAnswer} 
                  className="w-full rounded-xl bg-[var(--accent-red)] px-8 py-4 font-bold text-lg shadow-lg hover:bg-red-700 hover:-translate-y-0.5 transition-all"
                >
                  ▶️ ดูต่อให้จบ
                </button>
              </div>
            </div>
          )}
        </div>

        {!videoStarted && !videoEnded && (
          <div className="mt-8 flex justify-center">
            <div className="bg-white px-8 py-4 rounded-full shadow-md border border-gray-100 flex items-center gap-3 animate-bounce">
              <span className="text-[var(--accent-red)] text-2xl">☝️</span>
              <p className="text-[var(--primary-blue)] font-bold text-lg">คลิกตรงกลางวิดีโอเพื่อเริ่มการอบรม</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}