
import React, { useState } from 'react';
import { ReceptionOrder, Operator, TipoRecepcion } from '../types.ts';
import { Icons } from '../constants.tsx';

export default function Reception({ receptions, setReceptions, onDelete, operators }: { receptions: ReceptionOrder[], setReceptions: (recs: ReceptionOrder[]) => void, onDelete: (id: string) => void, operators: Operator[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<any>({
    fecha: new Date().toISOString().split('T')[0], 
    tipo: 'Compra Local', 
    documento: '', 
    proveedor: '', 
    operador: '', 
    horaInicio: '08:00', 
    horaFin: '09:00', 
    cantidad: '', 
    lineas: '', 
    fotoEvidencia: ''
  });

  const tipos: TipoRecepcion[] = ['Compra Local', 'Importación'];

  const handleOpenEdit = (r: ReceptionOrder) => {
    setForm({ ...r });
    setEditingId(r.id);
    setIsConfirming(false);
    setShowForm(true);
  };

  const handleOpenNew = () => {
    setForm({
      fecha: new Date().toISOString().split('T')[0], 
      tipo: 'Compra Local', 
      documento: '', 
      proveedor: '', 
      operador: '', 
      horaInicio: '08:00', 
      horaFin: '09:00', 
      cantidad: '', 
      lineas: '', 
      fotoEvidencia: ''
    });
    setEditingId(null);
    setIsConfirming(false);
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const [h1, m1] = (form.horaInicio || '08:00').split(':').map(Number);
      const [h2, m2] = (form.horaFin || '09:00').split(':').map(Number);
      const dur = (h2 * 60 + m2) - (h1 * 60 + m1);

      const updatedRec: ReceptionOrder = {
        ...form,
        id: editingId || Math.random().toString(36).substr(2, 9),
        cantidad: Number(form.cantidad || 0), 
        lineas: Number(form.lineas || 0),
        duracionMinutos: Math.max(1, dur)
      };

      if (editingId) {
        await setReceptions(receptions.map(r => r.id === editingId ? updatedRec : r));
      } else {
        await setReceptions([updatedRec, ...receptions]);
      }
      
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving reception:', error);
      // The error will be handled by the parent component
    } finally {
      setSaving(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setForm(prev => ({ ...prev, fotoEvidencia: evt.target?.result as string }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Recepción</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gestión de Entradas</p>
        </div>
        <button onClick={handleOpenNew} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">NUEVA RECEPCIÓN</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {receptions.map(r => (
          <div key={r.id} onClick={() => handleOpenEdit(r)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-black text-slate-900">{r.documento}</h4>
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{r.tipo}</p>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.proveedor}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>{r.operador}</span>
              <span>{r.lineas}L / {r.cantidad}U</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
               <span className="text-[9px] font-bold text-slate-400 uppercase">Horario: {r.horaInicio} - {r.horaFin}</span>
               <span className="text-[9px] font-black text-slate-300">{r.fecha}</span>
            </div>
          </div>
        ))}
        {receptions.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No hay recepciones registradas</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black text-xs uppercase tracking-widest">{editingId ? 'Editar Recepción' : 'Nueva Recepción'}</h3>
              <button onClick={()=>setShowForm(false)} className="text-white/60 hover:text-white font-black">✕</button>
            </div>
            
            <div className="p-8 space-y-4 overflow-y-auto custom-scrollbar">
              <form onSubmit={save} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Fecha</label>
                    <input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Tipo de Recepción</label>
                    <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none">
                      {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase">Responsable / Operador</label>
                  <select value={form.operador} onChange={e=>setForm({...form, operador:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required>
                    <option value="">Seleccionar...</option>
                    {operators.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase">Factura / Documento</label>
                  <input type="text" placeholder="Ej: REM-990" value={form.documento} onChange={e=>setForm({...form, documento:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase">Proveedor</label>
                  <input type="text" placeholder="Nombre" value={form.proveedor} onChange={e=>setForm({...form, proveedor:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Hora Inicio</label>
                    <input type="time" value={form.horaInicio} onChange={e=>setForm({...form, horaInicio:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Hora Finalización</label>
                    <input type="time" value={form.horaFin} onChange={e=>setForm({...form, horaFin:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Líneas de Artículo</label>
                    <input type="number" value={form.lineas} onChange={e=>setForm({...form, lineas:e.target.value})} className="w-full bg-transparent text-xl font-black outline-none" required />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Unidades Totales</label>
                    <input type="number" value={form.cantidad} onChange={e=>setForm({...form, cantidad:e.target.value})} className="w-full bg-transparent text-xl font-black outline-none" required />
                  </div>
                </div>

                <div className="relative h-28 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden">
                  {form.fotoEvidencia ? <img src={form.fotoEvidencia} className="w-full h-full object-cover" /> : <div className="text-center opacity-40"><Icons.Upload /><p className="text-[8px] font-black uppercase mt-1">Foto Evidencia</p></div>}
                  <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  {!isConfirming ? (
                    <>
                      <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {saving && <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>}
                        {saving ? 'GUARDANDO...' : (editingId ? 'ACTUALIZAR REGISTRO' : 'GUARDAR RECEPCIÓN')}
                      </button>
                      {editingId && (
                        <button type="button" onClick={() => setIsConfirming(true)} className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-red-100 transition-all">
                          ELIMINAR REGISTRO
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 animate-in zoom-in-95">
                      <p className="text-[9px] font-black text-red-600 uppercase text-center mb-3">¿ESTÁ SEGURO DE ELIMINAR ESTA RECEPCIÓN?</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { onDelete(editingId!); setShowForm(false); }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black text-[10px] uppercase">SÍ, ELIMINAR</button>
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
