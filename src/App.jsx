import React, { useState, useEffect, useRef } from "react";
import { Heart, Check, X, ShieldCheck, Quote, Camera } from "lucide-react";

/* ---------------------------------------------------------
   디자인 토큰
   컨셉: "친구의 추천장" — 코르크보드에 핀으로 꽂은 종이 카드.
   시스템 UI(버튼/입력창)는 부드러운 라운드, 종이/카드류는
   살짝 각지고 회전된 형태로 구분해요.
--------------------------------------------------------- */
const C = {
  primary: "#E14C5F", // 체리·라즈베리 포인트
  primaryDeep: "#B93A4C",
  gold: "#E8A33D", // 스티키노트/핀 포인트
  ink: "#241A1C", // 따뜻한 잉크블랙 (본문 텍스트)
  sub: "#8A7A75", // 톤다운된 보조 텍스트
  paper: "#FFFBF8", // 카드/기본 배경 (light)
  paperAlt: "#FBF1E9", // 섹션 배경 (light, 약간 더 진한 톤)
  board: "#2A1620", // 헤더·히어로·푸터 (dark, 코르크보드 느낌)
  tint: "#FDEDEF", // 옅은 라즈베리 워시 (배지/경고박스)
  border: "#F0E3DA", // 밝은 배경 위 헤어라인
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  color: C.ink,
  background: "#FFFFFF",
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  outline: "none",
};

// Google Apps Script 웹 앱 URL
// ⚠️ 지금 이 URL은 아직 구글 로그인을 요구해요. 배포 설정에서
// "액세스 권한이 있는 사용자"가 "Anyone with Google Account"로 되어 있을 가능성이 높아요.
// 반드시 "Anyone"(전체, 로그인 불필요)으로 바꿔서 재배포한 뒤 이 URL이 맞는지 다시 확인해주세요.
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw40yYXSbFGC06MfKuV-Vm6ezUQYL0njGLSRKGChw6abCdHtnp3HFBCEaZ-URI1zvrn/exec";

const GLOBAL_CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap');

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
.ncs-input:focus { border-color: ${C.primary} !important; box-shadow: 0 0 0 3px ${C.tint}; }
button { font-family: inherit; cursor: pointer; }
:focus-visible { outline: 2px solid ${C.primary}; outline-offset: 2px; }
::selection { background: ${C.tint}; color: ${C.primaryDeep}; }

@keyframes toastPop {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
@keyframes adFade {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes stampIn {
  0% { opacity: 0; transform: scale(1.6) rotate(-14deg); }
  60% { opacity: 1; transform: scale(0.94) rotate(-8deg); }
  100% { opacity: 1; transform: scale(1) rotate(-8deg); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

/* ---------------------------------------------------------
   사진 압축 유틸
   - Apps Script POST 용량/속도를 위해 업로드 전 브라우저에서
     가로/세로 최대 800px, JPEG 품질 0.75로 리사이즈해요.
--------------------------------------------------------- */
function compressImage(file, maxSize = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------
   작은 장식 컴포넌트 — "핀"과 "테이프"
--------------------------------------------------------- */
function PinDot({ color = C.gold }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top: -7,
        left: "50%",
        transform: "translateX(-50%)",
        width: 13,
        height: 13,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, #FFFFFFaa, ${color})`,
        boxShadow: "0 2px 5px rgba(0,0,0,0.28)",
      }}
    />
  );
}

function TapeStrip({ rotate = -6, left = 18, color = "rgba(232,163,61,0.55)" }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top: -9,
        left,
        width: 44,
        height: 16,
        background: color,
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }}
    />
  );
}

