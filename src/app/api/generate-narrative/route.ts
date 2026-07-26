import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Parser pembantu untuk memecah teks menjadi bagian-bagian
const extractSection = (text: string, title: string): string => {
  const regex = new RegExp(`===\\s*${title}\\s*===\\n([\\s\\S]*?)(?:\\n===|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

// ——————————————————————————————————————
// PROMPT BUILDER per Segmen
// ——————————————————————————————————————

function buildCHIPrompt(body: any): string {
  const { name, nickname, ageYears, iq, percentile, totalScore, firstAttemptScore, psychogram } = body;

  let psychogramText = "Psikogram belum tersedia.";
  if (psychogram && psychogram.processProfile) {
    psychogramText = Object.entries(psychogram.processProfile)
      .map(([k, v]: [string, any]) => `  - ${v.construct}: ${v.score} (${v.status})`)
      .join('\n');
  }

  return `
Anda adalah Dr. Lentera, seorang Psikolog Anak berpengalaman di Indonesia.
Tugas Anda adalah menulis NARASI PSIKOLOGIS yang mendalam, empatik, dan BUKAN sekedar daftar angka.
Gaya bahasa: formal tapi hangat, seperti laporan untuk orang tua berpendidikan.

DATA ASESMEN:
- Nama: ${name || 'Anak'} (Panggilan: ${nickname || name || 'Anak'})
- Usia: ${ageYears || '?'} tahun
- Skor CPM Total: ${totalScore || '?'} / 36
- Skor Percobaan Pertama: ${firstAttemptScore || '?'}
- Estimasi IQ: ${iq || '?'}
- Persentil: ${percentile || '?'}
- Profil Psikogram (kategori per aspek fungsi kognitif):
${psychogramText}

INSTRUKSI FORMAT OUTPUT:
Kembalikan teks terstruktur dengan 4 bagian berikut. JANGAN tambahkan markdown, bold (**), atau bullet list.

=== DINAMIKA ===
Tulis 2-4 paragraf yang menjelaskan profil kognitif secara naratif. Apa yang membuat anak ini unik berdasarkan psikogram? Bagaimana cara ia memproses informasi?

=== KESIMPULAN ===
Tulis 1-2 paragraf. Rangkum kekuatan dan area perkembangan utama dalam konteks kesiapan sekolah dasar.

=== REKOMENDASI ===
Tulis 3-5 rekomendasi praktis dan spesifik untuk orang tua dan guru dalam kalimat penuh (bukan bullet). Gunakan frasa seperti "Kami menyarankan agar..." atau "Untuk mendukung perkembangan...".

=== CATATAN KHUSUS ===
Jika ada temuan yang perlu perhatian ekstra (misal: skor sangat rendah/tinggi, inkonsistensi), tulis di sini. Jika tidak ada, kosongkan bagian ini.
`;
}

function buildSTUPrompt(body: any): string {
  const { name, ageYears, iq, percentile, hexaco, riasec, vak } = body;

  return `
Anda adalah seorang Psikolog, Konselor Pendidikan, dan Ahli Perkembangan Anak yang profesional. Pendekatan Anda sangat holistik, utuh, dan mampu mengintegrasikan data psikometri (Kecerdasan, Minat, dan Kepribadian) menjadi narasi yang memberdayakan siswa dan keluarga.

TUGAS:
Lakukan sintesis data hasil asesmen psikologi dari seorang peserta, lalu hasilkan laporan untuk Interpretasi Terpadu, Saran Pengembangan, dan Peta Masa Depan. 

PRINSIP KERJA (SEARCH BEFORE SYNTHESIS):
Sebelum merumuskan narasi, Anda wajib menganalisis secara diam-diam korelasi antar data kuantitatif yang diberikan. Temukan benang merah antara kemampuan kognitif, gaya belajar dominan, dan top 3 RIASEC. Grounding setiap kesimpulan Anda murni pada data peserta, bukan asumsi umum.

DATA ASESMEN:
- Nama: ${name || 'Siswa'}
- Usia: ${ageYears || '?'} tahun
- Kemampuan Kognitif Umum (RAVEN2):
  - Estimasi IQ: ${iq || 'Belum tersedia'}
  - Persentil: ${percentile || '?'}
- Profil Minat Karir (RIASEC): ${riasec ? JSON.stringify(riasec) : 'Belum tersedia'}
- Gaya Belajar (VAK): ${vak ? JSON.stringify(vak) : 'Belum tersedia'}

FORMAT OUTPUT:
Keluarkan output HANYA dalam format JSON yang valid dengan struktur berikut:

{
  "interpretasiTerpadu": {
    "poinAnalisis": [
      "Berisi 3-5 poin kesimpulan utama yang menghubungkan kognitif, minat, dan gaya belajar (misal: 'Kemampuan kognitif didukung oleh gaya belajar visual...')"
    ],
    "paragrafKesimpulan": "Satu paragraf kutipan epik yang merangkum keseluruhan potensi peserta"
  },
  "saranPengembangan": {
    "lingkunganRumah": [
      {
        "potensi": "Nama bakat/potensi",
        "kegiatan": "Contoh kegiatan konkret bersama keluarga",
        "manfaat": "Manfaat psikologis/kognitif dari kegiatan tersebut"
      }
    ],
    "kolaborasiSekolah": [
      "3-4 rekomendasi akademis, ekstrakurikuler, atau penjurusan"
    ],
    "pengembanganKarakter": [
      "2-3 saran untuk mentalitas, kepemimpinan, atau konseling lanjutan"
    ]
  },
  "petaMasaDepan": {
    "rekomendasiKarir": [
      {
        "bidang": "Nama Jurusan/Bidang Industri",
        "contohKarir": "2-3 Contoh spesifik profesi",
        "alasanKesesuaian": "Penjelasan mengapa ini cocok berdasarkan RIASEC dan Gaya Belajar"
      }
    ],
    "pesanUntukOrangTua": "Satu paragraf penutup yang hangat, empatik, dan suportif untuk orang tua."
  }
}
`;
}

function buildEMPPrompt(body: any): string {
  const { name, ageYears, iq, percentile, disc, hexaco, wvi } = body;

  return `
Anda adalah seorang Psikolog Industri & Organisasi (PIO) berpengalaman.
Tugas Anda adalah menulis LAPORAN ASESMEN REKRUTMEN yang objektif, analitis, dan berbasis data.
Gaya bahasa: formal dan profesional, untuk konsumsi HRD dan Manajer.

DATA ASESMEN:
- Nama: ${name || 'Kandidat'}
- Usia: ${ageYears || '?'} tahun
- Kemampuan Kognitif Umum (RAVEN2):
  - Estimasi IQ / Fluid Intelligence: ${iq || 'Belum tersedia'}
  - Persentil: ${percentile || '?'}
- Profil Perilaku DISC (Arketipe: ${disc?.archetype || 'Belum tersedia'}): ${disc ? JSON.stringify({ D: disc.D, I: disc.I, S: disc.S, C: disc.C }) : 'Belum tersedia'}
- Profil Kepribadian HEXACO (skala 1-5): ${hexaco ? JSON.stringify(hexaco) : 'Belum tersedia'}
- Nilai Kerja / Work Values (WVI): ${wvi ? JSON.stringify(wvi) : 'Belum tersedia'}
- Posisi / Jabatan yang Dilamar: ${body.position || 'Posisi Umum'}

INSTRUKSI FORMAT OUTPUT:
Kembalikan respon murni dalam format JSON (tanpa markdown). Struktur JSON HANYA boleh memiliki kunci-kunci berikut:
{
  "deskripsiTerintegrasi": "2-3 paragraf narasi ekstensif yang menggabungkan gaya kerja DISC, karakter fundamental HEXACO, dan kapasitas kognitif (IQ). Penjelasan ini harus mengalir seperti cerita yang kohesif.",
  "kekuatanUtama": [
    "Poin kekuatan 1 (misal: Integritas dan kejujuran yang tinggi)",
    "Poin kekuatan 2",
    "Poin kekuatan 3"
  ],
  "tantanganHambatan": {
    "areaFriksi": "1 paragraf utuh yang menjelaskan hambatan kandidat dalam pekerjaan, interaksi sosial, atau hal yang memicu konflik berdasarkan datanya.",
    "karakterInternal": "1 paragraf utuh yang menjelaskan manajemen stres, emosi, kemandirian, dan stabilitas psikologis kandidat."
  },
  "lingkunganIdeal": {
    "ekosistemKerja": "1 paragraf utuh tentang tipe organisasi, budaya kerja, atau sistem hierarki yang paling cocok agar kandidat ini berkembang optimal.",
    "kebutuhanMotivasi": "1 paragraf utuh tentang pendorong motivasi terkuatnya berdasarkan WVI (Work Values)."
  },
  "saranPengembangan": [
    "Saran strategis 1 untuk HRD/Atasan",
    "Saran strategis 2",
    "Saran strategis 3"
  ],
  "rekomendasiAkhir": {
    "status": "Hanya boleh pilih salah satu: DIREKOMENDASIKAN / DIPERTIMBANGKAN DENGAN SYARAT / TIDAK DIREKOMENDASIKAN",
    "persentaseJobFit": "Angka integer persentase kecocokan dari 1 sampai 100 (misal: 82)",
    "keterangan": "1 paragraf penjelasan alasan rekomendasi tersebut berdasarkan profil kandidat terhadap posisi yang dilamar."
  }
}
`;
}

// ——————————————————————————————————————
// Main Handler
// ——————————————————————————————————————

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum dikonfigurasi di environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const segment: 'CHI' | 'STU' | 'EMP' = body.segment || 'CHI';

    let prompt = '';
    if (segment === 'CHI') {
      prompt = buildCHIPrompt(body);
    } else if (segment === 'STU') {
      prompt = buildSTUPrompt(body);
    } else {
      prompt = buildEMPPrompt(body);
    }

    let modelConfig: any = {
      temperature: 0.75,
      topK: 40,
      topP: 0.95,
    };

    if (segment === 'STU' || segment === 'EMP') {
      modelConfig.responseMimeType = "application/json";
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: modelConfig,
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (segment === 'STU' || segment === 'EMP') {
      let parsed = {};
      try { parsed = JSON.parse(responseText); } catch(e) {}
      
      if (segment === 'EMP') {
        return NextResponse.json({
          raw: responseText,
          empData: parsed 
        });
      }

      return NextResponse.json({
        raw: responseText,
        stuData: parsed 
      });
    }

    const dynamics = extractSection(responseText, 'DINAMIKA');
    const conclusion = extractSection(responseText, 'KESIMPULAN');
    const recommendation = extractSection(responseText, 'REKOMENDASI');
    const specialNote = extractSection(responseText, 'CATATAN KHUSUS');

    return NextResponse.json({
      raw: responseText,
      interpretation: dynamics,
      conclusion,
      recommendation,
      specialNote,
    });

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses narasi AI.' },
      { status: 500 }
    );
  }
}
