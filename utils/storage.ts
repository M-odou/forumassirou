
import { createClient } from '@supabase/supabase-js';
import { Participant } from '../types';

// REMPLACEZ 'votre-projet-id' par l'identifiant réel de votre projet Supabase
const supabaseUrl = 'https://s9pmyrnhvowevpk0mlt2.supabase.co'; // Exemple basé sur votre clé
const supabaseAnonKey = 'sb_publishable_s9PMYRnHvoweVPk0MLT2Lg_g6qWGroq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const saveToLocal = (participant: Participant) => {
  const localData = JSON.parse(localStorage.getItem('participants_fallback') || '[]');
  localData.push(participant);
  localStorage.setItem('participants_fallback', JSON.stringify(localData));
};

const getFromLocal = (ticketId: string): Participant | null => {
  const localData = JSON.parse(localStorage.getItem('participants_fallback') || '[]');
  return localData.find((p: Participant) => p.numero_ticket === ticketId) || null;
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
    console.error("Erreur lors de la récupération des participants:", e);
    return JSON.parse(localStorage.getItem('participants_fallback') || '[]');
  }
};

export const getParticipantByTicket = async (ticketId: string): Promise<Participant | null> => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('numero_ticket', ticketId)
      .single();
    
    if (error) throw error;
    return data as Participant;
  } catch (e) {
    return getFromLocal(ticketId);
  }
};

export const saveParticipant = async (participant: Participant): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('participants')
      .insert([participant]);
    
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Erreur Supabase, sauvegarde locale activée:", e);
    saveToLocal(participant);
    return true; // On retourne true car la sauvegarde locale a fonctionné
  }
};

export const generateTicketNumber = async (): Promise<string> => {
  try {
    const { count } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });
    
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
      .single();
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
