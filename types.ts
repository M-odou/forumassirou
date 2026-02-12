
export interface Participant {
  id: string;
  nom_complet: string;
  sexe: 'Homme' | 'Femme';
  adresse_email: string;
  telephone: string;
  organisation_entreprise: string;
  fonction: string;
  participation: "Individuel" | "Représentant d'une entreprise" | "Professionnel de la sécurité" | "Étudiant / Chercheur" | "Autre";
  avis_theme?: string;
  canal_forum: string[];
  canal_assirou: string[];
  souhait_formation: 'Oui' | 'Non';
  type_formation: string[];
  interet_services: 'Oui' | 'Non';
  services_interesses: string[];
  numero_ticket: string;
  date_inscription: string;
  statut_email: 'pending' | 'sent' | 'failed';
}

export interface WebhookPayload extends Omit<Participant, 'id' | 'numero_ticket' | 'date_inscription' | 'statut_email'> {}

export interface TicketResponse {
  status: 'success' | 'error';
  message: string;
  ticket?: {
    numero: string;
    download_url: string;
  };
}
