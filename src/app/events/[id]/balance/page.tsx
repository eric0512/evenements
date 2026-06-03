'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useEvents } from '@/context/EventsContext';
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  UserX,
  PiggyBank
} from 'lucide-react';

export default function BalancePage() {
  const params = useParams();
  const id = params.id as string;
  const { evenements } = useEvents();
  
  const selectedEvent = evenements.find(e => e.id === id);

  if (!selectedEvent) return null;

  const adultes = selectedEvent.participants.filter(p => !p.isEnfant);
  const adultesCount = adultes.length;

  const totalDepenses = selectedEvent.depenses.reduce((acc, d) => acc + d.montant, 0);
  const partDepenseParAdulte = adultesCount > 0 ? totalDepenses / adultesCount : 0;
  
  // Différence entre ce qui a été demandé (cotisation) et le coût réel
  const differenceParAdulte = selectedEvent.cotisationMontant - partDepenseParAdulte;
  
  // Listes pour le bilan
  const ontPaye = adultes.filter(p => p.cotisationReglee);
  const nontPasPaye = adultes.filter(p => !p.cotisationReglee);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fadeIn">
      
      {/* En-tête Bilan */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-6 justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
            <Scale className="h-6 w-6 text-indigo-400" />
            Bilan Financier
          </h2>
          <p className="text-sm text-slate-400">
            Analyse des comptes et répartition finale des coûts de l'événement.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 text-center min-w-[140px]">
            <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Cotisation fixée</div>
            <div className="text-2xl font-bold text-white">{selectedEvent.cotisationMontant} €</div>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 text-center min-w-[140px]">
            <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Coût réel / Adulte</div>
            <div className="text-2xl font-bold text-cyan-400">{partDepenseParAdulte.toFixed(2)} €</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Colonne 1 : Retards de paiement */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl h-full">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <UserX className="h-5 w-5 text-rose-400" />
              Retards de paiement ({nontPasPaye.length})
            </h3>
            
            {nontPasPaye.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-emerald-400">Parfait !</p>
                <p className="text-xs text-emerald-500/70 mt-1">Tous les participants ont réglé leur cotisation initiale.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 mb-2">
                  Ces participants doivent encore régler la cotisation initiale de <strong>{selectedEvent.cotisationMontant} €</strong>.
                </p>
                {nontPasPaye.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-rose-500/20">
                    <span className="text-sm font-medium text-white">{p.prenom} {p.nom}</span>
                    <span className="text-sm font-bold text-rose-400 flex items-center gap-1">
                      Doit {selectedEvent.cotisationMontant} € <ArrowRight className="h-3 w-3" /> Pot commun
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne 2 : Ajustement Final (Remboursement ou Complément) */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl h-full">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <PiggyBank className="h-5 w-5 text-amber-400" />
              Ajustement Final
            </h3>

            {differenceParAdulte === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm text-emerald-400">Les comptes sont parfaitement à l'équilibre.</p>
              </div>
            ) : differenceParAdulte > 0 ? (
              // Trop perçu -> Remboursement
              <div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-4">
                  <p className="text-sm text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span>
                      La cotisation demandée ({selectedEvent.cotisationMontant} €) est supérieure au coût réel ({partDepenseParAdulte.toFixed(2)} €).
                      Un surplus de <strong>{differenceParAdulte.toFixed(2)} €</strong> par adulte a été perçu.
                    </span>
                  </p>
                </div>
                
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">À rembourser</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {ontPaye.length === 0 && <p className="text-xs text-slate-500">Personne n'a encore payé.</p>}
                  {ontPaye.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-xs text-slate-300">{p.prenom} {p.nom}</span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        Pot commun <ArrowRight className="h-3 w-3" /> {differenceParAdulte.toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Déficit -> Complément demandé
              <div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-4">
                  <p className="text-sm text-rose-400 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span>
                      La cotisation demandée ({selectedEvent.cotisationMontant} €) ne couvre pas le coût réel ({partDepenseParAdulte.toFixed(2)} €).
                      Un complément de <strong>{Math.abs(differenceParAdulte).toFixed(2)} €</strong> par adulte est nécessaire.
                    </span>
                  </p>
                </div>
                
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Complément à réclamer</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {adultes.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-xs text-slate-300">{p.prenom} {p.nom}</span>
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        Doit {Math.abs(differenceParAdulte).toFixed(2)} € <ArrowRight className="h-3 w-3" /> Pot commun
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
