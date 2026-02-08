
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

  const processedDocs = new Set(orders.filter(o => o.statusPacking === 'Procesado').map(o => o.documento));
  const compliance = masterBase.length > 0 ? (processedDocs.size / masterBase.length) * 100 : 0;

  const totalRecUnits = receptions.reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
  const totalVasUnits = conditioning.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0);
  const totalStorageUnits = storage.reduce((acc, s) => acc + (Number(s.cantidad) || 0), 0);

  const runAi = async () => {
    setLoading(true);
    const res = await getLogisticAnalysis(orders, stats);
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
    doc.text(`EMISIÓN: ${new Date().toLocaleString()} - LOGITRACK AI SYSTEM`, 20, 35);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text("1. ANÁLISIS DE OPERACIÓN (IA)", 20, 60);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(insight.replace(/[#*]/g, ''), 170);
    doc.text(splitText, 20, 70);

    let y = 70 + (splitText.length * 6);
    doc.text("2. RENDIMIENTO POR PROCESO", 20, y + 10);
    doc.text(`- Picking/Packing: ${orders.length} lotes`, 25, y + 20);
    doc.text(`- Recepción: ${totalRecUnits} unidades`, 25, y + 28);
    doc.text(`- Almacenamiento: ${totalStorageUnits} unidades`, 25, y + 36);
    doc.text(`- VAS: ${totalVasUnits} unidades`, 25, y + 44);

    doc.save(`Reporte_Gerencial_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20 max-w-[1500px] mx-auto">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-slate-200 pb-10">
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
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={runAi} 
            disabled={loading} 
            className="bg-slate-900 hover:bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs flex items-center gap-4 shadow-2xl transition-all active:scale-95"
          >
            {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Icons.Brain />}
            <span className="tracking-widest uppercase">Generar Auditoría IA</span>
          </button>
          {insight && (
            <button onClick={downloadManagerialReport} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs flex items-center gap-4 shadow-xl active:scale-95 transition-all">
              <Icons.Pdf /> PDF GERENCIAL
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8">
        <GiantKPI title="Cumplimiento" val={`${compliance.toFixed(1)}%`} sub="Progreso Master" icon={Icons.Dashboard} color="indigo" desc="Efectividad despacho" />
        <GiantKPI title="Inbound Flow" val={totalRecUnits.toLocaleString()} sub="Unidades" icon={Icons.Reception} color="blue" desc="Entradas registradas" />
        <GiantKPI title="Almacenaje" val={totalStorageUnits.toLocaleString()} sub="Unidades" icon={Icons.Storage} color="cyan" desc="Movimientos bodega" />
        <GiantKPI title="VAS Production" val={totalVasUnits.toLocaleString()} sub="Unidades" icon={Icons.Conditioning} color="orange" desc="Procesos VAS" />
        <GiantKPI title="Eficiencia" val={(stats.reduce((a,s)=>a+s.efficiency,0)/(stats.length||1)).toFixed(1)} sub="L/H" icon={Icons.Users} color="emerald" desc="Promedio staff" />
      </section>

      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Rendimiento Multiproceso</h3>
          <div className="flex gap-6 bg-slate-50 p-4 rounded-3xl border border-slate-100 overflow-x-auto max-w-full">
            <LegendIndicator color="#3b82f6" label="Pick" />
            <LegendIndicator color="#a855f7" label="Pack" />
            <LegendIndicator color="#06b6d4" label="Rec" />
            <LegendIndicator color="#0891b2" label="Alm" />
            <LegendIndicator color="#f97316" label="VAS" />
          </div>
        </div>
        <div className="h-[500px]">
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
