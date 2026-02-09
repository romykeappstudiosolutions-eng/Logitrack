
import React, { useState } from 'react';
import { Icons } from '../constants.tsx';
import JSZip from 'jszip';

export default function SyncHub({ orders, setOrders, masterBase, setMasterBase, operators, setOperators }: any) {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadSourceAsZip = async () => {
    setIsGenerating(true);
    const zip = new JSZip();
    
    try {
      const projectFiles = [
        { nameInZip: 'index.html', fetchPath: './index.html' },
        { nameInZip: 'index.tsx', fetchPath: './index.tsx' },
        { nameInZip: 'App.tsx', fetchPath: './App.tsx' },
        { nameInZip: 'types.ts', fetchPath: './types.ts' },
        { nameInZip: 'constants.tsx', fetchPath: './constants.tsx' },
        { nameInZip: 'metadata.json', fetchPath: './metadata.json' },
        { nameInZip: 'package.json', fetchPath: './package.json' },
        { nameInZip: 'supabase_schema.sql', fetchPath: './supabase_schema.sql' },
        
        // Carpeta de Vistas (views/)
        { nameInZip: 'views/Dashboard.tsx', fetchPath: './views/Dashboard.tsx' },
        { nameInZip: 'views/Upload.tsx', fetchPath: './views/Upload.tsx' },
        { nameInZip: 'views/Operators.tsx', fetchPath: './views/Operators.tsx' },
        { nameInZip: 'views/Reports.tsx', fetchPath: './views/Reports.tsx' },
        { nameInZip: 'views/ManageOrders.tsx', fetchPath: './views/ManageOrders.tsx' },
        { nameInZip: 'views/SyncHub.tsx', fetchPath: './views/SyncHub.tsx' },
        { nameInZip: 'views/Reception.tsx', fetchPath: './views/Reception.tsx' },
        { nameInZip: 'views/Conditioning.tsx', fetchPath: './views/Conditioning.tsx' },
        { nameInZip: 'views/Storage.tsx', fetchPath: './views/Storage.tsx' },
        { nameInZip: 'views/OrderRegistration.tsx', fetchPath: './views/OrderRegistration.tsx' },
        
        // Carpeta de Servicios (services/)
        { nameInZip: 'services/geminiService.ts', fetchPath: './services/geminiService.ts' },
        { nameInZip: 'services/cloudService.ts', fetchPath: './services/cloudService.ts' },
        { nameInZip: 'services/supabaseClient.ts', fetchPath: './services/supabaseClient.ts' },
        { nameInZip: 'services/supabaseService.ts', fetchPath: './services/supabaseService.ts' }
      ];

      for (const file of projectFiles) {
        try {
          const response = await fetch(file.fetchPath);
          if (response.ok) {
            const text = await response.text();
            zip.file(file.nameInZip, text);
          } else {
            console.warn(`Archivo no encontrado: ${file.fetchPath}`);
          }
        } catch (e) {
          console.error(`Error de red al intentar obtener ${file.fetchPath}:`, e);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `LOGITRACK_FULL_BACKUP_${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      
      alert("¡RESPALDO GENERADO!\n\nSe ha incluido el archivo 'supabase_schema.sql' para que puedas configurar tu base de datos fácilmente.");
    } catch (error) {
      alert("Error crítico al generar el paquete ZIP.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearData = () => {
    if(window.confirm('¿ESTA ACCIÓN BORRARÁ TODO EL HISTORIAL LOCAL?')) {
      localStorage.clear();
      alert('Datos locales reseteados.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center animate-in zoom-in-95 duration-500">
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border shadow-2xl space-y-8">
        <div className="mx-auto w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-inner">
           <Icons.Cloud />
        </div>
        
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Sync & Database</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Configuración de Persistencia Cloud</p>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Esquema SQL Incluido</h4>
           </div>
           <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
             Descarga el proyecto para obtener <code>supabase_schema.sql</code>. Ejecútalo en Supabase para crear las tablas de Picking, Packing y Maestros.
           </p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={downloadSourceAsZip} 
            disabled={isGenerating}
            className="w-full py-6 bg-slate-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all hover:bg-black active:scale-95 shadow-2xl disabled:opacity-50"
          >
            {isGenerating ? "EMPAQUETANDO SQL & SERVICES..." : "DESCARGAR PROYECTO + SQL"}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button 
            onClick={clearData} 
            className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors py-2"
          >
            Resetear Base de Datos Local
          </button>
        </div>
      </div>
      <p className="mt-8 text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">LogiTrack AI • Database Initializer</p>
    </div>
  );
}
