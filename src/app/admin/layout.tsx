"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, KeySquare, Users, FileBarChart2, Menu, X, Rocket, ShieldAlert, LogOut, Activity, ClipboardCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const menuSections = [
    {
      title: "Dashboard & Tools",
      links: [
        { href: "/admin", icon: <Home className="w-4 h-4" />, label: "Dashboard" },
        { href: "/admin/dap", icon: <FileBarChart2 className="w-4 h-4" />, label: "Penilaian Grafis" },
        { href: "/admin/validity", icon: <ShieldAlert className="w-4 h-4" />, label: "Analisis Validitas" },
      ]
    },
    {
      title: "Kesiapan SD (Anak)",
      links: [
        { href: "/admin/clients/list/child", icon: <Users className="w-4 h-4" />, label: "Direktori Klien" },
        { href: "/admin/reports/list/child", icon: <FileBarChart2 className="w-4 h-4" />, label: "Laporan Asesmen" },
        { href: "/admin/observation/child", icon: <ClipboardCheck className="w-4 h-4" />, label: "Observasi & Wawancara" },
        { href: "/admin/tracking", icon: <Activity className="w-4 h-4" />, label: "Tracking Progres Ortu" },
      ]
    },
    {
      title: "Penjurusan (Remaja)",
      links: [
        { href: "/admin/clients/list/student", icon: <Users className="w-4 h-4" />, label: "Direktori Klien" },
        { href: "/admin/reports/list/student", icon: <FileBarChart2 className="w-4 h-4" />, label: "Laporan Asesmen" },
        { href: "/admin/observation/student", icon: <ClipboardCheck className="w-4 h-4" />, label: "Observasi & Wawancara" },
      ]
    },
    {
      title: "Rekrutmen (Pegawai)",
      links: [
        { href: "/admin/clients/list/employee", icon: <Users className="w-4 h-4" />, label: "Direktori Klien" },
        { href: "/admin/reports/list/employee", icon: <FileBarChart2 className="w-4 h-4" />, label: "Laporan Asesmen" },
        { href: "/admin/observation/employee", icon: <ClipboardCheck className="w-4 h-4" />, label: "Observasi & Wawancara" },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/50 backdrop-blur-2xl border-r border-slate-800/60 text-white flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-3">
	               <img src="/logo-lentera-batin.png" alt="Lentera Batin" className="w-9 h-9 object-contain" />
	               <div>
	                 <span className="font-black text-2xl tracking-tighter text-white">Lentera Batin</span>
	                 <div className="text-[10px] text-teal-400 -mt-1 font-medium">ASSESSMENT</div>
	               </div>
	             </div>
          </div>
          <button
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-5 px-4 overflow-y-auto">
          {menuSections.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{section.title}</p>
              {section.links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-4 font-semibold group relative overflow-hidden ${isActive ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    {isActive && (
                       <motion.div
                         layoutId={`active-nav-${idx}`}
                         className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-xl"
                         transition={{ type: "spring", stiffness: 300, damping: 30 }}
                       />
                    )}
                    <div className={`relative z-10 ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400 transition-colors'}`}>
                      {link.icon}
                    </div>
                    <span className="relative z-10 text-sm">{link.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800/50 space-y-4">
          <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4">
             <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-slate-300" />
             </div>
             <div>
                <p className="text-sm font-bold text-slate-200">Administrator</p>
                <p className="text-xs text-emerald-400 font-medium">Online &bull; v2.0</p>
             </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-10">
        {/* Mobile Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center px-4 md:hidden shrink-0 gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg text-white">Lentera Batin Assessment</span>
        </header>

        <main className="flex-1 overflow-y-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
