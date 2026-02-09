
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { PickingOrder, Operator, MasterOrder, OperatorStats, ReceptionOrder, ConditioningOrder, StorageOrder, ArticleMaster } from './types.ts';
import { Icons } from './constants.tsx';
import { supabaseService } from './services/supabaseService.ts';
import { isSupabaseConfigured } from './services/supabaseClient.ts';

// Importaciones desde la carpeta views
import Dashboard from './views/Dashboard.tsx';
import Upload from './views/Upload.tsx';
import Operators from './views/Operators.tsx';
import ManageOrders from './views/ManageOrders.tsx';
import Reports from './views/Reports.tsx';
import SyncHub from './views/SyncHub.tsx';
import Reception from './views/Reception.tsx';
import Conditioning from './views/Conditioning.tsx';
import Storage from './views/Storage.tsx';

const MOCK_OPS: Operator[] = [
  { id: '1', name: 'Juan Logística', role: 'Picking Master', active: true },
  { id: '2', name: 'Maria Almacén', role: 'Packing Expert', active: true }
];

export default function App() {
  const [orders, setOrders] = useState<PickingOrder[]>([]);
  const [receptions, setReceptions] = useState<ReceptionOrder[]>([]);
  const [conditioning, setConditioning] = useState<ConditioningOrder[]>([]);
  const [storage, setStorage] = useState<StorageOrder[]>([]);
  const [masterBase, setMasterBase] = useState<MasterOrder[]>([]);
  const [articleMaster, setArticleMaster] = useState<ArticleMaster[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial híbrida (Supabase + Local Fallback)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Si no hay Supabase configurado, cargamos mocks o local storage y salimos
      console.log("Supabase Configurado:", isSupabaseConfigured);
      if (!isSupabaseConfigured) {
        console.warn("Supabase no configurado. Iniciando en modo local.");
        setOperators(MOCK_OPS);
        setIsLoading(false);
        return;
      }

      try {
        // Timeout de seguridad de 5 segundos para la conexión inicial
        const dataPromise = Promise.all([
          supabaseService.fetchTable('picking_orders'),
          supabaseService.fetchTable('reception_orders'),
          supabaseService.fetchTable('conditioning_orders'),
          supabaseService.fetchTable('storage_orders'),
          supabaseService.fetchTable('master_orders'),
          supabaseService.fetchTable('article_master'),
          supabaseService.fetchTable('operators')
        ]);

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout conectando a Supabase")), 5000)
        );

        const [o, r, c, s, m, a, ops] = await Promise.race([dataPromise, timeoutPromise]) as any[];
        
        setOrders(o || []);
        setReceptions(r || []);
        setConditioning(c || []);
        setStorage(s || []);
        setMasterBase(m || []);
        setArticleMaster(a || []);
        setOperators(ops?.length > 0 ? ops : MOCK_OPS);
      } catch (err) {
        console.error("Fallo de sincronización. Usando modo offline:", err);
        setOperators(MOCK_OPS);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Handlers para asegurar persistencia al eliminar
  const handleDeleteOrder = async (id: string) => {
    setOrders(prev => prev.filter(o => String(o.id) !== String(id)));
    if (isSupabaseConfigured) await supabaseService.delete('picking_orders', id);
  };
  
  const handleDeleteReception = async (id: string) => {
    setReceptions(prev => prev.filter(r => String(r.id) !== String(id)));
    if (isSupabaseConfigured) await supabaseService.delete('reception_orders', id);
  };
  
  const handleDeleteConditioning = async (id: string) => {
    setConditioning(prev => prev.filter(c => String(c.id) !== String(id)));
    if (isSupabaseConfigured) await supabaseService.delete('conditioning_orders', id);
  };

  const handleDeleteStorage = async (id: string) => {
    setStorage(prev => prev.filter(s => String(s.id) !== String(id)));
    if (isSupabaseConfigured) await supabaseService.delete('storage_orders', id);
  };

  const handleSetOrders = (newOrders: any) => {
    const value = typeof newOrders === 'function' ? newOrders(orders) : newOrders;
    setOrders(value);
    const latest = Array.isArray(value) ? value[0] : null;
    if (isSupabaseConfigured && latest && latest.id) {
      supabaseService.upsert('picking_orders', latest);
    }
  };

  const stats = useMemo((): OperatorStats[] => {
    const map = new Map<string, any>();
    operators.forEach(o => map.set(o.name, { 
      name: o.name, 
      totalOrders: 0, totalLines: 0, totalQuantity: 0, totalPickMinutes: 0, pickRecords: 0,
      totalPackLines: 0, totalPackQuantity: 0, totalPackMinutes: 0, packRecords: 0,
      totalRecLines: 0, totalRecQuantity: 0, totalRecMinutes: 0, recRecords: 0,
      totalVasLines: 0, totalVasQuantity: 0, totalVasMinutes: 0, vasRecords: 0,
      totalStorageQuantity: 0, totalStorageMinutes: 0, storageRecords: 0
    }));
    
    orders.forEach(o => {
      const p = map.get(o.operador);
      if (p) {
        p.totalOrders++; 
        p.totalLines += (Number(o.lineas) || 0);
        p.totalQuantity += (Number(o.cantidad) || 0);
        p.totalPickMinutes += (o.duracionMinutos || 0); 
        p.pickRecords++;
      }
      if (o.operadorPacking) {
        const pk = map.get(o.operadorPacking);
        if (pk) {
          pk.totalPackLines += (Number(o.lineasPacking || o.lineas) || 0);
          pk.totalPackQuantity += (Number(o.cantidadPacking || o.cantidad) || 0);
          pk.totalPackMinutes += (o.duracionPackingMinutos || 0);
          pk.packRecords++;
        }
      }
    });

    receptions.forEach(r => {
      const op = map.get(r.operador);
      if (op) { 
        op.totalRecLines += (Number(r.lineas) || 0); 
        op.totalRecQuantity += (Number(r.cantidad) || 0);
        op.totalRecMinutes += (r.duracionMinutos || 0); 
        op.recRecords++; 
      }
    });

    storage.forEach(s => {
      const op = map.get(s.operador);
      if (op) {
        op.totalStorageQuantity += (Number(s.cantidad) || 0);
        op.totalStorageMinutes += (s.duracionMinutos || 0);
        op.storageRecords++;
      }
    });

    return Array.from(map.values()).map(m => ({
      ...m,
      avgDuration: m.pickRecords > 0 ? m.totalPickMinutes / m.pickRecords : 0,
      efficiency: m.totalPickMinutes > 0 ? (m.totalLines / (m.totalPickMinutes / 60)) : 0,
      packingEfficiency: m.totalPackMinutes > 0 ? (m.totalPackLines / (m.totalPackMinutes / 60)) : 0,
      receptionEfficiency: m.totalRecMinutes > 0 ? (m.totalRecLines / (m.totalRecMinutes / 60)) : 0,
      conditioningEfficiency: m.totalVasMinutes > 0 ? (m.totalVasLines / (m.totalVasMinutes / 60)) : 0,
      storageEfficiency: m.totalStorageMinutes > 0 ? (m.totalStorageQuantity / (m.totalStorageMinutes / 60)) : 0
    }));
  }, [orders, receptions, conditioning, storage, operators]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          {isSupabaseConfigured ? "Sincronizando con Supabase..." : "Iniciando Entorno Local..."}
        </p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-6 z-50">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl mb-4">
            <Icons.Brain />
          </div>
          <nav className="flex flex-col gap-4">
            <NavIcon to="/" icon={Icons.Dashboard} label="Dash" />
            <NavIcon to="/reception" icon={Icons.Reception} label="Rec" />
            <NavIcon to="/storage" icon={Icons.Storage} label="Alm" />
            <NavIcon to="/conditioning" icon={Icons.Conditioning} label="VAS" />
            <NavIcon to="/manage" icon={Icons.Report} label="Gest" />
            <NavIcon to="/reports" icon={Icons.Report} label="Hist" />
            <NavIcon to="/upload" icon={Icons.Upload} label="Carga" />
            <NavIcon to="/config" icon={Icons.Users} label="Ops" />
            <NavIcon to="/sync" icon={Icons.Cloud} label="Sync" />
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#FAFBFC]">
          <div className="max-w-6xl mx-auto h-full">
            <Routes>
              <Route path="/" element={<Dashboard orders={orders} stats={stats} masterBase={masterBase} receptions={receptions} conditioning={conditioning} storage={storage} />} />
              <Route path="/reception" element={<Reception receptions={receptions} setReceptions={(r:any)=>{setReceptions(r); if(isSupabaseConfigured) supabaseService.upsert('reception_orders', Array.isArray(r)?r[0]:r)}} onDelete={handleDeleteReception} operators={operators} />} />
              <Route path="/storage" element={<Storage storage={storage} setStorage={(s:any)=>{setStorage(s); if(isSupabaseConfigured) supabaseService.upsert('storage_orders', Array.isArray(s)?s[0]:s)}} onDelete={handleDeleteStorage} operators={operators} articleMaster={articleMaster} />} />
              <Route path="/conditioning" element={<Conditioning conditioning={conditioning} setConditioning={(c:any)=>{setConditioning(c); if(isSupabaseConfigured) supabaseService.upsert('conditioning_orders', Array.isArray(c)?c[0]:c)}} onDelete={handleDeleteConditioning} operators={operators} />} />
              <Route path="/manage" element={<ManageOrders orders={orders} operators={operators} masterBase={masterBase} onSave={(o:any) => {setOrders(p=>[o,...p]); if(isSupabaseConfigured) supabaseService.upsert('picking_orders', o)}} onUpdate={(o:any) => {setOrders(p=>p.map(x=>String(x.id)===String(o.id)?o:x)); if(isSupabaseConfigured) supabaseService.upsert('picking_orders', o)}} onDelete={handleDeleteOrder} />} />
              <Route path="/upload" element={<Upload 
                setOrders={handleSetOrders} 
                setReceptions={(r:any)=>setReceptions(p=>[...r,...p])} 
                setStorage={(s:any)=>setStorage(p=>[...s,...p])} 
                setConditioning={(c:any)=>setConditioning(p=>[...c,...p])} 
                masterBase={masterBase} 
                setMasterBase={(m:any)=>{setMasterBase(m); if(isSupabaseConfigured) m.forEach((x:any)=>supabaseService.upsertMaster(x))}} 
                articleMaster={articleMaster} 
                setArticleMaster={(a:any)=>{setArticleMaster(a); if(isSupabaseConfigured) a.forEach((x:any)=>supabaseService.upsertArticleMaster(x))}} 
              />} />
              <Route path="/config" element={<Operators operators={operators} setOperators={(ops:any)=>{setOperators(ops); const last = Array.isArray(ops)?ops[ops.length-1]:null; if(isSupabaseConfigured && last) supabaseService.upsert('operators', last)}} stats={stats} />} />
              <Route path="/reports" element={<Reports orders={orders} receptions={receptions} conditioning={conditioning} storage={storage} />} />
              <Route path="/sync" element={<SyncHub orders={orders} setOrders={setOrders} masterBase={masterBase} setMasterBase={setMasterBase} operators={operators} setOperators={setOperators} />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
}

function NavIcon({ to, icon: Icon, label }: any) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center p-2 rounded-xl transition-all ${active ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
      <Icon />
      <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{label}</span>
    </Link>
  );
}
