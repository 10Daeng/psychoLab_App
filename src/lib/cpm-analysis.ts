// Konstanta Norma CPM
export const expectedScoresTable: Record<number, number[]> = {
  10: [5, 3, 2], 11: [6, 3, 2], 12: [7, 3, 2], 13: [7, 3, 3],
  14: [7, 4, 3], 15: [7, 4, 4], 16: [8, 4, 4], 17: [8, 5, 4],
  18: [8, 5, 4], 19: [8, 5, 5], 20: [8, 7, 5], 21: [9, 7, 5],
  22: [9, 8, 5], 23: [9, 8, 6], 24: [10, 8, 6], 25: [10, 9, 6],
  26: [10, 9, 7], 27: [10, 10, 7], 28: [10, 10, 8], 29: [11, 10, 8],
  30: [11, 10, 9], 31: [11, 10, 10], 32: [11, 11, 10], 33: [11, 11, 11],
  34: [12, 11, 11], 35: [12, 12, 11], 36: [12, 12, 12]
};

const percentileTable: Record<string, (number | null)[]> = {
  "3.5": [20, 17, 14, 10, null, null, null],
  "4.0": [21, 19, 15, 11, 7, null, null],
  "4.5": [22, 20, 16, 12, 8, null, null],
  "5.0": [24, 22, 18, 14, 10, null, null],
  "5.5": [25, 23, 19, 15, 11, 7, null],
  "6.0": [26, 24, 20, 16, 12, 9, null],
  "6.5": [27, 26, 22, 18, 14, 10, 8],
  "7.0": [28, 27, 23, 19, 15, 12, 9],
  "7.5": [29, 28, 25, 21, 17, 13, 11],
  "8.0": [30, 28, 26, 22, 18, 14, 12],
  "8.5": [31, 29, 27, 23, 19, 15, 13],
  "9.0": [32, 30, 28, 25, 21, 17, 15],
  "9.5": [33, 31, 29, 26, 22, 18, 16],
  "10.0": [33, 32, 30, 27, 23, 19, 17],
  "10.5": [34, 33, 31, 28, 25, 21, 19],
  "11.0": [35, 34, 32, 29, 26, 22, 20],
  "11.5": [35, 34, 32, 29, 26, 22, 20],
};

const levelTable = [
  [95, "I", "Intellectual Superior"],
  [90, "II+", "Kapasitas intelektual di atas rata-rata tinggi"],
  [75, "II", "Kapasitas intelektual di atas rata-rata"],
  [25, "III", "Kapasitas intelektual rata-rata"],
  [10, "IV", "Kapasitas intelektual di bawah rata-rata"],
  [5, "IV-", "Kapasitas intelektual sangat rendah"],
  [0, "V", "Intellectual Defective"],
];

export function getPercentile(score: number, age: number) {
  let ageKey = (Math.round(age * 2) / 2).toFixed(1);
  if (parseFloat(ageKey) < 3.5) ageKey = "3.5";
  if (parseFloat(ageKey) > 11.5) ageKey = "11.5";
  const scores = percentileTable[ageKey];
  if (!scores) return 0;
  const percentiles = [95, 90, 75, 50, 25, 10, 5, 0];
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] !== null && score >= (scores[i] as number)) {
      return percentiles[i];
    }
  }
  return 0;
}

export function getIntellectualLevel(percentile: number) {
  for (const [minPercentile, grade, level] of levelTable) {
    if (percentile >= (minPercentile as number)) return { grade, level };
  }
  return { grade: "V", level: "Intellectual Defective" };
}

