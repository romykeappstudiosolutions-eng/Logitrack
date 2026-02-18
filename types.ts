
export interface Operator {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export type OrderStatus = 'Pendiente' | 'Procesado' | 'Anulado';
export type TipoLista = 'General (Artículos)' | 'Individual (Clientes)';
export type TipoRecepcion = 'Compra Local' | 'Importación' | 'Devoluciones';
export type TipoAcondicionamiento = 'Inkjet' | 'Leyendas' | 'Etiquetado' | 'Encajado' | 'Borrado e Inkjet' | 'Reg San';
export type TipoBodega = 'Ambiente' | 'Refrigerado';

export interface MasterOrder {
  documento: string;
  cliente: string;
  lineas: number;
  cantidad: number;
}

export interface ArticleMaster {
  codigo: string;
  descripcion: string;
}

export interface PickingOrder {
  id: string;
  fecha: string;
  documento: string;
  cliente: string;
  tipoLista: TipoLista;
  operador: string;
  horaInicio: string;
  horaFin: string;
  status: OrderStatus;
  cantidad: number;
  lineas: number;
  duracionMinutos?: number;
  
  // Nuevos campos solicitados
  fechaDocumento?: string;
  horaGeneracion?: string;
  
  // Campos de Packing Independientes
  operadorPacking?: string;
  horaInicioPacking?: string;
  horaFinPacking?: string;
  statusPacking?: OrderStatus;
  cantidadPacking?: number;
  lineasPacking?: number;
  duracionPackingMinutos?: number;
  
  referenciaBatch?: string;
}

export interface ReceptionOrder {
  id: string;
  fecha: string;
  tipo: TipoRecepcion;
  documento: string; 
  proveedor: string;
  operador: string;
  horaInicio: string;
  horaFin: string;
  cantidad: number;
  lineas: number;
  fotoEvidencia?: string; 
  duracionMinutos: number;
}

export interface ConditioningOrder {
  id: string;
  fecha: string;
  tipo: TipoAcondicionamiento;
  operador: string;
  cliente: string;
  documento: string;
  horaInicio: string;
  horaFin: string;
  lineas: number;
  cantidad: number;
  duracionMinutos: number;
}

export interface StorageOrder {
  id: string;
  fecha: string;
  ubicacionEntrada: string;
  ubicacionSalida: string;
  operador: string;
  horaInicio: string;
  horaFin: string;
  tipoBodega: TipoBodega;
  cantidad: number;
  duracionMinutos: number;
  codigoProducto?: string;
  descripcionProducto?: string;
}

export interface OperatorStats {
  name: string;
  
  // Picking
  totalOrders: number;
  totalQuantity: number;
  totalLines: number;
  totalPickMinutes: number;
  pickRecords: number;
  
  // Packing
  totalPackQuantity: number;
  totalPackLines: number;
  totalPackMinutes: number;
  packRecords: number;
  
  // Recepción
  totalRecLines: number;
  totalRecQuantity: number;
  totalRecMinutes: number;
  recRecords: number;
  
  // VAS
  totalVasLines: number;
  totalVasQuantity: number;
  totalVasMinutes: number;
  vasRecords: number;

  // Almacenamiento
  totalStorageQuantity: number;
  totalStorageMinutes: number;
  storageRecords: number;

  // Calculados (KPIs de eficiencia)
  avgDuration: number;
  efficiency: number;
  packingEfficiency?: number;
  receptionEfficiency?: number;
  conditioningEfficiency?: number;
  storageEfficiency?: number;
}
