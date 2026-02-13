
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Participant } from '../types';

// Récupération des variables d'environnement
// Nous utilisons la clé que vous avez fournie comme fallback
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_s9PMYRnHvoweVPk0MLT2Lg_g6qWGroq';

/**
 * Initialisation sécurisée du client Supabase.
 * On vérifie que l'URL est présente pour éviter l'erreur "supabaseUrl is required".
 */
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn("CONFIGURATION MANQUANTE : L'URL Supabase n'est pas configurée. L'application fonctionne en mode limité.");
}

/**
 * Récupère les participants exclusivement depuis Supabase (Mode Production).
 */
export const getParticipants = async (): Promise<Participant[]> => {
  if (!supabase) throw new Error("URL Supabase manquante dans les variables d'environnement.");
  
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('date_inscription', { ascending: false });
    
    if (error) throw error;

    return (data || []).map(p => ({
      ...p,
      canal_forum: p.canal_forum || [],
      canal_assirou: p.canal_assirou || [],
      type_formation: p.type_formation || [],
      services_interesses: p.services_interesses || [],
      nom_complet: p.nom_complet || 'Inconnu',
      numero_ticket: p.numero_ticket || 'SANS-TICKET'
    }));
  } catch (e) {
    console.error("Fetch Error:", e);
    throw e;
  }
};

/**
 * Enregistre un participant.
 */
export const saveParticipant = async (participantData: Omit<Participant, 'id' | 'token'>): Promise<boolean> => {
  if (!supabase) return false;
  
  const token = crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36);
  const newParticipant = { ...participantData, token };

  try {
    const { error } = await supabase.from('participants').insert([newParticipant]);
    if (error) throw error;
    return true;
  } catch (e) {
    return false;
  }
};

export const deleteParticipant = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    return !error;
  } catch (e) {
    return false;
  }
};

export const validateTicket = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  const now = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('participants')
      .update({ scan_valide: true, date_validation: now })
      .eq('id', id);
    return !error;
  } catch (e) {
    return false;
  }
};

export const getParticipantByToken = async (token: string): Promise<Participant | null> => {
  if (!supabase) return null;
  const { data } = await supabase.from('participants').select('*').eq('token', token).maybeSingle();
  return data;
};

export const getParticipantByTicket = async (ticket: string): Promise<Participant | null> => {
  if (!supabase) return null;
  const { data } = await supabase.from('participants').select('*').eq('numero_ticket', ticket).maybeSingle();
  return data;
};

export const isRegistrationActive = async (): Promise<boolean> => {
  if (!supabase) return true;
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'registration_active').maybeSingle();
    return data ? data.value === 'true' : true;
  } catch (e) { 
    return true; 
  }
};

export const isScanSystemActive = async (): Promise<boolean> => {
  if (!supabase) return true;
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'scan_system_active').maybeSingle();
    return data ? data.value === 'true' : true;
  } catch (e) { 
    return true; 
  }
};

export const setRegistrationStatus = async (val: boolean) => {
  if (!supabase) return;
  await supabase.from('settings').upsert({ key: 'registration_active', value: val.toString() });
};

export const generateTicketNumber = async () => {
  if (!supabase) return `FORUM-DEMO-${Date.now()}`;
  const { count } = await supabase.from('participants').select('*', { count: 'exact', head: true });
  const next = (count || 0) + 1;
  return `FORUM-SEC-2026-${next.toString().padStart(4, '0')}`;
};

export const subscribeToParticipants = (cb: () => void) => {
  if (!supabase) return null;
  return supabase
    .channel('production_updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, cb)
    .subscribe();
};

export const exportParticipantsToCSV = async () => {
  const data = await getParticipants();
  const headers = ["Nom", "Email", "Tel", "Orga", "Type", "Ticket", "Date", "Statut"];
  const rows = data.map(p => [
    p.nom_complet, 
    p.adresse_email, 
    p.telephone, 
    p.organisation_entreprise || 'INDIVIDUEL', 
    p.participation, 
    p.numero_ticket, 
    p.date_inscription, 
    p.scan_valide ? "PRÉSENT" : "ABSENT"
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FORUM_DATA_PRODUCTION.csv`;
  a.click();
};
