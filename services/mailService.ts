
import { Participant } from '../types';
import { generateEmailContent } from './geminiService';
import { supabase } from '../utils/storage';

/**
 * Le "Sel" : Orchestrateur d'envoi d'e-mail
 * 1. Récupère l'e-mail du participant
 * 2. Génère le texte avec Gemini
 * 3. Envoie via un service de mail (Exemple avec un Webhook ou API)
 */
export const sendConfirmationEmail = async (participant: Participant): Promise<boolean> => {
  try {
    // 1. Génération du contenu personnalisé par l'IA
    const emailBody = await generateEmailContent(participant);
    
    // 2. Préparation du lien du ticket
    const ticketLink = `${window.location.origin}/#/ticket/${participant.numero_ticket}`;

    console.log(`Préparation de l'envoi pour : ${participant.adresse_email}`);

    // 3. ENVOI RÉEL (Le Sel)
    // Ici, nous utilisons une requête vers un service tiers (ex: Resend, EmailJS, ou votre propre backend)
    // Pour cet exemple, nous simulons l'appel API qui transmet l'emailBody et l'adresse_email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY || 're_placeholder'}` 
      },
      body: JSON.stringify({
        from: 'Assirou Sécurité <forum@assirousecurite.sn>',
        to: [participant.adresse_email],
        subject: `Confirmation d'inscription - Forum Sécurité 2026 - ${participant.numero_ticket}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
            <img src="https://api.dicebear.com/7.x/initials/svg?seed=AS&backgroundColor=002157" width="50" height="50" style="border-radius: 10px;" />
            <h2 style="color: #002157;">Votre Inscription est validée !</h2>
            <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">${emailBody}</div>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${ticketLink}" style="background-color: #C5A022; color: #002157; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block;">
                TÉLÉCHARGER MON BADGE D'ACCÈS
              </a>
            </div>
            <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 10px; color: #999; text-align: center;">ASSIRU SÉCURITÉ © 2026 • kaarange bi dall xel</p>
          </div>
        `
      })
    });

    // 4. Mise à jour du statut dans Supabase
    const { error } = await supabase
      .from('participants')
      .update({ statut_email: 'sent' })
      .eq('numero_ticket', participant.numero_ticket);

    if (error) console.error("Erreur update statut email:", error);

    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    
    // Mise à jour en statut échec
    await supabase
      .from('participants')
      .update({ statut_email: 'failed' })
      .eq('numero_ticket', participant.numero_ticket);
      
    return false;
  }
};
