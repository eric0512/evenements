'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useEvents } from '@/context/EventsContext';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Scale
} from 'lucide-react';

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params.id as string;
  const pathname = usePathname();
  const router = useRouter();
  
  const { evenements, loading } = useEvents();
  
  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const selectedEvent = evenements.find(e => e.id === id);

  if (!selectedEvent) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-slate-300">Événement introuvable</h2>
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </button>
      </div>
    );
  }

  const navItems = [
    { name: 'Finances', path: `/events/${id}/finances`, icon: <LayoutDashboard className="h-4 w-4" /> },
    { name: 'Participants', path: `/events/${id}/participants`, icon: <Users className="h-4 w-4" /> },
    { name: 'Dépenses', path: `/events/${id}/expenses`, icon: <CreditCard className="h-4 w-4" /> },
    { name: 'Bilan', path: `/events/${id}/balance`, icon: <Scale className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 py-4">
            <button 
              onClick={() => router.push('/')}
              className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Retour aux événements"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{selectedEvent.titre}</h1>
              <p className="text-xs text-slate-400">Le {selectedEvent.date} — Cotisation: {selectedEvent.cotisationMontant} €</p>
            </div>
          </div>
          
          <nav className="flex overflow-x-auto hide-scrollbar gap-1 pb-[-1px]">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
}
