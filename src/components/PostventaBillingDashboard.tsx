import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DashboardFrame, 
  LuxuryKPICard, 
  ChartWrapper, 
  MonthSelector, 
  DataTable, 
  StatusBadge,
  InsightCard
} from './DashboardUI';
import { Icons } from './Icon';
import { GaugeChart } from './GaugeChart';
import { ChatBot } from './ChatBot';
import { fetchPostventaBillingData } from '../services/dataService';
import { BillingRecord, LoadingStatus } from '../types';
import { MONTHS, YEARS, BRANCHES, BRANCH_COLORS, DEFAULT_CONFIG } from '../constants';

interface PostventaBillingDashboardProps {
  onBack?: () => void;
}

export const PostventaBillingDashboard: React.FC<PostventaBillingDashboardProps> = ({ onBack }) => {
  const [data, setData] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState<LoadingStatus>({ isLoading: true, error: null });
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const normalize = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  useEffect(() => {
    const loadData = async () => {
      setLoading({ isLoading: true, error: null });
      try {
        const result = await fetchPostventaBillingData(DEFAULT_CONFIG.sheetUrls.postventa_billing);
        setData(result);
        
        // Set default year to the latest year in the data
        if (result.length > 0) {
          const years = Array.from(new Set(result.map(item => item.anio?.toString()))).filter(y => y && y !== '0').sort();
          if (years.length > 0) {
            setSelectedYear(years[years.length - 1]!);
          }
        }
        
        setLoading({ isLoading: false, error: null });
      } catch (err) {
        setLoading({ isLoading: false, error: 'Error al cargar los datos de facturación.' });
      }
    };
    loadData();
  }, []);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(data.map(item => item.anio?.toString()))).filter(y => y && y !== '0').sort();
    return years.length > 0 ? years : YEARS;
  }, [data]);

  const areas = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach(item => {
      if (item.area) {
        const norm = normalize(item.area);
        if (!map.has(norm)) {
          map.set(norm, item.area);
        }
      }
    });
    return Array.from(map.values()).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const yearMatch = item.anio?.toString() === selectedYear;
      const monthMatch = selectedMonths.length === 0 || selectedMonths.includes(item.mes);
      const branchMatch = selectedBranches.length === 0 || selectedBranches.includes(item.sucursal);
      const areaMatch = selectedAreas.length === 0 || selectedAreas.some(a => normalize(item.area) === normalize(a));
      return yearMatch && monthMatch && branchMatch && areaMatch;
    });
  }, [data, selectedYear, selectedMonths, selectedBranches, selectedAreas]);

  // Financial KPI Calculations
  const kpis = useMemo(() => {
    const totalFacturacion = filteredData.reduce((sum, item) => sum + (item.avance_fecha || 0), 0);
    const totalObjetivo = filteredData.reduce((sum, item) => sum + (item.objetivo_mensual || 0), 0);
    const totalDesvio = filteredData.reduce((sum, item) => sum + (item.desvio_fecha || 0), 0);
    const totalPromedioDiario = filteredData.reduce((sum, item) => sum + (item.promedio_diario || 0), 0);
    const totalObjetivoDiario = totalObjetivo / 22; // Assuming 22 working days
    
    // Breakdown by branch - Ensure all selected branches are included
    const branchesToInclude = selectedBranches.length > 0 ? selectedBranches : Array.from(new Set(data.map(d => d.sucursal))).filter(Boolean);
    
    const branchBreakdown = branchesToInclude.map(branch => {
      const branchData = filteredData.filter(d => d.sucursal === branch);
      const facturacion = branchData.reduce((sum, d) => sum + (d.avance_fecha || 0), 0);
      const objetivo = branchData.reduce((sum, d) => sum + (d.objetivo_mensual || 0), 0);
      const desvio = branchData.reduce((sum, d) => sum + (d.desvio_fecha || 0), 0);
      const promedio = branchData.reduce((sum, d) => sum + (d.promedio_diario || 0), 0);
      const objetivoDiario = objetivo / 22;
      return {
        name: branch,
        facturacion,
        objetivo,
        desvio,
        promedio,
        objetivoDiario,
        cumplimiento: objetivo > 0 ? (facturacion / objetivo) * 100 : 0
      };
    }).sort((a, b) => b.facturacion - a.facturacion);

    return {
      facturacion: totalFacturacion,
      objetivo: totalObjetivo,
      desvio: totalDesvio,
      promedio: totalPromedioDiario,
      objetivoDiario: totalObjetivoDiario,
      cumplimiento: totalObjetivo > 0 ? (totalFacturacion / totalObjetivo) * 100 : 0,
      branchBreakdown
    };
  }, [filteredData]);

  // Monthly Billing Chart Data by Branch (Always Annual)
  const branchMonthlyData = useMemo(() => {
    const months = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    
    const branchesToRender = selectedBranches.length > 0 ? selectedBranches : BRANCHES;

    return branchesToRender.map(branch => {
      const branchData = months.map((m, index) => {
        const monthData = data.filter(d => 
          d.sucursal === branch &&
          (d.nro_mes === index + 1 || d.mes === m) && 
          d.anio?.toString() === selectedYear && 
          (selectedAreas.length === 0 || selectedAreas.some(a => normalize(d.area) === normalize(a)))
        );
        return {
          name: m.substring(0, 3),
          fullName: m,
          facturacion: monthData.reduce((sum, d) => sum + (d.avance_fecha || 0), 0),
          isStudyMonth: selectedMonths.includes(m)
        };
      });
      return { branch, data: branchData };
    }).filter(b => b.data.some(d => d.facturacion > 0));
  }, [data, selectedYear, selectedMonths, selectedBranches, selectedAreas]);

  const formatCurrency = (value: number, inMillions: boolean = true) => {
    if (inMillions) {
      const millions = value / 1000000;
      return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: 'ARS', 
        maximumFractionDigits: 1 
      }).format(millions) + 'M';
    }
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const toggleBranch = (branch: string) => {
    setSelectedBranches(prev => 
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };

  const toggleArea = (area: string) => {
    const normArea = normalize(area);
    setSelectedAreas(prev => 
      prev.some(a => normalize(a) === normArea) 
        ? prev.filter(a => normalize(a) !== normArea) 
        : [...prev, area]
    );
  };
  const horizontalFilters = (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30 mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Temporality */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporalidad</span>
            <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-2xl w-fit">
              {availableYears.map(y => (
                <button 
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-8 py-2.5 rounded-xl text-[11px] font-black transition-all ${selectedYear === y ? 'bg-slate-950 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedMonths([])}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border ${selectedMonths.length === 0 ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
              >
                ANUAL
              </button>
              {MONTHS.slice(0, 9).map(m => (
                <button 
                  key={m}
                  onClick={() => toggleMonth(m)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border ${selectedMonths.includes(m) ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                >
                  {m.charAt(0) + m.slice(1, 3).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {MONTHS.slice(9).map(m => (
                <button 
                  key={m}
                  onClick={() => toggleMonth(m)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border ${selectedMonths.includes(m) ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                >
                  {m.charAt(0) + m.slice(1, 3).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Branches */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sucursales</span>
          <div className="flex flex-wrap gap-2 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
            <button 
              onClick={() => setSelectedBranches([])}
              className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${selectedBranches.length === 0 ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-slate-400 hover:text-slate-600'}`}
            >
              TODAS
            </button>
            {BRANCHES.map(b => (
              <button 
                key={b}
                onClick={() => toggleBranch(b)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${selectedBranches.includes(b) ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-white text-slate-400 hover:text-slate-600'}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-12 pt-12 border-t border-slate-100">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Áreas de Negocio</span>
        <div className="flex flex-wrap gap-2 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
          <button 
            onClick={() => setSelectedAreas([])}
            className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${selectedAreas.length === 0 ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-slate-400 hover:text-slate-600'}`}
          >
            TODAS
          </button>
          {areas.map(a => (
            <button 
              key={a}
              onClick={() => toggleArea(a)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${selectedAreas.some(sa => normalize(sa) === normalize(a)) ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-white text-slate-400 hover:text-slate-600'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardFrame 
      title="Facturación Posventa" 
      subtitle="Análisis de Ingresos y Objetivos"
      onBack={onBack}
      isLoading={loading.isLoading}
      lastUpdated="23/03/2026 12:15"
    >
      {horizontalFilters}

      {filteredData.length === 0 && !loading.isLoading ? (
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <Icons.Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-900 mb-2">No se encontraron datos</h3>
          <p className="text-slate-500 text-sm">Prueba ajustando los filtros de año, sucursal o área.</p>
        </div>
      ) : (
        <>
          {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <LuxuryKPICard 
          title="Avance a Fecha" 
          value={formatCurrency(kpis.facturacion)} 
          color="bg-blue-600" 
          icon={Icons.DollarSign}
          breakdown={kpis.branchBreakdown.map(b => ({ 
            name: b.name, 
            value: formatCurrency(b.facturacion)
          }))}
        />
        <LuxuryKPICard 
          title="Objetivo Facturación" 
          value={formatCurrency(kpis.objetivo)} 
          color="bg-slate-800" 
          icon={Icons.Target}
          breakdown={kpis.branchBreakdown.map(b => ({ name: b.name, value: formatCurrency(b.objetivo) }))}
        />
        <LuxuryKPICard 
          title="Desvío a Fecha" 
          value={formatCurrency(kpis.desvio)} 
          color={kpis.desvio < 0 ? 'bg-rose-600' : 'bg-emerald-600'} 
          icon={Icons.AlertTriangle}
          isDark={kpis.desvio < 0}
          isDanger={kpis.desvio < 0}
          breakdown={kpis.branchBreakdown.map(b => ({ 
            name: b.name, 
            value: formatCurrency(b.desvio),
            percentage: b.desvio < 0 ? 100 : undefined // Only show bar for negative deviation
          }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LuxuryKPICard 
          title="Promedio Diario" 
          value={formatCurrency(kpis.promedio, false)} 
          color="bg-emerald-600" 
          icon={Icons.Activity}
          breakdown={kpis.branchBreakdown.map(b => ({ 
            name: b.name, 
            value: formatCurrency(b.promedio, false)
          }))}
        />
        <LuxuryKPICard 
          title="Objetivo Diario" 
          value={formatCurrency(kpis.objetivoDiario, false)} 
          color="bg-slate-700" 
          icon={Icons.Target}
          breakdown={kpis.branchBreakdown.map(b => ({ name: b.name, value: formatCurrency(b.objetivoDiario, false) }))}
        />
      </div>

      {/* Gauges Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpis.branchBreakdown.map((branch, idx) => (
          <div key={idx} className="bg-slate-950 rounded-[1.5rem] p-4 shadow-2xl relative overflow-hidden flex items-center justify-between group">
            <div className="relative z-10">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Cumplimiento {branch.name}</p>
              <h4 className={`text-2xl font-black tracking-tighter italic leading-none ${
                branch.cumplimiento >= 95 ? 'text-emerald-500' : branch.cumplimiento >= 90 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {(branch.cumplimiento || 0).toFixed(1)}%
              </h4>
            </div>
            <div className="w-12 h-12 relative z-10">
              <GaugeChart 
                value={branch.cumplimiento} 
                color={branch.cumplimiento >= 95 ? '#10b981' : branch.cumplimiento >= 90 ? '#f59e0b' : '#ef4444'}
              />
            </div>
          </div>
        ))}
        {/* Global Gauge if multiple branches selected */}
        {kpis.branchBreakdown.length > 1 && (
          <div className="bg-slate-900 rounded-[1.5rem] p-4 shadow-2xl relative overflow-hidden flex items-center justify-between group border border-white/5">
            <div className="relative z-10">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Cumplimiento Total</p>
              <h4 className={`text-2xl font-black tracking-tighter italic leading-none ${
                kpis.cumplimiento >= 95 ? 'text-emerald-500' : kpis.cumplimiento >= 90 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {(kpis.cumplimiento || 0).toFixed(1)}%
              </h4>
            </div>
            <div className="w-12 h-12 relative z-10">
              <GaugeChart 
                value={kpis.cumplimiento} 
                color={kpis.cumplimiento >= 95 ? '#10b981' : kpis.cumplimiento >= 90 ? '#f59e0b' : '#ef4444'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Central Visualization: Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {branchMonthlyData.map(({ branch, data: branchData }, idx) => (
          <ChartWrapper 
            key={idx}
            title={`Performance Mensual: ${branch}`} 
            subtitle="Comparativa de ingresos anual (M$)"
          >
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                    tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '20px' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar 
                    dataKey="facturacion" 
                    name="Facturación" 
                    radius={[10, 10, 0, 0]}
                    label={{ 
                      position: 'top', 
                      fill: '#1e293b', 
                      fontSize: 10, 
                      fontWeight: 900, 
                      formatter: (v: number) => `$${(v / 1000000).toFixed(1)}M` 
                    }}
                  >
                    {branchData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isStudyMonth ? '#2563eb' : '#e2e8f0'} 
                        fillOpacity={entry.isStudyMonth ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
        ))}
      </div>

      {/* Detailed Billing Table */}
      <DataTable 
        title="Detalle de Facturación"
        subtitle="Desglose por sucursal, área y cumplimiento"
        data={filteredData}
        columns={[
          { header: 'Sucursal', accessor: 'sucursal' },
          { header: 'Área', accessor: 'area' },
          { header: 'Mes', accessor: 'mes' },
          { 
            header: 'Objetivo', 
            accessor: 'objetivo_mensual',
            render: (val) => <span className="text-slate-500">{formatCurrency(val)}</span>
          },
          { 
            header: 'Avance', 
            accessor: 'avance_fecha',
            render: (val) => <span className="font-black text-slate-900">{formatCurrency(val)}</span>
          },
          { 
            header: 'Desvío', 
            accessor: 'desvio_fecha',
            render: (val) => {
              const numVal = parseFloat(val?.toString()) || 0;
              const color = numVal < -1000000 ? 'text-rose-600 bg-rose-50' : numVal < -500000 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';
              return (
                <span className={`px-3 py-1 rounded-lg font-black italic ${color}`}>
                  {formatCurrency(val)}
                </span>
              );
            }
          },
          { 
            header: 'Prom. Diario', 
            accessor: 'promedio_diario',
            render: (val) => <span className="font-bold text-slate-600">{formatCurrency(val, false)}</span>
          },
          { 
            header: 'Cumplimiento', 
            accessor: 'cumplimiento_fecha_pct',
            render: (val) => {
              const numVal = parseFloat(val?.toString().replace('%', '').replace(',', '.')) || 0;
              return (
                <div className="flex items-center gap-2">
                  <span className={`font-black italic ${numVal >= 95 ? 'text-emerald-600' : numVal >= 90 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {numVal.toFixed(1)}%
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full ${numVal >= 95 ? 'bg-emerald-500' : numVal >= 90 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                </div>
              );
            }
          },
          { 
            header: 'Estado', 
            accessor: 'cumplimiento_fecha_pct',
            render: (val) => {
              const numVal = parseFloat(val?.toString().replace('%', '').replace(',', '.')) || 0;
              if (numVal >= 95) return <StatusBadge status="success" label="En Meta" />;
              if (numVal >= 90) return <StatusBadge status="warning" label="Alerta" />;
              return <StatusBadge status="error" label="Crítico" />;
            }
          }
        ]}
      />

        </>
      )}

      <ChatBot context={`Estás viendo el Dashboard de Facturación de Posventa de Autosol. 
        Facturación Total: ${formatCurrency(kpis.facturacion)}. 
        Objetivo Total: ${formatCurrency(kpis.objetivo)}. 
        Cumplimiento Global: ${(kpis.cumplimiento || 0).toFixed(1)}%. 
        Sucursales Seleccionadas: ${selectedBranches.length > 0 ? selectedBranches.join(', ') : 'Todas'}.
        Áreas Seleccionadas: ${selectedAreas.length > 0 ? selectedAreas.join(', ') : 'Todas'}.`} 
      />
    </DashboardFrame>
  );
};
