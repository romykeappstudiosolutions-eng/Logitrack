
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { PickingOrder, Operator, MasterOrder, OperatorStats, ReceptionOrder, ConditioningOrder, StorageOrder, ArticleMaster } from './types.ts';
import { Icons } from './constants.tsx';
import { supabaseService, ServiceResult } from './services/supabaseService.ts';
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
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // Enhanced data loading with proper error handling
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      // If Supabase is not configured, use local mode
      console.log("Supabase Configurado:", isSupabaseConfigured);
      if (!isSupabaseConfigured) {
        console.warn("Supabase no configurado. Iniciando en modo local.");
        setOperators(MOCK_OPS);
        setIsLoading(false);
        return;
      }

      try {
        // Timeout de seguridad de 8 segundos para la conexión inicial
        const dataPromise = Promise.all([
          supabaseService.fetchTable('picking_orders'),
          supabaseService.fetchTable('reception_orders'),
          supabaseService.fetchTable('conditioning_orders'),
          supabaseService.fetchTable('storage_orders'),
          supabaseService.fetchTable('master_orders'),
          supabaseService.fetchTable('article_master'),
          supabaseService.fetchTable('operators')
        ]);

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout conectando a Supabase")), 8000)
        );

        const results = await Promise.race([dataPromise, timeoutPromise]);
        
        // Handle results with proper error checking
        const [ordersResult, receptionsResult, conditioningResult, storageResult, masterResult, articleResult, operatorsResult] = results;
        
        // Set data from successful results or empty arrays for failures
        setOrders(ordersResult.success ? ordersResult.data! : []);
        setReceptions(receptionsResult.success ? receptionsResult.data! : []);
        setConditioning(conditioningResult.success ? conditioningResult.data! : []);
        setStorage(storageResult.success ? storageResult.data! : []);
        setMasterBase(masterResult.success ? masterResult.data! : []);
        setArticleMaster(articleResult.success ? articleResult.data! : []);
        setOperators(operatorsResult.success && operatorsResult.data!.length > 0 ? operatorsResult.data! : MOCK_OPS);
        
        // Collect any errors
        const errors = results.filter(r => !r.success).map(r => r.error).filter(Boolean);
        if (errors.length > 0) {
          console.warn("Algunos datos no pudieron cargarse:", errors);
          setError(`Algunos datos no pudieron cargarse: ${errors.join(', ')}`);
        }
        
      } catch (err) {
        console.error("Fallo de sincronización. Usando modo offline:", err);
        setError(`Error de conexión: ${String(err)}`);
        setOperators(MOCK_OPS);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Enhanced delete handlers with proper error handling and rollback
  const handleDeleteOrder = async (id: string) => {
    if (!id) return;
    setOperationLoading(true);
    
    // Optimistic update
    const previousOrders = orders;
    setOrders(prev => prev.filter(o => String(o.id) !== String(id)));
    
    if (isSupabaseConfigured) {
      const result = await supabaseService.delete('picking_orders', id);
      if (!result.success) {
        // Rollback on failure
        setOrders(previousOrders);
        setError(`Error eliminando orden: ${result.error}`);
        console.error('Delete order failed:', result.error);
      }
    }
    setOperationLoading(false);
  };
  
  const handleDeleteReception = async (id: string) => {
    if (!id) return;
    setOperationLoading(true);
    
    const previousReceptions = receptions;
    setReceptions(prev => prev.filter(r => String(r.id) !== String(id)));
    
    if (isSupabaseConfigured) {
      const result = await supabaseService.delete('reception_orders', id);
      if (!result.success) {
        setReceptions(previousReceptions);
        setError(`Error eliminando recepción: ${result.error}`);
        console.error('Delete reception failed:', result.error);
      }
    }
    setOperationLoading(false);
  };
  
  const handleDeleteConditioning = async (id: string) => {
    if (!id) return;
    setOperationLoading(true);
    
    const previousConditioning = conditioning;
    setConditioning(prev => prev.filter(c => String(c.id) !== String(id)));
    
    if (isSupabaseConfigured) {
      const result = await supabaseService.delete('conditioning_orders', id);
      if (!result.success) {
        setConditioning(previousConditioning);
        setError(`Error eliminando acondicionamiento: ${result.error}`);
        console.error('Delete conditioning failed:', result.error);
      }
    }
    setOperationLoading(false);
  };

  const handleDeleteStorage = async (id: string) => {
    if (!id) return;
    setOperationLoading(true);
    
    const previousStorage = storage;
    setStorage(prev => prev.filter(s => String(s.id) !== String(id)));
    
    if (isSupabaseConfigured) {
      const result = await supabaseService.delete('storage_orders', id);
      if (!result.success) {
        setStorage(previousStorage);
        setError(`Error eliminando almacenamiento: ${result.error}`);
        console.error('Delete storage failed:', result.error);
      }
    }
    setOperationLoading(false);
  };

  const handleSetOrders = async (newOrders: any) => {
    setOperationLoading(true);
    const value = typeof newOrders === 'function' ? newOrders(orders) : newOrders;
    const previousOrders = orders;
    
    setOrders(value);
    
    if (isSupabaseConfigured) {
      const latest = Array.isArray(value) ? value[0] : null;
      if (latest && latest.id) {
        const result = await supabaseService.upsert('picking_orders', latest);
        if (!result.success) {
          // Rollback on failure
          setOrders(previousOrders);
          setError(`Error guardando orden: ${result.error}`);
          console.error('Save order failed:', result.error);
        }
      }
    }
    setOperationLoading(false);
  };

  // Improved handlers for other operations
  const handleSaveOrder = async (order: PickingOrder) => {
    setOperationLoading(true);
    const previousOrders = orders;
    setOrders(prev => [order, ...prev]);
    
    if (isSupabaseConfigured) {
      const result = await supabaseService.upsert('picking_orders', order);
      if (!result.success) {
        setOrders(previousOrders);
        setError(`Error guardando orden: ${result.error}`);
      }
    }
    setOperationLoading(false);
  };

  const handleUpdateOrder = async (order: PickingOrder) => {
    setOperationLoading(true);
    const previousOrders = orders;
    setOrders(prev => prev.map(x => String(x.id) === String(order.id) ? order : x));
    
    if (isSupabaseConfigured) {
      const result = await supabaseService.upsert('picking_orders', order);
      if (!result.success) {
        setOrders(previousOrders);
        setError(`Error actualizando orden: ${result.error}`);
      }
    }
    setOperationLoading(false);
  };

  const handleSetReceptions = async (newReceptions: any) => {
    setOperationLoading(true);
    const previousReceptions = receptions;
    const value = typeof newReceptions === 'function' ? newReceptions(receptions) : newReceptions;
    setReceptions(value);
    
    if (isSupabaseConfigured) {
      const latest = Array.isArray(value) ? value[0] : null;
      if (latest && latest.id) {
        const result = await supabaseService.upsert('reception_orders', latest);
        if (!result.success) {
          setReceptions(previousReceptions);
          setError(`Error guardando recepción: ${result.error}`);
        }
      }
    }
    setOperationLoading(false);
  };

  const handleSetStorage = async (newStorage: any) => {
    setOperationLoading(true);
    const previousStorage = storage;
    const value = typeof newStorage === 'function' ? newStorage(storage) : newStorage;
    setStorage(value);
    
    if (isSupabaseConfigured) {
      const latest = Array.isArray(value) ? value[0] : null;
      if (latest && latest.id) {
        const result = await supabaseService.upsert('storage_orders', latest);
        if (!result.success) {
          setStorage(previousStorage);
          setError(`Error guardando almacenamiento: ${result.error}`);
        }
      }
    }
    setOperationLoading(false);
  };

  const handleSetConditioning = async (newConditioning: any) => {
    setOperationLoading(true);
    const previousConditioning = conditioning;
    const value = typeof newConditioning === 'function' ? newConditioning(conditioning) : newConditioning;
    setConditioning(value);
    
    if (isSupabaseConfigured) {
      const latest = Array.isArray(value) ? value[0] : null;
      if (latest && latest.id) {
        const result = await supabaseService.upsert('conditioning_orders', latest);
        if (!result.success) {
          setConditioning(previousConditioning);
          setError(`Error guardando acondicionamiento: ${result.error}`);
        }
      }
    }
    setOperationLoading(false);
  };

  const handleSetMasterBase = async (newMasterBase: any) => {
    setOperationLoading(true);
    setMasterBase(newMasterBase);
    
    if (isSupabaseConfigured && Array.isArray(newMasterBase)) {
      const results = await supabaseService.batchUpsert('master_orders', newMasterBase);
      if (!results.success && results.errors.length > 0) {
        setError(`Error guardando maestro de órdenes: ${results.errors[0]}`);
      }
    }
    setOperationLoading(false);
  };

  const handleSetArticleMaster = async (newArticleMaster: any) => {
    setOperationLoading(true);
    setArticleMaster(newArticleMaster);
    
    if (isSupabaseConfigured && Array.isArray(newArticleMaster)) {
      const results = await supabaseService.batchUpsert('article_master', newArticleMaster);
      if (!results.success && results.errors.length > 0) {
        setError(`Error guardando maestro de artículos: ${results.errors[0]}`);
      }
    }
    setOperationLoading(false);
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
          {/* Global error notification */}
          {error && (
            <div className="fixed top-4 right-4 z-[999] bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg shadow-lg max-w-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">×</button>
              </div>
            </div>
          )}
          
          {/* Global loading indicator */}
          {operationLoading && (
            <div className="fixed bottom-4 right-4 z-[999] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
              <span className="text-xs font-bold">Sincronizando...</span>
            </div>
          )}
          
          <div className="max-w-6xl mx-auto h-full">
            <Routes>
              <Route path="/" element={<Dashboard orders={orders} stats={stats} masterBase={masterBase} receptions={receptions} conditioning={conditioning} storage={storage} />} />
              <Route path="/reception" element={<Reception receptions={receptions} setReceptions={handleSetReceptions} onDelete={handleDeleteReception} operators={operators} />} />
              <Route path="/storage" element={<Storage storage={storage} setStorage={handleSetStorage} onDelete={handleDeleteStorage} operators={operators} articleMaster={articleMaster} />} />
              <Route path="/conditioning" element={<Conditioning conditioning={conditioning} setConditioning={handleSetConditioning} onDelete={handleDeleteConditioning} operators={operators} />} />
              <Route path="/manage" element={<ManageOrders orders={orders} operators={operators} masterBase={masterBase} onSave={handleSaveOrder} onUpdate={handleUpdateOrder} onDelete={handleDeleteOrder} />} />
              <Route path="/upload" element={<Upload 
                setOrders={handleSetOrders} 
                setReceptions={handleSetReceptions} 
                setStorage={handleSetStorage} 
                setConditioning={handleSetConditioning} 
                masterBase={masterBase} 
                setMasterBase={handleSetMasterBase} 
                articleMaster={articleMaster} 
                setArticleMaster={handleSetArticleMaster} 
              />} />
              <Route path="/config" element={<Operators operators={operators} setOperators={setOperators} stats={stats} />} />
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
