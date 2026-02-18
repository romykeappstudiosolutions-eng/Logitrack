
import React, { useState } from 'react';
import { ConditioningOrder, Operator, TipoAcondicionamiento } from '../types.ts';
import { Icons } from '../constants.tsx';

export default function Conditioning({ conditioning, setConditioning, onDelete, operators }: { conditioning: ConditioningOrder[], setConditioning: (c: ConditioningOrder[]) => void, onDelete: (id: string) => void, operators: Operator[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const [form, setForm] = useState<any>({ 
    fecha: new Date().toISOString().split('T')[0], 
    tipo: 'Inkjet', operador: '', cliente: '', documento: '', 
    horaInicio: '08:00', horaFin: '09:00', lineas: '', cantidad: '' 
  });

  const tipos: TipoAcondicionamiento[] = ['Inkjet', 'Leyendas', 'Etiquetado', 'Encajado', 'Borrado e Inkjet', 'Reg San'];

  const handleOpenEdit = (c: ConditioningOrder) => {
    setForm({ ...c });
    setEditingId(c.id);
    setIsConfirming(false);
    setShowForm(true);
  };

  const handleOpenNew = () => {
    setForm({ 
      fecha: new Date().toISOString().split('T')[0], 
      tipo: 'Inkjet', operador: '', cliente: '', documento: '', 
      horaInicio: '08:00', horaFin: '09:00', lineas: '', cantidad: '' 
    });
    setEditingId(null);
    setIsConfirming(false);
    setShowForm(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const [h1, m1] = (form.horaInicio || '08:00').split(':').map(Number);
    const [h2, m2] = (form.horaFin || '08:30').split(':').map(Number);
    const dur = (h2 * 60 + m2) - (h1 * 60 + m1);

    const updatedData: ConditioningOrder = {
      ...form,
      id: editingId || Math.random().toString(36).substr(2, 9),
      cantidad: Number(form.cantidad || 0), lineas: Number(form.lineas || 0),
      duracionMinutos: Math.max(1, dur)
    };

    if (editingId) setConditioning(conditioning.map(c => c.id === editingId ? updatedData : c));
    else setConditioning([updatedData, ...conditioning]);

    setShowForm(false); setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Servicios VAS</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Acondicionamiento Técnico</p>
        </div>
        <button onClick={handleOpenNew} className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">NUEVO PROCESO</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conditioning.map(c => (
          <div key={c.id} onClick={() => handleOpenEdit(c)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-1">
               <h4 className="font-black text-slate-900 leading-tight">DOC: {c.documento || 'S/D'}</h4>
               <span className="text-[9px] font-black text-slate-300">{c.fecha}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase truncate mb-1">CLI: {c.cliente || 'Sin Cliente'}</p>
            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">{c.tipo}</p>
            <div className="flex justify-between text-xs font-bold text-slate-400 border-t border-slate-50 pt-3">
              <span className="truncate max-w-[120px]">{c.operador}</span>
              <span className="text-slate-900">{c.lineas} L / {c.cantidad} U</span>
            </div>
          </div>
        ))}
        {conditioning.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No hay procesos VAS registrados</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-orange-600 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black text-xs uppercase tracking-widest">{editingId ? 'Editar Proceso VAS' : 'Nuevo Proceso VAS'}</h3>
              <button onClick={()=>setShowForm(false)} className="text-white/60 font-black">✕</button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={save} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                    <input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tipo de Proceso</label>
                    <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none">
                      {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Responsable VAS</label>
                  <select value={form.operador} onChange={e=>setForm({...form, operador:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required>
                    <option value="">Seleccionar...</option>
                    {operators.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Documento / Lote</label>
                    <input type="text" placeholder="Ej: DOC-882" value={form.documento} onChange={e=>setForm({...form, documento:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cliente / Destino</label>
                    <input type="text" placeholder="Nombre Cliente" value={form.cliente} onChange={e=>setForm({...form, cliente:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Líneas de Artículo</label>
                    <input type="number" value={form.lineas} onChange={e=>setForm({...form, lineas:e.target.value})} className="w-full bg-transparent text-xl font-black outline-none" required />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unidades Totales</label>
                    <input type="number" value={form.cantidad} onChange={e=>setForm({...form, cantidad:e.target.value})} className="w-full bg-transparent text-xl font-black outline-none" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Horario de Trabajo</label>
                  <div className="flex gap-2">
                    <input type="time" value={form.horaInicio} onChange={e=>setForm({...form, horaInicio:e.target.value})} className="flex-1 bg-slate-50 p-3 rounded-xl text-[10px] font-bold border outline-none" />
                    <input type="time" value={form.horaFin} onChange={e=>setForm({...form, horaFin:e.target.value})} className="flex-1 bg-slate-50 p-3 rounded-xl text-[10px] font-bold border outline-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  {!isConfirming ? (
                    <>
                      <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-orange-700 transition-all">
                        {editingId ? 'ACTUALIZAR PROCESO' : 'REGISTRAR PROCESO'}
                      </button>
                      {editingId && (
                        <button type="button" onClick={() => setIsConfirming(true)} className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-red-100 transition-all">
                          ELIMINAR REGISTRO
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 animate-in zoom-in-95">
                      <p className="text-[9px] font-black text-red-600 uppercase text-center mb-3">¿CONFIRMA ELIMINACIÓN?</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { onDelete(editingId!); setShowForm(false); }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black text-[10px] uppercase">SÍ, BORRAR</button>
                        <button type="button" onClick={() => setIsConfirming(false)} className="flex-1 bg-white text-slate-400 border py-3 rounded-xl font-black text-[10px] uppercase">CANCELAR</button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
