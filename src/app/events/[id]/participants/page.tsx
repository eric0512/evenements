'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useEvents } from '@/context/EventsContext';
import { Participant } from '@/types';
import { 
  Users, 
  Baby, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Heart, 
  Plus 
} from 'lucide-react';

export default function ParticipantsPage() {
  const params = useParams();
  const id = params.id as string;
  const { evenements, saveData } = useEvents();
  
  const selectedEvent = evenements.find(e => e.id === id);

  const [newPartNom, setNewPartNom] = useState('');
  const [newPartPrenom, setNewPartPrenom] = useState('');
  const [newPartIsEnfant, setNewPartIsEnfant] = useState(false);
  const [newPartCoupleAvec, setNewPartCoupleAvec] = useState('');
  const [newPartParentCouple, setNewPartParentCouple] = useState('');

  if (!selectedEvent) return null;

  const getCouplesList = () => {
    const list: { id: string; name: string }[] = [];
    const processed = new Set<string>();

    selectedEvent.participants.forEach(p => {
      if (!p.isEnfant && p.coupleAvecId && !processed.has(p.id)) {
        const conjoint = selectedEvent.participants.find(c => c.id === p.coupleAvecId);
        if (conjoint) {
          list.push({
            id: `${p.id}-${conjoint.id}`,
            name: `Couple: ${p.prenom} ${p.nom} & ${conjoint.prenom} ${conjoint.nom}`
          });
          processed.add(p.id);
          processed.add(conjoint.id);
        }
      }
    });
    return list;
  };

  const couples = getCouplesList();

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartNom || !newPartPrenom) return;

    const newParticipant: Participant = {
      id: Date.now().toString(),
      nom: newPartNom.toUpperCase(),
      prenom: newPartPrenom.charAt(0).toUpperCase() + newPartPrenom.slice(1),
      isEnfant: newPartIsEnfant,
      cotisationReglee: false
    };

    if (!newPartIsEnfant && newPartCoupleAvec) {
      newParticipant.coupleAvecId = newPartCoupleAvec;
    } else if (newPartIsEnfant && newPartParentCouple) {
      newParticipant.parentIds = newPartParentCouple.split('-');
    }

    const updatedParticipants = [...selectedEvent.participants, newParticipant];

    if (!newPartIsEnfant && newPartCoupleAvec) {
      const spouseIndex = updatedParticipants.findIndex(p => p.id === newPartCoupleAvec);
      if (spouseIndex > -1) {
        updatedParticipants[spouseIndex].coupleAvecId = newParticipant.id;
      }
    }

    const updatedEvents = evenements.map(evt => {
      if (evt.id === selectedEvent.id) {
        return { ...evt, participants: updatedParticipants };
      }
      return evt;
    });

    await saveData(updatedEvents);

    setNewPartNom('');
    setNewPartPrenom('');
    setNewPartIsEnfant(false);
    setNewPartCoupleAvec('');
    setNewPartParentCouple('');
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce participant ?')) return;

    let updatedParticipants = selectedEvent.participants.filter(p => p.id !== participantId);

    updatedParticipants = updatedParticipants.map(p => {
      if (p.coupleAvecId === participantId) {
        return { ...p, coupleAvecId: undefined };
      }
      if (p.parentIds && p.parentIds.includes(participantId)) {
        return { ...p, parentIds: undefined };
      }
      return p;
    });

    const updatedEvents = evenements.map(evt => {
      if (evt.id === selectedEvent.id) {
        return { ...evt, participants: updatedParticipants };
      }
      return evt;
    });

    await saveData(updatedEvents);
  };

  const handleToggleCotisation = async (participantId: string) => {
    const updatedParticipants = selectedEvent.participants.map(p => {
      if (p.id === participantId) {
        return { ...p, cotisationReglee: !p.cotisationReglee };
      }
      return p;
    });

    const updatedEvents = evenements.map(evt => {
      if (evt.id === selectedEvent.id) {
        return { ...evt, participants: updatedParticipants };
      }
      return evt;
    });

    await saveData(updatedEvents);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne de gauche: Formulaire */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-indigo-400" />
            Nouveau Participant
          </h3>

          <form onSubmit={handleAddParticipant} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Prénom</label>
                <input 
                  type="text" 
                  value={newPartPrenom} 
                  onChange={(e) => setNewPartPrenom(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom</label>
                <input 
                  type="text" 
                  value={newPartNom} 
                  onChange={(e) => setNewPartNom(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-1 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
              <input 
                type="checkbox" 
                id="isEnfant" 
                checked={newPartIsEnfant}
                onChange={(e) => {
                  setNewPartIsEnfant(e.target.checked);
                  setNewPartCoupleAvec('');
                  setNewPartParentCouple('');
                }}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="isEnfant" className="text-sm text-slate-300 font-medium select-none cursor-pointer flex items-center gap-1.5">
                <Baby className="h-4 w-4 text-cyan-400" /> C'est un enfant (ne cotise pas)
              </label>
            </div>

            {!newPartIsEnfant && selectedEvent.participants.filter(p => !p.isEnfant && !p.coupleAvecId).length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Lier à un conjoint (optionnel)</label>
                <select 
                  value={newPartCoupleAvec} 
                  onChange={(e) => setNewPartCoupleAvec(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                >
                  <option value="">-- Aucun couple --</option>
                  {selectedEvent.participants
                    .filter(p => !p.isEnfant && !p.coupleAvecId)
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                    ))}
                </select>
              </div>
            )}

            {newPartIsEnfant && couples.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Parents (optionnel)</label>
                <select 
                  value={newPartParentCouple} 
                  onChange={(e) => setNewPartParentCouple(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                >
                  <option value="">-- Non spécifié --</option>
                  {couples.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              type="submit"
              className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition duration-200"
            >
              Ajouter le participant
            </button>
          </form>
        </div>
      </div>

      {/* Colonne de droite: Liste */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full max-h-[800px]">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-indigo-400" />
            Liste des Participants ({selectedEvent.participants.length})
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {selectedEvent.participants.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Aucun participant.</p>
              </div>
            ) : (
              selectedEvent.participants.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{p.prenom} {p.nom}</span>
                        {p.isEnfant ? (
                          <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-semibold border border-cyan-500/20">Enfant</span>
                        ) : (
                          <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-semibold border border-indigo-500/20">Adulte</span>
                        )}
                        {p.coupleAvecId && (
                          <Heart className="h-3 w-3 text-rose-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {p.coupleAvecId && "En couple"}
                        {p.parentIds && "Rattaché à ses parents"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {!p.isEnfant && (
                      <button 
                        onClick={() => handleToggleCotisation(p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          p.cotisationReglee 
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                        }`}
                      >
                        {p.cotisationReglee ? (
                          <><CheckCircle className="h-3.5 w-3.5" /> Payé</>
                        ) : (
                          <><XCircle className="h-3.5 w-3.5" /> À payer</>
                        )}
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteParticipant(p.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
