
import { createClient } from '@supabase/supabase-js';
import { Participant } from '../types';

// Utilisation de variables d'environnement avec valeurs de secours pour le développement
const supabaseUrl = process.env.SUPABASE_URL || 'https://s9pmyrnhvowevpk0mlt2.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_s9PMYRnHvoweVPk0MLT2Lg_g6qWGroq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const saveToLocal = (participant: Participant) => {
  try {
    const localData = JSON.parse(localStorage.getItem('participants_fallback') || '[]');
    localData.push(participant);
    localStorage.setItem('participants_fallback', JSON.stringify(localData));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

const getFromLocal = (ticketId: string): Participant | null => {
  try {
    const localData = JSON.parse(localStorage.getItem('participants_fallback') || '[]');
    return localData.find((p: Participant) => p.numero_ticket === ticketId) || null;
  } catch (e) {
    return null;
  }
};

export const getParticipants = async (): Promise<Participant[]> => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('date_inscription', { ascending: false });
    
    if (error) throw error;
    return data as Participant[];
  } catch (e) {
    console.warn("Erreur Supabase, chargement local:", e);
    return JSON.parse(localStorage.getItem('participants_fallback') || '[]');
  }
};

export const getParticipantByTicket = async (ticketId: string): Promise<Participant | null> => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('numero_ticket', ticketId)
      .maybeSingle(); // Utilisation de maybeSingle pour éviter les erreurs 406
    
    if (error) throw error;
    return data as Participant || getFromLocal(ticketId);
  } catch (e) {
    return getFromLocal(ticketId);
  }
};

export const saveParticipant = async (participantData: Omit<Participant, 'id'>): Promise<boolean> => {
  // Génération d'un ID de secours
  const fallbackId = Math.random().toString(36).substring(2, 15);
  
  try {
    const { data, error } = await supabase
      .from('participants')
      .insert([{ ...participantData }])
      .select();
    
    if (error) {
      console.error("Supabase error detail:", error);
      throw error;
    }
    return true;
  } catch (e) {
    console.warn("Échec insertion Supabase, repli sur local:", e);
    const localEntry: Participant = {
      ...participantData,
      id: fallbackId,
    } as Participant;
    saveToLocal(localEntry);
    return true;
  }
};

export const deleteParticipant = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (e) {
    const localData = JSON.parse(localStorage.getItem('participants_fallback') || '[]');
    const filtered = localData.filter((p: Participant) => p.id !== id);
    localStorage.setItem('participants_fallback', JSON.stringify(filtered));
    return true;
  }
};

export const generateTicketNumber = async (): Promise<string> => {
  try {
    const { count, error } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    const nextCount = (count || 0) + 1;
    return `FORUM-SEC-2026-${nextCount.toString().padStart(4, '0')}`;
  } catch (e) {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FORUM-26-${timestamp}-${random}`;
  }
};

export const isRegistrationActive = async (): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'registration_active')
      .maybeSingle();
    return !data || data.value === 'true';
  } catch (e) {
    return true;
  }
};

export const setRegistrationStatus = async (active: boolean): Promise<void> => {
  try {
    await supabase
      .from('settings')
      .upsert({ key: 'registration_active', value: active.toString() });
  } catch (e) {}
};

export const exportParticipantsToCSV = async () => {
  const participants = await getParticipants();
  if (participants.length === 0) return;
  const headers = ["Ticket", "Nom", "Email", "Tel", "Structure", "Type", "Formation", "Services"];
  const rows = participants.map(p => [
    p.numero_ticket, p.nom_complet, p.adresse_email, p.telephone,
    p.organisation_entreprise || 'N/A', p.participation,
    p.type_formation?.join(' / ') || 'Non',
    p.services_interesses?.join(' / ') || 'Non'
  ]);
  const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `export_forum_2026.csv`);
  link.click();
};
