
import React, { useState } from 'react';
import { PickingOrder, MasterOrder, ReceptionOrder, StorageOrder, ConditioningOrder, ArticleMaster } from '../types.ts';
import * as XLSX from 'xlsx';
import { Icons } from '../constants.tsx';

type UploadMode = 'MAESTRO' | 'PICKING' | 'RECEPTION' | 'STORAGE' | 'VAS' | 'ARTICULOS';

export default function Upload({ 
  setOrders, 
  setReceptions, 
  setStorage, 
  setConditioning, 
  masterBase, 
  setMasterBase,
  articleMaster,
  setArticleMaster
}: any) {
  const [mode, setMode] = useState<UploadMode>('MAESTRO');
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (mode === 'MAESTRO') {
          const mapped = data.map(r => ({
            documento: String(r['documento'] || r['Documento'] || r['DOCUMENTO'] || r['PEDIDO'] || r['Pedido'] || '').trim(),
            cliente: String(r['cliente'] || r['Cliente'] || r['CLIENTE'] || r['NOMBRE'] || r['Nombre'] || 'S/N').trim(),
            lineas: Number(r['lineas'] || r['Lineas'] || r['LINEAS'] || r['SKUS'] || r['Skus'] || 0),
            cantidad: Number(r['cantidad'] || r['Cantidad'] || r['CANTIDAD'] || r['UNIDADES'] || r['Unidades'] || 0)
          })).filter(x => x.documento);
          setMasterBase(mapped);
          alert(`${mapped.length} registros cargados en Maestro de Pedidos.`);
        } else if (mode === 'ARTICULOS') {
          const mapped = data.map(r => ({
            codigo: String(
              r['codigo'] || r['Codigo'] || r['CÓDIGO'] || r['CODIGO'] || 
              r['SKU'] || r['Sku'] || r['EAN'] || r['Ean'] || 
              r['ARTICULO'] || r['Articulo'] || r['ARTÍCULO'] || ''
            ).trim(),
            descripcion: String(
              r['descripcion'] || r['Descripcion'] || r['DESCRIPCIÓN'] || r['DESCRIPCION'] || 
              r['NOMBRE'] || r['Nombre'] || r['PRODUCTO'] || r['Producto'] || ''
            ).trim()
          })).filter(x => x.codigo && x.codigo !== "undefined");
          
          setArticleMaster(mapped);
          alert(`${mapped.length} artículos vinculados exitosamente al Maestro de Productos.`);
        } else if (mode === 'PICKING') {
          const mapped = data.map(r => ({
            id: Math.random().toString(36).substr(2,9),
            fecha: String(r['fecha'] || r['Fecha'] || new Date().toISOString().split('T')[0]),
            documento: String(r['documento'] || r['Documento'] || '').trim(),
            cliente: String(r['cliente'] || r['Cliente'] || 'N/A'),
            tipoLista: 'Individual (Clientes)',
            operador: String(r['operador'] || r['Operador'] || 'S/A'),
            horaInicio: String(r['hora_inicio'] || '08:00'),
            horaFin: String(r['hora_fin'] || '08:30'),
            status: 'Procesado',
            cantidad: Number(r['cantidad'] || r['Cantidad'] || 0),
            lineas: Number(r['lineas'] || r['Lineas'] || 0),
            duracionMinutos: 30
          })).filter(x => x.documento);

          // Lógica de Upsert por Documento
          setOrders((prev: any[]) => {
            const updated = [...prev];
            mapped.forEach(newItem => {
              const existingIndex = updated.findIndex(o => String(o.documento).trim().toLowerCase() === newItem.documento.toLowerCase());
              if (existingIndex !== -1) {
                // Actualizar manteniendo el ID único original
                updated[existingIndex] = { ...updated[existingIndex], ...newItem, id: updated[existingIndex].id };
              } else {
                // No existe, se agrega al inicio
                updated.unshift(newItem);
              }
            });
            return updated;
          });
          alert(`${mapped.length} registros de Picking procesados (Nuevos / Actualizados).`);
        } else if (mode === 'RECEPTION') {
          const mapped = data.map(r => ({
            id: Math.random().toString(36).substr(2,9),
            fecha: String(r['fecha'] || r['Fecha'] || new Date().toISOString().split('T')[0]),
            tipo: String(r['tipo'] || 'Compra Local'),
            documento: String(r['documento'] || r['Documento'] || ''),
            proveedor: String(r['proveedor'] || r['Proveedor'] || 'N/A'),
            operador: String(r['operador'] || r['Operador'] || 'S/A'),
            horaInicio: String(r['hora_inicio'] || '08:00'),
            horaFin: String(r['hora_fin'] || '09:00'),
            cantidad: Number(r['cantidad'] || 0),
            lineas: Number(r['lineas'] || 0),
            duracionMinutos: 60
          }));
          setReceptions((prev: any) => [...mapped, ...prev]);
          alert(`${mapped.length} registros de Recepción cargados.`);
        } else if (mode === 'STORAGE') {
          const mapped = data.map(r => ({
            id: Math.random().toString(36).substr(2,9),
            fecha: String(r['fecha'] || r['Fecha'] || new Date().toISOString().split('T')[0]),
            ubicacionEntrada: String(r['entrada'] || r['Entrada'] || 'A-1'),
            ubicacionSalida: String(r['salida'] || r['Salida'] || 'B-1'),
            operador: String(r['operador'] || r['Operador'] || 'S/A'),
            horaInicio: String(r['hora_inicio'] || '08:00'),
            horaFin: String(r['hora_fin'] || '09:00'),
            tipoBodega: String(r['bodega'] || 'Ambiente'),
            cantidad: Number(r['cantidad'] || 0),
            codigoProducto: String(r['codigo'] || r['Codigo'] || r['SKU'] || ''),
            descripcionProducto: String(r['descripcion'] || r['Descripcion'] || r['NOMBRE'] || ''),
            duracionMinutos: 60
          }));
          setStorage((prev: any) => [...mapped, ...prev]);
          alert(`${mapped.length} registros de Almacenamiento cargados.`);
        } else if (mode === 'VAS') {
          const mapped = data.map(r => ({
            id: Math.random().toString(36).substr(2,9),
            fecha: String(r['fecha'] || r['Fecha'] || new Date().toISOString().split('T')[0]),
            tipo: String(r['proceso'] || r['Proceso'] || 'Etiquetado'),
            operador: String(r['operador'] || r['Operador'] || 'S/A'),
            cliente: String(r['cliente'] || r['Cliente'] || 'N/A'),
            documento: String(r['documento'] || r['Documento'] || ''),
            horaInicio: String(r['hora_inicio'] || '08:00'),
            horaFin: String(r['hora_fin'] || '09:00'),
            lineas: Number(r['lineas'] || 0),
            cantidad: Number(r['cantidad'] || 0),
            duracionMinutos: 60
          }));
          setConditioning((prev: any) => [...mapped, ...prev]);
          alert(`${mapped.length} registros de VAS cargados.`);
        }
      } catch (err) {
        alert("Error al procesar el archivo Excel. Verifique que las columnas coincidan.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center space-y-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Carga de Datos Logísticos</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestión de Bases Maestras y Operativas</p>
        </div>

        <div className="flex flex-wrap bg-slate-50 p-1.5 rounded-2xl gap-2">
           <TabBtn active={mode==='MAESTRO'} onClick={()=>setMode('MAESTRO')} label="Maestro Pedidos" color="blue" />
           <TabBtn active={mode==='ARTICULOS'} onClick={()=>setMode('ARTICULOS')} label="Maestro Artículos" color="indigo" />
           <TabBtn active={mode==='PICKING'} onClick={()=>setMode('PICKING')} label="Picking Hist." color="indigo" />
           <TabBtn active={mode==='RECEPTION'} onClick={()=>setMode('RECEPTION')} label="Recepción" color="emerald" />
           <TabBtn active={mode==='STORAGE'} onClick={()=>setMode('STORAGE')} label="Almacenaje" color="cyan" />
           <TabBtn active={mode==='VAS'} onClick={()=>setMode('VAS')} label="VAS" color="orange" />
        </div>

        <div className="relative border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 group hover:bg-slate-50/50 transition-colors">
          <input type="file" onChange={handleFile} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <div className="space-y-4">
             <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg transition-transform group-hover:scale-110 ${getColorClass(mode)}`}>
                {uploading ? <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" /> : <Icons.Upload />}
             </div>
             <div>
               <p className="text-sm font-black text-slate-800 tracking-tight">{uploading ? 'Procesando...' : `Cargar Excel de ${mode === 'ARTICULOS' ? 'Artículos' : mode === 'MAESTRO' ? 'Pedidos' : 'Operaciones'}`}</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Suelta el archivo para importar</p>
             </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-[2rem] text-left">
           <h4 className="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest">Columnas Sugeridas</h4>
           <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
             {mode === 'MAESTRO' && "Documento, Cliente, Lineas, Cantidad"}
             {mode === 'ARTICULOS' && "Codigo, Descripcion, SKU, Nombre"}
             {mode === 'PICKING' && "Fecha, Documento, Cliente, Operador, Cantidad, Lineas"}
             {mode === 'RECEPTION' && "Fecha, Tipo, Documento, Proveedor, Operador, Cantidad, Lineas"}
             {mode === 'STORAGE' && "Fecha, Entrada, Salida, Operador, Bodega, Cantidad, Codigo"}
             {mode === 'VAS' && "Fecha, Proceso, Operador, Cliente, Documento, Lineas, Cantidad"}
           </p>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label, color }: any) {
  const colors: any = {
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    cyan: 'text-cyan-600',
    orange: 'text-orange-600'
  };
  return (
    <button 
      onClick={onClick} 
      className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${active ? `bg-white ${colors[color]} shadow-md` : 'text-slate-400'}`}
    >
      {label}
    </button>
  );
}

function getColorClass(mode: UploadMode) {
  switch(mode) {
    case 'MAESTRO': return 'bg-blue-600 text-white';
    case 'ARTICULOS': return 'bg-indigo-600 text-white';
    case 'PICKING': return 'bg-indigo-600 text-white';
    case 'RECEPTION': return 'bg-emerald-600 text-white';
    case 'STORAGE': return 'bg-cyan-600 text-white';
    case 'VAS': return 'bg-orange-600 text-white';
    default: return 'bg-slate-600 text-white';
  }
}
