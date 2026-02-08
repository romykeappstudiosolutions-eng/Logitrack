
import React, { useState } from 'react';
import { PickingOrder, ReceptionOrder, ConditioningOrder, StorageOrder } from '../types.ts';
import * as XLSX from 'xlsx';
import { Icons } from '../constants.tsx';
import { jsPDF } from 'jspdf';

type ReportTab = 'PICKING' | 'RECEPTION' | 'VAS' | 'STORAGE';

export default function Reports({ 
  orders, 
  receptions = [], 
  conditioning = [],
  storage = []
}: { 
  orders: PickingOrder[], 
  receptions?: ReceptionOrder[], 
  conditioning?: ConditioningOrder[],
  storage?: StorageOrder[]
}) {
  const [tab, setTab] = useState<ReportTab>('PICKING');
  const [filter, setFilter] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filterItems = (items: any[]) => {
    return items.filter(item => {
      const matchDate = item.fecha >= startDate && item.fecha <= endDate;
      const matchText = (item.documento || '').toLowerCase().includes(filter.toLowerCase()) || 
                        (item.operador || '').toLowerCase().includes(filter.toLowerCase()) ||
                        (item.proveedor || '').toLowerCase().includes(filter.toLowerCase()) ||
                        (item.cliente || '').toLowerCase().includes(filter.toLowerCase()) ||
                        (item.ubicacionEntrada || '').toLowerCase().includes(filter.toLowerCase()) ||
                        (item.codigoProducto || '').toLowerCase().includes(filter.toLowerCase()) ||
                        (item.ubicacionSalida || '').toLowerCase().includes(filter.toLowerCase());
      return matchDate && matchText;
    });
  };

  const currentOrders = filterItems(orders);
  const currentReceptions = filterItems(receptions);
  const currentConditioning = filterItems(conditioning);
  const currentStorage = filterItems(storage);

  const exportExcel = () => {
    let data = [];
    if (tab === 'PICKING') {
      data = currentOrders.map(o => ({
        'Fecha Operativa': o.fecha,
        'Fecha Documento': o.fechaDocumento || 'N/A',
        'Hora Generación': o.horaGeneracion || 'N/A',
        Documento: o.documento,
        Cliente: o.cliente,
        'Tipo Lista': o.tipoLista,
        'Operador Picking': o.operador,
        'Inicio Picking': o.horaInicio,
        'Fin Picking': o.horaFin,
        'Líneas Picking': o.lineas,
        'Unidades Picking': o.cantidad,
        'Duración Pick (Min)': o.duracionMinutos,
        'Status Pick': o.status,
        'Operador Packing': o.operadorPacking || 'N/A',
        'Inicio Packing': o.horaInicioPacking || 'N/A',
        'Fin Packing': o.horaFinPacking || 'N/A',
        'Líneas Packing': o.lineasPacking || 'N/A',
        'Unidades Packing': o.cantidadPacking || 'N/A',
        'Duración Pack (Min)': o.duracionPackingMinutos || 0,
        'Status Pack': o.statusPacking || 'PENDIENTE'
      }));
    } else if (tab === 'RECEPTION') {
      data = currentReceptions.map(r => ({
        Fecha: r.fecha,
        Documento: r.documento,
        Proveedor: r.proveedor,
        'Tipo Recepción': r.tipo,
        Operador: r.operador,
        'Inicio': r.horaInicio,
        'Fin': r.horaFin,
        'Líneas': r.lineas,
        'Unidades': r.cantidad,
        'Duración (Min)': r.duracionMinutos,
        'Evidencia Foto': r.fotoEvidencia ? 'Si' : 'No'
      }));
    } else if (tab === 'VAS') {
      data = currentConditioning.map(c => ({
        Fecha: c.fecha,
        Documento: c.documento,
        Cliente: c.cliente,
        'Tipo VAS': c.tipo,
        Operador: c.operador,
        'Inicio': c.horaInicio,
        'Fin': c.horaFin,
        'Líneas': c.lineas,
        'Unidades': c.cantidad,
        'Duración (Min)': c.duracionMinutos
      }));
    } else {
      data = currentStorage.map(s => ({
        Fecha: s.fecha,
        'Código Producto': s.codigoProducto || 'N/A',
        'Ubicación Entrada': s.ubicacionEntrada,
        'Ubicación Salida': s.ubicacionSalida,
        'Tipo Bodega': s.tipoBodega,
        Operador: s.operador,
        'Inicio': s.horaInicio,
        'Fin': s.horaFin,
        Unidades: s.cantidad,
        'Duración (Min)': s.duracionMinutos
      }));
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoría Completa");
    XLSX.writeFile(wb, `LogiTrack_Reporte_${tab}_${Date.now()}.xlsx`);
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`REPORTE ${tab} (${startDate} - ${endDate})`, 15, 20);
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    let y = 45;
    
    const items = tab === 'PICKING' ? currentOrders : tab === 'RECEPTION' ? currentReceptions : tab === 'VAS' ? currentConditioning : currentStorage;
    items.forEach(item => {
      const detail = tab === 'RECEPTION' ? `Prov: ${item.proveedor}` : tab === 'VAS' ? `Proc: ${item.tipo}` : tab === 'STORAGE' ? `Mv: ${item.ubicacionEntrada}->${item.ubicacionSalida} [${item.codigoProducto || 'S/C'}]` : `Cli: ${item.cliente}`;
      doc.text(`${item.fecha} | Doc: ${item.documento || 'STORAGE'} | ${detail} | Op: ${item.operador} | ${item.cantidad || 0} U`, 15, y);
      y += 7;
      if (y > 280) { doc.addPage(); y = 20; }
    });

    doc.save(`Reporte_${tab}_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Historial Operativo</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">Auditoría Multi-Módulo</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generatePDF} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 transition-all active:scale-95 shadow-xl">
            <Icons.Pdf /> PDF
          </button>
          <button onClick={exportExcel} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-xl shadow-emerald-50 transition-all active:scale-95">
            <Icons.Report /> Exportar Excel Completo
          </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[8px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Búsqueda General</label>
            <input type="text" placeholder="Documento, cliente, código o responsable..." value={filter} onChange={e=>setFilter(e.target.value)} className="w-full bg-slate-50 px-5 py-3 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-500 transition-all" />
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-[8px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Desde</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-slate-50 px-5 py-3 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-500 transition-all" />
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-[8px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Hasta</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-slate-50 px-5 py-3 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-500 transition-all" />
          </div>
        </div>

        <div className="flex bg-slate-50 p-1 rounded-2xl gap-1 overflow-x-auto">
          <button onClick={()=>setTab('PICKING')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${tab==='PICKING'?'bg-white text-blue-600 shadow-sm':'text-slate-400'}`}>Picking / Packing</button>
          <button onClick={()=>setTab('RECEPTION')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${tab==='RECEPTION'?'bg-white text-indigo-600 shadow-sm':'text-slate-400'}`}>Recepción</button>
          <button onClick={()=>setTab('STORAGE')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${tab==='STORAGE'?'bg-white text-cyan-600 shadow-sm':'text-slate-400'}`}>Almacenaje</button>
          <button onClick={()=>setTab('VAS')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${tab==='VAS'?'bg-white text-orange-600 shadow-sm':'text-slate-400'}`}>Servicios VAS</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[8px] font-black uppercase text-slate-400 border-b">
                <th className="px-6 py-4">Doc / Fecha</th>
                <th className="px-6 py-4">Detalle</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-4 py-4 text-center">Cantidades</th>
                <th className="px-6 py-4 text-right">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tab === 'PICKING' && currentOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/30">
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-black">{o.documento}</p>
                    <p className="text-[8px] text-slate-400">{o.fecha}</p>
                    {o.fechaDocumento && (
                      <p className="text-[7px] text-slate-400 font-bold">DOC: {o.fechaDocumento}</p>
                    )}
                  </td>
                  <td className="px-6 py-4"><p className="text-[10px] font-bold text-slate-700">{o.cliente}</p><p className="text-[7px] text-purple-500 uppercase font-black">{o.tipoLista}</p></td>
                  <td className="px-6 py-4">
                    <div className="text-[9px]"><span className="font-black text-blue-500">PI:</span> {o.operador}</div>
                    <div className="text-[9px]"><span className="font-black text-purple-500">PA:</span> {o.operadorPacking || 'PEND'}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-[10px] font-black">{o.lineas}L / {o.cantidad}U</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[7px] font-black uppercase">{o.statusPacking || 'PEND'}</span>
                  </td>
                </tr>
              ))}
              {tab === 'RECEPTION' && currentReceptions.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/30">
                  <td className="px-6 py-4"><p className="text-[10px] font-black">{r.documento}</p><p className="text-[8px] text-slate-400">{r.fecha}</p></td>
                  <td className="px-6 py-4"><p className="text-[10px] font-bold text-indigo-700 uppercase">{r.proveedor}</p><p className="text-[7px] text-slate-400 uppercase font-black">{r.tipo}</p></td>
                  <td className="px-6 py-4"><p className="text-[10px] font-bold">{r.operador}</p></td>
                  <td className="px-4 py-4 text-center"><span className="text-[10px] font-black">{r.cantidad} U</span></td>
                  <td className="px-6 py-4 text-right"><span className="text-[8px] font-black text-slate-400">{r.duracionMinutos} min</span></td>
                </tr>
              ))}
              {tab === 'STORAGE' && currentStorage.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/30">
                  <td className="px-6 py-4"><p className="text-[10px] font-black">{s.fecha}</p></td>
                  <td className="px-6 py-4"><p className="text-[10px] font-bold text-cyan-700">{s.ubicacionEntrada} → {s.ubicacionSalida}</p><p className="text-[8px] text-indigo-500 font-black">Cód: {s.codigoProducto || 'S/C'}</p><p className="text-[7px] text-slate-400 uppercase font-black">{s.tipoBodega}</p></td>
                  <td className="px-6 py-4"><p className="text-[10px] font-bold">{s.operador}</p></td>
                  <td className="px-4 py-4 text-center"><span className="text-[10px] font-black">{s.cantidad} U</span></td>
                  <td className="px-6 py-4 text-right"><span className="text-[8px] font-black text-slate-400">{s.duracionMinutos} min</span></td>
                </tr>
              ))}
              {tab === 'VAS' && currentConditioning.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/30">
                  <td className="px-6 py-4"><p className="text-[10px] font-black">{c.documento}</p><p className="text-[8px] text-slate-400">{c.fecha}</p></td>
                  <td className="px-6 py-4"><p className="text-[10px] font-bold text-orange-600 uppercase">{c.tipo}</p><p className="text-[7px] text-slate-400">{c.cliente}</p></td>
                  <td className="px-6 py-4"><p className="text-[10px] font-bold">{c.operador}</p></td>
                  <td className="px-4 py-4 text-center"><span className="text-[10px] font-black">{c.cantidad} U</span></td>
                  <td className="px-6 py-4 text-right"><span className="text-[8px] font-black text-slate-400">{c.duracionMinutos} min</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
