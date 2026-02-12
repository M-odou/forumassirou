
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Participant } from '../types';

// Utilisation des variables d'environnement injectées par Vite
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_STORAGE_KEY = 'participants_backup';

const getFromLocal = (): Participant[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveToLocal = (participant: Participant) => {
  try {
    const localData = getFromLocal();
    const exists = localData.findIndex(p => p.numero_ticket === participant.numero_ticket);
    if (exists > -1) {
      localData[exists] = participant;
    } else {
      localData.push(participant);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
  } catch (e) {
    console.error("LocalSaveError:", e);
  }
};

export const getParticipants = async (): Promise<Participant[]> => {
  let remoteData: Participant[] = [];
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('date_inscription', { ascending: false });
      
      if (error) {
        console.error("Supabase Error:", error.message);
      } else {
        remoteData = (data || []).map(p => ({
          ...p,
          canal_forum: p.canal_forum || [],
          canal_assirou: p.canal_assirou || [],
          type_formation: p.type_formation || [],
          services_interesses: p.services_interesses || []
        }));
      }
    } catch (e) {
      console.warn("Supabase Unreachable, using local cache only.");
    }
  }

  const localData = getFromLocal();
  const combinedMap = new Map<string, Participant>();
  
  localData.forEach(p => { if (p.numero_ticket) combinedMap.set(p.numero_ticket, p); });
  remoteData.forEach(p => { if (p.numero_ticket) combinedMap.set(p.numero_ticket, p); });

  return Array.from(combinedMap.values()).sort((a, b) => 
    new Date(b.date_inscription || 0).getTime() - new Date(a.date_inscription || 0).getTime()
  );
};

export const saveParticipant = async (participantData: Omit<Participant, 'id' | 'token'>): Promise<boolean> => {
  const token = crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36);
  const newParticipant = { ...participantData, token };

  if (supabase) {
    try {
      const { error } = await supabase.from('participants').insert([newParticipant]);
      if (!error) return true;
    } catch (e) {
      console.error("Supabase Insert Error:", e);
    }
  }
  
  saveToLocal({ ...newParticipant, id: 'temp_' + Date.now() } as Participant);
  return true;
};

export const deleteParticipant = async (id: string): Promise<boolean> => {
  if (supabase && !id.startsWith('temp_')) {
    try {
      await supabase.from('participants').delete().eq('id', id);
    } catch (e) {}
  }
  const local = getFromLocal().filter(p => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
  return true;
};

export const validateTicket = async (id: string): Promise<boolean> => {
  const now = new Date().toISOString();
  if (supabase && !id.startsWith('temp_')) {
    try {
      await supabase.from('participants').update({ scan_valide: true, date_validation: now }).eq('id', id);
    } catch (e) {}
  }
  
  const local = getFromLocal();
  const idx = local.findIndex(p => p.id === id);
  if (idx !== -1) {
    local[idx].scan_valide = true;
    local[idx].date_validation = now;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
  }
  return true;
};

export const getParticipantByToken = async (token: string): Promise<Participant | null> => {
  if (supabase) {
    const { data } = await supabase.from('participants').select('*').eq('token', token).maybeSingle();
    if (data) return data;
  }
  return getFromLocal().find(p => p.token === token) || null;
};

export const getParticipantByTicket = async (ticket: string): Promise<Participant | null> => {
  if (supabase) {
    const { data } = await supabase.from('participants').select('*').eq('numero_ticket', ticket).maybeSingle();
    if (data) return data;
  }
  return getFromLocal().find(p => p.numero_ticket === ticket) || null;
};

export const isRegistrationActive = async () => {
  if (supabase) {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'registration_active').maybeSingle();
      return data ? data.value === 'true' : true;
    } catch (e) { return true; }
  }
  return true;
};

// Fix: Added missing isScanSystemActive function to resolve import errors in TicketView and ScanPage
export const isScanSystemActive = async () => {
  if (supabase) {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'scan_system_active').maybeSingle();
      return data ? data.value === 'true' : true;
    } catch (e) { return true; }
  }
  return true;
};

export const setRegistrationStatus = async (val: boolean) => {
  if (supabase) {
    await supabase.from('settings').upsert({ key: 'registration_active', value: val.toString() });
  }
};

export const generateTicketNumber = async () => {
  const participants = await getParticipants();
  const next = participants.length + 1;
  return `FORUM-SEC-2026-${next.toString().padStart(4, '0')}`;
};

export const subscribeToParticipants = (cb: () => void) => {
  if (!supabase) return null;
  return supabase.channel('participants_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, cb).subscribe();
};

export const exportParticipantsToCSV = async () => {
  const data = await getParticipants();
  const headers = ["Nom", "Email", "Tel", "Orga", "Type", "Ticket", "Date", "Valide"];
  const rows = data.map(p => [p.nom_complet, p.adresse_email, p.telephone, p.organisation_entreprise, p.participation, p.numero_ticket, p.date_inscription, p.scan_valide ? "OUI" : "NON"]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'participants.csv';
  a.click();
};
