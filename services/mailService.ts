
import { Participant } from '../types';
import { generateEmailContent } from './geminiService';
import { supabase } from '../utils/storage';

export const sendConfirmationEmail = async (participant: Participant): Promise<boolean> => {
  try {
    const emailBody = await generateEmailContent(participant);
    const ticketLink = `${window.location.origin}/#/ticket/${participant.numero_ticket}`;
    
    // Récupération de la clé API
    const apiKey = process.env.RESEND_API_KEY;

    // Si la clé est manquante, on ne traite pas l'envoi automatique mais on ne bloque pas le processus global
    if (!apiKey || apiKey === '' || apiKey === 're_placeholder' || apiKey.length < 5) {
      console.warn("NOTE DÉVELOPPEUR : Clé API Resend non configurée. L'envoi automatique est ignoré.");
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
        from: 'Assirou Sécurité <onboarding@resend.dev>',
        to: [participant.adresse_email],
        subject: `Confirmation d'inscription - Forum Sécurité 2026`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
            <h2 style="color: #002157; text-transform: uppercase;">Inscription Validée</h2>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Bonjour ${participant.nom_complet},</p>
            <div style="white-space: pre-wrap; color: #555; font-size: 14px;">${emailBody}</div>
            <div style="margin-top: 40px; text-align: center;">
              <a href="${ticketLink}" style="background-color: #C5A022; color: #002157; padding: 18px 30px; text-decoration: none; font-weight: 900; border-radius: 12px; display: inline-block; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
                ACCÉDER À MON BADGE
              </a>
            </div>
            <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 10px; color: #aaa; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Assirou Sécurité • Kaarange bi dall xel</p>
          </div>
        `
      })
    });

    if (response.ok) {
      console.log("Email envoyé avec succès via Resend.");
      await updateMailStatus(participant.numero_ticket, 'sent');
      return true;
    } else {
      const errorText = await response.text();
      console.error("Erreur API Resend :", errorText);
      await updateMailStatus(participant.numero_ticket, 'failed');
      return false;
    }
  } catch (error) {
    console.error("Échec de l'envoi d'email :", error);
    await updateMailStatus(participant.numero_ticket, 'failed');
    return false;
  }
};

const updateMailStatus = async (ticketNum: string, status: 'sent' | 'failed') => {
  if (!supabase) {
    console.warn("Supabase non initialisé : impossible de mettre à jour le statut mail.");
    return;
  }
  
  try {
    const { error } = await supabase
      .from('participants')
      .update({ statut_email: status })
      .eq('numero_ticket', ticketNum);
    if (error) console.error("Update DB status error:", error);
  } catch (e) {
    console.error("Erreur mise à jour statut mail Supabase:", e);
  }
};

export const openMailClient = async (participant: Participant) => {
  try {
    const content = await generateEmailContent(participant);
    const subject = encodeURIComponent(`Confirmation d'inscription - Forum Sécurité 2026`);
    const body = encodeURIComponent(content + `\n\nVotre badge est disponible ici : ${window.location.origin}/#/ticket/${participant.numero_ticket}`);
    window.location.href = `mailto:${participant.adresse_email}?subject=${subject}&body=${body}`;
  } catch (e) {
    window.location.href = `mailto:${participant.adresse_email}?subject=Confirmation&body=Votre badge est prêt.`;
  }
};
