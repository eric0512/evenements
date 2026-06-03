'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Evenement } from '@/types';

interface EventsContextType {
  evenements: Evenement[];
  loading: boolean;
  errorMsg: string;
  isDemoMode: boolean;
  saving: boolean;
  saveData: (updatedEvents: Evenement[]) => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

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
          }
        } else if (data.evenements) {
          setEvenements(data.evenements);
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
      setErrorMsg('Erreur lors de la sauvegarde. Les données restent en mémoire locale.');
      localStorage.setItem('evenements_local_data', JSON.stringify({ evenements: updatedEvents }));
      setEvenements(updatedEvents);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EventsContext.Provider
      value={{
        evenements,
        loading,
        errorMsg,
        isDemoMode,
        saving,
        saveData,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}
