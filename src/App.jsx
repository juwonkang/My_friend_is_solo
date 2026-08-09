import React, { useState, useEffect, useRef } from "react";
import { Heart, Check, X, ShieldCheck, Quote } from "lucide-react";

/* ---------------------------------------------------------
   디자인 토큰
--------------------------------------------------------- */
const C = {
  primary: "#FF5A5F",
  primaryDark: "#E14449",
  tint: "#FFF4F4",
  bg: "#FFFFFF",
  surface: "#FAFAFA",
  text: "#222222",
  sub: "#666666",
  border: "#ECECEC",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  color: C.text,
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  outline: "none",
};

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfgDiBO2JF_sGQ-DZndx8Wn14FogCackAht8MAocC3N3h1WWQ/viewform";
const GOOGLE_FORM_EMBED_URL = `${GOOGLE_FORM_URL}?embedded=true`;

const GLOBAL_CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap');

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
.ncs-input:focus { border-color: ${C.primary} !important; box-shadow: 0 0 0 3px ${C.tint}; }
button { font-family: inherit; }
::selection { background: ${C.tint}; color: ${C.primaryDark}; }
@keyframes toastPop {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
@keyframes adFade {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

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
      style={{
        background: C.tint,
        border: "1px solid #FFE1E2",
        borderRadius: 18,
        padding: big ? "22px 24px" : "16px 18px",
        transform: "rotate(-0.6deg)",
      }}
    >
      <Quote size={big ? 20 : 16} style={{ color: "#FFB3B5", marginBottom: 6 }} />
      <p
        style={{
          fontFamily: "'Gowun Batang', serif",
          fontSize: big ? 17 : 14,
          lineHeight: 1.7,
          color: "#4A3435",
        }}
      >
        {quote}
      </p>
      {author && (
        <p className="mt-2 text-xs font-medium" style={{ color: C.primary }}>
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
      className="fixed bottom-6 left-1/2 z-50 px-5 py-3 text-sm font-medium text-white"
      style={{
        background: C.text,
        borderRadius: 999,
        animation: "toastPop 0.25s ease",
        transform: "translateX(-50%)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
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
      bg: "#FFE1EC",
      accent: "#FF5A8A",
    },
    {
      tag: "피부과",
      title: "칙칙한 피부, 톤업 케어",
      desc: "첫 방문 진단 상담 50% 할인",
      bg: "#DCEEFF",
      accent: "#3E8EF7",
    },
    {
      tag: "헤어·뷰티",
      title: "소개팅 전, 헤어 스타일링",
      desc: "지금 예약하면 5분 무료 상담",
      bg: "#EAE2FF",
      accent: "#8B6CFF",
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
        background: ad.bg,
        borderRadius: 20,
        padding: "20px 20px 16px",
        overflow: "hidden",
        transition: "background 0.4s ease",
      }}
    >
      <div key={i} style={{ animation: "adFade 0.4s ease" }}>
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(0,0,0,0.4)",
            background: "rgba(255,255,255,0.65)",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          광고
        </span>
        <p style={{ fontSize: 11, fontWeight: 700, color: ad.accent, marginBottom: 6 }}>{ad.tag}</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#2B2B2B" }}>{ad.title}</p>
        <p style={{ fontSize: 12, color: "#5b5b5b", marginTop: 4 }}>{ad.desc}</p>
      </div>
      <div className="mt-3.5 flex gap-1.5">
        {ads.map((_, idx) => (
          <span
            key={idx}
            style={{
              width: idx === i ? 16 : 5,
              height: 5,
              borderRadius: 999,
              background: idx === i ? ad.accent : "rgba(0,0,0,0.15)",
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
    "친구에게 보낸 인증 링크를 확인하고 있어요",
    "제출해주신 소개글을 검토하고 있어요",
    "사진을 확인하고 있어요",
    "신청 접수를 준비하고 있어요",
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
          <h2 className="font-bold" style={{ fontSize: 18, color: C.text }}>
            신청을 처리하고 있어요
          </h2>
        </div>
        <div className="space-y-3 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-2.5 text-sm transition duration-300"
              style={{ opacity: i <= doneCount ? 1 : 0.35, color: i < doneCount ? C.text : C.sub }}
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

function FriendShareModal({ onClose, onDone }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);

  const shareUrl = `https://naechinso.app/verify/${Math.random().toString(36).slice(2, 9)}`;

  const handleShare = async () => {
    if (phone.replace(/\D/g, "").length < 10) {
      setError("친구 번호를 정확히 입력해주세요");
      return;
    }
    setError("");
    setSharing(true);

    const shareData = {
      title: "내친소 친구 인증 요청",
      text: "네가 소개됐어! 확인하고 동의해줘 💌",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      // 공유 취소해도 신청 절차는 계속 진행
    }

    setTimeout(onDone, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white p-7" style={{ borderRadius: 24 }}>
        <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: C.text }}>
          <ShieldCheck size={18} style={{ color: C.primary }} /> 친구 인증 요청
        </div>
        <p className="text-sm mb-6" style={{ color: C.sub }}>
          친구 번호를 입력하고 인증 링크를 공유해주세요. 친구가 확인하고 동의해야 신청이 완료돼요.
        </p>

        <div className="space-y-2">
          <input
            className="ncs-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="친구 번호 (010-0000-0000)"
            style={inputStyle}
          />
          {error && (
            <p className="text-xs" style={{ color: C.primary }}>
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-full mt-5 py-3.5 font-semibold text-white transition duration-200 hover:brightness-95 active:scale-95"
          style={{ background: C.primary, borderRadius: 999 }}
        >
          {sharing ? "공유 중..." : "인증 링크 공유하기"}
        </button>
        <button onClick={onClose} className="w-full mt-3 text-sm font-medium" style={{ color: C.sub }}>
          취소
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
      className="sticky top-0 z-40 bg-white border-b"
      style={{ borderColor: C.border, boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <button onClick={onLogoClick} className="flex items-center gap-1.5 font-bold text-lg" style={{ color: C.text }}>
          <Heart size={20} style={{ color: C.primary }} fill={C.primary} />
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
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center relative">
        <div
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 mb-6"
          style={{ background: C.tint, color: C.primary, borderRadius: 999 }}
        >
          <ShieldCheck size={14} /> 친구가 보증하는 소개
        </div>
        <h1
          className="font-bold leading-tight tracking-tight"
          style={{ fontSize: "clamp(28px, 5vw, 48px)", color: C.text }}
        >
          괜찮은 친구를
          <br className="sm:hidden" /> 대신 소개해주세요.
        </h1>
        <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: C.sub }}>
          직접 나를 소개하는 건 어렵지만,
          <br />
          친구를 자랑하는 건 쉽습니다.
        </p>
        <div className="mt-9 flex items-center justify-center">
          <button
            onClick={onApply}
            className="inline-block px-8 py-3.5 font-semibold text-white transition duration-200 hover:brightness-95 active:scale-95"
            style={{ background: C.primary, borderRadius: 999 }}
          >
            지금 신청하기
          </button>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: C.primary }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-10"
        style={{ background: C.primary }}
      />
    </section>
  );
}

function WhyCompare() {
  const oldWay = ["내가 나를 소개해야 함", "부담스러움", "과장된 프로필"];
  const newWay = ["친구가 소개", "실제 성격 기반", "신뢰감"];
  return (
    <section className="py-16 sm:py-24" style={{ background: C.surface }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2
            className="text-center font-bold"
            style={{ fontSize: "clamp(22px,3.4vw,32px)", color: C.text }}
          >
            왜 내친소인가?
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <Reveal delay={0.05}>
            <div
              className="h-full p-7"
              style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 22 }}
            >
              <p className="text-xs font-semibold mb-4" style={{ color: C.sub }}>
                기존 소개팅
              </p>
              <ul className="space-y-3">
                {oldWay.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm" style={{ color: C.sub }}>
                    <X size={16} className="mt-0.5 shrink-0" style={{ color: "#C7C7C7" }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div
              className="h-full p-7"
              style={{ background: C.tint, border: "1px solid #FFD9DA", borderRadius: 22 }}
            >
              <p className="text-xs font-semibold mb-4" style={{ color: C.primary }}>
                내친소
              </p>
              <ul className="space-y-3">
                {newWay.map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-2 text-sm font-medium"
                    style={{ color: C.text }}
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
    <section className="py-16 sm:py-24">
      <div className="max-w-2xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="text-center font-bold" style={{ fontSize: "clamp(22px,3.4vw,32px)", color: C.text }}>
            다들 한 번쯤 해본 그 말
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-8 text-center space-y-4" style={{ fontSize: 15, lineHeight: 1.85, color: C.text }}>
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
          <div className="mt-8 text-center space-y-3" style={{ fontSize: 15, lineHeight: 1.85, color: C.text }}>
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
          <div className="mt-8 flex justify-center">
            <FriendNote
              quote="아 진짜 소개해주고 싶은 사람 있는데, 어떻게 말을 꺼내야 하지..."
              author="우리 모두의 마음속에 있던 그 문장"
              size="lg"
            />
          </div>
        </Reveal>

        <Reveal delay={0.32}>
          <p className="mt-9 text-center" style={{ fontSize: 15, color: C.sub, lineHeight: 1.7 }}>
            내 주변엔
            <br />
            나보다 훨씬 멀끔한 친구들이
            <br />
            수두룩합니다.
          </p>
          <p className="mt-5 text-center font-bold" style={{ fontSize: 18, color: C.primary, lineHeight: 1.6 }}>
            내친소는 그 다음 말을 대신해드려요.
            <br />
            <span style={{ color: C.text }}>친구 번호 하나만 입력하면, 나머지는 저희가 이어드릴게요.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function StepsTimeline() {
  return (
    <section className="py-16 sm:py-24" style={{ background: C.surface }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2
            className="text-center font-bold"
            style={{ fontSize: "clamp(22px,3.4vw,32px)", color: C.text }}
          >
            신청하면 이렇게 진행돼요
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          <Reveal delay={0.05}>
            <div
              className="h-full p-7 text-center"
              style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 22 }}
            >
              <div
                className="mx-auto mb-4 flex items-center justify-center font-bold text-sm"
                style={{ width: 40, height: 40, borderRadius: "50%", background: C.primary, color: "#fff" }}
              >
                1
              </div>
              <h3 className="font-bold" style={{ color: C.text, fontSize: 17 }}>
                신청서 작성
              </h3>
              <p className="mt-1.5 text-sm" style={{ color: C.sub }}>
                친구 정보와 소개하는 한마디를 적어서 신청해요.
              </p>
              <div className="mt-5 p-4 text-left" style={{ background: C.tint, border: "1px solid #FFD9DA", borderRadius: 14 }}>
                <p className="text-xs font-bold mb-1.5" style={{ color: C.primary }}>
                  ⚠️ 신청 전 꼭 확인해주세요
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#8a4b4d" }}>
                  이름, 사진, 나이 같은 친구의 개인정보는 반드시 당사자 동의를 받은 후에만 입력할 수 있어요.
                  동의 없이 제3자의 개인정보를 수집·제공하면 개인정보보호법 위반에 해당할 수 있어요.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div
              className="h-full p-7 text-center"
              style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 22 }}
            >
              <div
                className="mx-auto mb-4 flex items-center justify-center font-bold text-sm"
                style={{ width: 40, height: 40, borderRadius: "50%", background: C.primary, color: "#fff" }}
              >
                2
              </div>
              <h3 className="font-bold" style={{ color: C.text, fontSize: 17 }}>
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

function StepsTimeline() {
  const steps = [
    { title: "신청서 작성", desc: "친구 정보와 소개하는 한마디를 적어서 신청해요." },
    { title: "친구 인증", desc: "친구에게 인증 링크를 보내고, 친구가 확인하고 동의해요." },
    { title: "접수 완료", desc: "신청이 접수돼요. 정식 오픈하면 가장 먼저 연락드려요." },
  ];
  return (
    <section className="py-16 sm:py-24" style={{ background: C.surface }}>
      <div className="max-w-2xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2
            className="text-center font-bold"
            style={{ fontSize: "clamp(22px,3.4vw,32px)", color: C.text }}
          >
            신청하면 이렇게 진행돼요
          </h2>
        </Reveal>
        <div className="mt-12 relative">
          <div className="absolute top-2 bottom-2 w-px" style={{ left: 19, background: C.border }} />
          <div className="space-y-9">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <div className="relative pl-14">
                  <div
                    className="absolute top-0 left-0 flex items-center justify-center font-bold text-sm"
                    style={{ width: 40, height: 40, borderRadius: "50%", background: C.primary, color: "#fff" }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-bold" style={{ color: C.text, fontSize: 16 }}>
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: C.sub }}>
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   신청 섹션 (구글 폼 임베드 + 친구 인증 팝업)
--------------------------------------------------------- */
function ApplySection({ onBack }) {
  const [showShare, setShowShare] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleShareDone = () => {
    setShowShare(false);
    setSubmitting(true);
  };

  const handleFinalize = () => {
    setSubmitting(false);
    setDone(true);
  };

  return (
    <section className="py-10 sm:py-16" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="max-w-xl mx-auto px-5 sm:px-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
          style={{ color: C.sub }}
        >
          ← 처음으로
        </button>

        <div className="text-center mb-8">
          <h2 className="font-bold" style={{ fontSize: "clamp(22px,3.4vw,32px)", color: C.text }}>
            지금 신청해보세요
          </h2>
          <p className="mt-2 text-sm" style={{ color: C.sub }}>
            친구 정보를 적어주시면, 인증을 거쳐 신청이 접수돼요.
          </p>
        </div>

        {submitting ? (
          <SubmittingLoader onDone={handleFinalize} />
        ) : done ? (
          <Reveal>
            <div className="text-center py-10">
              <div
                className="mx-auto mb-6 flex items-center justify-center"
                style={{ width: 64, height: 64, borderRadius: "50%", background: C.tint }}
              >
                <Check size={28} style={{ color: C.primary }} />
              </div>
              <h3 className="font-bold" style={{ fontSize: 20, color: C.text }}>
                신청 완료!
              </h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: C.sub }}>
                친구에게 인증 링크를 보냈어요.
                <br />
                친구가 확인하고 동의하면 신청이 정식으로 접수돼요.
              </p>
              <p className="mt-2 text-xs" style={{ color: C.sub }}>
                정식 오픈 소식은 가장 먼저 알려드릴게요. 매칭 수수료도 받지 않을 예정이에요.
              </p>
              <button
                onClick={() => setDone(false)}
                className="mt-8 px-6 py-3 font-semibold text-white transition duration-200 hover:brightness-95"
                style={{ background: C.primary, borderRadius: 999 }}
              >
                다른 친구도 신청하기
              </button>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.08}>
            <div>
              <div className="mt-2">
                <iframe
                  src={GOOGLE_FORM_EMBED_URL}
                  title="내친소 친구 소개 폼"
                  scrolling="no"
                  style={{ width: "100%", height: 1600, border: "none", display: "block", borderRadius: 20 }}
                >
                  로드 중...
                </iframe>
              </div>

              <p className="mt-3 text-xs text-center" style={{ color: C.sub }}>
                폼이 안 보이면{" "}
                <a
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.primary, fontWeight: 600, textDecoration: "underline" }}
                >
                  새 창에서 작성하기
                </a>
              </p>

              <button
                onClick={() => setShowShare(true)}
                className="w-full mt-6 py-3.5 font-semibold text-white transition duration-200 hover:brightness-95 active:scale-95"
                style={{ background: C.primary, borderRadius: 999 }}
              >
                신청하기
              </button>
            </div>
          </Reveal>
        )}
      </div>

      {showShare && <FriendShareModal onClose={() => setShowShare(false)} onDone={handleShareDone} />}
    </section>
  );
}

function ClosingCTA({ onApply }) {
  return (
    <section className="py-16 sm:py-20">
      <Reveal>
        <div
          className="max-w-2xl mx-auto px-5 sm:px-8 text-center py-12 sm:py-16"
          style={{ background: C.text, borderRadius: 28 }}
        >
          <h2 className="font-bold text-white" style={{ fontSize: "clamp(20px,3vw,28px)" }}>
            내 친구, 나만 알기 아깝잖아요
          </h2>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            지금 신청해보세요. 1분이면 충분해요.
          </p>
          <button
            onClick={onApply}
            className="mt-7 inline-block px-8 py-3.5 font-semibold transition duration-200 hover:brightness-95 active:scale-95"
            style={{ background: C.primary, color: "#fff", borderRadius: 999 }}
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
    <footer className="py-10 border-t" style={{ borderColor: C.border }}>
      <div
        className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
        style={{ color: C.sub }}
      >
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: C.text }}>
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
    <div style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", color: C.text, background: C.bg }}>
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