export function calculateAdvancedMetrics(rawData: any[], ageDecimal: number, clientName: string) {
  let setScores = { A: 0, Ab: 0, B: 0 };
  let diffScores = { mudah: 0, sedang: 0, sulit: 0 };
  let attempt1_correct = 0;
  let attempt2_correct = 0;
  let learningStats = { totalErrors: 0, learnedFromErrors: 0, persistentErrors: 0, gaveUp: 0 };
  let timingData = { totalTimeSec: 0, fastItems: 0, moderateItems: 0, slowItems: 0, times: [] as number[], impulsiveCnt: 0 };
  let lateCorrect = 0;

  rawData.forEach((item: any, index: number) => {
    // Determine section and question number
    const qId = item.questionId; // e.g. "A1", "AB12", "B5"
    let section = "A";
    if (qId.startsWith("AB")) section = "Ab";
    else if (qId.startsWith("B")) section = "B";

    const qNum = parseInt(qId.replace(/[^0-9]/g, ''));

    // Scoring
    const isCorrect = item.isFirstAttemptCorrect || item.isSecondAttemptCorrect;
    if (isCorrect) {
      setScores[section as keyof typeof setScores] += 1;
      if (item.isFirstAttemptCorrect) attempt1_correct += 1;
      else if (item.isSecondAttemptCorrect) attempt2_correct += 1;

      if (qNum >= 1 && qNum <= 4) diffScores.mudah += 1;
      else if (qNum >= 5 && qNum <= 8) diffScores.sedang += 1;
      else diffScores.sulit += 1;
    }

    // Detect if this is a single attempt mode (secondAttemptTimeMs is missing or 0)
    const isSingleAttemptMode = rawData.every((r: any) => !r.secondAttemptTimeMs);

    // Learning Stats
    if (!item.isFirstAttemptCorrect) {
      learningStats.totalErrors += 1;
      if (item.isSecondAttemptCorrect) {
        learningStats.learnedFromErrors += 1;
      } else {
        learningStats.persistentErrors += 1;
      }
      
      if (!isSingleAttemptMode) {
        const t2 = item.secondAttemptTimeMs || 0;
        if (t2 < 3000 || item.secondAttemptAnswer === null) {
          learningStats.gaveUp += 1;
        }
      }
    } else {
      if (index >= rawData.length - 12) {
        lateCorrect += 1;
      }
    }

    // Timing Stats
    let timeMs = item.firstAttemptTimeMs || 0;
    const timeSec = timeMs / 1000;
    timingData.times.push(timeSec);
    if (item.secondAttemptTimeMs) timeMs += item.secondAttemptTimeMs;
    const totalTimeSec = timeMs / 1000;
    timingData.totalTimeSec += totalTimeSec;

    if (totalTimeSec < 5) timingData.fastItems += 1;
    else if (totalTimeSec <= 10) timingData.moderateItems += 1;
    else timingData.slowItems += 1;

    if (timeSec < 3) timingData.impulsiveCnt += 1;
  });

  const totalRawScore = setScores.A + setScores.Ab + setScores.B;
  const percentile = getPercentile(totalRawScore, ageDecimal);
  const level = getIntellectualLevel(percentile);
  
  // Calculate average time for FIRST attempt only for Psychogram variance
  const firstAvgTime = timingData.times.length > 0 ? timingData.times.reduce((a, b) => a + b, 0) / timingData.times.length : 0;
  const variance = timingData.times.length > 0 ? timingData.times.reduce((a, b) => a + Math.abs(b - firstAvgTime), 0) / timingData.times.length : 0;
  
  // Note: Standard IQ scaling based on first attempt score if age > 7
  let iq = 100;
  if (ageDecimal > 7) {
    if (attempt1_correct >= 35) iq = 125;
    else if (attempt1_correct >= 32) iq = 110;
    else if (attempt1_correct >= 24) iq = 100;
    else if (attempt1_correct >= 18) iq = 85;
    else iq = 75;
  } else {
    // For age <= 7, we can map percentile to roughly estimated IQ
    if (percentile >= 95) iq = 125;
    else if (percentile >= 90) iq = 120;
    else if (percentile >= 75) iq = 110;
    else if (percentile >= 50) iq = 100;
    else if (percentile >= 25) iq = 90;
    else if (percentile >= 10) iq = 80;
    else iq = 70;
  }

  const avgTimePerItem = timingData.totalTimeSec / 36;
  const accuracyPct = (totalRawScore / 36) * 100;
  
  let learningRate = 0;
  if (learningStats.totalErrors > 0) {
    learningRate = (learningStats.learnedFromErrors / learningStats.totalErrors) * 100;
  }

  const sanitize = (val: number) => {
    if (isNaN(val) || val === null || val === undefined) return 0;
    if (val < 0) return 0;
    if (val > 100) return 100;
    return val;
  };

  // --- Psychogram Premium Calculation ---
  const vis_spatial = (setScores.A / 12) * 100;
  const pattern_rec = (setScores.Ab / 12) * 100;
  const abstract = (setScores.B / 12) * 100;
  
  const sustained = (lateCorrect / 12) * 100;
  const stability = sanitize(Math.max(0, 100 - (variance * 5)));
  const resistance = (stability + sustained) / 2;
  
  const planning = sanitize(Math.max(0, 100 - (timingData.impulsiveCnt * 10)));
  
  // Deteksi mode satu kesempatan dari awal untuk kalkulasi yang bergantung pada percobaan ke-2
  const isSingleAttemptMode = rawData.every((r: any) => !r.secondAttemptTimeMs);
  
  let flexibility = 80;
  if (!isSingleAttemptMode && learningStats.totalErrors > 0) {
    flexibility = (learningStats.learnedFromErrors / learningStats.totalErrors) * 100;
  } else if (isSingleAttemptMode) {
    // Estimasi aman berdasarkan akurasi umum dan kehati-hatian
    flexibility = sanitize((accuracyPct + planning) / 2);
  }
  
  const impulse_control = planning;
  
  const persistence = sanitize(Math.max(0, 100 - (learningStats.gaveUp * 15)));
  const accuracy = accuracyPct;
  
  let speed = 40;
  const avg_time = avgTimePerItem;
  if (avg_time < 5) speed = 90;
  else if (avg_time < 10) speed = 80;
  else if (avg_time < 15) speed = 60;
  
  const frustration = persistence;
  const confidence = 100 - (learningStats.totalErrors * 2);

  const psychogramPremium = {
    COGNITIVE: {
      'Visual-Spatial Reasoning': vis_spatial,
      'Pattern Recognition': pattern_rec,
      'Abstract Reasoning': abstract
    },
    'ATTENTION & CONCENTRATION': {
      'Sustained Attention': sustained,
      'Focus Stability': stability,
      'Resistance to Distraction': resistance
    },
    'EXECUTIVE FUNCTIONS': {
      'Planning & Organization': planning,
      'Cognitive Flexibility': flexibility,
      'Impulse Control': impulse_control
    },
    'TASK COMMITMENT': {
      'Task Persistence': persistence,
      'Effort & Motivation': (persistence + 80) / 2,
      'Speed of Work': speed,
      'Accuracy/Carefulness': accuracy
    },
    'EMOTIONAL REGULATION': {
      'Frustration Tolerance': frustration,
      'Anxiety Management': (frustration + 70) / 2,
      'Emotional Stability': (frustration + stability) / 2,
      'Self-Confidence': confidence
    },
    'LEARNING CHARACTERISTICS': {
      'Systematic Approach': planning,
      'Trial-Error Learning': 100 - flexibility,
      'Reflective Thinking': planning,
      'Independent Problem-Solving': (accuracy + persistence) / 2
    }
  };

  // --- Narasi Gaya Kerja ---
  let workStyle = "";
  let workDesc = "";
  if (avgTimePerItem < 7 && accuracyPct >= 70) {
    workStyle = "Cepat dan Akurat";
    workDesc = `${clientName} menunjukkan gaya kerja yang efisien dengan kemampuan memproses informasi dengan cepat tanpa mengorbankan akurasi.`;
  } else if (avgTimePerItem < 7 && accuracyPct < 70) {
    workStyle = "Cepat Namun Perlu Teliti";
    workDesc = `${clientName} bekerja dengan tempo yang cukup impulsif/cepat, namun akan lebih optimal jika lebih memperhatikan detail sebelum memberikan jawaban.`;
  } else if (avgTimePerItem >= 7 && accuracyPct >= 70) {
    workStyle = "Cermat dan Sistematis";
    workDesc = `${clientName} menunjukkan pendekatan yang hati-hati dan teliti. Ia memastikan pemahaman yang baik sebelum memberikan jawaban.`;
  } else {
    workStyle = "Membutuhkan Dukungan Tambahan";
    workDesc = `${clientName} tampak masih perlu pengembangan dalam tempo kerja dan akurasi. Pendampingan yang tepat akan sangat membantu perkembangannya.`;
  }

  // --- Narasi Adaptasi / Learning Rate ---
  let learningDesc = "";
  if (isSingleAttemptMode) {
    learningDesc = `${clientName} menyelesaikan rangkaian tugas ini dalam sekali kesempatan. Karena ini adalah format pengujian tunggal, daya tangkapnya diukur dari akurasi awal secara langsung. Berdasarkan skor dan kehati-hatiannya, ia diestimasi memiliki fleksibilitas kognitif di level ${flexibility.toFixed(0)}%.`;
  } else {
    if (learningRate >= 60) {
      learningDesc = `${clientName} menunjukkan kemampuan adaptasi yang sangat baik. Dari ${learningStats.totalErrors} kesalahan di percobaan pertama, ia berhasil memperbaiki ${learningStats.learnedFromErrors} di percobaan kedua (Tingkat Adaptasi: ${learningRate.toFixed(0)}%). Ini menunjukkan fleksibilitas kognitif yang baik.`;
    } else if (learningRate >= 40) {
      learningDesc = `${clientName} menunjukkan kemampuan adaptasi yang cukup baik dengan Tingkat Adaptasi ${learningRate.toFixed(0)}%. Dengan dukungan yang tepat, kemampuan belajar dari kesalahan ini dapat terus ditingkatkan.`;
    } else {
      learningDesc = `${clientName} tampak memerlukan waktu lebih untuk memproses umpan balik (Tingkat Adaptasi: ${learningRate.toFixed(0)}%). Ini menunjukkan perlunya pendekatan pembelajaran yang lebih terstruktur dan berulang.`;
    }
  }

  // --- Narasi Pola Kesulitan ---
  let patternAnalysis = "";
  if (diffScores.mudah >= 10) patternAnalysis += `Pada tugas dasar (mudah), ${clientName} menunjukkan penguasaan yang sangat baik (${diffScores.mudah}/12). `;
  else patternAnalysis += `Pada tugas dasar (mudah), ${clientName} masih perlu penguatan konsep fundamental (${diffScores.mudah}/12). `;

  if (diffScores.sedang >= 8) patternAnalysis += `Kemampuan pemecahan masalah pada tingkat menengah cukup baik (${diffScores.sedang}/12). `;
  else patternAnalysis += `Pemecahan masalah pada tingkat menengah masih dapat ditingkatkan (${diffScores.sedang}/12). `;

  if (diffScores.sulit >= 6) patternAnalysis += `Yang menarik, ${clientName} juga mampu menyelesaikan soal-soal abstrak kompleks dengan baik (${diffScores.sulit}/12), menunjukkan potensi reasoning yang tersembunyi.`;
  else patternAnalysis += `Soal-soal abstrak kompleks masih menjadi tantangan utama (${diffScores.sulit}/12), yang wajar untuk tahap perkembangannya.`;

  // --- Kesimpulan Kesiapan ---
  let readiness = "";
  if (percentile >= 75) {
    readiness = `${clientName} menunjukkan KESIAPAN YANG BAIK. Dengan kapasitas kognitif di atas rata-rata (persentil ${percentile}), ia diprediksi dapat menyerap pembelajaran dengan lancar.`;
  } else if (percentile >= 50) {
    readiness = `${clientName} menunjukkan KESIAPAN YANG MEMADAI. Dengan kapasitas kognitif rata-rata (persentil ${percentile}), ia dapat mengikuti kurikulum standar dengan dukungan sewajarnya.`;
  } else if (percentile >= 25) {
    readiness = `${clientName} menunjukkan KESIAPAN DASAR. Pendampingan ekstra di awal-awal periode belajar akan sangat membantu kelancaran adaptasinya.`;
  } else {
    readiness = `${clientName} akan mendapat manfaat optimal dengan DUKUNGAN KHUSUS di awal pembelajaran. Hal ini menunjukkan perlunya perhatian individual.`;
  }

  // --- Discrepancy Validation Check ---
  let isValid = true;
  let discrepancyWarning = "";
  const expected = expectedScoresTable[totalRawScore];
  
  if (expected) {
    const diffA = Math.abs(setScores.A - expected[0]);
    const diffAb = Math.abs(setScores.Ab - expected[1]);
    const diffB = Math.abs(setScores.B - expected[2]);
    
    // Jika selisih absolut > 2 pada salah satu set, maka tidak valid
    if (diffA > 2 || diffAb > 2 || diffB > 2) {
      isValid = false;
      discrepancyWarning = `⚠️ PERINGATAN VALIDITAS: Pola jawaban tidak konsisten (Discrepansi Set A=${diffA}, Ab=${diffAb}, B=${diffB}). Klien kemungkinan besar menebak jawaban secara acak. Hasil persentil dan interpretasi mungkin tidak menggambarkan kapasitas kognitif yang sebenarnya.\n\n`;
    }
  }

  const interpretationText = `${discrepancyWarning}${readiness}\n\nPROFIL KOGNITIF & POLA KESULITAN:\n${patternAnalysis}\n\nGAYA KERJA & TEMPO:\n${workDesc}\n\nKEMAMPUAN ADAPTASI (LEARNING RATE):\n${learningDesc}`;

  // --- Generate Recommendations ---
  let recommendations: string[] = [];
  if (!isValid) {
    recommendations.push("Tes diulang di sesi berikutnya karena pola jawaban yang tidak konsisten (mengindikasikan anak lelah, kurang fokus, atau asal menebak).");
  }
  if (percentile >= 90) {
    recommendations.push("Berikan aktivitas pengayaan (enrichment) yang menantang untuk menstimulasi potensi tingginya.");
  } else if (percentile >= 75) {
    recommendations.push("Stimulasi dengan aktivitas yang sesuai dengan kapasitasnya yang berada di atas rata-rata.");
  } else if (percentile < 25) {
    recommendations.push("Gunakan pendekatan multi-sensori (visual, auditori, kinestetik) dalam pembelajaran sehari-hari.");
    recommendations.push("Ulangi konsep-konsep penting dengan cara yang menyenangkan agar tertanam lebih kuat.");
  }
  
  if (learningRate >= 60) {
    recommendations.push("Manfaatkan fleksibilitas kognitifnya dengan memberikan beragam strategi pemecahan masalah alternatif.");
  } else if (learningRate < 40) {
    recommendations.push("Berikan umpan balik yang jelas, langsung, dan positif setiap kali ia mencoba sesuatu yang baru.");
  }

  if (avgTimePerItem < 7 && accuracyPct < 70) {
    recommendations.push("Latih anak untuk 'double-check' atau memeriksa kembali jawabannya sebelum merasa yakin.");
  } else if (avgTimePerItem >= 10) {
    recommendations.push("Berikan waktu yang cukup saat mengerjakan tugas mandiri, jangan terlalu diburu-buru.");
  }

  if (diffScores.mudah < 10) {
    recommendations.push("Perkuat konsep-konsep pemahaman dasar melalui media visual atau permainan edukatif.");
  }

  const recommendationText = recommendations.map(r => "- " + r).join("\n");

  return {
    setScores,
    totalRawScore,
    attempt1_correct,
    attempt2_correct,
    percentile,
    iq,
    level,
    isValid, // Ditambahkan untuk penanda status validasi skor
    discrepancyWarning,
    workStyle,
    avgTimePerItem,
    accuracyPct,
    learningRate,
    interpretationText,
    recommendationText,
    psychogramPremium
  };
}
