// DAT Scoring Engine

const DAT_SCORING_KEYS: Record<string, Record<string, string>> = {
  VERBAL: {
    "V1": "Air", // Panas : Api = Dingin : Air
    "V2": "Pendek" // Besar : Kecil = Tinggi : Pendek
  },
  NUMERICAL: {
    "N1": "10", 
    "N2": "5"
  },
  ABSTRACT: {
    "A1": "C"
  }
};

export function processDatScore(rawAnswers: Record<string, Record<string, string>>) {
  const scores: Record<string, number> = {
    VERBAL: 0,
    NUMERICAL: 0,
    ABSTRACT: 0
  };

  const totalQuestions: Record<string, number> = {
    VERBAL: Object.keys(DAT_SCORING_KEYS.VERBAL).length,
    NUMERICAL: Object.keys(DAT_SCORING_KEYS.NUMERICAL).length,
    ABSTRACT: Object.keys(DAT_SCORING_KEYS.ABSTRACT).length
  };

  let totalRawScore = 0;
  let totalMaxScore = 0;

  // Hitung Raw Score
  for (const [subtest, answers] of Object.entries(rawAnswers)) {
    if (DAT_SCORING_KEYS[subtest]) {
      for (const [qId, ans] of Object.entries(answers)) {
        if (DAT_SCORING_KEYS[subtest][qId] === ans) {
          scores[subtest]++;
          totalRawScore++;
        }
      }
      totalMaxScore += totalQuestions[subtest];
    }
  }

  // Kalkulasi Persentil Kasar (Simulasi Norma)
  const percentiles = {
    VERBAL: Math.round((scores.VERBAL / totalQuestions.VERBAL) * 100) || 0,
    NUMERICAL: Math.round((scores.NUMERICAL / totalQuestions.NUMERICAL) * 100) || 0,
    ABSTRACT: Math.round((scores.ABSTRACT / totalQuestions.ABSTRACT) * 100) || 0
  };

  // Rasio Prediktif Jurusan (IPA vs IPS) / (Technical vs Admin)
  const ipaScore = percentiles.NUMERICAL + percentiles.ABSTRACT; // Logika & Angka
  const ipsScore = percentiles.VERBAL; // Bahasa & Nalar Sosial

  let recommendation = "SEIMBANG";
  if (ipaScore > ipsScore * 1.5) {
    recommendation = "Kuat di IPA / Teknik / Analitis";
  } else if (ipsScore > ipaScore * 1.5) {
    recommendation = "Kuat di IPS / Bahasa / Administratif";
  } else {
    recommendation = "Kapasitas Berimbang (Generalis)";
  }

  return {
    calculatedData: {
      rawScores: scores,
      maxScores: totalQuestions,
      percentiles,
      totalRawScore,
      totalMaxScore,
      recommendation,
      ipaScore,
      ipsScore
    }
  };
}
