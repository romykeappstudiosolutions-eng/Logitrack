
import React, { useState, useMemo } from 'react';
import { Operator, OperatorStats, PickingOrder, ReceptionOrder, ConditioningOrder, StorageOrder } from '../types.ts';
import { Icons } from '../constants.tsx';
import { getOperatorSpecificAnalysis } from '../services/geminiService.ts';
import { jsPDF } from 'jspdf';

export default function Operators({ 
  operators, 
  setOperators, 
  stats,
  orders = [],
  receptions = [],
  conditioning = [],
  storage = []
}: { 
  operators: Operator[], 
  setOperators: React.Dispatch<React.SetStateAction<Operator[]>>, 
  stats: OperatorStats[],
  orders?: PickingOrder[],
  receptions?: ReceptionOrder[],
  conditioning?: ConditioningOrder[],
  storage?: StorageOrder[]
}) {
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Estados para Rango de Fechas
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Cálculo de métricas filtradas por rango de fechas para el operador seleccionado
  const filteredMetrics = useMemo(() => {
    if (!selectedOp) return null;

    const opName = selectedOp.name.trim();
    const filterFn = (item: any) => item.fecha >= startDate && item.fecha <= endDate && (item.operador === opName || item.operadorPacking === opName);

    const fOrders = orders.filter(o => o.fecha >= startDate && o.fecha <= endDate);
    const fRecs = receptions.filter(r => r.fecha >= startDate && r.fecha <= endDate && r.operador === opName);
    const fCond = conditioning.filter(c => c.fecha >= startDate && c.fecha <= endDate && c.operador === opName);
    const fStor = storage.filter(s => s.fecha >= startDate && s.fecha <= endDate && s.operador === opName);

    // Picking específico
    const opPickOrders = fOrders.filter(o => o.operador === opName);
    const totalLines = opPickOrders.reduce((acc, o) => acc + (Number(o.lineas) || 0), 0);
    const totalQty = opPickOrders.reduce((acc, o) => acc + (Number(o.cantidad) || 0), 0);
    const totalPickMin = opPickOrders.reduce((acc, o) => acc + (Number(o.duracionMinutos) || 0), 0);
    
    // Packing específico
    const opPackOrders = fOrders.filter(o => o.operadorPacking === opName);
    const totalPackLines = opPackOrders.reduce((acc, o) => acc + (Number(o.lineasPacking || o.lineas) || 0), 0);
    const totalPackQty = opPackOrders.reduce((acc, o) => acc + (Number(o.cantidadPacking || o.cantidad) || 0), 0);
    const totalPackMin = opPackOrders.reduce((acc, o) => acc + (Number(o.duracionPackingMinutos) || 0), 0);

    // Otros procesos
    const totalRecQty = fRecs.reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
    const totalRecMin = fRecs.reduce((acc, r) => acc + (Number(r.duracionMinutos) || 0), 0);
    const totalVasQty = fCond.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0);
    const totalVasLines = fCond.reduce((acc, c) => acc + (Number(c.lineas) || 0), 0);
    const totalVasMin = fCond.reduce((acc, c) => acc + (Number(c.duracionMinutos) || 0), 0);

    return {
      name: opName,
      totalLines,
      totalQuantity: totalQty,
      totalPickMinutes: totalPickMin,
      pickRecords: opPickOrders.length,
      efficiency: totalPickMin > 0 ? (totalLines / (totalPickMin / 60)) : 0,
      
      totalPackLines,
      totalPackQuantity: totalPackQty,
      totalPackMinutes: totalPackMin,
      packRecords: opPackOrders.length,
      packingEfficiency: totalPackMin > 0 ? (totalPackLines / (totalPackMin / 60)) : 0,

      totalRecLines: fRecs.reduce((acc, r) => acc + (Number(r.lineas) || 0), 0),
      totalRecQuantity: totalRecQty,
      totalRecMinutes: totalRecMin,
      recRecords: fRecs.length,
      receptionEfficiency: totalRecMin > 0 ? (totalRecQty / (totalRecMin / 60)) : 0,

      totalVasLines: totalVasLines,
      totalVasQuantity: totalVasQty,
      totalVasMinutes: totalVasMin,
      vasRecords: fCond.length,
      conditioningEfficiency: totalVasMin > 0 ? (totalVasLines / (totalVasMin / 60)) : 0,

      totalOrders: opPickOrders.length + opPackOrders.length
    } as OperatorStats;
  }, [selectedOp, startDate, endDate, orders, receptions, conditioning, storage]);

  const handleCardClick = (o: Operator) => {
    if (confirmingId) return;
    setSelectedOp(o);
    setAiAnalysis(null);
  };

  const fetchAiReport = async () => {
    if (!filteredMetrics) return;
    setLoadingAi(true);
    const analysis = await getOperatorSpecificAnalysis(filteredMetrics.name, filteredMetrics, { start: startDate, end: endDate });
    setAiAnalysis(analysis);
    setLoadingAi(false);
  };

  const downloadPdfReport = () => {
    if (!filteredMetrics) return;
    const doc = new jsPDF();
    
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SCORECARD DE PRODUCTIVIDAD", 20, 25);
    doc.setFontSize(10);
    doc.text(`COLABORADOR: ${filteredMetrics.name.toUpperCase()} | PERIODO: ${startDate} al ${endDate}`, 20, 35);
    doc.text(`EMISIÓN: ${new Date().toLocaleDateString()}`, 20, 42);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text("1. MÉTRICAS DEL PERIODO SELECCIONADO", 20, 65);
    
    let y = 75;
    const dataRows = [
      { p: "PICKING", l: filteredMetrics.totalLines, u: filteredMetrics.totalQuantity, t: filteredMetrics.totalPickMinutes, ef: filteredMetrics.efficiency.toFixed(1) + " L/H" },
      { p: "PACKING", l: filteredMetrics.totalPackLines, u: filteredMetrics.totalPackQuantity, t: filteredMetrics.totalPackMinutes, ef: (filteredMetrics.packingEfficiency || 0).toFixed(1) + " L/H" },
      { p: "RECEPCIÓN", l: filteredMetrics.totalRecLines, u: filteredMetrics.totalRecQuantity, t: filteredMetrics.totalRecMinutes, ef: (filteredMetrics.receptionEfficiency || 0).toFixed(1) + " U/H" },
      { p: "VAS (ACOND)", l: filteredMetrics.totalVasLines, u: filteredMetrics.totalVasQuantity, t: filteredMetrics.totalVasMinutes, ef: (filteredMetrics.conditioningEfficiency || 0).toFixed(1) + " L/H" }
    ];

    dataRows.forEach(d => {
      doc.setFontSize(10);
      doc.text(`• ${d.p}:`, 20, y);
      doc.setFontSize(8);
      doc.text(`  Líneas: ${d.l} | Unidades: ${d.u} | Tiempo: ${d.t} min | Eficiencia: ${d.ef}`, 25, y + 5);
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
    doc.text("LogiTrack Enterprise Edition - Reporte Temporal", 105, 285, { align: 'center' });

    doc.save(`Scorecard_${filteredMetrics.name}_${startDate}_${endDate}.pdf`);
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
            <div key={o.id} onClick={() => handleCardClick(o)} className={`p-4 bg-white border rounded-[2rem] flex items-center gap-4 group cursor-pointer transition-all ${confirmingId === o.id ? 'border-red-500 bg-red-50' : selectedOp?.id === o.id ? 'border-blue-500 bg-blue-50/30 shadow-md' : 'border-slate-100 hover:border-blue-200'}`}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black bg-slate-900 text-white shrink-0">{o.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-slate-900 truncate">{o.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{o.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedOp && filteredMetrics ? (
          <div className="bg-white p-10 rounded-[3.5rem] border shadow-2xl space-y-8 animate-in zoom-in-95 h-full flex flex-col">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center text-3xl font-black shrink-0">{selectedOp.name.charAt(0)}</div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 leading-none">{selectedOp.name}</h2>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Auditado por LogiTrack AI</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={fetchAiReport} disabled={loadingAi} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl flex items-center gap-2">
                      {loadingAi ? 'ANALIZANDO...' : 'AUDITORÍA IA RANGO'}
                   </button>
                   <button onClick={downloadPdfReport} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2">
                      <Icons.Pdf /> PDF GERENCIAL
                   </button>
                </div>
             </div>

             {/* Rango de Fechas para el Scorecard */}
             <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 shrink-0">
                <div className="flex flex-col">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-2 mb-1">Rango Desde</label>
                  <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black border outline-none focus:border-blue-500" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-2 mb-1">Rango Hasta</label>
                  <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black border outline-none focus:border-blue-500" />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-auto">Resultados del periodo</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                <MetricBox label="Pick Líneas" val={filteredMetrics.totalLines} sub="Rango Fechas" color="blue" />
                <MetricBox label="Pick Unid." val={filteredMetrics.totalQuantity} sub="Rango Fechas" color="blue" />
                <MetricBox label="Eficiencia Pick" val={filteredMetrics.efficiency.toFixed(1)} sub="L/H Periodo" color="blue" />
                <MetricBox label="Pack Líneas" val={filteredMetrics.totalPackLines} sub="Rango Fechas" color="purple" />
                
                <MetricBox label="Pack Unid." val={filteredMetrics.totalPackQuantity} sub="Rango Fechas" color="purple" />
                <MetricBox label="Eficiencia Pack" val={(filteredMetrics.packingEfficiency || 0).toFixed(1)} sub="L/H Periodo" color="purple" />
                <MetricBox label="Rec Unid." val={filteredMetrics.totalRecQuantity} sub="Inbound Periodo" color="indigo" />
                <MetricBox label="VAS Unid." val={filteredMetrics.totalVasQuantity} sub="VAS Periodo" color="orange" />
             </div>

             <div className="flex-1 bg-slate-50/50 border border-dashed rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Icons.Brain /> Auditoría de Desempeño Temporal
                </h4>
                {aiAnalysis ? (
                  <div className="prose prose-sm prose-slate max-w-none text-slate-600 font-medium leading-relaxed">
                    {aiAnalysis.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
                     <p className="text-[9px] font-black uppercase tracking-widest max-w-[200px]">Ajuste el rango de fechas y pulse AUDITORÍA IA para un análisis contextual del periodo.</p>
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
