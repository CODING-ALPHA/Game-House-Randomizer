// app/result/page.tsx
import { Suspense } from "react";
import ResultContent from "./ResultContent";

export default function ResultPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B]">
        <div className="bg-white/95 border-4 border-[#D4AF37] rounded-3xl p-8 shadow-2xl text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-950 font-bold text-lg">Revealing Your Royal Tribe...</p>
        </div>
      </main>
    }>
      <ResultContent />
    </Suspense>
  );
}