
import { createClient } from '@supabase/supabase-js';
import { Participant } from '../types';

// Récupération des variables d'environnement
// Note : SUPABASE_URL et SUPABASE_ANON_KEY doivent être configurés dans votre environnement.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Initialisation sécurisée pour éviter le crash si les clés manquent
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const ensureSupabase = () => {
  if (!supabase) {
    const msg = "Supabase n'est pas configuré. Veuillez définir SUPABASE_URL et SUPABASE_ANON_KEY dans vos variables d'environnement.";
    console.error(msg);
    throw new Error(msg);
  }
  return supabase;
};

export const getParticipants = async (): Promise<Participant[]> => {
  try {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('participants')
      .select('*')
      .order('date_inscription', { ascending: false });
    
    if (error) {
      console.error("Error fetching participants:", error);
      return [];
    }
    return data as Participant[];
  } catch (e) {
    console.warn("Échec de la récupération des participants (Supabase non configuré ou erreur réseau).");
    return [];
  }
};

export const getParticipantByTicket = async (ticketId: string): Promise<Participant | null> => {
  try {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('participants')
      .select('*')
      .eq('numero_ticket', ticketId)
      .single();
    
    if (error) return null;
    return data as Participant;
  } catch (e) {
    return null;
  }
};

export const saveParticipant = async (participant: Participant): Promise<boolean> => {
  try {
    const client = ensureSupabase();
    const { error } = await client
      .from('participants')
      .insert([participant]);
    
    if (error) {
      console.error("Error saving participant:", error);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

export const generateTicketNumber = async (): Promise<string> => {
  try {
    const client = ensureSupabase();
    const { count, error } = await client
      .from('participants')
      .select('*', { count: 'exact', head: true });
    
    const nextCount = (count || 0) + 1;
    const padded = nextCount.toString().padStart(4, '0');
    return `FORUM-SEC-2026-${padded}`;
  } catch (e) {
    // Fallback en cas d'absence de DB pour que l'interface reste fonctionnelle en démo
    return `FORUM-SEC-2026-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  }
};

export const isRegistrationActive = async (): Promise<boolean> => {
  try {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('settings')
      .select('value')
      .eq('key', 'registration_active')
      .single();
    
    if (error || !data) return true;
    return data.value === 'true';
  } catch (e) {
    return true;
  }
};

export const setRegistrationStatus = async (active: boolean): Promise<void> => {
  try {
    const client = ensureSupabase();
    await client
      .from('settings')
      .upsert({ key: 'registration_active', value: active.toString() });
  } catch (e) {
    console.error("Échec de la mise à jour du statut d'inscription.");
  }
};

export const exportParticipantsToCSV = async () => {
  const participants = await getParticipants();
  if (participants.length === 0) return;

  const headers = ["Ticket", "Nom Complet", "Email", "Telephone", "Structure", "Type", "Formation", "Date"];
  const rows = participants.map(p => [
    p.numero_ticket,
    p.nom_complet,
    p.adresse_email,
    p.telephone,
    p.organisation_entreprise || 'N/A',
    p.participation,
    p.souhait_formation,
    new Date(p.date_inscription).toLocaleDateString()
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(e => e.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `participants_forum_2026.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
