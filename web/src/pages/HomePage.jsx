import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 overflow-hidden bg-[#051a33]">
      {/* Aurora + grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_50%,rgba(14,165,233,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_80%,rgba(99,102,241,0.1),transparent_45%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute -top-24 -left-16 w-[28rem] h-[28rem] rounded-full bg-sky-400/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-10 w-[32rem] h-[32rem] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/20 mb-6">
            <span className="text-5xl leading-none drop-shadow-lg" aria-hidden>
              🚕
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-sm">
            연타
          </h1>
          <p className="text-sky-200/95 text-sm font-semibold tracking-[0.25em] uppercase">
            연세 타요
          </p>
        </div>

        <div className="rounded-3xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-8 shadow-2xl shadow-black/25 mb-10">
          <p className="text-white/90 text-[15px] leading-relaxed text-balance font-medium">
            연세대 미래캠퍼스 학생 전용
            <br />
            <span className="text-sky-100/90">택시 합승 플랫폼</span>
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-sky-200/80">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">빠른 매칭</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">익명 참여</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">캠퍼스 인증</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/auth"
            className="block w-full py-4 rounded-2xl bg-white text-[#0a2744] text-lg font-bold shadow-xl shadow-black/25 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ring-1 ring-white/20"
          >
            시작하기
          </Link>
          <Link
            to="/rides"
            className="block w-full py-4 rounded-2xl bg-white/5 backdrop-blur-sm text-white text-lg font-semibold border border-white/20 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            합승 둘러보기
          </Link>
        </div>

        <p className="mt-14 text-sky-300/45 text-xs font-medium tracking-wide">
          같이 타면 반값! 🚕
        </p>
      </div>
    </div>
  );
}
