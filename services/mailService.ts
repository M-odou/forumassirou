
import { Participant } from '../types';
import { generateEmailContent } from './geminiService';
import { supabase } from '../utils/storage';

export const sendConfirmationEmail = async (participant: Participant): Promise<boolean> => {
  try {
    const emailBody = await generateEmailContent(participant);
    const ticketLink = `${window.location.origin}/#/ticket/${participant.numero_ticket}`;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 're_placeholder') {
      console.warn("Clé RESEND_API_KEY manquante. Passage en statut 'failed' pour envoi manuel.");
      await updateMailStatus(participant.numero_ticket, 'failed');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        from: 'Assirou Sécurité <forum@assirousecurite.sn>',
        to: [participant.adresse_email],
        subject: `Confirmation d'inscription - Forum Sécurité 2026 - ${participant.numero_ticket}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #002157;">Inscription Validée !</h2>
            <div style="white-space: pre-wrap;">${emailBody}</div>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${ticketLink}" style="background-color: #C5A022; color: #002157; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block;">
                TÉLÉCHARGER MON BADGE
              </a>
            </div>
          </div>
        `
      })
    });

    if (response.ok) {
      await updateMailStatus(participant.numero_ticket, 'sent');
      return true;
    } else {
      throw new Error("Erreur API Resend");
    }
  } catch (error) {
    console.error("Erreur envoi mail:", error);
    await updateMailStatus(participant.numero_ticket, 'failed');
    return false;
  }
};

const updateMailStatus = async (ticketNum: string, status: 'sent' | 'failed') => {
  await supabase
    .from('participants')
    .update({ statut_email: status })
    .eq('numero_ticket', ticketNum);
};

export const openMailClient = async (participant: Participant) => {
  const content = await generateEmailContent(participant);
  const subject = encodeURIComponent(`Votre Badge - Forum Sécurité 2026`);
  const body = encodeURIComponent(content);
  window.location.href = `mailto:${participant.adresse_email}?subject=${subject}&body=${body}`;
};
