
import { GoogleGenAI } from "@google/genai";
import { PickingOrder, OperatorStats } from "../types.ts";

export const getLogisticAnalysis = async (orders: PickingOrder[], stats: OperatorStats[], dateRange: { start: string, end: string }) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const prompt = `
    Como Director de Operaciones Logísticas, analiza el desempeño en el periodo del ${dateRange.start} al ${dateRange.end}:
    - Pedidos Totales en Periodo: ${orders.length}
    - Pickings Finalizados: ${orders.filter(o => o.status === 'Procesado').length}
    - Packings Finalizados: ${orders.filter(o => o.operadorPacking && o.operadorPacking !== '').length}
    - Total Líneas Procesadas: ${orders.reduce((acc, o) => acc + (Number(o.lineas) || 0), 0)}
    - Total Unidades Físicas: ${orders.reduce((acc, o) => acc + (Number(o.cantidad) || 0), 0)}

    Resumen de Productividad por Operador en este rango:
    ${JSON.stringify(stats.map(s => ({
      nombre: s.name,
      picking: { ef: s.efficiency.toFixed(1) + ' L/H', total: s.totalLines },
      packing: { ef: (s.packingEfficiency || 0).toFixed(1) + ' L/H', total: s.totalPackLines },
      recepcion: { ef: (s.receptionEfficiency || 0).toFixed(1) + ' L/H' },
      vas: { unidades: s.totalVasQuantity }
    })))}

    Proporciona una auditoría ejecutiva del PERIODO (4 puntos) sobre:
    1. Densidad operativa y cumplimiento de la ventana temporal.
    2. Operadores destacados en este rango específico.
    3. Anomalías o cuellos de botella detectados.
    4. Recomendación estratégica inmediata.
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
    return "Análisis gerencial no disponible para este rango. Verifique conexión.";
  }
};

export const getOperatorSpecificAnalysis = async (operatorName: string, stats: OperatorStats, dateRange: { start: string, end: string }) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const prompt = `
    Realiza una auditoría técnica de productividad para "${operatorName}" del ${dateRange.start} al ${dateRange.end}:

    MÉTRICAS DEL PERIODO:
    - PICKING: ${stats.totalLines} Líneas, ${stats.efficiency.toFixed(1)} L/H.
    - PACKING: ${stats.totalPackLines} Líneas, ${(stats.packingEfficiency || 0).toFixed(1)} L/H.
    - RECEPCIÓN: ${stats.totalRecQuantity} Unid, ${(stats.receptionEfficiency || 0).toFixed(1)} L/H.
    - VAS: ${stats.totalVasQuantity} Unidades procesadas.

    PROPORCIONA:
    1. Evaluación de rendimiento en este rango de fechas.
    2. Comparativa implícita contra estándares de 45 L/H.
    3. Una fortaleza y una oportunidad de mejora crítica.
    Máximo 150 palabras. Tono supervisor senior.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Operator AI Error:", error);
    return "No se pudo generar el reporte técnico para este rango de fechas.";
  }
};
