'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEvents } from '@/context/EventsContext';
import { Evenement } from '@/types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Calendar,
  CheckCircle,
  Info,
  RefreshCw,
  Download,
  Upload,
  FolderOpen
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { evenements, isDemoMode, saving, saveData } = useEvents();

  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventTitre, setNewEventTitre] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventCotisation, setNewEventCotisation] = useState(50);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitre) return;

    const newEvent: Evenement = {
      id: Date.now().toString(),
      titre: newEventTitre,
      date: newEventDate || new Date().toISOString().split('T')[0],
      cotisationMontant: Number(newEventCotisation),
      participants: [],
      depenses: []
    };

    const updated = [...evenements, newEvent];
    await saveData(updated);
    
    setNewEventTitre('');
    setNewEventDate('');
    setNewEventCotisation(50);
    setShowNewEventForm(false);
    
    router.push(`/events/${newEvent.id}/finances`);
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement et toutes ses données ?')) return;
    const updated = evenements.filter(evt => evt.id !== id);
    await saveData(updated);
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ evenements }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "antigravity_evenements_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.evenements)) {
          await saveData(parsed.evenements);
          alert("Sauvegarde importée avec succès !");
        } else {
          alert("Format de fichier invalide. Le fichier doit contenir un tableau 'evenements'.");
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier de sauvegarde.");
      }
    };
    fileReader.readAsText(files[0]);
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Gestionnaire d'Événements
            </h1>
            <p className="text-xs text-slate-400">Suivi financier et répartition familiale</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDemoMode ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <Info className="h-3.5 w-3.5" />
              Stockage Local (Démo)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <CheckCircle className="h-3.5 w-3.5" />
              Synchro Google Drive active
            </span>
          )}

          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Sauvegarde...
            </span>
          )}

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <button 
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition duration-200"
              title="Exporter les données en fichier JSON"
            >
              <Download className="h-3.5 w-3.5" /> Exporter
            </button>
            <label 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition duration-200 cursor-pointer"
              title="Importer des données depuis un fichier JSON"
            >
              <Upload className="h-3.5 w-3.5" /> Importer
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold tracking-wide text-white">
              Mes Événements
            </h2>
            <button 
              onClick={() => setShowNewEventForm(!showNewEventForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition duration-200"
            >
              <Plus className="h-4 w-4" /> Nouvel événement
            </button>
          </div>

          {showNewEventForm && (
            <form onSubmit={handleCreateEvent} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col gap-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nom de l'événement</label>
                  <input 
                    type="text" 
                    placeholder="Anniversaire, Sortie..."
                    value={newEventTitre}
                    onChange={(e) => setNewEventTitre(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Date</label>
                  <input 
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Cotisation adulte (€)</label>
                  <input 
                    type="number" 
                    value={newEventCotisation}
                    onChange={(e) => setNewEventCotisation(Number(e.target.value))}
                    min="0"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowNewEventForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition duration-200"
                >
                  Créer et continuer
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evenements.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-10 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Aucun événement créé.</p>
                <p className="text-sm text-slate-500 mt-1">Créez votre premier événement pour commencer.</p>
              </div>
            ) : (
              evenements.map(evt => (
                <div 
                  key={evt.id}
                  onClick={() => router.push(`/events/${evt.id}/finances`)}
                  className="group relative flex flex-col justify-between p-5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-indigo-500/30"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{evt.titre}</h3>
                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> {evt.date}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Participants</span>
                        <span className="text-sm font-medium text-slate-300">{evt.participants.length}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Cotisation</span>
                        <span className="text-sm font-medium text-slate-300">{evt.cotisationMontant} €</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => handleDeleteEvent(evt.id, e)}
                    className="absolute top-4 right-4 p-2 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Supprimer l'événement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
            <FolderOpen className="h-4 w-4 text-indigo-400" /> Sauvegarde Drive
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pour sauvegarder vos données manuellement sur votre Google Drive :
          </p>
          <ol className="text-xs space-y-1.5 text-slate-300 list-decimal pl-5">
            <li>Cliquez sur le bouton <strong>Exporter</strong> dans l'en-tête pour télécharger le fichier de sauvegarde.</li>
            <li>Glissez-déposez le fichier téléchargé dans votre dossier Google Drive <strong>Appli gwen</strong> ou <strong>Appli evenements</strong>.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
