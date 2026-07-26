/**
 * Validity Engine - cpm-online
 * Diadaptasi dari assessment-web dengan dukungan untuk CPM, HEXACO, dan DISC.
 */

// ==================================================
// 1. DURASI CHECK
// ==================================================
function checkDuration(durasiText: string, testCodes: string[]) {
  if (!durasiText || durasiText === 'Tidak diketahui') {
    return { score: -1, label: 'Tidak tersedia', detail: 'Fitur durasi belum tersedia saat klien ini mengisi', totalSeconds: 0 };
  }

  const minMatch = durasiText.match(/(\d+)\s*menit/);
  const secMatch = durasiText.match(/(\d+)\s*detik/);
  const totalSeconds = (minMatch ? parseInt(minMatch[1]) * 60 : 0) + (secMatch ? parseInt(secMatch[1]) : 0);

  // Standar minimal berubah tergantung jumlah tes
  let minValidSeconds = 300; // Default 5 menit
  if (testCodes.includes('HEXACO') && testCodes.includes('DISC')) minValidSeconds = 600; // 10 menit
  else if (testCodes.includes('HEXACO')) minValidSeconds = 420; // 7 menit
  else if (testCodes.includes('CPM')) minValidSeconds = 240; // 4 menit CPM (60 soal)

  if (totalSeconds < minValidSeconds * 0.5) {
    return { score: 10, label: 'Sangat Cepat', detail: `${durasiText} — Terlalu cepat (Hampir pasti asal klik)`, totalSeconds };
  } else if (totalSeconds < minValidSeconds * 0.8) {
    return { score: 35, label: 'Terlalu Cepat', detail: `${durasiText} — Kemungkinan besar tidak membaca soal`, totalSeconds };
  } else if (totalSeconds < minValidSeconds) {
    return { score: 60, label: 'Agak Cepat', detail: `${durasiText} — Terburu-buru`, totalSeconds };
  } else if (totalSeconds <= minValidSeconds * 6) {
    return { score: 100, label: 'Wajar', detail: `${durasiText} — Durasi normal`, totalSeconds };
  } else {
    return { score: 80, label: 'Sangat Lama', detail: `${durasiText} — Mungkin ditinggal / ada jeda`, totalSeconds };
  }
}

// ==================================================
// 2. STRAIGHT-LINING CHECK (Pola Lurus)
// ==================================================
function checkStraightLining(answers: any, testCodes: string[]) {
  if (!answers || Object.keys(answers).length === 0) {
    return { score: -1, label: 'Tidak tersedia', detail: 'Data jawaban mentah tidak tersedia' };
  }

  // Khusus CPM, kita cek answers_cpm atau jika awalan key-nya A, B, dll
  let values: any[] = [];
  
  if (testCodes.includes('HEXACO')) {
    // Collect 1-5 Likert
    for (let i = 1; i <= 100; i++) {
      if (answers[`hexaco_${i}`] !== undefined) values.push(answers[`hexaco_${i}`]);
      else if (answers[i] !== undefined && typeof answers[i] === 'number') values.push(answers[i]);
    }
  } else if (testCodes.includes('CPM')) {
    // CPM answers like A1: 'A', A2: 'B'
    Object.keys(answers).forEach(k => {
      if (k.match(/^[A-E]\d+$/)) values.push(answers[k]);
    });
  } else {
     return { score: -1, label: 'Tidak relevan', detail: 'Tes ini tidak didukung untuk cek pola straight-lining' };
  }

  if (values.length < 10) return { score: -1, label: 'Tidak Cukup Data', detail: 'Jawaban terlalu sedikit' };

  let maxRun = 1, currentRun = 1;
  const freq: any = {};
  
  values.forEach(v => { 
    freq[v] = (freq[v] || 0) + 1; 
  });

  const maxFreq = Math.max(...Object.values(freq) as number[]);
  const dominantPct = (maxFreq / values.length) * 100;

  for (let i = 1; i < values.length; i++) {
    if (values[i] === values[i - 1]) {
      currentRun++;
      if (currentRun > maxRun) maxRun = currentRun;
    } else {
      currentRun = 1;
    }
  }

  let score = 100;
  if (dominantPct >= 80 || maxRun >= (values.length * 0.4)) score = 5;
  else if (dominantPct >= 60 || maxRun >= (values.length * 0.25)) score = 30;
  else if (dominantPct >= 45 || maxRun >= (values.length * 0.15)) score = 60;
  else score = 100;

  const label = score >= 85 ? 'Normal' : score >= 60 ? 'Agak Seragam' : score >= 30 ? 'Mencurigakan' : 'Sangat Seragam';
  return {
    score, label,
    detail: `Jawaban paling sering: ${dominantPct.toFixed(0)}% sama | Run terpanjang beruntun: ${maxRun}`
  };
}

