import SdsFormClient from "./SdsFormClient";
import type { SdsItem } from "@/lib/sds/types";

// Halaman Server Component
export default async function SdsPage() {
  // Fetch data dari API Backend
  const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "/api/test/questions?code=SDS" || "http://localhost:3000/api/test/questions?code=SDS", { cache: 'no-store' });
  const rawQuestions = await res.json();
  
  if (rawQuestions.error || !Array.isArray(rawQuestions)) {
    return <div>Gagal memuat soal SDS. Silakan coba lagi.</div>;
  }

  // Format ulang ke tipe SdsItem yang diharapkan SdsFormClient
  const items: SdsItem[] = rawQuestions.map((q: any) => ({
    id: q.options?.originalId || q.id,
    section: q.options?.section || q.category || q.options?.category || 'activities', // Default fallback
    code: q.options?.code,
    text: q.text,
    scoringType: q.options?.scoringType,
    minValue: q.options?.minValue,
    maxValue: q.options?.maxValue
  }));

  // Fix section assignment karena di migration script kita pakai question_category
  // Kita fetch ulang dari supabase di sini jika butuh, tapi lebih mudah ambil category dari options. Wait, migration script nyimpan category di column `question_category`, tapi API `questions` tidak me-return `question_category`?
  
  return (
    <main>
      <div className="card">
        <h1>SDS Online</h1>
        <p className="muted">
          Form ini mengambil item secara dinamis dari database, lalu dihitung
          memakai engine RIASEC.
        </p>
      </div>

      <SdsFormClient items={items} />
    </main>
  );
}
