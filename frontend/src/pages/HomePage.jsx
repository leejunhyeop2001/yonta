import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003876] via-[#004a9e] to-[#0062B8] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-md mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-7xl block mb-4">🚕</span>
          <h1 className="text-6xl font-black text-white tracking-tight mb-3">
            연타
          </h1>
          <p className="text-blue-200 text-lg font-medium tracking-wide">
            연세 타요
          </p>
        </div>

        {/* Tagline */}
        <p className="text-white/80 text-base mb-12 leading-relaxed">
          연세대 미래캠퍼스 학생 전용<br />
          택시 합승 플랫폼
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            to="/auth"
            className="block w-full py-4 rounded-2xl bg-white text-[#003876] text-lg font-bold shadow-xl shadow-black/20 hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            시작하기
          </Link>
          <Link
            to="/rides"
            className="block w-full py-4 rounded-2xl bg-white/10 backdrop-blur-sm text-white text-lg font-semibold border border-white/20 hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            합승 둘러보기
          </Link>
        </div>

        {/* Footer tagline */}
        <p className="mt-16 text-blue-300/50 text-xs font-medium">
          같이 타면 반값! 🚕
        </p>
      </div>
    </div>
  );
}
