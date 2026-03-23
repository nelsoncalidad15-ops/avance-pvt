import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PostventaDashboard } from './components/PostventaDashboard';
import { PostventaKpiDashboard } from './components/PostventaKpiDashboard';
import { PostventaBillingDashboard } from './components/PostventaBillingDashboard';
import { Icons } from './components/Icon';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center space-y-12">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-slate-900/30 transform -rotate-6">
            <Icons.Activity className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black text-slate-950 uppercase tracking-tighter italic">Autosol Intelligence</h1>
          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.5em]">Enterprise Management System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MenuCard 
            title="Control Operativo" 
            subtitle="PPT & Performance" 
            icon={Icons.Wrench} 
            onClick={() => navigate('/operativo')}
            color="bg-blue-600"
          />
          <MenuCard 
            title="Gestión de KPIs" 
            subtitle="21 Indicadores Críticos" 
            icon={Icons.Target} 
            onClick={() => navigate('/kpis')}
            color="bg-emerald-600"
          />
          <MenuCard 
            title="Facturación" 
            subtitle="Finanzas & Ventas" 
            icon={Icons.DollarSign} 
            onClick={() => navigate('/billing')}
            color="bg-indigo-600"
          />
        </div>
      </div>
    </div>
  );
};

const MenuCard = ({ title, subtitle, icon: Icon, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group text-left flex flex-col h-full w-full"
  >
    <div className={`w-16 h-16 ${color} rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-xl group-hover:rotate-12 transition-transform`}>
      <Icon className="w-8 h-8" />
    </div>
    <div className="mt-auto">
      <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight italic leading-none">{title}</h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">{subtitle}</p>
    </div>
  </button>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/operativo" 
          element={
            <PostventaDashboard 
              onBack={() => window.location.href = '/'}
            />
          } 
        />
        <Route 
          path="/kpis" 
          element={
            <PostventaKpiDashboard 
              onBack={() => window.location.href = '/'}
            />
          } 
        />
        <Route 
          path="/billing" 
          element={
            <PostventaBillingDashboard 
              onBack={() => window.location.href = '/'}
            />
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
