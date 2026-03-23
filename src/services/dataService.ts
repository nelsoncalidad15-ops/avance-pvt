import Papa from 'papaparse';
import { AutoRecord, PostventaKpiRecord, BillingRecord } from '../types';
import { MOCK_DATA } from '../constants';

const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val || val === 'NA' || val === 'N/A') return 0;
  
  const s = String(val).trim();
  if (!s) return 0;
  
  // Remove everything except digits, dots, commas and minus
  let clean = s.replace(/[^-0-9,.]/g, '');
  
  // Handle Argentine format (comma as decimal, dot as thousand)
  // If there's a comma, we assume it's the decimal separator
  if (clean.includes(',')) {
    // If there's also a dot, it's a thousand separator
    if (clean.includes('.')) {
      clean = clean.replace(/\./g, '');
    }
    clean = clean.replace(',', '.');
  }
  
  const result = parseFloat(clean);
  return isNaN(result) ? 0 : result;
};

const parsePercentage = (val: any): number => {
  return parseNumber(val);
};

export const fetchSheetData = async (url: string): Promise<AutoRecord[]> => {
  if (!url || url === 'postventa') return MOCK_DATA;
  
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      delimiter: "", // Auto-detect delimiter
      dynamicTyping: false, // Disable dynamicTyping to handle number parsing manually
      skipEmptyLines: true,
      complete: (results) => {
        const mappedData = results.data.map((row: any, index: number) => ({
          id: index.toString(),
          nro_mes: parseNumber(row['Nro - Mes']),
          mes: row['MES'],
          sucursal: row['Suc.'],
          semana_1: parseNumber(row['Semana 1']),
          semana_2: parseNumber(row['Semana 2']),
          semana_3: parseNumber(row['Semana 3']),
          semana_4: parseNumber(row['Semana 4']),
          semana_5: parseNumber(row['Semana 5']),
          avance_ppt: parseNumber(row['Avance PPT']),
          dias_laborables: parseNumber(row['DIA LAB.']),
          ppt_diarios: parseNumber(row['PPT DIARIOS']),
          avance_servicios: parseNumber(row['Avance Servis']),
          servicios_diarios: parseNumber(row['servis DIARIOS']),
          servis_vs_ppt: parsePercentage(row['% Servis Vs PPT']),
          objetivo_mensual: parseNumber(row['OBJ MENSUAL']),
          objetivo_ppt: parsePercentage(row['OBJ PPT']),
          anio: parseNumber(row['AÑO'])
        })).filter((d: any) => d.mes && d.sucursal); // Filter out empty rows
        
        resolve(mappedData);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const fetchPostventaKpiData = async (url: string): Promise<PostventaKpiRecord[]> => {
  // Mock data if no URL
  if (!url || url === 'postventa_kpi') {
    return [
      { id: '1', sucursal: 'Santa Fe', mes: 'Enero', anio: 2026, lvs: 4.85, email_validos: 96, tasa_respuesta: 32, dac: 0.15, contrato_mantenimiento: 22, reporte_tecnico: 50, reporte_garantia: 45, ampliacion_trabajo: 55, ppt_diario: 28, conversion_ppt_serv: 62, oudi_servicios: 13, costos_controlables: 75, costo_sueldos: 58, stock_muerto: 12, meses_stock: 3.5, cotizacion_seguros: 10, uodi_repuestos: 8, uodi_posventa: 6.5, incentivo_calidad: 100, plan_incentivo_posventa: 100, plan_incentivo_repuestos: 125, uops_total: 100 },
      { id: '2', sucursal: 'Jujuy', mes: 'Enero', anio: 2026, lvs: 4.75, email_validos: 94, tasa_respuesta: 28, dac: 0.25, contrato_mantenimiento: 18, reporte_tecnico: 45, reporte_garantia: 50, ampliacion_trabajo: 48, ppt_diario: 24, conversion_ppt_serv: 58, oudi_servicios: 11, costos_controlables: 82, costo_sueldos: 62, stock_muerto: 18, meses_stock: 4.2, cotizacion_seguros: 8, uodi_repuestos: 6, uodi_posventa: 6.1, incentivo_calidad: 90, plan_incentivo_posventa: 95, plan_incentivo_repuestos: 115, uops_total: 95 },
    ];
  }

  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      delimiter: "", // Auto-detect delimiter
      dynamicTyping: false,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          resolve([]);
          return;
        }

        const mappedData = results.data.map((row: any, index: number) => ({
          id: index.toString(),
          sucursal: String(getVal(row, ['Sucursal', 'Suc.', 'SUCURSAL', 'Suc']) || '').trim(),
          mes: String(getVal(row, ['Mes', 'MES', 'Month']) || '').trim(),
          anio: (() => {
            const a = parseNumber(getVal(row, ['AÑO', 'Año', 'Anio', 'Year']));
            if (a > 0) return a;
            // Fallback to 2025 if missing
            return 2025;
          })(),
          lvs: parseNumber(getVal(row, ['LVS', 'LVS OBJ: 4,80', 'LVS OBJ: 4.80'])),
          email_validos: parsePercentage(getVal(row, ['Email validos', 'Email validos Obj 95 %', 'Email validos Obj 95%'])),
          tasa_respuesta: parsePercentage(getVal(row, ['Tasa de repuesta', 'Tasa de repuesta OBJ: 30 %', 'Tasa de repuesta OBJ: 30%'])),
          dac: parsePercentage(getVal(row, ['DAC', 'DAC Obj: 0,2%', 'DAC Obj: 0.2%'])),
          contrato_mantenimiento: parseNumber(getVal(row, ['Contrato mantenimiento', 'Contrato mantenimiento Obj: 20'])),
          reporte_tecnico: parseNumber(getVal(row, ['Reporte tecnico', 'Reporte tecnico Obj: 48'])),
          reporte_garantia: parseNumber(getVal(row, ['Reporte garantia', 'Reporte garantia Obj: 48'])),
          ampliacion_trabajo: parsePercentage(getVal(row, ['Ampliacion de trabajo 50%', 'Ampliacion de trabajo'])),
          ppt_diario: parseNumber(getVal(row, ['PPT diario', 'PPT diario Obj 26'])),
          conversion_ppt_serv: parsePercentage(getVal(row, ['Conversion PPT vs Serv >60%', 'Conversion PPT vs Serv'])),
          oudi_servicios: parsePercentage(getVal(row, ['OUDI Servicios', 'OUDI Servicios Obj >12%'])),
          costos_controlables: parsePercentage(getVal(row, ['Costos controlables servicios', 'Costos controlables servicios Obj <80%'])),
          costo_sueldos: parsePercentage(getVal(row, ['Costo sueldos servicios', 'Costo sueldos servicios Obj: <60 %'])),
          stock_muerto: parsePercentage(getVal(row, ['Stock muerto <15%', 'Stock muerto'])),
          meses_stock: parseNumber(getVal(row, ['Meses de Stock 4M', 'Meses de Stock'])),
          cotizacion_seguros: parsePercentage(getVal(row, ['Cotizacion seguros'])),
          uodi_repuestos: parsePercentage(getVal(row, ['UDIG repuestos 7%', 'UODI Repuestos'])),
          uodi_posventa: parsePercentage(getVal(row, ['UODI POSVENTA 6.33%', 'UODI Posventa'])),
          incentivo_calidad: parsePercentage(getVal(row, ['Incentivo calidad'])),
          plan_incentivo_posventa: parsePercentage(getVal(row, ['Plan incentivo posventa'])),
          plan_incentivo_repuestos: parsePercentage(getVal(row, ['Plan incentivo repuestos 120%', 'Plan incentivo repuestos'])),
          uops_total: parsePercentage(getVal(row, ['UOPS Total']))
        })).filter((d: any) => d.mes && d.sucursal);

        resolve(mappedData);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

const getVal = (row: any, keys: string[]): any => {
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const targetKey = key.toLowerCase().trim();
    // Try exact match first
    let actualKey = rowKeys.find(k => k.toLowerCase().trim() === targetKey);
    if (actualKey && row[actualKey] !== undefined && row[actualKey] !== null) {
      return row[actualKey];
    }
    // Try partial match (starts with)
    actualKey = rowKeys.find(k => k.toLowerCase().trim().startsWith(targetKey));
    if (actualKey && row[actualKey] !== undefined && row[actualKey] !== null) {
      return row[actualKey];
    }
  }
  return undefined;
};

export const fetchPostventaBillingData = async (url: string): Promise<BillingRecord[]> => {
  // Mock data if no URL
  if (!url || url === 'postventa_billing') {
    return [
      { id: '1', nro_mes: 1, mes: 'Enero', sucursal: 'Santa Fe', area: 'Facturación REPUESTOS', objetivo_mensual: 5000000, avance_fecha: 4800000, cumplimiento_fecha_pct: 96, cumplimiento_cierre_pct: 102, objetivo_diario: 227000, promedio_diario: 218000, desvio_fecha: -200000, dif_dias_operacion: 0, anio: 2026 },
      { id: '2', nro_mes: 1, mes: 'Enero', sucursal: 'Santa Fe', area: 'Facturación SERVICIOS', objetivo_mensual: 8000000, avance_fecha: 8200000, cumplimiento_fecha_pct: 102.5, cumplimiento_cierre_pct: 105, objetivo_diario: 363000, promedio_diario: 372000, desvio_fecha: 200000, dif_dias_operacion: 0, anio: 2026 },
    ];
  }

  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      delimiter: "", // Auto-detect delimiter
      encoding: 'UTF-8',
      dynamicTyping: false,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          resolve([]);
          return;
        }
        const mappedData = results.data.map((row: any, index: number) => ({
          id: index.toString(),
          nro_mes: (() => {
            const nm = parseNumber(getVal(row, ['Nro Mes', 'Nro - Mes', 'NRO MES', 'Nro_Mes', 'Mes Nro', 'MES NRO']));
            if (nm > 0) return nm;
            const m = getVal(row, ['Mes', 'MES', 'Month']);
            const MONTHS_LIST = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const idx = MONTHS_LIST.indexOf(m);
            return idx !== -1 ? idx + 1 : 0;
          })(),
          mes: (() => {
            const m = getVal(row, ['Mes', 'MES', 'Month']);
            const num = parseInt(m);
            if (!isNaN(num) && num >= 1 && num <= 12) {
              const MONTHS_LIST = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
              return MONTHS_LIST[num - 1];
            }
            return m;
          })(),
          sucursal: getVal(row, ['Sucursal', 'Suc.', 'SUCURSAL', 'Suc']),
          area: getVal(row, ['AREA', 'Area', 'Área', 'Sector']),
          objetivo_mensual: parseNumber(getVal(row, ['OBJETIVO MENSUAL', 'OBJ MENSUAL', 'Objetivo'])),
          avance_fecha: parseNumber(getVal(row, ['AVANCE A FECHA', 'AVANCE FECHA', 'Avance'])),
          cumplimiento_fecha_pct: parsePercentage(getVal(row, ['Cumplimiento a la fecha (%)', 'CUMPLIMIENTO A LA FECHA', 'Cumplimiento %'])),
          cumplimiento_cierre_pct: parsePercentage(getVal(row, ['Cumplimiento a cierre MES (%)', 'CUMPLIMIENTO A CIERRE', 'Cierre %'])),
          objetivo_diario: parseNumber(getVal(row, ['OBJETIVO DIARIO', 'OBJ DIARIO'])),
          promedio_diario: parseNumber(getVal(row, ['PROM. DIARIO', 'PROMEDIO DIARIO', 'Prom. Diario'])),
          desvio_fecha: parseNumber(getVal(row, ['DESVIO A FECHA', 'DESVIO FECHA', 'Desvio'])),
          dif_dias_operacion: parseNumber(getVal(row, ['DIF. DIAS DE OPERACIÓN', 'DIF DIAS', 'Dif. Dias'])),
          anio: parseNumber(getVal(row, ['AÑO', 'Año', 'Anio', 'Year']))
        })).filter((d: any) => d.mes || d.sucursal || d.avance_fecha > 0);
        
        resolve(mappedData);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
