import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PostventaDashboard } from './components/PostventaDashboard';
import { PostventaKpiDashboard } from './components/PostventaKpiDashboard';
import { PostventaBillingDashboard } from './components/PostventaBillingDashboard';
import { Icons } from './components/Icon';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=2070" 
          alt="VW Background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl w-full text-center space-y-16">
        <div className="space-y-6">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl transform -rotate-6 transition-transform hover:rotate-0 duration-500">
            <Icons.Activity className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl md:text-7xl font-black text-white uppercase tracking-tighter italic drop-shadow-2xl">
              Autosol <span className="text-blue-500">Intelligence</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-blue-500/50"></div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-[0.6em]">Postventa Excellence System</p>
              <div className="h-[1px] w-12 bg-blue-500/50"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MenuCard 
            title="Control Operativo" 
            subtitle="PPT & Performance" 
            icon={Icons.Wrench} 
            onClick={() => navigate('/operativo')}
            color="bg-blue-500"
          />
          <MenuCard 
            title="Gestión de KPIs" 
            subtitle="21 Indicadores Críticos" 
            icon={Icons.Target} 
            onClick={() => navigate('/kpis')}
            color="bg-emerald-500"
          />
          <MenuCard 
            title="Facturación" 
            subtitle="Finanzas & Ventas" 
            icon={Icons.DollarSign} 
            onClick={() => navigate('/billing')}
            color="bg-indigo-500"
          />
        </div>

        <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-medium">
          © 2024 Autosol Jujuy • Gestión Profesional de Concesionarios
        </p>
      </div>
    </div>
  );
};

const MenuCard = ({ title, subtitle, icon: Icon, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] transition-all group text-left flex flex-col h-full w-full"
  >
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
      <Icon className="w-7 h-7" />
    </div>
    <div className="mt-auto relative z-10">
      <h3 className="text-xl font-black text-white uppercase tracking-tight italic leading-none group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">{subtitle}</p>
    </div>
    {/* Subtle gradient glow on hover */}
    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/10 blur-[80px] group-hover:bg-blue-500/20 transition-all duration-700"></div>
  </button>
);

const DashboardWrapper = ({ children }: { children: (navigate: any) => React.ReactNode }) => {
  const navigate = useNavigate();
  return <>{children(navigate)}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/operativo" 
          element={
            <DashboardWrapper>
              {(navigate) => <PostventaDashboard onBack={() => navigate('/')} />}
            </DashboardWrapper>
          } 
        />
        <Route 
          path="/kpis" 
          element={
            <DashboardWrapper>
              {(navigate) => <PostventaKpiDashboard onBack={() => navigate('/')} />}
            </DashboardWrapper>
          } 
        />
        <Route 
          path="/billing" 
          element={
            <DashboardWrapper>
              {(navigate) => <PostventaBillingDashboard onBack={() => navigate('/')} />}
            </DashboardWrapper>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
