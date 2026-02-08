
import React, { useState } from 'react';
import { PickingOrder, Operator, MasterOrder } from '../types.ts';
import { Icons } from '../constants.tsx';

interface ManageOrdersProps {
  orders: PickingOrder[];
  operators: Operator[];
  masterBase: MasterOrder[];
  onSave: (order: PickingOrder) => void;
  onUpdate: (order: PickingOrder) => void;
  onDelete: (id: string) => void;
}

export default function ManageOrders({ orders, operators, masterBase, onSave, onUpdate, onDelete }: ManageOrdersProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [masterSearch, setMasterSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'PICKING' | 'PACKING'>('PICKING');
  
  const [isConfirming, setIsConfirming] = useState(false);

  const [form, setForm] = useState<any>({
    fecha: new Date().toISOString().split('T')[0],
    documento: '', 
    cliente: '', 
    tipoLista: 'Individual (Clientes)', 
    operador: '', 
    horaInicio: '08:00', 
    horaFin: '08:30', 
    status: 'Procesado',
    cantidad: '', 
    lineas: '',
    
    // Nuevos campos
    fechaDocumento: new Date().toISOString().split('T')[0],
    horaGeneracion: '07:00',

    // Campos Packing
    operadorPacking: '', 
    horaInicioPacking: '09:00', 
    horaFinPacking: '09:30',
    statusPacking: 'Pendiente', 
    cantidadPacking: '', 
    lineasPacking: ''
  });

  const handleSelectMaster = (m: MasterOrder) => {
    setForm({ 
      ...form, 
      documento: m.documento, 
      cliente: m.cliente, 
      lineas: m.lineas, 
      cantidad: m.cantidad,
      lineasPacking: m.lineas,
      cantidadPacking: m.cantidad
    });
    setMasterSearch(m.documento);
    setShowSuggestions(false);
  };

  const handleOpenForm = (o?: PickingOrder) => {
    setIsConfirming(false);
    setActiveTab('PICKING');
    if (o) {
      setForm({ ...o });
      setEditingId(String(o.id));
      setMasterSearch(o.documento);
    } else {
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        documento: '', 
        cliente: '', 
        tipoLista: 'Individual (Clientes)', 
        operador: '', 
        horaInicio: '08:00', 
        horaFin: '08:30', 
        status: 'Procesado',
        cantidad: '', 
        lineas: '',
        fechaDocumento: new Date().toISOString().split('T')[0],
        horaGeneracion: '07:00',
        operadorPacking: '', 
        horaInicioPacking: '09:00', 
        horaFinPacking: '09:30',
        statusPacking: 'Pendiente', 
        cantidadPacking: '', 
        lineasPacking: ''
      });
      setEditingId(null);
      setMasterSearch('');
    }
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const [h1, m1] = (form.horaInicio || '08:00').split(':').map(Number);
    const [h2, m2] = (form.horaFin || '08:30').split(':').map(Number);
    const duracion = (h2 * 60 + m2) - (h1 * 60 + m1);

    const [h3, m3] = (form.horaInicioPacking || '09:00').split(':').map(Number);
    const [h4, m4] = (form.horaFinPacking || '09:30').split(':').map(Number);
    const duracionPack = (h4 * 60 + m4) - (h3 * 60 + m3);

    const data = {
      ...form,
      id: editingId || Math.random().toString(36).substr(2, 9),
      duracionMinutos: Math.max(1, duracion),
      duracionPackingMinutos: Math.max(1, duracionPack)
    } as PickingOrder;

    if (editingId) onUpdate(data); else onSave(data);
    setShowForm(false);
  };

  const filtered = orders.filter(o => 
    o.documento.toLowerCase().includes(search.toLowerCase()) || 
    (o.operador || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.operadorPacking || '').toLowerCase().includes(search.toLowerCase()) ||
    o.cliente.toLowerCase().includes(search.toLowerCase())
  );

  const suggestions = masterBase.filter(m => 
    m.documento.toLowerCase().includes(masterSearch.toLowerCase()) ||
    m.cliente.toLowerCase().includes(masterSearch.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Gestión Operativa</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Picking & Packing Independiente</p>
        </div>
        <button 
          onClick={() => handleOpenForm()} 
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[12px] uppercase shadow-xl active:scale-95 transition-all"
        >
          NUEVA ORDEN
        </button>
      </header>

      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <input 
          type="text" 
          placeholder="Buscar por documento, cliente o responsable..." 
          value={search} 
          onChange={e=>setSearch(e.target.value)} 
          className="w-full bg-slate-50 px-5 py-3 rounded-xl text-[11px] font-bold outline-none border focus:border-blue-500 transition-all" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(o => (
          <div key={o.id} onClick={() => handleOpenForm(o)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm active:bg-slate-50 transition-all cursor-pointer relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[16px] font-black text-slate-900 leading-none">{o.documento}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{o.cliente}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-300 block">{o.fecha}</span>
                {o.fechaDocumento && (
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Doc: {o.fechaDocumento}</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Picking
                </p>
                <div className="bg-blue-50/50 p-3 rounded-2xl">
                  <p className="text-[11px] font-black text-slate-800 truncate">{o.operador || 'S/A'}</p>
                  <p className="text-[9px] font-bold text-blue-600/60">{o.lineas}L / {o.cantidad}U</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Packing
                </p>
                <div className="bg-purple-50/50 p-3 rounded-2xl">
                  <p className="text-[11px] font-black text-slate-800 truncate">{o.operadorPacking || 'Pendiente'}</p>
                  <p className="text-[9px] font-bold text-purple-600/60">{o.lineasPacking || o.lineas}L / {o.cantidadPacking || o.cantidad}U</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-widest">Sin resultados operativos</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[95vh] animate-in slide-in-from-bottom duration-300">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="text-[11px] font-black uppercase tracking-widest">Detalle de Operación</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-4 text-xl font-black transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
               <div className="space-y-4">
                 {!editingId && (
                   <div className="bg-slate-50 p-4 rounded-3xl space-y-2 border border-slate-100 relative">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronizar con Master</label>
                      <input 
                        type="text" 
                        value={masterSearch}
                        onChange={(e) => { setMasterSearch(e.target.value); setShowSuggestions(true); }}
                        placeholder="Buscar por documento o cliente..."
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-[11px] font-bold outline-none focus:border-blue-500 transition-all"
                      />
                      {showSuggestions && masterSearch.length > 1 && suggestions.length > 0 && (
                        <div className="absolute z-50 left-4 right-4 top-[calc(100%-8px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                          {suggestions.map((m, i) => (
                            <div key={i} onClick={() => handleSelectMaster(m)} className="p-4 hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none">
                              <div><p className="text-[10px] font-black text-slate-800">{m.documento}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{m.cliente}</p></div>
                              <Icons.Dashboard />
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha Operativa</label>
                      <input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-black outline-none border border-transparent focus:border-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Documento</label>
                      <input type="text" placeholder="FAC-XXXX" value={form.documento} onChange={e=>setForm({...form, documento: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-black outline-none border border-transparent focus:border-slate-200" />
                    </div>
                 </div>

                 {/* Nuevos campos Fecha Documento y Hora Generación */}
                 <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-dashed border-slate-200">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fecha Documento</label>
                      <input type="date" value={form.fechaDocumento} onChange={e=>setForm({...form, fechaDocumento: e.target.value})} className="w-full bg-white p-3 rounded-xl text-[10px] font-bold outline-none border border-slate-100" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Hora Generación</label>
                      <input type="time" value={form.horaGeneracion} onChange={e=>setForm({...form, horaGeneracion: e.target.value})} className="w-full bg-white p-3 rounded-xl text-[10px] font-bold outline-none border border-slate-100" />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cliente / Destino</label>
                    <input type="text" placeholder="Nombre" value={form.cliente} onChange={e=>setForm({...form, cliente: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-black outline-none border border-transparent focus:border-slate-200" />
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('PICKING')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PICKING' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Picking
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('PACKING')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PACKING' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Packing
                    </button>
                 </div>

                 {activeTab === 'PICKING' ? (
                   <div className="space-y-4 animate-in fade-in duration-300">
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Responsable Picking</label>
                        <select value={form.operador} onChange={e=>setForm({...form, operador: e.target.value})} className="w-full bg-blue-50/50 p-4 rounded-2xl text-[11px] font-bold outline-none border border-blue-100">
                          <option value="">-- Seleccionar --</option>
                          {operators.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inicio Picking</label>
                          <input type="time" value={form.horaInicio} onChange={e=>setForm({...form, horaInicio: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fin Picking</label>
                          <input type="time" value={form.horaFin} onChange={e=>setForm({...form, horaFin: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                          <label className="text-[8px] font-black text-blue-400 uppercase">Líneas Picking</label>
                          <input type="number" value={form.lineas} onChange={e=>setForm({...form, lineas: e.target.value})} className="w-full bg-transparent text-xl font-black outline-none" />
                        </div>
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                          <label className="text-[8px] font-black text-blue-400 uppercase">Unidades Picking</label>
                          <input type="number" value={form.cantidad} onChange={e=>setForm({...form, cantidad: e.target.value})} className="w-full bg-transparent text-xl font-black outline-none" />
                        </div>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-4 animate-in fade-in duration-300">
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-purple-500 uppercase tracking-widest">Responsable Packing</label>
                        <select value={form.operadorPacking} onChange={e=>setForm({...form, operadorPacking: e.target.value})} className="w-full bg-purple-50/50 p-4 rounded-2xl text-[11px] font-bold outline-none border border-purple-100">
                          <option value="">-- Seleccionar --</option>
                          {operators.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inicio Packing</label>
                          <input type="time" value={form.horaInicioPacking} onChange={e=>setForm({...form, horaInicioPacking: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fin Packing</label>
                          <input type="time" value={form.horaFinPacking} onChange={e=>setForm({...form, horaFinPacking: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                          <label className="text-[8px] font-black text-purple-400 uppercase">Líneas Packing</label>
                          <input type="number" value={form.lineasPacking} onChange={e=>setForm({...form, lineasPacking: e.target.value})} className="w-full bg-transparent text-xl font-black outline-none" />
                        </div>
                        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                          <label className="text-[8px] font-black text-purple-400 uppercase">Unidades Packing</label>
                          <input type="number" value={form.cantidadPacking} onChange={e=>setForm({...form, cantidadPacking: e.target.value})} className="w-full bg-transparent text-xl font-black outline-none" />
                        </div>
                     </div>
                   </div>
                 )}
               </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 space-y-3">
              {!isConfirming ? (
                <>
                  <button 
                    type="button"
                    onClick={handleSave}
                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[12px] uppercase shadow-2xl active:scale-95 transition-all"
                  >
                    {editingId ? 'ACTUALIZAR TODA LA OPERACIÓN' : 'GUARDAR REGISTRO'}
                  </button>
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={() => setIsConfirming(true)}
                      className="w-full bg-red-50 text-red-600 py-4 rounded-[1.5rem] font-black text-[11px] uppercase transition-all hover:bg-red-100"
                    >
                      ELIMINAR ORDEN
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95">
                  <p className="text-[10px] font-black text-red-600 uppercase text-center mb-1 tracking-widest">¿ESTÁ SEGURO DE ELIMINAR ESTA ORDEN COMPLETA?</p>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => { onDelete(editingId!); setShowForm(false); }}
                      className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg active:scale-95"
                    >
                      SÍ, ELIMINAR
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsConfirming(false)}
                      className="flex-1 bg-white text-slate-400 border py-4 rounded-2xl font-black text-[11px] uppercase active:scale-95"
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
