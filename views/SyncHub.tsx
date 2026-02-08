
import React, { useState } from 'react';
import { Icons } from '../constants.tsx';
import JSZip from 'jszip';

export default function SyncHub({ orders, setOrders, masterBase, setMasterBase, operators, setOperators }: any) {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadSourceAsZip = async () => {
    setIsGenerating(true);
    const zip = new JSZip();
    
    try {
      // Lista de archivos con sus rutas relativas correctas según la estructura del proyecto
      const projectFiles = [
        { name: 'index.html', path: './index.html' },
        { name: 'index.tsx', path: './index.tsx' },
        { name: 'App.tsx', path: './App.tsx' },
        { name: 'types.ts', path: './types.ts' },
        { name: 'constants.tsx', path: './constants.tsx' },
        { name: 'metadata.json', path: './metadata.json' },
        { name: 'package.json', path: './package.json' },
        // Vistas
        { name: 'views/Dashboard.tsx', path: './views/Dashboard.tsx' },
        { name: 'views/Upload.tsx', path: './views/Upload.tsx' },
        { name: 'views/Operators.tsx', path: './views/Operators.tsx' },
        { name: 'views/Reports.tsx', path: './views/Reports.tsx' },
        { name: 'views/ManageOrders.tsx', path: './views/ManageOrders.tsx' },
        { name: 'views/SyncHub.tsx', path: './views/SyncHub.tsx' },
        { name: 'views/Reception.tsx', path: './views/Reception.tsx' },
        { name: 'views/Conditioning.tsx', path: './views/Conditioning.tsx' },
        { name: 'views/Storage.tsx', path: './views/Storage.tsx' },
        { name: 'views/OrderRegistration.tsx', path: './views/OrderRegistration.tsx' },
        // Servicios
        { name: 'services/geminiService.ts', path: './services/geminiService.ts' },
        { name: 'services/cloudService.ts', path: './services/cloudService.ts' }
      ];

      for (const file of projectFiles) {
        try {
          const response = await fetch(file.path);
          if (response.ok) {
            const text = await response.text();
            zip.file(file.name, text);
          }
        } catch (e) {
          console.error(`No se pudo incluir el archivo ${file.name}:`, e);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `LOGITRACK_BACKUP_${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      
      alert("¡PROYECTO DESCARGADO!\n\nSe ha generado un archivo ZIP con toda la estructura de carpetas. Puedes subir este archivo manualmente a GitHub si la sincronización automática sigue fallando.");
    } catch (error) {
      alert("Error al generar el paquete de respaldo.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearData = () => {
    if(window.confirm('¿ESTA ACCIÓN BORRARÁ TODO EL HISTORIAL LOCAL. DESEA CONTINUAR?')) {
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Sincronización</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Respaldo Seguro de la Aplicación</p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={downloadSourceAsZip} 
            disabled={isGenerating}
            className="w-full py-6 bg-slate-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all hover:bg-black active:scale-95 shadow-2xl disabled:opacity-50"
          >
            {isGenerating ? "PROCESANDO ARCHIVOS..." : "DESCARGAR PROYECTO (ZIP)"}
          </button>
          
          <p className="text-[9px] font-bold text-slate-400 leading-relaxed px-4">
            Si la sincronización directa con GitHub presenta errores de conexión, utiliza este botón para obtener una copia física de todo tu trabajo.
          </p>
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
    </div>
  );
}
