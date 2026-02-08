
import React, { useState } from 'react';
import { Operator, OperatorStats } from '../types.ts';
import { Icons } from '../constants.tsx';
import { getOperatorSpecificAnalysis } from '../services/geminiService.ts';
import { jsPDF } from 'jspdf';

export default function Operators({ operators, setOperators, stats }: { operators: Operator[], setOperators: React.Dispatch<React.SetStateAction<Operator[]>>, stats: OperatorStats[] }) {
  const [selected, setSelected] = useState<OperatorStats | null>(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleCardClick = (o: Operator) => {
    if (confirmingId) return;
    const s = stats.find(x => x.name === o.name) || {
      name: o.name, totalOrders: 0, totalQuantity: 0, totalLines: 0, totalPickMinutes: 0, pickRecords: 0,
      totalPackLines: 0, totalPackQuantity: 0, totalPackMinutes: 0, packRecords: 0,
      totalRecLines: 0, totalRecQuantity: 0, totalRecMinutes: 0, recRecords: 0,
      totalVasLines: 0, totalVasQuantity: 0, totalVasMinutes: 0, vasRecords: 0,
      avgDuration: 0, efficiency: 0
    };
    setSelected(s as OperatorStats);
    setAiAnalysis(null);
  };

  const fetchAiReport = async () => {
    if (!selected) return;
    setLoadingAi(true);
    const analysis = await getOperatorSpecificAnalysis(selected.name, selected);
    setAiAnalysis(analysis);
    setLoadingAi(false);
  };

  const downloadPdfReport = () => {
    if (!selected) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SCORECARD DE PRODUCTIVIDAD", 20, 25);
    doc.setFontSize(10);
    doc.text(`LOGITRACK AI - AUDITORÍA DE COLABORADOR: ${selected.name.toUpperCase()}`, 20, 35);
    doc.text(`CORTE AL: ${new Date().toLocaleDateString()}`, 20, 42);

    // Métricas de Volumen
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text("1. VOLÚMENES Y REGISTROS POR PROCESO", 20, 65);
    
    doc.setFontSize(9);
    let y = 75;
    const data = [
      { p: "PICKING", l: selected.totalLines, u: selected.totalQuantity, t: selected.totalPickMinutes, r: selected.pickRecords },
      { p: "PACKING", l: selected.totalPackLines, u: selected.totalPackQuantity, t: selected.totalPackMinutes, r: selected.packRecords },
      { p: "RECEPCIÓN", l: selected.totalRecLines, u: selected.totalRecQuantity, t: selected.totalRecMinutes, r: selected.recRecords },
      { p: "VAS (ACOND)", l: selected.totalVasLines, u: selected.totalVasQuantity, t: selected.totalVasMinutes, r: selected.vasRecords }
    ];

    data.forEach(d => {
      doc.setFontSize(10);
      doc.text(`• ${d.p}:`, 20, y);
      doc.setFontSize(8);
      doc.text(`  Artículos/Líneas: ${d.l} | Unidades: ${d.u} | Tiempo: ${d.t} min | Registros: ${d.r}`, 25, y + 5);
      y += 15;
    });

    if (aiAnalysis) {
      doc.setFontSize(14);
      doc.text("2. ANÁLISIS ESTRATÉGICO IA", 20, y + 10);
      doc.setFontSize(9);
      const splitAi = doc.splitTextToSize(aiAnalysis.replace(/[#*]/g, ''), 170);
      doc.text(splitAi, 20, y + 20);
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("LogiTrack Enterprise Edition - AI Generated Performance Audit", 105, 285, { align: 'center' });

    doc.save(`Auditoria_${selected.name.replace(/\s+/g, '_')}.pdf`);
  };

  const startDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation(); setConfirmingId(id);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setConfirmingId(null);
  };

  const executeDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault(); e.stopPropagation();
    setOperators(prev => prev.filter(op => op.id !== id));
    if (selected && selected.name === name) setSelected(null);
    setConfirmingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newOp: Operator = { id: Math.random().toString(36).substr(2, 9), name: newName.trim(), role: newRole.trim() || 'Operador Logístico', active: true };
    setOperators(prev => [...prev, newOp]);
    setNewName(''); setNewRole('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl border-slate-100">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Módulo de Personal</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Nombre completo" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-500 transition-all" required />
            <input type="text" placeholder="Cargo u Operación" value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-500 transition-all" />
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black active:scale-95 transition-all">VINCULAR COLABORADOR</button>
          </form>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
          {operators.map((o: Operator) => (
            <div key={o.id} onClick={() => handleCardClick(o)} className={`p-4 bg-white border rounded-[2rem] flex items-center gap-4 group cursor-pointer transition-all ${confirmingId === o.id ? 'border-red-500 bg-red-50' : selected?.name === o.name ? 'border-blue-500 bg-blue-50/30 shadow-md' : 'border-slate-100 hover:border-blue-200'}`}>
              {confirmingId !== o.id ? (
                <>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black bg-slate-900 text-white shrink-0">{o.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-slate-900 truncate">{o.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{o.role}</p>
                  </div>
                  <button onClick={(e) => startDelete(e, o.id)} className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all active:scale-90 shadow-sm opacity-0 group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-between gap-2 animate-in fade-in zoom-in-95">
                  <p className="text-[9px] font-black text-red-600 uppercase">¿BORRAR?</p>
                  <div className="flex gap-1">
                    <button onClick={(e) => executeDelete(e, o.id, o.name)} className="bg-red-600 text-white px-3 py-2 rounded-xl text-[8px] font-black uppercase">SÍ</button>
                    <button onClick={cancelDelete} className="bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-[8px] font-black uppercase">NO</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selected ? (
          <div className="bg-white p-10 rounded-[3.5rem] border shadow-2xl space-y-8 animate-in zoom-in-95 h-full flex flex-col">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center text-3xl font-black shrink-0">{selected.name.charAt(0)}</div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 leading-none">{selected.name}</h2>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Auditado por LogiTrack AI</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={fetchAiReport} disabled={loadingAi} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2">
                      {loadingAi ? 'ANALIZANDO...' : 'AUDITORÍA IA'}
                   </button>
                   <button onClick={downloadPdfReport} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2">
                      <Icons.Pdf /> PDF GERENCIAL
                   </button>
                </div>
             </div>

             {/* Cuadrícula Scorecard de Productividad Real */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                <MetricBox label="Pick Líneas" val={selected.totalLines} sub="Artículos" color="blue" />
                <MetricBox label="Pick Unid." val={selected.totalQuantity} sub="Cant. Física" color="blue" />
                <MetricBox label="Pick Tiempo" val={selected.totalPickMinutes} sub="Minutos Totales" color="blue" />
                <MetricBox label="Pick Registros" val={selected.pickRecords} sub="Documentos" color="blue" />
                
                <MetricBox label="Pack Líneas" val={selected.totalPackLines} sub="Artículos" color="purple" />
                <MetricBox label="Pack Unid." val={selected.totalPackQuantity} sub="Cant. Física" color="purple" />
                <MetricBox label="Pack Tiempo" val={selected.totalPackMinutes} sub="Minutos Totales" color="purple" />
                <MetricBox label="Pack Registros" val={selected.packRecords} sub="Documentos" color="purple" />

                <MetricBox label="Rec Líneas" val={selected.totalRecLines} sub="Inbound Art" color="indigo" />
                <MetricBox label="VAS Líneas" val={selected.totalVasLines} sub="Acondic. Art" color="orange" />
                <MetricBox label="Rec Tiempo" val={selected.totalRecMinutes} sub="Inbound Min" color="indigo" />
                <MetricBox label="VAS Tiempo" val={selected.totalVasMinutes} sub="VAS Min" color="orange" />
             </div>

             <div className="flex-1 bg-slate-50/50 border border-dashed rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Icons.Brain /> Auditoría de Desempeño y Productividad
                </h4>
                {aiAnalysis ? (
                  <div className="prose prose-sm prose-slate max-w-none text-slate-600 font-medium leading-relaxed">
                    {aiAnalysis.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
                     <p className="text-[9px] font-black uppercase tracking-widest max-w-[200px]">Pulse AUDITORÍA IA para procesar volúmenes de artículos, cantidades y tiempos de ejecución.</p>
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-slate-100 rounded-[4rem] min-h-[400px]">
            <Icons.Users />
            <p className="font-black uppercase text-[10px] mt-4 tracking-widest">Seleccione un operador para ver auditoría</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBox({ label, val, sub, color }: any) {
  const themes: any = {
    blue: 'bg-blue-50/50 border-blue-100/50 text-blue-600',
    purple: 'bg-purple-50/50 border-purple-100/50 text-purple-600',
    indigo: 'bg-indigo-50/50 border-indigo-100/50 text-indigo-600',
    orange: 'bg-orange-50/50 border-orange-100/50 text-orange-600'
  };

  return (
    <div className={`${themes[color]} p-5 rounded-3xl border text-center transition-all hover:shadow-md`}>
      <p className="text-[8px] font-black uppercase mb-1 opacity-60 tracking-widest">{label}</p>
      <p className="text-2xl font-black">{val}</p>
      <p className="text-[8px] font-bold uppercase opacity-40 mt-1">{sub}</p>
    </div>
  );
}