// ==================================================
// 3. EXTREME RESPONDING CHECK (Hanya Likert/HEXACO)
// ==================================================
function checkExtremeResponding(answers: any, testCodes: string[]) {
  if (!testCodes.includes('HEXACO')) {
    return { score: -1, label: 'Tidak Relevan', detail: 'Hanya untuk tes Likert Scale' };
  }

  const values: number[] = [];
  for (let i = 1; i <= 100; i++) {
    if (answers[`hexaco_${i}`] !== undefined) values.push(answers[`hexaco_${i}`]);
    else if (answers[i] !== undefined && typeof answers[i] === 'number') values.push(answers[i]);
  }

  if (values.length === 0) return { score: -1, label: 'Tidak tersedia', detail: 'Jawaban HEXACO tidak ada' };

  const extremeCount = values.filter(v => v === 1 || v === 5).length;
  const extremePct = (extremeCount / values.length) * 100;

  let score;
  if (extremePct >= 80) score = 10;
  else if (extremePct >= 60) score = 40;
  else if (extremePct >= 50) score = 65;
  else score = 100;

  const label = score >= 85 ? 'Normal' : score >= 60 ? 'Agak Ekstrem' : score >= 30 ? 'Terlalu Ekstrem' : 'Sangat Ekstrem';
  return {
    score, label,
    detail: `${extremePct.toFixed(0)}% jawaban adalah nilai ekstrem (1 atau 5)`
  };
}


// ==================================================
// MASTER FUNCTION
// ==================================================
export function calculateValidityIndex(rawData: any, testCodes: string[]) {
  const durasiText = rawData?.userData?.durasi;
  const answers = rawData?.answers || {};

  const duration = checkDuration(durasiText, testCodes);
  const straightLining = checkStraightLining(answers, testCodes);
  const extreme = checkExtremeResponding(answers, testCodes);

  // Buat default object untuk yang tidak relevan
  const inconsistency = { score: -1, label: 'N/A', detail: 'Belum dihitung' };
  const discUndiff = { score: -1, label: 'N/A', detail: 'Belum dihitung' };
  const discOverShift = { score: -1, label: 'N/A', detail: 'Belum dihitung' };

  const indicators = [
    { data: duration, weight: 0.40 },
    { data: straightLining, weight: 0.60 }
  ];

  if (extreme.score >= 0) {
    indicators.push({ data: extreme, weight: 0.30 });
    indicators[0].weight = 0.30;
    indicators[1].weight = 0.40;
  }

  let totalWeight = 0;
  let totalScoreRaw = 0;

  indicators.forEach(ind => {
    if (ind.data.score >= 0) {
      totalScoreRaw += ind.data.score * ind.weight;
      totalWeight += ind.weight;
    }
  });

  let overallScore = totalWeight > 0 ? Math.round(totalScoreRaw / totalWeight) : -1;

  const getLabelColor = (sc: number) => {
    if (sc < 0) return { label: 'TIDAK ADA DATA', color: '#6b7280' };
    if (sc >= 85) return { label: 'VALID', color: '#22c55e' };
    if (sc >= 70) return { label: 'CUKUP VALID', color: '#eab308' };
    if (sc >= 50) return { label: 'MERAGUKAN', color: '#f97316' };
    return { label: 'TIDAK VALID', color: '#ef4444' };
  };

  const mainObj = getLabelColor(overallScore);

  return {
    overallLabel: mainObj.label,
    overallColor: mainObj.color,
    overallScore: overallScore < 0 ? '-' : overallScore,
    indicators: { 
      duration, 
      straightLining, 
      extreme, 
      inconsistency,
      discUndifferentiated: discUndiff,
      discOverShift: discOverShift
    }
  };
}
