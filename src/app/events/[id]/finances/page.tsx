'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useEvents } from '@/context/EventsContext';
import { 
  CreditCard, 
  TrendingDown, 
  DollarSign, 
  Users 
} from 'lucide-react';

export default function FinancesPage() {
  const params = useParams();
  const id = params.id as string;
  const { evenements, saveData } = useEvents();
  
  const selectedEvent = evenements.find(e => e.id === id);
  const [editingCotisation, setEditingCotisation] = useState(false);
  const [tempCotisation, setTempCotisation] = useState(0);

  if (!selectedEvent) return null;

  const startEditingCotisation = () => {
    setTempCotisation(selectedEvent.cotisationMontant);
    setEditingCotisation(true);
  };

  const handleUpdateCotisation = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedEvents = evenements.map(evt => {
      if (evt.id === selectedEvent.id) {
        return { ...evt, cotisationMontant: Number(tempCotisation) };
      }
      return evt;
    });
    await saveData(updatedEvents);
    setEditingCotisation(false);
  };

  const getFinancialStats = () => {
    const adultes = selectedEvent.participants.filter(p => !p.isEnfant);
    const enfants = selectedEvent.participants.filter(p => p.isEnfant);

    const adultesCount = adultes.length;
    const enfantsCount = enfants.length;

    const totalCotisationsAttendues = adultesCount * selectedEvent.cotisationMontant;
    const totalCotisationsRecues = adultes.filter(p => p.cotisationReglee).length * selectedEvent.cotisationMontant;
    
    const totalDepenses = selectedEvent.depenses.reduce((acc, d) => acc + d.montant, 0);
    const soldeEvenement = totalCotisationsRecues - totalDepenses;
    const partDepenseParAdulte = adultesCount > 0 ? totalDepenses / adultesCount : 0;

    return {
      adultesCount,
      enfantsCount,
      totalCotisationsAttendues,
      totalCotisationsRecues,
      totalDepenses,
      soldeEvenement,
      partDepenseParAdulte
    };
  };

  const stats = getFinancialStats();

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Event Overview Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-wrap gap-4 justify-between items-center shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Vue d'ensemble</h2>
          {editingCotisation ? (
            <form onSubmit={handleUpdateCotisation} className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-400">Cotisation adulte :</span>
              <input 
                type="number" 
                value={tempCotisation} 
                onChange={(e) => setTempCotisation(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:outline-none focus:border-indigo-500"
                min="0"
                required
                autoFocus
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition">Valider</button>
              <button type="button" onClick={() => setEditingCotisation(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition">Annuler</button>
            </form>
          ) : (
            <p className="text-sm text-slate-400">
              Cotisation fixée à{" "}
              <span 
                onClick={startEditingCotisation}
                className="font-bold text-indigo-400 underline cursor-pointer decoration-dotted hover:text-indigo-300 transition-colors"
                title="Cliquez pour modifier le montant de la cotisation"
              >
                {selectedEvent.cotisationMontant} €
              </span>{" "}
              par adulte.
            </p>
          )}
        </div>
        <div className="flex gap-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1 uppercase font-semibold tracking-wider">Adultes</div>
            <div className="text-2xl font-bold text-indigo-400">{stats.adultesCount}</div>
          </div>
          <div className="w-px bg-slate-800"></div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1 uppercase font-semibold tracking-wider">Enfants</div>
            <div className="text-2xl font-bold text-cyan-400">{stats.enfantsCount}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cotisations */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-indigo-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cotisations Perçues</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white">{stats.totalCotisationsRecues} €</span>
            <div className="text-xs text-slate-400 mt-2 flex justify-between items-center">
              <span>Sur un total attendu de</span>
              <span className="font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{stats.totalCotisationsAttendues} €</span>
            </div>
          </div>
        </div>

        {/* Dépenses */}
        <div className="bg-gradient-to-br from-slate-900 to-rose-950/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-rose-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dépenses Totales</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white">{stats.totalDepenses} €</span>
            <p className="text-xs text-slate-400 mt-2">
              Somme de tous les achats et frais.
            </p>
          </div>
        </div>

        {/* Solde */}
        <div className={`bg-gradient-to-br from-slate-900 ${stats.soldeEvenement < 0 ? 'to-rose-950/40' : 'to-emerald-950/40'} border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-${stats.soldeEvenement < 0 ? 'rose' : 'emerald'}-500/30 transition-colors`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Solde Restant</span>
            <div className={`p-2 rounded-xl ${stats.soldeEvenement < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-black ${stats.soldeEvenement < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats.soldeEvenement > 0 ? '+' : ''}{stats.soldeEvenement} €
            </span>
            <p className="text-xs text-slate-400 mt-2">
              Cotisations reçues - Dépenses
            </p>
          </div>
        </div>

        {/* Coût par adulte */}
        <div className="bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-cyan-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coût par Adulte</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white">
              {stats.partDepenseParAdulte.toFixed(2)} €
            </span>
            <p className="text-xs text-slate-400 mt-2">
              Réparti sur les {stats.adultesCount} adultes (enfants exclus).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
