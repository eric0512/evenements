'use client';

import React, { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useEvents } from '@/context/EventsContext';
import { Depense } from '@/types';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Camera, 
  Image as ImageIcon,
  X,
  CheckCircle
} from 'lucide-react';

export default function ExpensesPage() {
  const params = useParams();
  const id = params.id as string;
  const { evenements, saveData } = useEvents();
  
  const selectedEvent = evenements.find(e => e.id === id);

  const [newDepTitre, setNewDepTitre] = useState('');
  const [newDepMontant, setNewDepMontant] = useState(0);
  const [newDepCategorie, setNewDepCategorie] = useState('Autre');
  const [justificatifBase64, setJustificatifBase64] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!selectedEvent) return null;

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionnement via Canvas pour réduire le poids de l'image (Base64)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compression JPEG à 0.6
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setJustificatifBase64(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepTitre || newDepMontant <= 0) return;

    const newExpense: Depense = {
      id: Date.now().toString(),
      titre: newDepTitre,
      montant: Number(newDepMontant),
      categorie: newDepCategorie,
      date: new Date().toISOString().split('T')[0],
      ...(justificatifBase64 && { justificatif: justificatifBase64 })
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
    setJustificatifBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette dépense ?')) return;
    
    const updatedEvents = evenements.map(evt => {
      if (evt.id === selectedEvent.id) {
        return { ...evt, depenses: evt.depenses.filter(d => d.id !== expenseId) };
      }
      return evt;
    });

    await saveData(updatedEvents);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Modal d'aperçu de l'image */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-3xl w-full h-auto">
            <button 
              className="absolute -top-12 right-0 p-2 text-white bg-slate-800 rounded-full hover:bg-slate-700"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="Justificatif complet" className="w-full h-auto rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {/* Colonne de gauche: Formulaire */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-indigo-400" />
            Nouvelle Dépense
          </h3>

          <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Titre de la dépense</label>
              <input 
                type="text" 
                placeholder="Ex: Courses, Location..." 
                value={newDepTitre} 
                onChange={(e) => setNewDepTitre(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Montant (€)</label>
                <input 
                  type="number" 
                  value={newDepMontant} 
                  onChange={(e) => setNewDepMontant(Number(e.target.value))}
                  min="0.01" step="0.01"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
                <select 
                  value={newDepCategorie} 
                  onChange={(e) => setNewDepCategorie(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                >
                  <option value="Courses">Courses</option>
                  <option value="Location">Location</option>
                  <option value="Activités">Activités</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            {/* Upload / Capture photo justificatif */}
            <div className="mt-2">
              <label className="block text-xs text-slate-400 mb-2">Justificatif / Ticket (Optionnel)</label>
              
              {!justificatifBase64 ? (
                <div className="flex gap-2">
                  <label className="flex-1 flex flex-col items-center justify-center gap-2 py-4 border border-dashed border-slate-700 bg-slate-950/50 hover:bg-slate-900 rounded-lg cursor-pointer transition">
                    <Camera className="h-5 w-5 text-indigo-400" />
                    <span className="text-xs text-slate-400">Prendre une photo</span>
                    {/* accept="image/*" + capture="environment" force l'ouverture de l'appareil photo sur mobile */}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} ref={fileInputRef} />
                  </label>
                  <label className="flex-1 flex flex-col items-center justify-center gap-2 py-4 border border-dashed border-slate-700 bg-slate-950/50 hover:bg-slate-900 rounded-lg cursor-pointer transition">
                    <ImageIcon className="h-5 w-5 text-cyan-400" />
                    <span className="text-xs text-slate-400">Parcourir</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageCapture} />
                  </label>
                </div>
              ) : (
                <div className="relative inline-block w-full border border-slate-700 rounded-lg p-2 bg-slate-950/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Image capturée
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setJustificatifBase64(null)}
                      className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10"
                    >
                      Supprimer
                    </button>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={justificatifBase64} alt="Aperçu" className="w-full h-32 object-cover rounded-md border border-slate-800" />
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition duration-200"
            >
              Ajouter la dépense
            </button>
          </form>
        </div>
      </div>

      {/* Colonne de droite: Liste */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full max-h-[800px]">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            Liste des Dépenses ({selectedEvent.depenses.length})
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {selectedEvent.depenses.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                <CreditCard className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Aucune dépense enregistrée.</p>
              </div>
            ) : (
              selectedEvent.depenses.map(d => (
                <div key={d.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:bg-slate-900 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Vignette justificatif */}
                    {d.justificatif ? (
                      <div 
                        className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-slate-700 cursor-pointer relative group"
                        onClick={() => setSelectedImage(d.justificatif!)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.justificatif} alt="Justificatif" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 shrink-0 rounded-lg border border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-slate-600" />
                      </div>
                    )}
                    
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{d.titre}</span>
                      <div className="text-[10px] text-slate-400 flex gap-2 mt-1">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded">{d.categorie || 'Autre'}</span>
                        <span>{d.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-black text-rose-400 text-lg whitespace-nowrap">{d.montant.toFixed(2)} €</span>
                    <button 
                      onClick={() => handleDeleteExpense(d.id)}
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
