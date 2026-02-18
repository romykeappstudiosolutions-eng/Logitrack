
import React, { useState, useMemo } from 'react';
import { PickingOrder, OperatorStats, MasterOrder, ReceptionOrder, ConditioningOrder, StorageOrder } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getLogisticAnalysis } from '../services/geminiService.ts';
import { Icons } from '../constants.tsx';
import { jsPDF } from 'jspdf';

export default function Dashboard({ 
  orders, 
  stats, 
  masterBase, 
  receptions = [], 
  conditioning = [],
  storage = []
}: { 
  orders: PickingOrder[], 
  stats: OperatorStats[], 
  masterBase: MasterOrder[],
  receptions?: ReceptionOrder[],
  conditioning?: ConditioningOrder[],
  storage?: StorageOrder[]
}) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredData = useMemo(() => {
    const filterByDate = (arr: any[]) => arr.filter(item => item.fecha >= startDate && item.fecha <= endDate);
    
    const fOrders = filterByDate(orders);
    const fReceptions = filterByDate(receptions);
    const fConditioning = filterByDate(conditioning);
    const fStorage = filterByDate(storage);

    const uniqueDocs = Array.from(new Set(fOrders.map(o => o.documento)));
    const totalDocs = uniqueDocs.length;
    
    // Un documento se considera completado si tiene operador de packing asignado
    const processedDocs = uniqueDocs.filter(docId => 
      fOrders.some(o => o.documento === docId && o.operadorPacking && o.operadorPacking.trim() !== '')
    ).length;

    const compliance = totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 0;
    const pending = totalDocs > 0 ? ((totalDocs - processedDocs) / totalDocs) * 100 : 0;

    return {
      orders: fOrders,
      receptions: fReceptions,
      conditioning: fConditioning,
      storage: fStorage,
      metrics: {
        compliance: compliance.toFixed(1),
        pending: pending.toFixed(1),
        totalDocs,
        processedDocs
      }
    };
  }, [orders, receptions, conditioning, storage, startDate, endDate]);

  const totalRecUnits = filteredData.receptions.reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
  const totalVasUnits = filteredData.conditioning.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0);
  const totalStorageUnits = filteredData.storage.reduce((acc, s) => acc + (Number(s.cantidad) || 0), 0);

  const runAi = async () => {
    setLoading(true);
    const res = await getLogisticAnalysis(filteredData.orders, stats, { start: startDate, end: endDate });
    setInsight(res);
    setLoading(false);
  };

  const downloadManagerialReport = () => {
    if (!insight) return;
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("INFORME GERENCIAL LOGÍSTICO", 20, 25);
    doc.setFontSize(10);
    doc.text(`PERIODO: ${startDate} al ${endDate} - LOGITRACK AI`, 20, 35);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text("1. ANÁLISIS DE OPERACIÓN (IA)", 20, 60);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(insight.replace(/[#*]/g, ''), 170);
    doc.text(splitText, 20, 70);
    doc.save(`Auditoria_IA_${startDate}_${endDate}.pdf`);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20 max-w-[1500px] mx-auto">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-slate-200 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl">
              <Icons.Brain />
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Logistics Intelligence</h1>
          </div>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-[0.4em] flex items-center gap-3 ml-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Dashboard de Control Maestro v3.0
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[2.5rem] border shadow-sm">
           <div className="flex flex-col">
             <label className="text-[8px] font-black text-slate-400 uppercase ml-2 mb-1">Desde</label>
             <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black outline-none border focus:border-blue-500 transition-all" />
           </div>
           <div className="flex flex-col">
             <label className="text-[8px] font-black text-slate-400 uppercase ml-2 mb-1">Hasta</label>
             <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black outline-none border focus:border-blue-500 transition-all" />
           </div>
           <button 
             onClick={runAi} 
             disabled={loading} 
             className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] flex items-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
           >
             {loading ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Icons.Brain />}
             <span className="tracking-widest uppercase">AUDITORÍA IA</span>
           </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8">
        <GiantKPI 
          title="Cumplimiento" 
          val={`${filteredData.metrics.compliance}%`} 
          sub="Proceso Completo" 
          icon={Icons.Dashboard} 
          color="indigo" 
          desc={`Pendiente: ${filteredData.metrics.pending}% de ${filteredData.metrics.totalDocs} Pedidos`} 
        />
        <GiantKPI title="Inbound Flow" val={totalRecUnits.toLocaleString()} sub="Unidades" icon={Icons.Reception} color="blue" desc="Entradas registradas" />
        <GiantKPI title="Almacenaje" val={totalStorageUnits.toLocaleString()} sub="Unidades" icon={Icons.Storage} color="cyan" desc="Movimientos bodega" />
        <GiantKPI title="VAS Production" val={totalVasUnits.toLocaleString()} sub="Unidades" icon={Icons.Conditioning} color="orange" desc="Procesos VAS" />
        <GiantKPI title="Eficiencia Pick" val={(stats.reduce((a,s)=>a+s.efficiency,0)/(stats.length||1)).toFixed(1)} sub="L/H" icon={Icons.Users} color="emerald" desc="Promedio staff" />
      </section>

      {insight && (
        <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl animate-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Icons.Brain /></div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Análisis Ejecutivo IA</h3>
           </div>
           <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed">
             {insight.split('\n').map((l,i) => <p key={i}>{l}</p>)}
           </div>
        </div>
      )}

      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Rendimiento Operativo</h3>
          <div className="flex gap-6 bg-slate-50 p-4 rounded-3xl border border-slate-100 overflow-x-auto max-w-full">
            <LegendIndicator color="#3b82f6" label="Pick" />
            <LegendIndicator color="#a855f7" label="Pack" />
            <LegendIndicator color="#06b6d4" label="Rec" />
            <LegendIndicator color="#0891b2" label="Alm" />
            <LegendIndicator color="#f97316" label="VAS" />
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="efficiency" fill="#3b82f6" radius={[4,4,0,0]} barSize={20} />
              <Bar dataKey="packingEfficiency" fill="#a855f7" radius={[4,4,0,0]} barSize={20} />
              <Bar dataKey="receptionEfficiency" fill="#06b6d4" radius={[4,4,0,0]} barSize={20} />
              <Bar dataKey="storageEfficiency" fill="#0891b2" radius={[4,4,0,0]} barSize={20} />
              <Bar dataKey="conditioningEfficiency" fill="#f97316" radius={[4,4,0,0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function GiantKPI({ title, val, sub, icon: Icon, color, desc }: any) {
  const bgColors: any = {
    indigo: 'bg-indigo-600 shadow-indigo-200',
    blue: 'bg-blue-600 shadow-blue-200',
    cyan: 'bg-cyan-600 shadow-cyan-200',
    orange: 'bg-orange-500 shadow-orange-200',
    emerald: 'bg-emerald-600 shadow-emerald-200'
  };

  return (
    <div className={`p-10 rounded-[3.5rem] text-white shadow-2xl transition-all hover:scale-[1.03] hover:-translate-y-2 border-b-8 border-black/10 ${bgColors[color]}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-md">
          <Icon />
        </div>
      </div>
      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">{title}</h4>
      <p className="text-4xl font-black tracking-tighter mb-4">{val}</p>
      <div className="pt-4 border-t border-white/20">
        <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">{sub}</p>
        <p className="text-[8px] font-bold text-white/50 uppercase tracking-tighter">{desc}</p>
      </div>
    </div>
  );
}

function LegendIndicator({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}
