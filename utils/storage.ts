
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Participant } from '../types';

// Récupération sécurisée des variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Initialisation sécurisée : On ne crée le client que si les clés sont valides
// Cela évite l'erreur "supabaseUrl is required"
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn("ATTENTION : Les identifiants Supabase sont manquants ou invalides. L'application est en attente de configuration.");
}

/**
 * PRODUCTION : Récupère les participants exclusivement depuis le Cloud.
 */
export const getParticipants = async (): Promise<Participant[]> => {
  if (!supabase) throw new Error("Base de données non connectée.");
  
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
    console.error("Production Fetch Error:", e);
    throw e;
  }
};

/**
 * Enregistre un participant directement en base de données.
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
    console.error("Production Save Error:", e);
    return false;
  }
};

/**
 * Supprime un participant (Direct Production).
 */
export const deleteParticipant = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Valide un ticket (Direct Production).
 */
export const validateTicket = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  const now = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('participants')
      .update({ scan_valide: true, date_validation: now })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Recherche un participant par son token (QR Code).
 */
export const getParticipantByToken = async (token: string): Promise<Participant | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('participants').select('*').eq('token', token).maybeSingle();
  if (error) return null;
  return data;
};

/**
 * Recherche un participant par son numéro de ticket.
 */
export const getParticipantByTicket = async (ticket: string): Promise<Participant | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('participants').select('*').eq('numero_ticket', ticket).maybeSingle();
  if (error) return null;
  return data;
};

/**
 * Statut des inscriptions.
 */
export const isRegistrationActive = async (): Promise<boolean> => {
  if (!supabase) return true;
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'registration_active').maybeSingle();
    return data ? data.value === 'true' : true;
  } catch (e) { 
    return true; 
  }
};

/**
 * Statut du système de scan.
 */
export const isScanSystemActive = async (): Promise<boolean> => {
  if (!supabase) return true;
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'scan_system_active').maybeSingle();
    return data ? data.value === 'true' : true;
  } catch (e) { 
    return true; 
  }
};

/**
 * Mise à jour administrative du statut.
 */
export const setRegistrationStatus = async (val: boolean) => {
  if (!supabase) return;
  await supabase.from('settings').upsert({ key: 'registration_active', value: val.toString() });
};

/**
 * Génération de ticket basée sur le compte réel.
 */
export const generateTicketNumber = async () => {
  if (!supabase) return `FORUM-OFFLINE-${Date.now()}`;
  const { count } = await supabase.from('participants').select('*', { count: 'exact', head: true });
  const next = (count || 0) + 1;
  return `FORUM-SEC-2026-${next.toString().padStart(4, '0')}`;
};

/**
 * Abonnement Realtime.
 */
export const subscribeToParticipants = (cb: () => void) => {
  if (!supabase) return null;
  return supabase
    .channel('production_updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, cb)
    .subscribe();
};

/**
 * Export CSV.
 */
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
