'use client';

import React, { useState, useEffect } from 'react';
import { Evenement, Participant, Depense } from '@/types';
import { 
  Users, 
  Plus, 
  Trash2, 
  DollarSign, 
  CreditCard, 
  TrendingDown, 
  Heart, 
  Baby, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Info,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Download,
  Upload
} from 'lucide-react';

export default function Home() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [selectedEvenementId, setSelectedEvenementId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [editingCotisation, setEditingCotisation] = useState<boolean>(false);
  const [tempCotisation, setTempCotisation] = useState<number>(0);

  // Form states for Event creation
  const [newEventTitre, setNewEventTitre] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventCotisation, setNewEventCotisation] = useState(50);
  const [showNewEventForm, setShowNewEventForm] = useState(false);

  // Form states for Participant
  const [newPartNom, setNewPartNom] = useState('');
  const [newPartPrenom, setNewPartPrenom] = useState('');
  const [newPartIsEnfant, setNewPartIsEnfant] = useState(false);
  const [newPartCoupleAvec, setNewPartCoupleAvec] = useState('');
  const [newPartParentCouple, setNewPartParentCouple] = useState(''); // ID conjoint A + "-" + ID conjoint B

  // Form states for Expense
  const [newDepTitre, setNewDepTitre] = useState('');
  const [newDepMontant, setNewDepMontant] = useState(0);
  const [newDepCategorie, setNewDepCategorie] = useState('Autre');

  // Backup Handlers (Import / Export JSON)
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
          if (parsed.evenements.length > 0) {
            setSelectedEvenementId(parsed.evenements[0].id);
          }
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

  // Load data from API (Google Drive) or fallback to LocalStorage
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/drive');
        const data = await res.json();
        
        if (data.isDemo) {
          setIsDemoMode(true);
          const localData = localStorage.getItem('evenements_local_data');
          if (localData) {
            const parsed = JSON.parse(localData);
            setEvenements(parsed.evenements || []);
            if (parsed.evenements && parsed.evenements.length > 0) {
              setSelectedEvenementId(parsed.evenements[0].id);
            }
          }
        } else if (data.evenements) {
          setEvenements(data.evenements);
          if (data.evenements.length > 0) {
            setSelectedEvenementId(data.evenements[0].id);
          }
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des données:', err);
        setErrorMsg('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save data to Drive or LocalStorage
  const saveData = async (updatedEvents: Evenement[]) => {
    setSaving(true);
    setErrorMsg('');
    try {
      if (isDemoMode) {
        localStorage.setItem('evenements_local_data', JSON.stringify({ evenements: updatedEvents }));
      } else {
        const res = await fetch('/api/drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ evenements: updatedEvents }),
        });
        if (!res.ok) {
          throw new Error('Erreur de réponse du serveur.');
        }
      }
      setEvenements(updatedEvents);
    } catch (err: any) {
      console.error('Erreur de sauvegarde:', err);
      setErrorMsg('Erreur lors de la sauvegarde sur Google Drive. Les données restent en mémoire locale.');
      // En cas d'erreur de Drive, on force une sauvegarde en LocalStorage
      localStorage.setItem('evenements_local_data', JSON.stringify({ evenements: updatedEvents }));
      setEvenements(updatedEvents);
    } finally {
      setSaving(false);
    }
  };

  const selectedEvent = evenements.find(e => e.id === selectedEvenementId);

  // 1. Event Handlers
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
    setSelectedEvenementId(newEvent.id);
    setNewEventTitre('');
    setNewEventDate('');
    setNewEventCotisation(50);
    setShowNewEventForm(false);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement et toutes ses données ?')) return;
    const updated = evenements.filter(e => e.id !== id);
    await saveData(updated);
    if (selectedEvenementId === id && updated.length > 0) {
      setSelectedEvenementId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedEvenementId('');
    }
  };

  const startEditingCotisation = () => {
    if (!selectedEvent) return;
    setTempCotisation(selectedEvent.cotisationMontant);
    setEditingCotisation(true);
  };

  const handleUpdateCotisation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const updatedEvents = evenements.map(evt => {
      if (evt.id === selectedEvent.id) {
        return { ...evt, cotisationMontant: Number(tempCotisation) };
      }
      return evt;
    });
    await saveData(updatedEvents);
    setEditingCotisation(false);
  };

  // 2. Participant Handlers
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !newPartNom || !newPartPrenom) return;

    const newParticipant: Participant = {
      id: Date.now().toString(),
      nom: newPartNom.toUpperCase(),
      prenom: newPartPrenom.charAt(0).toUpperCase() + newPartPrenom.slice(1),
      isEnfant: newPartIsEnfant,
      cotisationReglee: false
    };

    // Gérer les relations
    if (!newPartIsEnfant) {
      // Si on associe un conjoint
      if (newPartCoupleAvec) {
        newParticipant.coupleAvecId = newPartCoupleAvec;
      }
    } else {
      // Si c'est un enfant, on l'associe aux parents
      if (newPartParentCouple) {
        const parents = newPartParentCouple.split('-');
        newParticipant.parentIds = parents;
      }
    }

    const updatedParticipants = [...selectedEvent.participants, newParticipant];

    // Mettre à jour de manière bidirectionnelle le couple
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

    // Reset Form
    setNewPartNom('');
    setNewPartPrenom('');
    setNewPartIsEnfant(false);
    setNewPartCoupleAvec('');
    setNewPartParentCouple('');
  };

  const handleDeleteParticipant = async (id: string) => {
    if (!selectedEvent) return;

    // Supprimer le participant
    let updatedParticipants = selectedEvent.participants.filter(p => p.id !== id);

    // Nettoyer les liaisons de couple et parents
    updatedParticipants = updatedParticipants.map(p => {
      if (p.coupleAvecId === id) {
        return { ...p, coupleAvecId: undefined };
      }
      if (p.parentIds && p.parentIds.includes(id)) {
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
    if (!selectedEvent) return;

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

  // 3. Expense Handlers
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !newDepTitre || newDepMontant <= 0) return;

    const newExpense: Depense = {
      id: Date.now().toString(),
      titre: newDepTitre,
      montant: Number(newDepMontant),
      categorie: newDepCategorie,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedEvents = evenements.map(evt => {
      if (evt.id === selectedEvent.id) {
        return { ...evt, depenses: [...evt.depenses, newExpense] };
      }
      return evt;
    });

    await saveData(updatedEvents);

    setNewDepTitre('');
    setNewDepMontant(0);
    setNewDepCategorie('Autre');
  };

  const handleDeleteExpense = async (id: string) => {
    if (!selectedEvent) return;

    const updatedEvents = evenements.map(evt => {
      if (evt.id === selectedEvent.id) {
        return { ...evt, depenses: evt.depenses.filter(d => d.id !== id) };
      }
      return evt;
    });

    await saveData(updatedEvents);
  };

  // 4. Financial Calculations
  const getFinancialStats = () => {
    if (!selectedEvent) return {
      adultesCount: 0,
      enfantsCount: 0,
      totalCotisationsAttendues: 0,
      totalCotisationsRecues: 0,
      totalDepenses: 0,
      soldeEvenement: 0,
      partDepenseParAdulte: 0
    };

    const adultes = selectedEvent.participants.filter(p => !p.isEnfant);
    const enfants = selectedEvent.participants.filter(p => p.isEnfant);

    const adultesCount = adultes.length;
    const enfantsCount = enfants.length;

    const totalCotisationsAttendues = adultesCount * selectedEvent.cotisationMontant;
    const totalCotisationsRecues = adultes.filter(p => p.cotisationReglee).length * selectedEvent.cotisationMontant;
    
    const totalDepenses = selectedEvent.depenses.reduce((acc, d) => acc + d.montant, 0);
    
    // Solde restant : Cotisations perçues - Dépenses
    const soldeEvenement = totalCotisationsRecues - totalDepenses;

    // Répartition des dépenses uniquement sur les adultes
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

  // Obtenir la liste des couples pour associer les enfants
  const getCouplesList = () => {
    if (!selectedEvent) return [];
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

  return (
    <div className="flex-1 min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
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

        {/* Sync & Demo Badges */}
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

          {/* Backup Buttons */}
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

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Events Selection */}
        <section className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-400">
                Mes Événements
              </h2>
              <button 
                onClick={() => setShowNewEventForm(!showNewEventForm)}
                className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white transition duration-200"
                title="Ajouter un événement"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showNewEventForm && (
              <form onSubmit={handleCreateEvent} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col gap-3 animate-fadeIn">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nom de l'événement</label>
                  <input 
                    type="text" 
                    placeholder="Anniversaire, Sortie..."
                    value={newEventTitre}
                    onChange={(e) => setNewEventTitre(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date</label>
                  <input 
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cotisation adulte (€)</label>
                  <input 
                    type="number" 
                    value={newEventCotisation}
                    onChange={(e) => setNewEventCotisation(Number(e.target.value))}
                    min="0"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 rounded-lg transition duration-200"
                  >
                    Créer
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowNewEventForm(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 rounded-lg transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              {evenements.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Aucun événement créé.</p>
              ) : (
                evenements.map(evt => (
                  <div 
                    key={evt.id}
                    onClick={() => setSelectedEvenementId(evt.id)}
                    className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition duration-200 ${
                      evt.id === selectedEvenementId
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold truncate max-w-[140px]">{evt.titre}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {evt.date}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(evt.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Guide Google Drive Configuration */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4 text-indigo-400" /> Sauvegarde Drive
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pour sauvegarder vos données sur votre Google Drive :
            </p>
            <ol className="text-[11px] space-y-1.5 text-slate-300 list-decimal pl-4">
              <li>Cliquez sur le bouton <strong>Exporter</strong> ci-dessus pour télécharger le fichier de sauvegarde.</li>
              <li>Glissez-déposez le fichier téléchargé dans votre dossier Google Drive <strong>Appli gwen</strong> ou <strong>Appli evenements</strong>.</li>
            </ol>
          </div>
        </section>

        {/* Right Columns: Main Event Panel */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedEvent ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl p-12 text-center bg-slate-900/20">
              <Calendar className="h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-300">Aucun événement sélectionné</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Sélectionnez un événement existant dans la liste latérale ou créez-en un nouveau pour commencer.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Financial KPI Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cotisation Card */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cotisations</span>
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">{stats.totalCotisationsRecues} €</span>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Perçues</span>
                      <span className="font-semibold text-slate-300">Sur {stats.totalCotisationsAttendues} €</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Card */}
                <div className="bg-gradient-to-br from-slate-900 to-rose-950/40 border border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dépenses</span>
                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">{stats.totalDepenses} €</span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      À déduire des cotisations perçues.
                    </p>
                  </div>
                </div>

                {/* Remaining Budget / Solde Card */}
                <div className={`bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg ${stats.soldeEvenement < 0 ? 'to-rose-950/40' : ''}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Solde Restant</span>
                    <div className={`p-2 rounded-xl ${stats.soldeEvenement < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className={`text-2xl font-black ${stats.soldeEvenement < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {stats.soldeEvenement} €
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Cotisations reçues - Dépenses
                    </p>
                  </div>
                </div>

                {/* Per-adult breakdown */}
                <div className="bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coût par Adulte</span>
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">
                      {stats.partDepenseParAdulte.toFixed(2)} €
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Réparti sur {stats.adultesCount} adultes (enfants exclus).
                    </p>
                  </div>
                </div>
              </div>

              {/* Event title summary info */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4.5 flex flex-wrap gap-4 justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedEvent.titre}</h2>
                  {editingCotisation ? (
                    <form onSubmit={handleUpdateCotisation} className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">Cotisation :</span>
                      <input 
                        type="number" 
                        value={tempCotisation} 
                        onChange={(e) => setTempCotisation(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white w-20 focus:outline-none focus:border-indigo-500"
                        min="0"
                        required
                        autoFocus
                      />
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2 py-1 rounded">Valider</button>
                      <button type="button" onClick={() => setEditingCotisation(false)} className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] px-2 py-1 rounded">Annuler</button>
                    </form>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Le {selectedEvent.date} — Cotisation fixée à{" "}
                      <span 
                        onClick={startEditingCotisation}
                        className="font-bold text-indigo-400 underline cursor-pointer decoration-dotted hover:text-indigo-300 animate-pulse"
                        title="Cliquez pour modifier le montant de la cotisation"
                      >
                        {selectedEvent.cotisationMontant} €
                      </span>{" "}
                      par adulte.
                    </p>
                  )}
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Adultes (Cotisants)</div>
                    <div className="text-lg font-bold text-indigo-400">{stats.adultesCount}</div>
                  </div>
                  <div className="border-r border-slate-800"></div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Enfants (Non-cotisants)</div>
                    <div className="text-lg font-bold text-cyan-400">{stats.enfantsCount}</div>
                  </div>
                </div>
              </div>

              {/* Grid 2-columns: Participants & Expenses */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* 1. SECTION: PARTICIPANTS */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-400" />
                    Participants ({selectedEvent.participants.length})
                  </h3>

                  {/* Add participant form */}
                  <form onSubmit={handleAddParticipant} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-xs font-semibold text-slate-400">Nouveau Participant</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Prénom" 
                        value={newPartPrenom} 
                        onChange={(e) => setNewPartPrenom(e.target.value)}
                        required
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Nom" 
                        value={newPartNom} 
                        onChange={(e) => setNewPartNom(e.target.value)}
                        required
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input 
                        type="checkbox" 
                        id="isEnfant" 
                        checked={newPartIsEnfant}
                        onChange={(e) => {
                          setNewPartIsEnfant(e.target.checked);
                          setNewPartCoupleAvec('');
                          setNewPartParentCouple('');
                        }}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <label htmlFor="isEnfant" className="text-xs text-slate-300 font-medium select-none cursor-pointer flex items-center gap-1">
                        <Baby className="h-3.5 w-3.5 text-cyan-400" /> C'est un enfant (non cotisant)
                      </label>
                    </div>

                    {/* Liaison couple (si adulte) */}
                    {!newPartIsEnfant && selectedEvent.participants.filter(p => !p.isEnfant && !p.coupleAvecId).length > 0 && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400">Lier à un conjoint (optionnel)</label>
                        <select 
                          value={newPartCoupleAvec} 
                          onChange={(e) => setNewPartCoupleAvec(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                        >
                          <option value="">-- Aucun couple --</option>
                          {selectedEvent.participants
                            .filter(p => !p.isEnfant && !p.coupleAvecId)
                            .map(p => (
                              <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                            ))
                          }
                        </select>
                      </div>
                    )}

                    {/* Liaison parents (si enfant) */}
                    {newPartIsEnfant && couples.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400">Associer aux parents (optionnel)</label>
                        <select 
                          value={newPartParentCouple} 
                          onChange={(e) => setNewPartParentCouple(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                        >
                          <option value="">-- Aucun parent --</option>
                          {couples.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button 
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg transition duration-200"
                    >
                      Ajouter au groupe
                    </button>
                  </form>

                  {/* Participants List */}
                  <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                    {selectedEvent.participants.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">Aucun participant enregistré.</p>
                    ) : (
                      selectedEvent.participants.map(p => {
                        // Trouver conjoint
                        const conjoint = p.coupleAvecId 
                          ? selectedEvent.participants.find(c => c.id === p.coupleAvecId)
                          : null;
                        
                        // Trouver parents
                        const parents = p.parentIds 
                          ? selectedEvent.participants.filter(pt => p.parentIds?.includes(pt.id))
                          : [];

                        return (
                          <div 
                            key={p.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-slate-950/30 gap-3 border-slate-800/60`}
                          >
                            <div className="flex items-start gap-2.5">
                              {p.isEnfant ? (
                                <Baby className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" />
                              ) : (
                                <Users className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                              )}
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white">
                                  {p.prenom} {p.nom}
                                </span>
                                
                                {/* Info Relations */}
                                {conjoint && (
                                  <span className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5">
                                    <Heart className="h-3 w-3 fill-rose-400/20" /> En couple avec {conjoint.prenom}
                                  </span>
                                )}
                                {p.isEnfant && parents.length > 0 && (
                                  <span className="text-[10px] text-cyan-400 flex items-center gap-1 mt-0.5">
                                    Enfant de {parents.map(pt => pt.prenom).join(' & ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions / Cotisations */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                              {p.isEnfant ? (
                                <span className="text-[10px] font-semibold tracking-wider uppercase text-cyan-500 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/10">
                                  Enfant (Gratuit)
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleCotisation(p.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition duration-200 ${
                                    p.cotisationReglee
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25'
                                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/25'
                                  }`}
                                >
                                  {p.cotisationReglee ? (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" /> Cotisation Réglée
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3.5 w-3.5" /> Cotisation à Régler
                                    </>
                                  )}
                                </button>
                              )}

                              <button 
                                onClick={() => handleDeleteParticipant(p.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. SECTION: EXPENSES */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-rose-400" />
                    Dépenses de l'Événement
                  </h3>

                  {/* Add expense form */}
                  <form onSubmit={handleAddExpense} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-xs font-semibold text-slate-400">Nouvelle Dépense</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Titre (ex: Courses, Location...)" 
                        value={newDepTitre} 
                        onChange={(e) => setNewDepTitre(e.target.value)}
                        required
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                      />
                      <input 
                        type="number" 
                        placeholder="Montant (€)" 
                        value={newDepMontant || ''} 
                        onChange={(e) => setNewDepMontant(Number(e.target.value))}
                        required
                        min="0.01"
                        step="0.01"
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">Catégorie</label>
                      <select 
                        value={newDepCategorie} 
                        onChange={(e) => setNewDepCategorie(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                      >
                        <option value="Alimentation">Alimentation & Boissons</option>
                        <option value="Hébergement">Hébergement</option>
                        <option value="Transport">Transport</option>
                        <option value="Activités">Activités & Loisirs</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-2 rounded-lg transition duration-200"
                    >
                      Enregistrer la dépense
                    </button>
                  </form>

                  {/* Expenses List */}
                  <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                    {selectedEvent.depenses.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">Aucune dépense enregistrée.</p>
                    ) : (
                      selectedEvent.depenses.map(d => (
                        <div 
                          key={d.id}
                          className="flex justify-between items-center p-3.5 rounded-xl border bg-slate-950/30 border-slate-800/60"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">{d.titre}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                              <span className="bg-slate-800/80 px-2 py-0.5 rounded-full text-slate-400">
                                {d.categorie || 'Autre'}
                              </span>
                              <span>{d.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-rose-400">-{d.montant} €</span>
                            <button 
                              onClick={() => handleDeleteExpense(d.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
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

              {/* 3. SECTION: FINANCIAL BALANCE & COST DISTRIBUTION */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-indigo-400" />
                  Bilan Financier & Répartition par Adulte
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary Box */}
                  <div className="bg-slate-950/50 border border-slate-800/60 p-4.5 rounded-xl flex flex-col gap-3 md:col-span-1">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Résumé des calculs</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dépenses totales :</span>
                        <span className="font-semibold text-white">{stats.totalDepenses.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Adultes cotisants :</span>
                        <span className="font-semibold text-indigo-400">{stats.adultesCount}</span>
                      </div>
                      <div className="border-t border-slate-800/80 my-1"></div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-slate-200">Part par Adulte :</span>
                        <span className="text-cyan-400">{stats.partDepenseParAdulte.toFixed(2)} €</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-[10px] text-indigo-300 leading-relaxed">
                      💡 <strong>Note de répartition :</strong> Les enfants ne participent pas financièrement. Le total des dépenses ({stats.totalDepenses.toFixed(2)} €) est réparti équitablement uniquement entre les {stats.adultesCount} adultes.
                    </div>
                  </div>

                  {/* Individual balance list */}
                  <div className="bg-slate-950/50 border border-slate-800/60 p-4.5 rounded-xl md:col-span-2 flex flex-col gap-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      État financier individuel (Adultes)
                    </h4>
                    
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {selectedEvent.participants.filter(p => !p.isEnfant).length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">Aucun adulte enregistré pour calculer les parts.</p>
                      ) : (
                        selectedEvent.participants.filter(p => !p.isEnfant).map(p => {
                          const aPayeCotisation = p.cotisationReglee;
                          const cotisationDétail = aPayeCotisation 
                            ? `Cotisation de ${selectedEvent.cotisationMontant} € PAYÉE`
                            : `Cotisation de ${selectedEvent.cotisationMontant} € NON PAYÉE`;
                          
                          // Calcul du solde individuel pour information
                          // Idéalement, s'il a payé sa cotisation, son apport est de +CotisationMontant.
                          // Sa part de dépense consommée est de -partDepenseParAdulte.
                          const apport = aPayeCotisation ? selectedEvent.cotisationMontant : 0;
                          const soldePersonnel = apport - stats.partDepenseParAdulte;

                          return (
                            <div 
                              key={p.id}
                              className="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-white">{p.prenom} {p.nom}</span>
                                <span className={`text-[10px] font-medium ${aPayeCotisation ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {cotisationDétail}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-bold text-white">
                                  Apport : {apport} €
                                </div>
                                <div className={`text-[10px] font-semibold mt-0.5 ${soldePersonnel >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  Bilan : {soldePersonnel >= 0 ? '+' : ''}{soldePersonnel.toFixed(2)} €
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>
      </main>
    </div>
  );
}
