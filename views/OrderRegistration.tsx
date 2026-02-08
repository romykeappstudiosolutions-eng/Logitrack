
import React, { useState } from 'react';
import { PickingOrder, Operator, OrderStatus, TipoLista } from '../types';

interface OrderRegistrationProps {
  operators: Operator[];
  onSave: (order: PickingOrder) => void;
}

const OrderRegistration: React.FC<OrderRegistrationProps> = ({ operators, onSave }) => {
  // Fix: Added tipoLista and corrected status to satisfy PickingOrder interface and OrderStatus type
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    documento: '',
    cliente: '',
    tipoLista: 'Individual (Clientes)' as TipoLista,
    operador: operators[0]?.name || '',
    horaInicio: '08:00',
    horaFin: '08:30',
    cantidad: 0,
    lineas: 0,
    status: 'Procesado' as OrderStatus
  });

  const [recentEntries, setRecentEntries] = useState<PickingOrder[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const [h1, m1] = formData.horaInicio.split(':').map(Number);
    const [h2, m2] = formData.horaFin.split(':').map(Number);
    const duracion = (h2 * 60 + m2) - (h1 * 60 + m1);

    if (duracion <= 0) {
      alert("La hora de fin debe ser posterior a la de inicio.");
      return;
    }

    const newOrder: PickingOrder = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      duracionMinutos: duracion
    };

    onSave(newOrder);
    setRecentEntries([newOrder, ...recentEntries].slice(0, 5));
    
    setFormData({
      ...formData,
      documento: '',
      cliente: '',
      cantidad: 0,
      lineas: 0
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 animate-in slide-in-from-right duration-500">
      <div className="lg:col-span-3">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Pedidos</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Registra manualmente el flujo de picking del día.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Operación</label>
                <input 
                  type="date" 
                  required
                  value={formData.fecha}
                  onChange={e => setFormData({...formData, fecha: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento / Pedido</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: FAC-4402"
                  value={formData.documento}
                  onChange={e => setFormData({...formData, documento: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatario / Cliente</label>
              <input 
                type="text" 
                required
                placeholder="Nombre de empresa o destino"
                value={formData.cliente}
                onChange={e => setFormData({...formData, cliente: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable del Picking</label>
              <select 
                value={formData.operador}
                onChange={e => setFormData({...formData, operador: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-extrabold text-slate-700 appearance-none cursor-pointer"
              >
                {operators.map(op => (
                  <option key={op.id} value={op.name}>{op.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora de Inicio</label>
                <input 
                  type="time" 
                  value={formData.horaInicio}
                  onChange={e => setFormData({...formData, horaInicio: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora de Finalización</label>
                <input 
                  type="time" 
                  value={formData.horaFin}
                  onChange={e => setFormData({...formData, horaFin: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-blue-50/50 p-6 rounded-2xl space-y-2 border border-blue-100">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Líneas SKU</label>
                <input 
                  type="number" 
                  required
                  value={formData.lineas}
                  onChange={e => setFormData({...formData, lineas: Math.max(0, Number(e.target.value))})}
                  className="w-full bg-transparent text-2xl font-black text-blue-700 border-none outline-none"
                />
              </div>
              <div className="bg-emerald-50/50 p-6 rounded-2xl space-y-2 border border-emerald-100">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Unidades Totales</label>
                <input 
                  type="number" 
                  required
                  value={formData.cantidad}
                  onChange={e => setFormData({...formData, cantidad: Math.max(0, Number(e.target.value))})}
                  className="w-full bg-transparent text-2xl font-black text-emerald-700 border-none outline-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black text-lg rounded-2xl transition-all shadow-2xl shadow-slate-200 flex items-center justify-center space-x-3 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              <span>Finalizar Registro</span>
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Actividad Reciente</h3>
          {recentEntries.length > 0 ? (
            <div className="space-y-4">
              {recentEntries.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <p className="text-sm font-black text-slate-800">{entry.documento}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{entry.operador} • {entry.horaInicio} - {entry.horaFin}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-blue-600">{entry.lineas} SKU</p>
                    <p className="text-[10px] font-bold text-slate-400">{entry.cantidad} Unid.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
              </div>
              <p className="text-xs text-slate-400 font-bold px-6 leading-relaxed">No hay registros nuevos en esta sesión. Los datos guardados aparecerán aquí.</p>
            </div>
          )}
        </div>

        <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
          <h3 className="font-black text-lg mb-2">Consejo Logístico</h3>
          <p className="text-blue-100 text-xs leading-relaxed font-medium">
            La exactitud en el registro de la hora de inicio y fin es crucial para que la IA pueda calcular correctamente la eficiencia de los operadores. Asegúrate de registrar los tiempos reales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderRegistration;
