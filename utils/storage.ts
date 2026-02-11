
import { createClient } from '@supabase/supabase-js';
import { Participant } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || 'https://s9pmyrnhvowevpk0mlt2.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_s9PMYRnHvoweVPk0MLT2Lg_g6qWGroq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_STORAGE_KEY = 'participants_fallback';

const saveToLocal = (participant: Participant) => {
  try {
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    if (!localData.find((p: Participant) => p.numero_ticket === participant.numero_ticket)) {
      localData.push(participant);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
    }
  } catch (e) { console.error("Local storage error:", e); }
};

const getFromLocal = (): Participant[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const getParticipants = async (): Promise<Participant[]> => {
  let remoteData: Participant[] = [];
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('date_inscription', { ascending: false });
    if (error) throw error;
    remoteData = data || [];
  } catch (e) { console.warn("Réseau instable ou erreur Supabase, lecture locale."); }

  const localData = getFromLocal();
  const combined = [...remoteData];
  localData.forEach(localP => {
    if (!combined.some(remoteP => remoteP.numero_ticket === localP.numero_ticket)) {
      combined.push(localP);
    }
  });
  return combined.sort((a, b) => new Date(b.date_inscription).getTime() - new Date(a.date_inscription).getTime());
};

/**
 * RECHERCHE ROBUSTE : 
 * Gère les IDs simples, les URLs complètes, et les erreurs de casse.
 */
export const getParticipantByTicket = async (ticketInput: string): Promise<Participant | null> => {
  if (!ticketInput) return null;
  
  // 1. Nettoyage profond : si l'input est une URL, on extrait juste la partie après le dernier slash
  let cleanTicket = ticketInput.trim();
  if (cleanTicket.includes('/')) {
    cleanTicket = cleanTicket.split('/').pop() || cleanTicket;
  }
  // Supprime les résidus éventuels de hash (#) ou de paramètres de requête (?)
  cleanTicket = cleanTicket.split('#').pop() || cleanTicket;
  cleanTicket = cleanTicket.split('?')[0];
  cleanTicket = cleanTicket.trim().toUpperCase();

  console.log("Tentative de validation pour le ticket:", cleanTicket);

  try {
    // 2. Recherche par correspondance exacte (Insensible à la casse via ilike)
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .ilike('numero_ticket', cleanTicket)
      .maybeSingle();
      
    if (data) return data as Participant;

    // 3. Recherche par suffixe (ex: juste 0001 au lieu de FORUM-SEC-2026-0001)
    if (cleanTicket.length >= 4) {
      const { data: suffixData } = await supabase
        .from('participants')
        .select('*')
        .ilike('numero_ticket', `%${cleanTicket}`)
        .maybeSingle();
      
      if (suffixData) return suffixData as Participant;
    }

    // 4. Fallback Local Storage
    const local = getFromLocal().find(p => {
      const pNum = p.numero_ticket.toUpperCase();
      return pNum === cleanTicket || pNum.endsWith(cleanTicket) || cleanTicket.endsWith(pNum);
    });
    
    return local || null;
  } catch (e) {
    console.error("Erreur critique lors de la récupération du participant:", e);
    return null;
  }
};

export const saveParticipant = async (participantData: Omit<Participant, 'id'>): Promise<boolean> => {
  try {
    const { error } = await supabase.from('participants').insert([participantData]);
    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
    return true;
  } catch (e) {
    const tempId = 'local_' + Math.random().toString(36).substring(2, 15);
    saveToLocal({ ...participantData, id: tempId } as Participant);
    return true; 
  }
};

export const subscribeToParticipants = (callback: () => void) => {
  try {
    return supabase.channel('any').on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, callback).subscribe();
  } catch (e) { return null; }
};

export const deleteParticipant = async (id: string): Promise<boolean> => {
  try {
    if (!id.startsWith('local_')) {
      const { error } = await supabase.from('participants').delete().eq('id', id);
      if (error) throw error;
    }
    const filtered = getFromLocal().filter(p => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) { 
    console.error("Delete error:", e);
    return false; 
  }
};

export const generateTicketNumber = async (): Promise<string> => {
  try {
    const { count } = await supabase.from('participants').select('*', { count: 'exact', head: true });
    const total = (count || 0) + getFromLocal().length + 1;
    return `FORUM-SEC-2026-${total.toString().padStart(4, '0')}`;
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
  try {
    await supabase.from('settings').upsert({ key: 'registration_active', value: active.toString() });
  } catch (e) {}
};

export const exportParticipantsToCSV = async () => {
  const participants = await getParticipants();
  const headers = ["Ticket", "Nom", "Email", "Tel", "Structure", "Type", "Formation", "Services", "Source Forum", "Source Assirou"];
  const rows = participants.map(p => [
    p.numero_ticket, p.nom_complet, p.adresse_email, p.telephone, p.organisation_entreprise, p.participation,
    p.type_formation.join('; '), p.services_interesses.join('; '), p.canal_forum.join('; '), p.canal_assirou.join('; ')
  ]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "participants_forum_2026.csv");
  link.click();
};
