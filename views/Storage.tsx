
import React, { useState } from 'react';
import { StorageOrder, Operator, TipoBodega, ArticleMaster } from '../types.ts';
import { Icons } from '../constants.tsx';

export default function Storage({ 
  storage, 
  setStorage, 
  onDelete, 
  operators,
  articleMaster = []
}: { 
  storage: StorageOrder[], 
  setStorage: (s: StorageOrder[]) => void, 
  onDelete: (id: string) => void, 
  operators: Operator[],
  articleMaster?: ArticleMaster[]
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [showArticleSuggestions, setShowArticleSuggestions] = useState(false);
  
  const [form, setForm] = useState<any>({
    fecha: new Date().toISOString().split('T')[0],
    ubicacionEntrada: '',
    ubicacionSalida: '',
    operador: '',
    horaInicio: '08:00',
    horaFin: '09:00',
    tipoBodega: 'Ambiente',
    cantidad: '',
    codigoProducto: '',
    descripcionProducto: ''
  });

  const tiposBodega: TipoBodega[] = ['Ambiente', 'Refrigerado'];

  const articleSuggestions = articleMaster.filter(a => 
    a.codigo.toLowerCase().includes(searchCode.toLowerCase()) ||
    a.descripcion.toLowerCase().includes(searchCode.toLowerCase())
  ).slice(0, 5);

  const handleSelectArticle = (a: ArticleMaster) => {
    setForm({ ...form, codigoProducto: a.codigo, descripcionProducto: a.descripcion });
    setSearchCode(a.codigo);
    setShowArticleSuggestions(false);
  };

  const handleOpenEdit = (s: StorageOrder) => {
    setForm({ ...s });
    setEditingId(s.id);
    setSearchCode(s.codigoProducto || '');
    setIsConfirming(false);
    setShowForm(true);
  };

  const handleOpenNew = () => {
    setForm({
      fecha: new Date().toISOString().split('T')[0],
      ubicacionEntrada: '',
      ubicacionSalida: '',
      operador: '',
      horaInicio: '08:00',
      horaFin: '09:00',
      tipoBodega: 'Ambiente',
      cantidad: '',
      codigoProducto: '',
      descripcionProducto: ''
    });
    setEditingId(null);
    setSearchCode('');
    setIsConfirming(false);
    setShowForm(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const [h1, m1] = (form.horaInicio || '08:00').split(':').map(Number);
    const [h2, m2] = (form.horaFin || '09:00').split(':').map(Number);
    const dur = (h2 * 60 + m2) - (h1 * 60 + m1);

    const updatedData: StorageOrder = {
      ...form,
      id: editingId || Math.random().toString(36).substr(2, 9),
      cantidad: Number(form.cantidad || 0),
      duracionMinutos: Math.max(1, dur)
    };

    if (editingId) setStorage(storage.map(s => s.id === editingId ? updatedData : s));
    else setStorage([updatedData, ...storage]);

    setShowForm(false); setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Almacenamiento</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Movimientos de Stock</p>
        </div>
        <button onClick={handleOpenNew} className="bg-cyan-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">NUEVO MOVIMIENTO</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storage.map(s => (
          <div key={s.id} onClick={() => handleOpenEdit(s)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="max-w-[75%]">
                <h4 className="font-black text-slate-900 leading-tight">{s.ubicacionEntrada} → {s.ubicacionSalida}</h4>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 truncate">{s.codigoProducto || 'SIN CÓDIGO'}</p>
                {s.descripcionProducto && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate mt-0.5">{s.descripcionProducto}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 block uppercase">{s.fecha}</span>
                <span className={`text-[8px] font-black uppercase tracking-tighter ${s.tipoBodega === 'Refrigerado' ? 'text-blue-500' : 'text-amber-600'}`}>{s.tipoBodega}</span>
              </div>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-slate-300 uppercase">Responsable</p>
                <p className="text-[11px] font-bold text-slate-600 truncate">{s.operador}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-slate-900 leading-none">{s.cantidad}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase">Unidades</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-bold text-slate-400 uppercase">{s.horaInicio} - {s.horaFin}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.duracionMinutos} MIN</span>
            </div>
          </div>
        ))}
        {storage.length === 0 && <div className="col-span-full py-24 text-center text-slate-300 font-black uppercase text-xs tracking-[0.2em] border-4 border-dashed border-slate-100 rounded-[3rem]">No hay movimientos registrados</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-cyan-600 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black text-xs uppercase tracking-widest">{editingId ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h3>
              <button onClick={()=>setShowForm(false)} className="text-white/60 hover:text-white font-black p-2">✕</button>
            </div>
            
            <div className="p-8 space-y-4 overflow-y-auto custom-scrollbar">
              <form onSubmit={save} className="space-y-6">
                
                <div className="bg-slate-50 p-5 rounded-[2rem] space-y-3 border border-slate-100 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Código de Producto (Maestro)</label>
                    {form.descripcionProducto && (
                      <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase">Vinculado</span>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchCode}
                      onChange={(e) => { 
                        const val = e.target.value;
                        setSearchCode(val); 
                        setShowArticleSuggestions(true); 
                        // Autocompletado reactivo si coincide exactamente
                        const exact = articleMaster.find(a => a.codigo.toLowerCase() === val.toLowerCase().trim());
                        setForm({
                          ...form, 
                          codigoProducto: val,
                          descripcionProducto: exact ? exact.descripcion : ''
                        });
                      }}
                      placeholder="Escriba código o escanee..."
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-[11px] font-bold outline-none focus:border-cyan-500 transition-all"
                    />
                    {showArticleSuggestions && searchCode.length >= 1 && articleSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {articleSuggestions.map((a, i) => (
                          <div key={i} onClick={() => handleSelectArticle(a)} className="p-4 hover:bg-cyan-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none group">
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-800 group-hover:text-cyan-600">{a.codigo}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{a.descripcion}</p>
                            </div>
                            <Icons.Dashboard />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {form.descripcionProducto && (
                    <div className="px-1 py-2 bg-white/50 rounded-xl border border-emerald-50">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tight mb-0.5">Producto Detectado:</p>
                      <p className="text-[11px] font-black text-slate-700 leading-tight">{form.descripcionProducto}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Fecha</label>
                    <input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border border-transparent focus:border-slate-200" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo Bodega</label>
                    <select value={form.tipoBodega} onChange={e=>setForm({...form, tipoBodega:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border border-transparent focus:border-slate-200">
                      {tiposBodega.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Responsable del Movimiento</label>
                  <select value={form.operador} onChange={e=>setForm({...form, operador:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border border-transparent focus:border-slate-200" required>
                    <option value="">Seleccionar Operador...</option>
                    {operators.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Ubicación Origen</label>
                    <input type="text" placeholder="Ej: A-10-1" value={form.ubicacionEntrada} onChange={e=>setForm({...form, ubicacionEntrada:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border border-transparent focus:border-slate-200 uppercase" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Ubicación Destino</label>
                    <input type="text" placeholder="Ej: B-05-2" value={form.ubicacionSalida} onChange={e=>setForm({...form, ubicacionSalida:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border border-transparent focus:border-slate-200 uppercase" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Unidades</label>
                    <input type="number" value={form.cantidad} onChange={e=>setForm({...form, cantidad:e.target.value})} className="w-full bg-transparent text-2xl font-black outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Inicio</label>
                        <input type="time" value={form.horaInicio} onChange={e=>setForm({...form, horaInicio:e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-[10px] font-bold border-none outline-none" required />
                      </div>
                      <div className="flex-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Fin</label>
                        <input type="time" value={form.horaFin} onChange={e=>setForm({...form, horaFin:e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-[10px] font-bold border-none outline-none" required />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 shrink-0">
                  {!isConfirming ? (
                    <>
                      <button type="submit" className="w-full bg-cyan-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-cyan-700 transition-all active:scale-95">
                        {editingId ? 'ACTUALIZAR MOVIMIENTO' : 'REGISTRAR MOVIMIENTO'}
                      </button>
                      {editingId && (
                        <button type="button" onClick={() => setIsConfirming(true)} className="w-full bg-red-50 text-red-600 py-4 rounded-[1.5rem] font-black text-[10px] uppercase hover:bg-red-100 transition-all">
                          ELIMINAR REGISTRO
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="bg-red-50 p-5 rounded-[2rem] border border-red-100 animate-in zoom-in-95">
                      <p className="text-[10px] font-black text-red-600 uppercase text-center mb-4 tracking-widest">¿BORRAR ESTE MOVIMIENTO?</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { onDelete(editingId!); setShowForm(false); }} className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">SÍ, ELIMINAR</button>
                        <button type="button" onClick={() => setIsConfirming(false)} className="flex-1 bg-white text-slate-400 border py-3 rounded-2xl font-black text-[10px] uppercase">CANCELAR</button>
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
