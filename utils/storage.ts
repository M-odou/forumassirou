
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Participant } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Initialisation sécurisée du client Supabase
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_STORAGE_KEY = 'forum_participants_backup';

const getLocalParticipants = (): Participant[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalParticipant = (participant: Participant) => {
  const participants = getLocalParticipants();
  participants.push(participant);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(participants));
};

export const getParticipants = async (): Promise<{data: Participant[], error: any}> => {
  if (!supabase) return { data: getLocalParticipants(), error: 'Mode Local Storage (Supabase non configuré)' };
  
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('date_inscription', { ascending: false });
    
    if (error) throw error;
    
    const formatted = (data || []).map(p => ({
      ...p,
      canal_forum: p.canal_forum || [],
      canal_assirou: p.canal_assirou || [],
      type_formation: p.type_formation || [],
      services_interesses: p.services_interesses || []
    }));
    
    return { data: formatted, error: null };
  } catch (e: any) {
    console.error("Supabase Fetch Error:", e);
    return { data: getLocalParticipants(), error: e.message || e };
  }
};

export const saveParticipant = async (participantData: Omit<Participant, 'id' | 'token'>): Promise<boolean> => {
  const token = crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36);
  const id = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
  const newParticipant = { ...participantData, id, token } as Participant;

  if (!supabase) {
    saveLocalParticipant(newParticipant);
    return true;
  }
  
  try {
    const { error } = await supabase.from('participants').insert([newParticipant]);
    if (error) {
       console.error("Supabase Insert Error:", error);
       saveLocalParticipant(newParticipant); 
       return true; // On retourne true car le fallback local a fonctionné
    }
    return true;
  } catch (e) {
    saveLocalParticipant(newParticipant);
    return true;
  }
};

export const deleteParticipant = async (id: string): Promise<boolean> => {
  if (!supabase) {
    const participants = getLocalParticipants().filter(p => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(participants));
    return true;
  }
  try {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
};

export const validateTicket = async (id: string): Promise<boolean> => {
  const now = new Date().toISOString();
  if (!supabase) {
    const participants = getLocalParticipants().map(p => 
      p.id === id ? { ...p, scan_valide: true, date_validation: now } : p
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(participants));
    return true;
  }
  try {
    const { error } = await supabase
      .from('participants')
      .update({ scan_valide: true, date_validation: now })
      .eq('id', id);
    return !error;
  } catch (e) { return false; }
};

export const getParticipantByTicket = async (ticket: string): Promise<Participant | null> => {
  if (!supabase) return getLocalParticipants().find(p => p.numero_ticket === ticket) || null;
  const { data } = await supabase.from('participants').select('*').eq('numero_ticket', ticket).maybeSingle();
  return data || getLocalParticipants().find(p => p.numero_ticket === ticket) || null;
};

export const getParticipantByToken = async (token: string): Promise<Participant | null> => {
  if (!supabase) return getLocalParticipants().find(p => p.token === token) || null;
  const { data } = await supabase.from('participants').select('*').eq('token', token).maybeSingle();
  return data || getLocalParticipants().find(p => p.token === token) || null;
};

export const isRegistrationActive = async (): Promise<boolean> => {
  if (!supabase) return true;
  try {
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'registration_active').maybeSingle();
    if (error) return true;
    return data ? data.value === 'true' : true;
  } catch (e) { 
    return true; 
  }
};

export const isScanSystemActive = async (): Promise<boolean> => {
  if (!supabase) return true;
  try {
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'scan_active').maybeSingle();
    if (error) return true;
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
  const timestamp = Date.now().toString().slice(-4);
  if (!supabase) return `FORUM-2026-L${timestamp}`;
  try {
    const { count, error } = await supabase.from('participants').select('*', { count: 'exact', head: true });
    if (error) return `FORUM-2026-T${timestamp}`;
    return `FORUM-2026-${((count || 0) + 1).toString().padStart(4, '0')}`;
  } catch (e) {
    return `FORUM-2026-T${timestamp}`;
  }
};

export const subscribeToParticipants = (cb: () => void) => {
  if (!supabase) return null;
  
  const channel = supabase
    .channel('public:participants')
    .on(
      'postgres_changes', 
      { event: '*', schema: 'public', table: 'participants' }, 
      () => { cb(); }
    )
    .subscribe();

  return channel;
};

export const exportParticipantsToCSV = async () => {
  const { data } = await getParticipants();
  const headers = ["Nom", "Email", "Tel", "Orga", "Participation", "Ticket", "Date"];
  const rows = data.map(p => [
    `"${p.nom_complet}"`, 
    `"${p.adresse_email}"`, 
    `"${p.telephone}"`, 
    `"${p.organisation_entreprise || 'INDIVIDUEL'}"`, 
    `"${p.participation}"`, 
    `"${p.numero_ticket}"`, 
    `"${p.date_inscription}"`
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FORUM_PARTICIPANTS.csv`;
  a.click();
};
