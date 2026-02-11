
import { createClient } from '@supabase/supabase-js';
import { Participant } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || 'https://s9pmyrnhvowevpk0mlt2.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_s9PMYRnHvoweVPk0MLT2Lg_g6qWGroq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_STORAGE_KEY = 'participants_fallback';

const getFromLocal = (): Participant[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const getParticipants = async (): Promise<Participant[]> => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('date_inscription', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    return getFromLocal();
  }
};

/**
 * RECHERCHE DE TICKET
 * Priorité à l'ID exact puis au suffixe.
 */
export const getParticipantByTicket = async (ticketInput: string): Promise<Participant | null> => {
  if (!ticketInput) return null;
  
  // Nettoyage de l'input (enlève les slashes, hash et espaces)
  let cleanId = ticketInput.trim();
  if (cleanId.includes('/')) {
    cleanId = cleanId.split('/').pop() || cleanId;
  }
  cleanId = cleanId.split('#').pop() || cleanId;
  cleanId = cleanId.toUpperCase();

  try {
    // Tentative 1 : Correspondance exacte (prioritaire)
    const { data: exactData } = await supabase
      .from('participants')
      .select('*')
      .eq('numero_ticket', cleanId)
      .maybeSingle();
      
    if (exactData) return exactData as Participant;

    // Tentative 2 : Recherche floue (si l'ID est partiel)
    const { data: fuzzyData } = await supabase
      .from('participants')
      .select('*')
      .ilike('numero_ticket', `%${cleanId}%`)
      .limit(1)
      .maybeSingle();
      
    return fuzzyData as Participant || null;
  } catch (e) {
    console.error("Erreur validation ticket:", e);
    // Dernier recours local
    return getFromLocal().find(p => p.numero_ticket.toUpperCase().includes(cleanId)) || null;
  }
};

export const saveParticipant = async (participantData: Omit<Participant, 'id'>): Promise<boolean> => {
  try {
    const { error } = await supabase.from('participants').insert([participantData]);
    if (error) throw error;
    return true;
  } catch (e) {
    return false; 
  }
};

export const subscribeToParticipants = (callback: () => void) => {
  return supabase.channel('any').on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, callback).subscribe();
};

export const deleteParticipant = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
};

export const generateTicketNumber = async (): Promise<string> => {
  try {
    const { count } = await supabase.from('participants').select('*', { count: 'exact', head: true });
    return `FORUM-SEC-2026-${((count || 0) + 1).toString().padStart(4, '0')}`;
  } catch (e) { 
    return `FORUM-SEC-2026-${Math.floor(Math.random() * 9000 + 1000)}`; 
  }
};

export const isRegistrationActive = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'registration_active').maybeSingle();
    return !data || data.value === 'true';
  } catch (e) { return true; }
};

export const setRegistrationStatus = async (active: boolean): Promise<void> => {
  await supabase.from('settings').upsert({ key: 'registration_active', value: active.toString() });
};

export const exportParticipantsToCSV = async () => {
  const participants = await getParticipants();
  const headers = ["Ticket", "Nom", "Email", "Tel", "Structure"];
  const rows = participants.map(p => [p.numero_ticket, p.nom_complet, p.adresse_email, p.telephone, p.organisation_entreprise]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "participants.csv");
  link.click();
};
