
import { PickingOrder, MasterOrder, Operator } from '../types';

// Este servicio está diseñado para ser reemplazado fácilmente por Firebase o Supabase
// Por ahora, gestiona la "Nube" mediante una simulación de latencia de red.

export const saveToCloud = async (data: any): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log("Sincronizando con la nube...", data);
    // Aquí iría el fetch('mi-api.com/sync', { method: 'POST', body: JSON.stringify(data) })
    setTimeout(() => {
      localStorage.setItem('cloud_backup', JSON.stringify({
        ...data,
        lastSync: new Date().toISOString()
      }));
      resolve(true);
    }, 1500);
  });
};

export const fetchFromCloud = async (): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const saved = localStorage.getItem('cloud_backup');
      resolve(saved ? JSON.parse(saved) : null);
    }, 1000);
  });
};

export const generateDeploymentGuide = () => {
  return [
    { step: 1, title: "Sube tu código a GitHub", desc: "Crea un repositorio privado con estos archivos." },
    { step: 2, title: "Conecta con Vercel", desc: "Entra a vercel.com, dale a 'New Project' y selecciona tu repo." },
    { step: 3, title: "Comparte el link", desc: "Vercel te dará un link tipo 'mi-app.vercel.app' para tus operadores." }
  ];
};
