'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function ParentQuestionnairePage() {
  const [tokenCode, setTokenCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenError, setTokenError] = useState("");
  
  const [clientData, setClientData] = useState<any>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  
  const [step, setStep] = useState<"LOGIN" | "FORM" | "SUCCESS">("LOGIN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom Form State
  const [formData, setFormData] = useState({
    kehamilan: "",
    motorikKasar: "",
    motorikHalus: "",
    bahasa: "",
    sosial: "",
    emosi: "",
    catatan: ""
  });

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenCode.trim() || !tokenCode.startsWith("CHI-")) {
      setTokenError("Harap masukkan token anak (berawalan CHI-).");
      return;
    }
    
    setIsVerifying(true);
    setTokenError("");
    
    try {
      const res = await fetch("/api/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenCode.toUpperCase() }),
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error);
      
      setClientData(data.client);
      setTokenId(data.token_id);
      setStep("FORM");
    } catch (err: any) {
      setTokenError(err.message || "Token tidak valid.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFormChange = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Create a test_results entry for PARENT_Q
      const res = await fetch("/api/start-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_id: tokenId, client_id: clientData.id, test_code: "PARENT_Q" })
      });
      const startData = await res.json();
      
      if (!startData.success) {
         // If it already exists or failed, we just try to update via save-result
      }
      const testResultId = startData.test_result_id;
      
      // Submit the form data
      await fetch("/api/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_result_id: testResultId,
          resultsLog: formData,
          clientData: clientData
        })
      });
      
      setStep("SUCCESS");
    } catch (err) {
      alert("Gagal menyimpan data kuesioner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "LOGIN") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Kuesioner Orang Tua</h1>
          <p className="text-slate-500 mb-8 text-sm">Silakan masukkan Kode Token Anak (cth: CHI-ABC12) yang Anda terima untuk mengisi formulir riwayat perkembangan.</p>
          
          <form onSubmit={handleVerifyToken}>
            <input 
              type="text" 
              placeholder="CHI-XXXXX" 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-center font-bold tracking-widest text-xl rounded-2xl px-6 py-4 mb-4 focus:outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all uppercase"
              value={tokenCode}
              onChange={(e) => setTokenCode(e.target.value.toUpperCase())}
            />
            {tokenError && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-sm font-medium mb-4 justify-center">
                <AlertCircle className="w-4 h-4" /> {tokenError}
              </div>
            )}
            <button 
              type="submit" 
              disabled={isVerifying || !tokenCode}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-200 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
              {isVerifying ? "Mengecek..." : "Masuk ke Formulir"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (step === "SUCCESS") {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-10 max-w-md w-full shadow-xl shadow-teal-100 border border-teal-100">
          <CheckCircle2 className="w-24 h-24 text-teal-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Terima Kasih!</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Kuesioner riwayat perkembangan <strong>{clientData.name}</strong> telah berhasil disimpan. Data ini akan sangat membantu Psikolog dalam memberikan kesimpulan yang komprehensif.
          </p>
          <button onClick={() => window.location.href = '/'} className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-sm transition-colors">
            Tutup Halaman
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-teal-600 rounded-t-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <FileText className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wider uppercase">Lentera Batin Asesmen</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Formulir Riwayat Anak</h1>
          <p className="opacity-90">Peserta: <strong>{clientData?.name}</strong> (Token: {tokenCode})</p>
        </div>
        
        <div className="bg-white rounded-b-3xl shadow-lg border border-slate-100 p-8">
          <p className="text-slate-600 mb-8 pb-6 border-b border-slate-100 leading-relaxed text-sm">
            Isilah kuesioner berikut sesuai dengan kondisi anak yang sebenarnya. Jawaban Anda bersifat rahasia dan hanya digunakan untuk keperluan asesmen psikologis.
          </p>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block font-bold text-slate-800">1. Riwayat Kehamilan & Kelahiran</label>
              <p className="text-xs text-slate-500">Apakah ada penyulit saat kehamilan atau kelahiran? Lahir cukup bulan/prematur? Normal/Caesar?</p>
              <textarea 
                rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm"
                value={formData.kehamilan} onChange={e => handleFormChange('kehamilan', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-slate-800">2. Perkembangan Motorik Kasar & Halus</label>
              <p className="text-xs text-slate-500">Kapan anak bisa berjalan? Kapan mulai bisa memegang pensil/menggambar?</p>
              <textarea 
                rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm"
                value={formData.motorikKasar} onChange={e => handleFormChange('motorikKasar', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-slate-800">3. Perkembangan Bahasa</label>
              <p className="text-xs text-slate-500">Kapan anak mulai mengucapkan kata pertama? Apakah saat ini ada kendala dalam berbicara atau memahami cerita?</p>
              <textarea 
                rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm"
                value={formData.bahasa} onChange={e => handleFormChange('bahasa', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-slate-800">4. Interaksi Sosial & Pertemanan</label>
              <p className="text-xs text-slate-500">Bagaimana anak berinteraksi dengan teman sebaya? Apakah ia mudah bergaul atau cenderung menyendiri?</p>
              <textarea 
                rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm"
                value={formData.sosial} onChange={e => handleFormChange('sosial', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-slate-800">5. Kematangan Emosi & Perilaku</label>
              <p className="text-xs text-slate-500">Bagaimana sikap anak saat keinginannya tidak dituruti? Apakah ada perilaku tertentu yang membuat Bapak/Ibu khawatir?</p>
              <textarea 
                rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm"
                value={formData.emosi} onChange={e => handleFormChange('emosi', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-slate-800">6. Catatan Tambahan (Opsional)</label>
              <p className="text-xs text-slate-500">Hal lain yang menurut Anda penting diketahui oleh Psikolog.</p>
              <textarea 
                rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm"
                value={formData.catatan} onChange={e => handleFormChange('catatan', e.target.value)}
              />
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end">
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-teal-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {isSubmitting ? "Mengirim Data..." : "Kirim Kuesioner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
