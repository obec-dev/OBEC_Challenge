"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds === 0) return "00:00";
  const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function TrainingPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const playerRef = useRef<any>(null);
  const isEndedRef = useRef(false);

  const [showQuestion, setShowQuestion] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [shownQuestions, setShownQuestions] = useState<number[]>([]);
  const [isLostFocus, setIsLostFocus] = useState(false); 

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const triggerVideoEnd = useCallback(async () => {
    if (isEndedRef.current) return;
    isEndedRef.current = true;
    setVideoEnded(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ training_flag: true }).eq("id", user.id);
      }
    } catch (err) {
      console.error("Error saving progress:", err);
    }
  }, [supabase]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isEndedRef.current || showQuestion) return;

      if (document.hidden) {
        if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
        setIsLostFocus(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [showQuestion]);

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
          fs: 0,              
          iv_load_policy: 3,  
          playsinline: 1,     
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
          const current = playerRef.current.getCurrentTime() || 0;
          const total = playerRef.current.getDuration() || 0;

          setCurrentTime(current);
          setDuration(total);

          if (state === 1 && current >= 4 && !shownQuestions.includes(2)) {
            playerRef.current.pauseVideo();
            setShownQuestions((prev) => [...prev, 2]);
            setShowQuestion(true);
          }

          if (total > 0 && current >= total - 0.5 && !isEndedRef.current) {
            triggerVideoEnd();
          }
        }
      } catch (error) { }
    }, 500);

    return () => clearInterval(interval);
  }, [shownQuestions, showQuestion, triggerVideoEnd]);

  const handleResumeVideo = () => {
    setShowQuestion(false);
    setIsLostFocus(false); 
    if (playerRef.current && typeof playerRef.current.playVideo === "function") {
      playerRef.current.playVideo();
    }
  };

  // 🟢 ฟังก์ชันสำหรับปุ่ม "ดูซ้ำอีกที"
  const handleReplayVideo = () => {
    setVideoEnded(false);
    isEndedRef.current = false; // รีเซ็ตสถานะการจบ
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(0, true); // ย้อนกลับไปวินาทีที่ 0
      playerRef.current.playVideo();
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4 relative overflow-hidden">
      
      <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "0s" }}></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "2s" }}></div>

      <div className="mx-auto max-w-4xl relative z-10 animate-fade-in-up">
        
        <div className="text-center mb-10 bg-white/60 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50">
          <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--primary-blue)] mb-4 leading-tight">
            อบรมกติกาการส่งผลงาน
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            กรุณารับชมวิดีโอให้จบ <span className="text-[var(--accent-red)] font-bold">ห้ามเปลี่ยนหน้าต่าง</span> เพื่อรับสิทธิ์เข้าร่วมโครงการ
          </p>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl border-4 border-white/50 group">
          <div className={videoEnded ? "hidden" : "h-full w-full pointer-events-none absolute inset-0 z-10"}></div>
          <div className={videoEnded ? "hidden" : "h-full w-full"} id="youtube-player"></div>

          {videoEnded && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[var(--primary-blue)] to-blue-900 text-white p-10 text-center animate-fade-in-up">
              <div>
                <h2 className="text-4xl font-extrabold text-[var(--accent-green)] mb-4">ผ่านการอบรมเรียบร้อย!</h2>
                <p className="text-xl text-blue-100 mb-10 font-light">ระบบได้บันทึกสถานะของคุณแล้ว ตอนนี้คุณพร้อมส่งผลงานเข้าประกวด</p>
                
                {/* 🟢 2 ปุ่ม: ดูซ้ำ กับ กลับหน้าแรก (ไม่มี Icon) */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleReplayVideo}
                    className="rounded-full bg-white text-[var(--primary-blue)] px-10 py-3.5 font-bold text-lg shadow-lg hover:bg-gray-100 hover:-translate-y-1 transition-all duration-300"
                  >
                    ดูซ้ำอีกที
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="rounded-full bg-[var(--accent-red)] px-10 py-3.5 text-white font-bold text-lg shadow-[0_10px_30px_rgba(220,38,38,0.4)] hover:bg-red-700 hover:-translate-y-1 transition-all duration-300"
                  >
                    กลับสู่หน้าแรก
                  </button>
                </div>
              </div>
            </div>
          )}

          {showQuestion && !videoEnded && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--primary-blue)]/95 backdrop-blur-2xl p-6 text-white text-center">
              <div className="max-w-md bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl animate-fade-in-up">
                <h2 className="text-3xl font-bold mb-3">ยังตั้งใจดูอยู่ไหม?</h2>
                <p className="text-blue-100 mb-8 text-lg font-light">คลิกปุ่มด้านล่างเพื่อยืนยันการรับชม และเรียนรู้ให้จบ</p>
                <button
                  onClick={handleResumeVideo}
                  className="w-full rounded-full bg-white text-[var(--primary-blue)] px-8 py-4 font-extrabold text-lg shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-300"
                >
                  ยืนยัน และดูต่อ
                </button>
              </div>
            </div>
          )}

          {isLostFocus && !videoEnded && !showQuestion && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-red-900/95 backdrop-blur-2xl p-6 text-white text-center">
              <div className="max-w-md animate-fade-in-up">
                <h2 className="text-3xl font-extrabold mb-4">วิดีโอถูกหยุดชั่วคราว!</h2>
                <p className="text-red-100 mb-8 text-lg">ระบบตรวจพบว่าคุณสลับหน้าต่าง กรุณากลับมาตั้งใจรับชมวิดีโอการอบรม</p>
                <button
                  onClick={handleResumeVideo}
                  className="rounded-full bg-white text-red-700 px-10 py-4 font-extrabold text-lg shadow-xl hover:bg-gray-100 transition-colors duration-300"
                >
                  เล่นวิดีโอต่อ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 🟢 Custom Progress Bar: เอา !videoEnded ออก เพื่อให้โชว์ตลอดเวลาที่วิดีโอเริ่มไปแล้ว */}
        {videoStarted && (
          <div className="mt-6 flex items-center gap-4 bg-white/60 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-white/50 animate-fade-in-up">
            <span className="text-sm font-bold text-[var(--primary-blue)] w-12 text-right">
              {formatTime(videoEnded ? duration : currentTime)}
            </span>
            
            <div className="flex-1 h-3 bg-gray-200/80 rounded-full overflow-hidden relative shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--accent-red)] to-red-400 rounded-full transition-all duration-500 ease-linear"
                // ถ้าจบแล้ว บังคับหลอดเต็ม 100% ทันที
                style={{ width: `${videoEnded ? 100 : (duration > 0 ? (currentTime / duration) * 100 : 0)}%` }}
              ></div>
            </div>

            <span className="text-sm font-bold text-gray-500 w-12">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {!videoStarted && !videoEnded && (
          <div className="mt-8 flex justify-center animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="bg-white px-8 py-4 rounded-full shadow-lg border border-blue-100 flex items-center gap-4 animate-bounce hover:bg-blue-50 transition-colors cursor-pointer"
                 onClick={() => {
                   if (playerRef.current && typeof playerRef.current.playVideo === "function") {
                     playerRef.current.playVideo();
                   }
                 }}>
              <p className="text-[var(--primary-blue)] font-extrabold text-lg tracking-wide">คลิกที่นี่ เพื่อเริ่มรับชมการอบรม</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}