/* ---------------------------------------------------------
   작은 컴포넌트들
--------------------------------------------------------- */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function FriendNote({ quote, author, size = "md" }) {
  const big = size === "lg";
  return (
    <div
      className="relative"
      style={{
        background: C.paper,
        border: `1px solid ${C.border}`,
        borderRadius: 5,
        padding: big ? "26px 26px 22px" : "18px 18px 16px",
        transform: `rotate(${big ? -1.4 : -1}deg)`,
        boxShadow: "0 16px 34px -16px rgba(42,22,32,0.35)",
      }}
    >
      <PinDot />
      <Quote size={big ? 20 : 16} style={{ color: C.gold, marginBottom: 8 }} />
      <p
        style={{
          fontFamily: "'Gowun Batang', serif",
          fontSize: big ? 18 : 15,
          lineHeight: 1.75,
          color: C.ink,
        }}
      >
        {quote}
      </p>
      {author && (
        <p className="mt-3 text-xs font-semibold" style={{ color: C.primary }}>
          — {author}
        </p>
      )}
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 px-5 py-3 text-sm font-medium"
      style={{
        background: C.ink,
        color: C.paper,
        borderRadius: 999,
        animation: "toastPop 0.25s ease",
        transform: "translateX(-50%)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      {message}
    </div>
  );
}

function AdSlot() {
  const ads = [
    {
      tag: "성형외과",
      title: "이번 봄, 자신감 리프팅",
      desc: "무료 상담 예약하고 가볍게 시작해보세요",
      accent: C.primary,
    },
    {
      tag: "피부과",
      title: "칙칙한 피부, 톤업 케어",
      desc: "첫 방문 진단 상담 50% 할인",
      accent: C.gold,
    },
    {
      tag: "헤어·뷰티",
      title: "소개팅 전, 헤어 스타일링",
      desc: "지금 예약하면 5분 무료 상담",
      accent: C.primaryDeep,
    },
  ];
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % ads.length), 1800);
    return () => clearInterval(t);
  }, []);

  const ad = ads[i];

  return (
    <div
      style={{
        position: "relative",
        background: C.paperAlt,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: "18px 20px 16px",
        overflow: "hidden",
      }}
    >
      <div key={i} style={{ animation: "adFade 0.4s ease" }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: ad.accent }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: ad.accent, letterSpacing: 0.3 }}>
            {ad.tag}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontWeight: 600,
              color: C.sub,
              background: "#fff",
              padding: "2px 8px",
              borderRadius: 999,
              border: `1px solid ${C.border}`,
            }}
          >
            광고
          </span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{ad.title}</p>
        <p style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{ad.desc}</p>
      </div>
      <div className="mt-3.5 flex gap-1.5">
        {ads.map((_, idx) => (
          <span
            key={idx}
            style={{
              width: idx === i ? 16 : 5,
              height: 5,
              borderRadius: 999,
              background: idx === i ? ad.accent : "rgba(36,26,28,0.14)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SubmittingLoader({ onDone }) {
  const steps = [
    "신청 내용을 확인하고 있어요",
    "소개해주신 한마디를 검토하고 있어요",
    "신청 접수를 준비하고 있어요",
    "정식 오픈 알림 목록에 등록하고 있어요",
  ];
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (doneCount >= steps.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDoneCount((c) => c + 1), 850);
    return () => clearTimeout(t);
  }, [doneCount]);

  return (
    <div className="py-10 px-1">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div
            className="mx-auto mb-4 animate-spin"
            style={{ width: 34, height: 34, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.primary }}
          />
          <h2 className="font-bold" style={{ fontSize: 18, color: C.ink }}>
            신청을 처리하고 있어요
          </h2>
        </div>
        <div className="space-y-3 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-2.5 text-sm transition duration-300"
              style={{ opacity: i <= doneCount ? 1 : 0.35, color: i < doneCount ? C.ink : C.sub }}
            >
              {i < doneCount ? (
                <Check size={16} style={{ color: C.primary, flexShrink: 0 }} />
              ) : i === doneCount ? (
                <span
                  className="animate-spin"
                  style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.primary, display: "inline-block", flexShrink: 0 }}
                />
              ) : (
                <span
                  style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.border}`, display: "inline-block", flexShrink: 0 }}
                />
              )}
              {s}
            </div>
          ))}
        </div>
        <AdSlot />
      </div>
    </div>
  );
}

function DoneModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(36,26,28,0.55)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm text-center"
        style={{ background: C.paper, borderRadius: 20, padding: "36px 30px" }}
      >
        <div
          className="mx-auto mb-5 flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: `3px solid ${C.primary}`,
            color: C.primary,
            transform: "rotate(-8deg)",
            animation: "stampIn 0.5s ease",
          }}
        >
          <Check size={30} />
        </div>
        <h3 className="font-bold" style={{ fontSize: 20, color: C.ink }}>
          신청 완료!
        </h3>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: C.sub }}>
          신청이 접수됐어요.
          <br />
          정식 오픈 소식은 가장 먼저 알려드릴게요.
        </p>
        <p className="mt-2 text-xs" style={{ color: C.sub }}>
          매칭 수수료는 받지 않을 예정이에요.
        </p>
        <button
          onClick={onClose}
          className="w-full mt-7 py-3.5 font-semibold text-white transition duration-200 hover:brightness-95"
          style={{ background: C.primary, borderRadius: 999 }}
        >
          확인
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   랜딩 섹션들
--------------------------------------------------------- */
function Header({ onApply, onLogoClick }) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(42,22,32,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <button onClick={onLogoClick} className="flex items-center gap-1.5 font-bold text-lg" style={{ color: C.paper }}>
          <Heart size={19} style={{ color: C.primary }} fill={C.primary} />
          내친소
        </button>
        <button
          onClick={onApply}
          className="text-sm font-semibold px-4 py-2 transition duration-200 hover:brightness-95"
          style={{ background: C.primary, color: "#fff", borderRadius: 999 }}
        >
          신청하기
        </button>
      </div>
    </header>
  );
}

function Hero({ onApply }) {
  return (
    <section className="relative overflow-hidden" style={{ background: C.board }}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: C.primary }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 w-80 h-80 rounded-full blur-3xl opacity-10"
        style={{ background: C.gold }}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 relative grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div className="text-center lg:text-left">
          <div
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 mb-6"
            style={{
              background: "rgba(232,163,61,0.16)",
              color: C.gold,
              borderRadius: 999,
              border: "1px solid rgba(232,163,61,0.3)",
            }}
          >
            <ShieldCheck size={14} /> 친구가 보증하는 소개
          </div>
          <h1
            className="font-bold leading-tight tracking-tight"
            style={{ fontSize: "clamp(30px, 5vw, 52px)", color: C.paper }}
          >
            괜찮은 친구를
            <br className="sm:hidden" /> 대신 소개해주세요.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: "rgba(255,251,248,0.62)" }}>
            직접 나를 소개하는 건 어렵지만,
            <br />
            친구를 자랑하는 건 쉽습니다.
          </p>
          <div className="mt-9 flex items-center justify-center lg:justify-start">
            <button
              onClick={onApply}
              className="inline-block px-8 py-3.5 font-semibold text-white transition duration-200 hover:brightness-95 active:scale-95"
              style={{ background: C.primary, borderRadius: 999, boxShadow: "0 14px 26px -10px rgba(225,76,95,0.55)" }}
            >
              지금 신청하기
            </button>
          </div>
        </div>

        <div className="relative mx-auto lg:mx-0" style={{ maxWidth: 300 }}>
          <div className="relative" style={{ transform: "rotate(-4deg)" }}>
            <div
              style={{
                background: C.paper,
                borderRadius: 6,
                padding: "22px 22px 20px",
                boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)",
              }}
            >
              <PinDot color={C.primary} />
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex items-center justify-center font-bold"
                  style={{ width: 40, height: 40, borderRadius: "50%", background: C.tint, color: C.primary }}
                >
                  도
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: C.ink }}>
                    김도윤 · 29
                  </p>
                  <p className="text-xs" style={{ color: C.sub }}>
                    수원시 영통구 · 백엔드 개발자
                  </p>
                </div>
              </div>
              <p style={{ fontFamily: "'Gowun Batang', serif", fontSize: 15, lineHeight: 1.7, color: C.ink }}>
                "배드민턴 치면 세상 다정한 사람. 아직 솔로인 게 미스터리예요."
              </p>
              <p className="mt-2 text-xs font-semibold" style={{ color: C.primary }}>
                — 친구 이서연
              </p>
            </div>
            <TapeStrip rotate={8} left={-6} />
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyCompare() {
  const oldWay = ["내가 나를 소개해야 함", "부담스러움", "과장된 프로필"];
  const newWay = ["친구가 소개", "실제 성격 기반", "신뢰감"];
  return (
    <section className="py-16 sm:py-24" style={{ background: C.paper }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2
            className="text-center font-bold"
            style={{ fontSize: "clamp(22px,3.4vw,32px)", color: C.ink }}
          >
            왜 내친소인가?
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Reveal delay={0.05}>
            <div
              className="h-full p-7"
              style={{ background: C.paperAlt, borderRadius: 5, transform: "rotate(-1.2deg)" }}
            >
              <p className="text-xs font-semibold mb-4" style={{ color: C.sub }}>
                기존 소개팅
              </p>
              <ul className="space-y-3">
                {oldWay.map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: C.sub, textDecoration: "line-through", textDecorationColor: "rgba(138,122,117,0.45)" }}
                  >
                    <X size={16} className="mt-0.5 shrink-0" style={{ color: "#C7BAB4" }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div
              className="relative h-full p-7"
              style={{
                background: C.paper,
                border: `1.5px solid ${C.primary}`,
                borderRadius: 5,
                transform: "rotate(1deg)",
                boxShadow: "0 20px 40px -18px rgba(225,76,95,0.3)",
              }}
            >
              <PinDot />
              <p className="text-xs font-semibold mb-4" style={{ color: C.primary }}>
                내친소
              </p>
              <ul className="space-y-3">
                {newWay.map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-2 text-sm font-medium"
                    style={{ color: C.ink }}
                  >
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color: C.primary }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function StorytellingSection() {
  return (
    <section className="py-16 sm:py-24" style={{ background: C.paperAlt }}>
      <div className="max-w-2xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="text-center font-bold" style={{ fontSize: "clamp(22px,3.4vw,32px)", color: C.ink }}>
            다들 한 번쯤 해본 그 말
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-8 text-center space-y-4" style={{ fontSize: 15, lineHeight: 1.85, color: C.ink }}>
            <p>지난주 동창 모임,<br />또 그 얘기가 나왔어요.</p>
            <p style={{ fontWeight: 700 }}>
              "야, 걔 진짜 성실하고 다정한데
              <br />
              왜 아직도 혼자냐?"
            </p>
            <p>다들 고개를 끄덕였죠.<br />근데 딱 거기까지.</p>
            <p style={{ color: C.sub }}>
              번호를 물어봐도 되는 건지,
              <br />
              괜히 나섰다가 어색해지는 건 아닌지 —
              <br />
              마음은 있어도 아무도 다음 말을 잇지 못했어요.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-8 text-center space-y-3" style={{ fontSize: 15, lineHeight: 1.85, color: C.ink }}>
            <p style={{ color: C.sub }}>이런 말도 어디선가 들어보셨을 거예요.</p>
            <p style={{ fontWeight: 700 }}>
              "아니 잘생기고 예쁜데
              <br />
              왜 여친 남친이 없지? 너 왜 안 사귀냐?"
            </p>
            <p style={{ color: C.sub }}>
              못 사귀는 거야, 안 사귀는 거야?
              <br />
              내가 볼 땐 그냥, 안 사귀는 거 같은데.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10 flex justify-center">
            <FriendNote
              quote="아 진짜 소개해주고 싶은 사람 있는데, 어떻게 말을 꺼내야 하지..."
              author="우리 모두의 마음속에 있던 그 문장"
              size="lg"
            />
          </div>
        </Reveal>

        <Reveal delay={0.32}>
          <p className="mt-10 text-center" style={{ fontSize: 15, color: C.sub, lineHeight: 1.7 }}>
            내 주변엔
            <br />
            나보다 훨씬 멀끔한 친구들이
            <br />
            수두룩합니다.
          </p>
          <p className="mt-5 text-center font-bold" style={{ fontSize: 18, color: C.primary, lineHeight: 1.6 }}>
            내친소는 그 다음 말을 대신해드려요.
            <br />
            <span style={{ color: C.ink }}>친구 번호 하나만 입력하면, 나머지는 저희가 이어드릴게요.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function StepsTimeline() {
  return (
    <section className="py-16 sm:py-24" style={{ background: C.paper }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2
            className="text-center font-bold"
            style={{ fontSize: "clamp(22px,3.4vw,32px)", color: C.ink }}
          >
            신청하면 이렇게 진행돼요
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          <Reveal delay={0.05}>
            <div
              className="h-full p-7 text-center"
              style={{ background: C.paperAlt, border: `1px solid ${C.border}`, borderRadius: 22 }}
            >
              <div
                className="mx-auto mb-4 flex items-center justify-center font-bold text-sm"
                style={{ width: 40, height: 40, borderRadius: "50%", background: C.primary, color: "#fff" }}
              >
                1
              </div>
              <h3 className="font-bold" style={{ color: C.ink, fontSize: 17 }}>
                신청서 작성
              </h3>
              <p className="mt-1.5 text-sm" style={{ color: C.sub }}>
                친구 정보와 소개하는 한마디를 적어서 신청해요.
              </p>
              <div className="mt-5 p-4 text-left" style={{ background: C.tint, border: `1px solid ${C.border}`, borderRadius: 14 }}>
                <p className="text-xs font-bold mb-1.5" style={{ color: C.primary }}>
                  ⚠️ 신청 전 꼭 확인해주세요
                </p>
                <p className="text-xs leading-relaxed" style={{ color: C.primaryDeep }}>
                  이름, 사진, 나이 같은 친구의 개인정보는 반드시 당사자 동의를 받은 후에만 입력할 수 있어요.
                  동의 없이 제3자의 개인정보를 수집·제공하면 개인정보보호법 위반에 해당할 수 있어요.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div
              className="h-full p-7 text-center"
              style={{ background: C.paperAlt, border: `1px solid ${C.border}`, borderRadius: 22 }}
            >
              <div
                className="mx-auto mb-4 flex items-center justify-center font-bold text-sm"
                style={{ width: 40, height: 40, borderRadius: "50%", background: C.primary, color: "#fff" }}
              >
                2
              </div>
              <h3 className="font-bold" style={{ color: C.ink, fontSize: 17 }}>
                접수 완료
              </h3>
              <p className="mt-1.5 text-sm" style={{ color: C.sub }}>
                신청이 접수돼요. 정식 오픈하면 가장 먼저 연락드려요.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   신청 섹션 (커스텀 폼 + Apps Script → 구글시트 + 드라이브)
--------------------------------------------------------- */
function SectionHeader({ title, subtitle }) {
  return (
    <div>
      <p className="text-sm font-bold" style={{ color: C.ink }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-xs mt-0.5" style={{ color: C.sub }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function SectionCard({ children }) {
  return (
    <div
      className="space-y-4 p-6 sm:p-7"
      style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 22 }}
    >
      {children}
    </div>
  );
}

function ApplySection({ onBack }) {
  const [form, setForm] = useState({
    myName: "",
    myPhone: "",
    friendName: "",
    friendGender: "",
    friendAge: "",
    friendRegion: "",
    friendJob: "",
    friendHeight: "",
    friendPhone: "",
    friendQuote: "",
    friendHobbies: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // 사진 업로드 관련 상태
  const [photoPreview, setPhotoPreview] = useState(null); // data URL (미리보기 + 전송용)
  const [photoError, setPhotoError] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 필수 동의 체크
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [consentError, setConsentError] = useState("");

  // 같은 요청이 진행 중일 때 재클릭으로 중복 전송되는 걸 막는 락
  const submitLockRef = useRef(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // 010-0000-0000 형태로 자동으로 하이픈을 넣어주는 포맷터
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length < 4) return digits;
    if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };
  const updatePhone = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: formatPhoneNumber(e.target.value) }));
  };

  // 이름 칸에는 숫자를 입력할 수 없도록 걸러줘요
  const updateNameOnly = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value.replace(/[0-9]/g, "") }));
  };

  // 숫자만 입력할 수 있게 걸러줘요 (키, 나이)
  const updateNumericOnly = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value.replace(/[^0-9]/g, "") }));
  };

  const validate = () => {
    const e = {};
    if (!form.myName.trim()) e.myName = "이름을 입력해주세요";
    if (!form.myPhone.trim()) e.myPhone = "연락처를 입력해주세요";
    if (!form.friendName.trim()) e.friendName = "친구 이름을 입력해주세요";
    if (!form.friendGender) e.friendGender = "친구 성별을 선택해주세요";
    if (!form.friendAge.trim()) e.friendAge = "나이를 입력해주세요";
    if (!form.friendRegion.trim()) e.friendRegion = "활동/거주지역을 입력해주세요";
    if (!form.friendJob.trim()) e.friendJob = "직업을 입력해주세요";
    if (!form.friendHeight.trim()) e.friendHeight = "키를 입력해주세요";
    if (!form.friendPhone.trim()) e.friendPhone = "친구 연락처를 입력해주세요";
    if (!form.friendQuote.trim()) e.friendQuote = "친구를 소개하는 한마디를 입력해주세요";
    if (!form.friendHobbies.trim()) e.friendHobbies = "취미/관심사를 입력해주세요";
    setErrors(e);

    let photoOk = true;
    if (!photoPreview) {
      setPhotoError("친구 사진을 첨부해주세요");
      photoOk = false;
    }

    let consentOk = true;
    if (!consentAgreed) {
      setConsentError("동의해야 신청이 가능해요");
      consentOk = false;
    } else {
      setConsentError("");
    }

    return Object.keys(e).length === 0 && photoOk && consentOk;
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 onChange가 또 발생하도록 초기화
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("이미지 파일만 업로드할 수 있어요");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setPhotoError("15MB 이하의 사진만 업로드할 수 있어요");
      return;
    }

    setPhotoLoading(true);
    setPhotoError("");
    try {
      const dataUrl = await compressImage(file);
      setPhotoPreview(dataUrl);
    } catch {
      setPhotoError("사진을 불러오지 못했어요. 다시 시도해주세요");
    } finally {
      setPhotoLoading(false);
    }
  };

  const removePhoto = () => setPhotoPreview(null);

  const toggleConsent = () => {
    setConsentAgreed((v) => {
      const next = !v;
      if (next) setConsentError("");
      return next;
    });
  };

  const handleFormSubmit = async (ev) => {
    ev.preventDefault();
    if (submitLockRef.current) return; // 이미 처리 중이면 무시
    if (!validate()) return;

    // 버튼을 다시 누를 수 없도록 폼을 즉시 숨기고(=버튼이 DOM에서 사라짐) 락을 건다.
    submitLockRef.current = true;
    setSubmitting(true);

    const payload = {
      myName: form.myName,
      myPhone: form.myPhone,
      friendName: form.friendName,
      friendGender: form.friendGender,
      friendAge: form.friendAge,
      friendRegion: form.friendRegion,
      friendJob: form.friendJob,
      friendHeight: form.friendHeight,
      friendPhone: form.friendPhone,
      friendQuote: form.friendQuote,
      friendHobbies: form.friendHobbies,
      submittedAt: new Date().toISOString(),
    };
    if (photoPreview) {
      const [, base64Data] = photoPreview.split(",");
      payload.photoBase64 = base64Data;
      payload.photoMimeType = "image/jpeg";
    }

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // no-cors라 응답은 못 읽지만, 요청 자체는 시트로 정상 전달돼요
    }
  };

  const handleFinalize = () => {
    setSubmitting(false);
    setDone(true);
    submitLockRef.current = false; // 다음 친구를 새로 신청할 수 있도록 락 해제
    setForm({
      myName: "",
      myPhone: "",
      friendName: "",
      friendGender: "",
      friendAge: "",
      friendRegion: "",
      friendJob: "",
      friendHeight: "",
      friendPhone: "",
      friendQuote: "",
      friendHobbies: "",
    });
    setPhotoPreview(null);
    setConsentAgreed(false);
  };

  return (
    <section className="py-10 sm:py-16" style={{ background: C.paperAlt, minHeight: "100vh" }}>
      <div className="max-w-xl mx-auto px-5 sm:px-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
          style={{ color: C.sub }}
        >
          ← 처음으로
        </button>

        <div className="text-center mb-8">
          <h2 className="font-bold" style={{ fontSize: "clamp(22px,3.4vw,32px)", color: C.ink }}>
            내 친구를 소개합니다
          </h2>
          <p className="mt-2 text-sm" style={{ color: C.sub }}>
            친구 정보를 적어주시면, 인증을 거쳐 신청이 접수돼요.
          </p>
        </div>

        {submitting ? (
          <SubmittingLoader onDone={handleFinalize} />
        ) : (
          <Reveal delay={0.08}>
            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* 작성자(나) 정보 */}
              <SectionCard>
                <SectionHeader title="작성자(나) 정보" subtitle="신청해주시는 본인 정보를 입력해주세요." />

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                    이름
                  </label>
                  <input
                    className="ncs-input"
                    value={form.myName}
                    onChange={updateNameOnly("myName")}
                    placeholder="예: 이서연"
                    style={inputStyle}
                  />
                  {errors.myName && (
                    <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                      {errors.myName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                    연락처 (010-0000-0000 형식)
                  </label>
                  <input
                    className="ncs-input"
                    value={form.myPhone}
                    onChange={updatePhone("myPhone")}
                    placeholder="010-0000-0000"
                    inputMode="tel"
                    maxLength={13}
                    style={inputStyle}
                  />
                  {errors.myPhone && (
                    <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                      {errors.myPhone}
                    </p>
                  )}
                </div>
              </SectionCard>

              {/* 소개해줄 친구 기본 정보 */}
              <SectionCard>
                <SectionHeader title="소개해줄 친구 기본 정보" />

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                    친구 이름
                  </label>
                  <input
                    className="ncs-input"
                    value={form.friendName}
                    onChange={updateNameOnly("friendName")}
                    placeholder="예: 김도윤"
                    style={inputStyle}
                  />
                  {errors.friendName && (
                    <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                      {errors.friendName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                    친구 성별
                  </label>
                  <div className="flex gap-2">
                    {["남", "여"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, friendGender: g }))}
                        className="flex-1 py-2.5 text-sm font-semibold transition duration-200"
                        style={{
                          borderRadius: 999,
                          border: `1.5px solid ${form.friendGender === g ? C.primary : C.border}`,
                          background: form.friendGender === g ? C.tint : "#fff",
                          color: form.friendGender === g ? C.primary : C.sub,
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {errors.friendGender && (
                    <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                      {errors.friendGender}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                      나이
                    </label>
                    <input
                      className="ncs-input"
                      value={form.friendAge}
                      onChange={updateNumericOnly("friendAge")}
                      placeholder="29"
                      inputMode="numeric"
                      maxLength={3}
                      style={inputStyle}
                    />
                    {errors.friendAge && (
                      <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                        {errors.friendAge}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                      키
                    </label>
                    <input
                      className="ncs-input"
                      value={form.friendHeight}
                      onChange={updateNumericOnly("friendHeight")}
                      placeholder="175"
                      inputMode="numeric"
                      maxLength={3}
                      style={inputStyle}
                    />
                    {errors.friendHeight && (
                      <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                        {errors.friendHeight}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                    활동/거주지역
                  </label>
                  <input
                    className="ncs-input"
                    value={form.friendRegion}
                    onChange={update("friendRegion")}
                    placeholder="예: 수원시 영통구, 서울 강남구 등"
                    style={inputStyle}
                  />
                  {errors.friendRegion && (
                    <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                      {errors.friendRegion}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                    직업
                  </label>
                  <input
                    className="ncs-input"
                    value={form.friendJob}
                    onChange={update("friendJob")}
                    placeholder="예: 백엔드 개발자, 초등학교 교사, 마케터"
                    style={inputStyle}
                  />
                  {errors.friendJob && (
                    <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                      {errors.friendJob}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                    친구 연락처 (010-0000-0000 형식)
                  </label>
                  <input
                    className="ncs-input"
                    value={form.friendPhone}
                    onChange={updatePhone("friendPhone")}
                    placeholder="010-0000-0000"
                    inputMode="tel"
                    maxLength={13}
                    style={inputStyle}
                  />
                  {errors.friendPhone && (
                    <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                      {errors.friendPhone}
                    </p>
                  )}
                </div>
              </SectionCard>

              {/* 친구 추천사 & 매력 */}
              <SectionCard>
                <SectionHeader title="친구 추천사 & 매력" />

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                    친구가 보증하는 한 줄 소개
                  </label>
                  <textarea
                    className="ncs-input"
                    value={form.friendQuote}
                    onChange={update("friendQuote")}
                    rows={3}
                    maxLength={40}
                    placeholder="예: 주말엔 배드민턴 치고 평일엔 코드랑 씨름하는 개발자예요"
                    style={{ ...inputStyle, resize: "none" }}
                  />
                  <p className="text-xs mt-1 text-right" style={{ color: C.sub }}>
                    {form.friendQuote.length}/40
                  </p>
                  {errors.friendQuote && (
                    <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                      {errors.friendQuote}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: C.ink }}>
                    주요 취미/관심사
                  </label>
                  <input
                    className="ncs-input"
                    value={form.friendHobbies}
                    onChange={update("friendHobbies")}
                    placeholder="예: 배드민턴, 카페 탐방, 드라이브"
                    style={inputStyle}
                  />
                  {errors.friendHobbies && (
                    <p className="text-xs mt-1.5" style={{ color: C.primary }}>
                      {errors.friendHobbies}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center transition duration-200 hover:brightness-95"
                    style={{
                      width: 128,
                      height: 152,
                      borderRadius: 6,
                      background: photoPreview ? C.paper : C.paperAlt,
                      border: `2px dashed ${photoPreview ? "transparent" : C.border}`,
                      padding: photoPreview ? 9 : 0,
                      boxShadow: photoPreview ? "0 16px 30px -16px rgba(42,22,32,0.4)" : "none",
                    }}
                  >
                    {photoPreview ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundImage: `url(${photoPreview})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          borderRadius: 2,
                        }}
                      />
                    ) : (
                      <>
                        <Camera size={22} style={{ color: photoLoading ? "#F3C6CC" : C.primary }} />
                        <span className="mt-1.5 font-medium" style={{ fontSize: 11, color: C.sub }}>
                          사진 첨부
                        </span>
                      </>
                    )}
                    {photoPreview && (
                      <span
                        className="absolute flex items-center justify-center"
                        style={{
                          bottom: -6,
                          right: -6,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: C.primary,
                          border: "2px solid #fff",
                        }}
                      >
                        <Camera size={13} style={{ color: "#fff" }} />
                      </span>
                    )}
                  </button>
                  <p className="mt-2 text-sm font-semibold" style={{ color: C.ink }}>
                    친구 대표 사진
                  </p>
                  <p className="text-xs mt-0.5 text-center" style={{ color: C.sub }}>
                    {photoLoading ? "사진 처리 중..." : "얼굴이 잘 나온 인스타 감성 사진으로 올려주세요"}
                  </p>
                  {photoPreview && !photoLoading && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="mt-1 text-xs font-medium"
                      style={{ color: C.primary }}
                    >
                      사진 지우기
                    </button>
                  )}
                  {photoError && (
                    <p className="mt-1 text-xs" style={{ color: C.primary }}>
                      {photoError}
                    </p>
                  )}
                </div>
              </SectionCard>

              {/* 개인정보 안내 + 필수 동의 */}
              <div className="space-y-3">
                <div className="p-4" style={{ background: C.tint, border: `1px solid ${C.border}`, borderRadius: 14 }}>
                  <p className="text-xs font-bold mb-1.5" style={{ color: C.primary }}>
                    ⚠️ 친구 개인정보 관련 안내
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: C.primaryDeep }}>
                    이름, 사진, 나이, 연락처 같은 친구의 개인정보는 반드시 당사자 동의를 받은 후에만
                    입력할 수 있어요. 동의 없이 제3자의 개인정보를 수집·제공하면 개인정보보호법 위반에
                    해당할 수 있어요.
                  </p>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer px-1">
                  <input
                    type="checkbox"
                    checked={consentAgreed}
                    onChange={toggleConsent}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: C.primary, flexShrink: 0 }}
                  />
                  <span className="text-sm leading-relaxed" style={{ color: C.ink }}>
                    소개해주는 친구에게 미리 '내친소' 등록 사실을 안내했고, 친구 동의를 받았음을
                    확인합니다. <span style={{ color: C.primary, fontWeight: 700 }}>(필수)</span>
                  </span>
                </label>
                {consentError && (
                  <p className="text-xs px-1" style={{ color: C.primary }}>
                    {consentError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={photoLoading}
                className="w-full py-3.5 font-semibold text-white transition duration-200 hover:brightness-95 active:scale-95"
                style={{
                  background: C.primary,
                  borderRadius: 999,
                  opacity: photoLoading ? 0.6 : 1,
                  cursor: photoLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 14px 26px -10px rgba(225,76,95,0.4)",
                }}
              >
                신청하기
              </button>
            </form>
          </Reveal>
        )}
      </div>

      {done && (
        <DoneModal
          onClose={() => {
            setDone(false);
            onBack(); // 확인을 누르면 메인 페이지로 이동
          }}
        />
      )}
    </section>
  );
}

