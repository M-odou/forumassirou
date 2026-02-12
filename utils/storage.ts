
import { createClient } from '@supabase/supabase-js';
import { Participant } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || 'https://s9pmyrnhvowevpk0mlt2.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_s9PMYRnHvoweVPk0MLT2Lg_g6qWGroq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('date_inscription', { ascending: false });
    if (!error) remoteData = data || [];
  } catch (e) { console.warn("Supabase unreachable"); }

  const localData = getFromLocal();
  const combined = [...remoteData];
  localData.forEach(lp => {
    if (!combined.some(rp => rp.numero_ticket === lp.numero_ticket)) {
      combined.push(lp);
    }
  });
  return combined.sort((a, b) => new Date(b.date_inscription).getTime() - new Date(a.date_inscription).getTime());
};

export const getParticipantByTicket = async (ticketInput: string): Promise<Participant | null> => {
  if (!ticketInput) return null;
  let cleanId = ticketInput.trim();
  if (cleanId.includes('/')) cleanId = cleanId.split('/').pop() || cleanId;
  if (cleanId.includes('#')) cleanId = cleanId.split('#').pop() || cleanId;
  cleanId = cleanId.toUpperCase();

  try {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .or(`numero_ticket.ilike.%${cleanId}%,id.eq.${cleanId}`)
      .maybeSingle();
    if (data) return data as Participant;
  } catch (e) {}

  return getFromLocal().find(p => 
    p.numero_ticket.toUpperCase().includes(cleanId) || p.id.toUpperCase().includes(cleanId)
  ) || null;
};

export const getParticipantByToken = async (token: string): Promise<Participant | null> => {
  try {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    return data as Participant || null;
  } catch (e) {
    return getFromLocal().find(p => p.token === token) || null;
  }
};

export const validateTicket = async (id: string): Promise<boolean> => {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('participants')
      .update({ scan_valide: true, date_validation: now })
      .eq('id', id);
    return !error;
  } catch (e) { return false; }
};

export const saveParticipant = async (participantData: Omit<Participant, 'id' | 'token'>): Promise<boolean> => {
  const tempId = 'ID_' + Math.random().toString(36).substr(2, 9);
  const token = crypto.randomUUID();
  const fullParticipant = { ...participantData, id: tempId, token } as Participant;

  try {
    const { error } = await supabase.from('participants').insert([{ ...participantData, token }]);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Échec base de données, sauvegarde locale de secours activée:", e);
    saveToLocal(fullParticipant);
    return true;
  }
};

export const deleteParticipant = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    const local = getFromLocal().filter(p => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
    return !error;
  } catch (e) { return false; }
};

export const generateTicketNumber = async (): Promise<string> => {
  try {
    const { count } = await supabase.from('participants').select('*', { count: 'exact', head: true });
    const localCount = getFromLocal().length;
    const total = (count || 0) + localCount + 1;
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

export const isScanSystemActive = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'scan_active').maybeSingle();
    return data ? data.value === 'true' : true;
  } catch (e) { return true; }
};

export const setScanSystemStatus = async (active: boolean): Promise<void> => {
  try {
    await supabase.from('settings').upsert({ key: 'scan_active', value: active.toString() });
  } catch (e) {}
};

export const subscribeToParticipants = (callback: () => void) => {
  return supabase.channel('any').on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, callback).subscribe();
};

export const exportParticipantsToCSV = async () => {
  const participants = await getParticipants();
  const headers = ["ID", "Nom Complet", "Email", "Telephone", "Organisation", "Type Participation", "Numero Ticket", "Token Scan", "Date Inscription", "Scan Valide", "Date Validation"];
  const rows = participants.map(p => [
    p.id, 
    p.nom_complet, 
    p.adresse_email, 
    p.telephone, 
    p.organisation_entreprise || 'N/A', 
    p.participation, 
    p.numero_ticket,
    p.token,
    p.date_inscription, 
    p.scan_valide ? "OUI" : "NON", 
    p.date_validation || 'N/A'
  ]);
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `export-participants-${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
};
