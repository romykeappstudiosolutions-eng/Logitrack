
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { PickingOrder, Operator, MasterOrder, OperatorStats, ReceptionOrder, ConditioningOrder, StorageOrder, ArticleMaster } from './types.ts';
import { Icons } from './constants.tsx';

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
  { id: '2', name: 'Maria Almacén', role: 'Packing Expert', active: true },
  { id: '3', name: 'Carlos Bodega', role: 'Inbound Specialist', active: true },
  { id: '4', name: 'Elena Flujo', role: 'VAS Operator', active: true }
];

const MOCK_MASTER: MasterOrder[] = [
  { documento: 'DOC-101', cliente: 'TIENDAS RETAIL S.A.', lineas: 10, cantidad: 100 },
  { documento: 'DOC-102', cliente: 'DISTRIBUIDORA NORTE', lineas: 5, cantidad: 50 },
  { documento: 'DOC-103', cliente: 'SUPERMERCADOS ALFA', lineas: 15, cantidad: 200 }
];

export default function App() {
  const [orders, setOrders] = useState<PickingOrder[]>(() => {
    try {
      const s = localStorage.getItem('logitrak_orders');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [receptions, setReceptions] = useState<ReceptionOrder[]>(() => {
    try {
      const s = localStorage.getItem('logitrak_receptions');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [conditioning, setConditioning] = useState<ConditioningOrder[]>(() => {
    try {
      const s = localStorage.getItem('logitrak_conditioning');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [storage, setStorage] = useState<StorageOrder[]>(() => {
    try {
      const s = localStorage.getItem('logitrak_storage');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [masterBase, setMasterBase] = useState<MasterOrder[]>(() => {
    try {
      const s = localStorage.getItem('logitrak_master');
      return s ? JSON.parse(s) : MOCK_MASTER;
    } catch { return MOCK_MASTER; }
  });
  const [articleMaster, setArticleMaster] = useState<ArticleMaster[]>(() => {
    try {
      const s = localStorage.getItem('logitrak_articles');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [operators, setOperators] = useState<Operator[]>(() => {
    try {
      const s = localStorage.getItem('logitrak_ops');
      return s ? JSON.parse(s) : MOCK_OPS;
    } catch { return MOCK_OPS; }
  });

  const safeSave = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Storage Full");
    }
  };

  useEffect(() => safeSave('logitrak_orders', orders), [orders]);
  useEffect(() => safeSave('logitrak_receptions', receptions), [receptions]);
  useEffect(() => safeSave('logitrak_conditioning', conditioning), [conditioning]);
  useEffect(() => safeSave('logitrak_storage', storage), [storage]);
  useEffect(() => safeSave('logitrak_master', masterBase), [masterBase]);
  useEffect(() => safeSave('logitrak_articles', articleMaster), [articleMaster]);
  useEffect(() => safeSave('logitrak_ops', operators), [operators]);

  const handleDeleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => String(o.id) !== String(id)));
  };
  
  const handleDeleteReception = (id: string) => {
    setReceptions(prev => prev.filter(r => String(r.id) !== String(id)));
  };
  
  const handleDeleteConditioning = (id: string) => {
    setConditioning(prev => prev.filter(c => String(c.id) !== String(id)));
  };

  const handleDeleteStorage = (id: string) => {
    setStorage(prev => prev.filter(s => String(s.id) !== String(id)));
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
          if (o.operadorPacking !== o.operador) pk.totalOrders++;
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

    conditioning.forEach(c => {
      const op = map.get(c.operador);
      if (op) { 
        op.totalVasLines += (Number(c.lineas) || 0); 
        op.totalVasQuantity += (Number(c.cantidad) || 0);
        op.totalVasMinutes += (c.duracionMinutos || 0); 
        op.vasRecords++; 
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
              <Route path="/reception" element={<Reception receptions={receptions} setReceptions={setReceptions} onDelete={handleDeleteReception} operators={operators} />} />
              <Route path="/storage" element={<Storage storage={storage} setStorage={setStorage} onDelete={handleDeleteStorage} operators={operators} articleMaster={articleMaster} />} />
              <Route path="/conditioning" element={<Conditioning conditioning={conditioning} setConditioning={setConditioning} onDelete={handleDeleteConditioning} operators={operators} />} />
              <Route path="/manage" element={<ManageOrders orders={orders} operators={operators} masterBase={masterBase} onSave={(o:any) => setOrders(p=>[o,...p])} onUpdate={(o:any) => setOrders(p=>p.map(x=>String(x.id)===String(o.id)?o:x))} onDelete={handleDeleteOrder} />} />
              <Route path="/upload" element={<Upload setOrders={setOrders} setReceptions={setReceptions} setStorage={setStorage} setConditioning={setConditioning} masterBase={masterBase} setMasterBase={setMasterBase} articleMaster={articleMaster} setArticleMaster={setArticleMaster} />} />
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