function ClosingCTA({ onApply }) {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20" style={{ background: C.board }}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <Reveal>
        <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center relative">
          <h2 className="font-bold" style={{ fontSize: "clamp(20px,3vw,28px)", color: C.paper }}>
            내 친구, 나만 알기 아깝잖아요
          </h2>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,251,248,0.6)" }}>
            지금 신청해보세요. 1분이면 충분해요.
          </p>
          <button
            onClick={onApply}
            className="mt-8 inline-block px-8 py-3.5 font-semibold transition duration-200 hover:brightness-95 active:scale-95"
            style={{
              background: C.primary,
              color: "#fff",
              borderRadius: 999,
              boxShadow: "0 14px 26px -10px rgba(225,76,95,0.5)",
            }}
          >
            지금 신청하기
          </button>
        </div>
      </Reveal>
    </section>
  );
}

function FooterSection({ onNotice }) {
  return (
    <footer className="py-10" style={{ background: C.board, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div
        className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
        style={{ color: "rgba(255,251,248,0.55)" }}
      >
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: C.paper }}>
          <Heart size={14} fill={C.primary} style={{ color: C.primary }} /> 내친소
        </div>
        <div className="flex items-center gap-5">
          <button className="hover:underline" onClick={() => onNotice("문의 페이지는 준비 중이에요.")}>
            문의
          </button>
          <button
            className="hover:underline"
            onClick={() => onNotice("개인정보처리방침 페이지는 준비 중이에요.")}
          >
            개인정보처리방침
          </button>
          <button className="hover:underline" onClick={() => onNotice("이용약관 페이지는 준비 중이에요.")}>
            이용약관
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------
   App
--------------------------------------------------------- */
export default function App() {
  const [view, setView] = useState("landing");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const goApply = () => setView("apply");
  const goLanding = () => setView("landing");

  return (
    <div style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", color: C.ink, background: C.paper }}>
      <style>{GLOBAL_CSS}</style>
      <Header onApply={goApply} onLogoClick={goLanding} />

      {view === "landing" && (
        <>
          <Hero onApply={goApply} />
          <WhyCompare />
          <StorytellingSection />
          <StepsTimeline />
          <ClosingCTA onApply={goApply} />
          <FooterSection onNotice={showToast} />
        </>
      )}

      {view === "apply" && <ApplySection onBack={goLanding} />}

      <Toast message={toast} />
    </div>
  );
}