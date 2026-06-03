export interface Participant {
  id: string;
  nom: string;
  prenom: string;
  isEnfant: boolean;
  coupleAvecId?: string; // ID du conjoint (adulte)
  parentIds?: string[];  // IDs des parents (couple d'adultes)
  cotisationReglee: boolean;
}

export interface Depense {
  id: string;
  titre: string;
  montant: number;
  date: string;
  categorie?: string;
}

export interface Evenement {
  id: string;
  titre: string;
  description?: string;
  date: string;
  cotisationMontant: number; // Cotisation demandée par adulte (les enfants ne paient pas)
  participants: Participant[];
  depenses: Depense[];
}
