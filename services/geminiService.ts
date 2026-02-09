
import { GoogleGenAI } from "@google/genai";
import { PickingOrder, OperatorStats } from "../types.ts";

export const getLogisticAnalysis = async (orders: PickingOrder[], stats: OperatorStats[]) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const prompt = `
    Como Director de Operaciones Logísticas, analiza el desempeño diario:
    - Pedidos Totales: ${orders.length}
    - Pickings Finalizados: ${orders.filter(o => o.status === 'Procesado').length}
    - Packings Finalizados: ${orders.filter(o => o.statusPacking === 'Procesado').length}
    - Total Líneas de Artículos: ${orders.reduce((acc, o) => acc + o.lineas, 0)}
    - Total Unidades Físicas: ${orders.reduce((acc, o) => acc + o.cantidad, 0)}

    Resumen por Operador (Volúmenes y Eficiencia):
    ${JSON.stringify(stats.map(s => ({
      nombre: s.name,
      picking: { lineas: s.totalLines, unidades: s.totalQuantity, tiempo: s.totalPickMinutes + ' min', registros: s.pickRecords },
      packing: { lineas: s.totalPackLines, unidades: s.totalPackQuantity, tiempo: s.totalPackMinutes + ' min', registros: s.packRecords },
      recepcion: { lineas: s.totalRecLines, unidades: s.totalRecQuantity, tiempo: s.totalRecMinutes + ' min' },
      almacenamiento: { unidades: s.totalStorageQuantity, tiempo: s.totalStorageMinutes + ' min', registros: s.storageRecords },
      vas: { lineas: s.totalVasLines, unidades: s.totalVasQuantity, tiempo: s.totalVasMinutes + ' min' }
    })))}

    Proporciona una auditoría ejecutiva (4 puntos) sobre:
    1. Densidad operativa (Artículos vs Tiempos).
    2. Operadores más productivos por tipo de flujo.
    3. Cuellos de botella detectados en tiempos de ejecución.
    4. Recomendación estratégica para mejorar el despacho y la ubicación de stock.
    Usa un lenguaje profesional y directo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Análisis gerencial no disponible. Verifique conexión.";
  }
};

export const getOperatorSpecificAnalysis = async (operatorName: string, stats: OperatorStats) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const prompt = `
    Realiza una auditoría técnica de productividad para el colaborador "${operatorName}":

    MÉTRICAS POR PROCESO:
    - PICKING: ${stats.totalLines} Líneas de Artículos, ${stats.totalQuantity} Unidades, ${stats.totalPickMinutes} min invertidos en ${stats.pickRecords} registros.
    - PACKING: ${stats.totalPackLines} Líneas de Artículos, ${stats.totalPackQuantity} Unidades, ${stats.totalPackMinutes} min invertidos en ${stats.packRecords} registros.
    - RECEPCIÓN: ${stats.totalRecLines} Líneas, ${stats.totalRecQuantity} Unidades, ${stats.totalRecMinutes} min invertidos.
    - ALMACENAMIENTO: ${stats.totalStorageQuantity} Unidades movidas, ${stats.totalStorageMinutes} min invertidos en ${stats.storageRecords} movimientos.
    - VAS: ${stats.totalVasLines} Líneas, ${stats.totalVasQuantity} Unidades, ${stats.totalVasMinutes} min invertidos.

    PROPORCIONA:
    1. Análisis de Capacidad de Respuesta (Relación Artículos/Minuto).
    2. Identificación de Excelencia Operativa (¿En qué proceso destaca más?).
    3. Área Crítica de Mejora (Eficiencia o Volumen).
    4. Recomendación de Capacitación o Ajuste de Rol.
    Usa tono de Supervisor Senior. Sé conciso pero profundo. Máximo 200 palabras.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Operator AI Error:", error);
    return "No se pudo generar el reporte técnico individual.";
  }
};
