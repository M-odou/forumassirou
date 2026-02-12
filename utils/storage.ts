
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Participant } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_STORAGE_KEY = 'participants_backup';

const saveToLocal = (participant: Participant) => {
  try {
    const localData = getFromLocal();
    if (!localData.find(p => p.numero_ticket === participant.numero_ticket)) {
      localData.push(participant);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
    }
  } catch (e) { console.error("Local save error:", e); }
};

const getFromLocal = (): Participant[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const getParticipants = async (): Promise<Participant[]> => {
  let remoteData: Participant[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('date_inscription', { ascending: false });
      if (!error) remoteData = data || [];
    } catch (e) { console.warn("Supabase query failed"); }
  }

  const localData = getFromLocal();
  const combined = [...remoteData];
  localData.forEach(lp => {
    if (!combined.some(rp => rp.id === lp.id || rp.numero_ticket === lp.numero_ticket)) {
      combined.push(lp);
    }
  });
  return combined.sort((a, b) => new Date(b.date_inscription).getTime() - new Date(a.date_inscription).getTime());
};

export const getParticipantByTicket = async (ticketInput: string): Promise<Participant | null> => {
  if (!ticketInput) return null;
  let cleanId = ticketInput.trim().toUpperCase();
  
  if (supabase) {
    try {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .or(`numero_ticket.eq.${cleanId},id.eq.${cleanId}`)
        .maybeSingle();
      if (data) return data as Participant;
    } catch (e) {}
  }

  return getFromLocal().find(p => 
    p.numero_ticket.toUpperCase() === cleanId || p.id.toUpperCase() === cleanId
  ) || null;
};

export const getParticipantByToken = async (token: string): Promise<Participant | null> => {
  if (!token) return null;
  if (supabase) {
    try {
      const { data } = await supabase.from('participants').select('*').eq('token', token).maybeSingle();
      if (data) return data as Participant;
    } catch (e) {}
  }
  return getFromLocal().find(p => p.token === token) || null;
};

export const validateTicket = async (id: string): Promise<boolean> => {
  const now = new Date().toISOString();
  let success = false;

  if (supabase) {
    try {
      const { error } = await supabase
        .from('participants')
        .update({ scan_valide: true, date_validation: now })
        .eq('id', id);
      success = !error;
    } catch (e) { success = false; }
  }
  
  const local = getFromLocal();
  const idx = local.findIndex(p => p.id === id);
  if (idx !== -1) {
    local[idx].scan_valide = true;
    local[idx].date_validation = now;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
    if (!supabase) success = true;
  }
  
  return success;
};

export const saveParticipant = async (participantData: Omit<Participant, 'id' | 'token'>): Promise<boolean> => {
  const token = crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36);
  const newParticipant = { ...participantData, token };

  if (supabase) {
    try {
      const { error } = await supabase.from('participants').insert([newParticipant]);
      if (!error) return true;
    } catch (e) {}
  }
  
  const tempId = 'ID_' + Math.random().toString(36).substr(2, 9);
  saveToLocal({ ...newParticipant, id: tempId } as Participant);
  return true;
};

export const deleteParticipant = async (id: string): Promise<boolean> => {
  let success = false;
  if (supabase) {
    try {
      const { error } = await supabase.from('participants').delete().eq('id', id);
      success = !error;
    } catch (e) {}
  }
  const local = getFromLocal().filter(p => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
  return success || !supabase;
};

export const generateTicketNumber = async (): Promise<string> => {
  let count = 0;
  if (supabase) {
    try {
      const { count: remoteCount } = await supabase.from('participants').select('*', { count: 'exact', head: true });
      count = remoteCount || 0;
    } catch (e) {}
  }
  const localCount = getFromLocal().length;
  const total = count + localCount + 1;
  return `FORUM-SEC-2026-${total.toString().padStart(4, '0')}`;
};

export const isRegistrationActive = async (): Promise<boolean> => {
  if (supabase) {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'registration_active').maybeSingle();
      return !data || data.value === 'true';
    } catch (e) {}
  }
  return true;
};

export const setRegistrationStatus = async (active: boolean): Promise<void> => {
  if (supabase) {
    try {
      await supabase.from('settings').upsert({ key: 'registration_active', value: active.toString() });
    } catch (e) {}
  }
};

export const isScanSystemActive = async (): Promise<boolean> => {
  if (supabase) {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'scan_active').maybeSingle();
      return data ? data.value === 'true' : true;
    } catch (e) {}
  }
  return true;
};

export const setScanSystemStatus = async (active: boolean): Promise<void> => {
  if (supabase) {
    try {
      await supabase.from('settings').upsert({ key: 'scan_active', value: active.toString() });
    } catch (e) {}
  }
};

export const subscribeToParticipants = (callback: () => void) => {
  if (!supabase) return null;
  // Utilisation d'un canal nommé spécifique pour forcer le rafraîchissement
  return supabase
    .channel('realtime_participants')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
      console.log("Realtime update received!");
      callback();
    })
    .subscribe();
};

export const exportParticipantsToCSV = async () => {
  const participants = await getParticipants();
  const headers = ["ID", "Nom Complet", "Email", "Telephone", "Organisation", "Type Participation", "Numero Ticket", "Date Inscription", "Valide"];
  const rows = participants.map(p => [p.id, p.nom_complet, p.adresse_email, p.telephone, p.organisation_entreprise || 'N/A', p.participation, p.numero_ticket, p.date_inscription, p.scan_valide ? "OUI" : "NON"]);
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `participants-${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
};
