"use client";

import { useMemo, useState } from "react";

import { SECTION_LABELS } from "@/lib/sds/constants";
import type {
  RiasecCode,
  SdsAnswerMap,
  SdsItem,
  SdsResult,
  SdsSection,
} from "@/lib/sds/types";

type ApiResponse =
  | {
      success: true;
      data: {
        studentId: string | null;
        result: SdsResult;
      };
    }
  | {
      success: false;
      message: string;
    };

const CODE_LABELS: Record<RiasecCode, string> = {
  R: "R - Realistic",
  I: "I - Investigative",
  A: "A - Artistic",
  S: "S - Social",
  E: "E - Enterprising",
  C: "C - Conventional",
};

export default function SdsFormClient({ items }: { items: SdsItem[] }) {
  const [answers, setAnswers] = useState<SdsAnswerMap>({});
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState<SdsResult | null>(null);
  const [error, setError] = useState("");
  const [isScoring, setIsScoring] = useState(false);

  const groupedItems = useMemo(() => groupItems(items), [items]);

  async function handleSubmit() {
    setError("");
    setIsScoring(true);

    try {
      const testResultId = sessionStorage.getItem("test_result_id");
      const clientDataStr = sessionStorage.getItem("client_data");
      
      const response = await fetch("/api/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_result_id: testResultId,
          resultsLog: answers,
          clientData: clientDataStr ? JSON.parse(clientDataStr) : {}
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Gagal menyimpan hasil SDS.");
      }

      alert("Laporan Karir (RIASEC) berhasil disimpan!");
      
      const tokenCode = sessionStorage.getItem("token_code") || "";
      const tokenId = sessionStorage.getItem("valid_token_id") || sessionStorage.getItem("current_token_id");
      const clientData = clientDataStr ? JSON.parse(clientDataStr) : {};

      if (tokenCode.startsWith("STU-")) {
        // Mulai sesi VAK
        const startRes = await fetch("/api/start-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token_id: tokenId, client_id: clientData.id, test_code: "VAK" })
        });
        
        const startData = await startRes.json();
        if (startData.success) {
          sessionStorage.setItem("test_result_id", startData.test_result_id);
          window.location.href = "/test/vak";
        } else {
          alert("Gagal melanjutkan tes.");
        }
      } else {
        sessionStorage.removeItem("current_participant");
        sessionStorage.removeItem("valid_token_id");
        sessionStorage.removeItem("test_result_id");
        window.location.href = "/selesai";
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menghitung hasil SDS.";
      setError(message);
      setIsScoring(false);
    }
  }

  function updateAnswer(item: SdsItem, value: boolean | number | undefined) {
    setAnswers((prev) => ({
      ...prev,
      [item.id]: value,
    }));
  }

  return (
    <>
      {result && <ResultCard result={result} />}

      {error && (
        <div className="card">
          <div className="warning">{error}</div>
        </div>
      )}

      <div className="card">
        <h2>Identitas</h2>
        <label>
          <div className="muted">ID / Nama siswa opsional</div>
          <input
            type="text"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="contoh: siswa-001"
            style={{
              width: "100%",
              marginTop: 8,
            }}
          />
        </label>
      </div>

      {Object.entries(groupedItems).map(([section, byCode]) => (
        <div className="card" key={section}>
          <h2>{SECTION_LABELS[section as SdsSection]}</h2>

          {Object.entries(byCode).map(([code, sectionItems]) => {
            if (sectionItems.length === 0) return null;

            return (
              <div key={`${section}-${code}`} style={{ marginTop: 18 }}>
                <h3>{CODE_LABELS[code as RiasecCode]}</h3>
                <div className="grid two">
                  {sectionItems.map((item) => (
                    <SdsInput
                      key={item.id}
                      item={item}
                      value={answers[item.id]}
                      onChange={(value) => updateAnswer(item, value)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div className="card">
        <button type="button" onClick={handleSubmit} disabled={isScoring}>
          {isScoring ? "Menghitung..." : "Hitung Hasil SDS"}
        </button>
      </div>
    </>
  );
}

function SdsInput({
  item,
  value,
  onChange,
}: {
  item: SdsItem;
  value: unknown;
  onChange: (value: boolean | number | undefined) => void;
}) {
  if (item.scoringType === "rating") {
    return (
      <label className="item">
        <div style={{ flex: 1 }}>
          <strong>{item.text}</strong>
          <div className="muted">
            Beri nilai {item.minValue ?? 1} sampai {item.maxValue ?? 10}.
          </div>
        </div>
        <input
          type="number"
          min={item.minValue ?? 1}
          max={item.maxValue ?? 10}
          value={typeof value === "number" ? value : ""}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === "" ? undefined : Number(raw));
          }}
        />
      </label>
    );
  }

  return (
    <label className="item">
      <input
        type="checkbox"
        checked={value === true}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{item.text}</span>
    </label>
  );
}

function ResultCard({ result }: { result: SdsResult }) {
  return (
    <div className="card">
      <h2>Hasil SDS</h2>
      <p>
        <strong>Kode Ringkasan:</strong> {result.summaryCode}
      </p>

      <p>{result.interpretation.profileSummary}</p>

      {result.warnings.length > 0 && (
        <div>
          <h3>Catatan kehati-hatian</h3>
          {result.warnings.map((warning) => (
            <div className="warning" key={warning}>
              {warning}
            </div>
          ))}
        </div>
      )}

      <h3>Skor Total RIASEC</h3>
      <table className="score-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Skor</th>
            <th>Ranking</th>
          </tr>
        </thead>
        <tbody>
          {result.rankedCodes.map((item) => (
            <tr key={item.code}>
              <td>{item.code}</td>
              <td>{item.score}</td>
              <td>{item.rank}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Skor per Aspek</h3>
      <table className="score-table">
        <thead>
          <tr>
            <th>Aspek</th>
            <th>R</th>
            <th>I</th>
            <th>A</th>
            <th>S</th>
            <th>E</th>
            <th>C</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(result.sectionScores).map(([section, scores]) => (
            <tr key={section}>
              <td>{SECTION_LABELS[section as SdsSection]}</td>
              <td>{scores.R}</td>
              <td>{scores.I}</td>
              <td>{scores.A}</td>
              <td>{scores.S}</td>
              <td>{scores.E}</td>
              <td>{scores.C}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Interpretasi Kode Dominan</h3>
      {result.interpretation.codeDescriptions.map((item) => (
        <p key={item.code}>
          <strong>
            {item.code} - {item.label}:
          </strong>{" "}
          {item.description}
        </p>
      ))}

      <h3>Rumpun Jurusan yang Layak Dieksplorasi</h3>
      <ul>
        {result.interpretation.suggestedMajorClusters.map((major) => (
          <li key={major}>{major}</li>
        ))}
      </ul>

      <h3>Catatan Konseling</h3>
      <ul>
        {result.interpretation.counselingNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <p className="muted">
        Kelengkapan jawaban: {result.overallCompleteness.percentage}% (
        {result.overallCompleteness.answeredItems}/
        {result.overallCompleteness.expectedItems})
      </p>
    </div>
  );
}

function groupItems(items: SdsItem[]) {
  const grouped = {} as Record<SdsSection, Record<RiasecCode, SdsItem[]>>;

  for (const item of items) {
    if (!grouped[item.section]) {
      grouped[item.section] = {
        R: [],
        I: [],
        A: [],
        S: [],
        E: [],
        C: [],
      };
    }

    grouped[item.section][item.code].push(item);
  }

  return grouped;
}
