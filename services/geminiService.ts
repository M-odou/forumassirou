
import { GoogleGenAI } from "@google/genai";
import { Participant } from '../types';

export const generateEmailContent = async (participant: Participant): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const downloadUrl = `${window.location.origin}/#/ticket/${participant.numero_ticket}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rédige un e-mail de confirmation d'inscription extrêmement professionnel et chaleureux pour Assirou Sécurité.
      
      Contexte : Deuxième forum sur les métiers de la sécurité privée au Sénégal.
      Participant : ${participant.nom_complet}
      Organisation : ${participant.organisation_entreprise || 'Participant individuel'}
      Ticket ID : ${participant.numero_ticket}
      Lien du ticket : ${downloadUrl}
      
      L'email doit inclure :
      - Un ton institutionnel mais accueillant.
      - Un rappel des détails (05 mars 2026, 12h-17h, CSC Thiaroye sur Mer).
      - Une instruction claire pour télécharger et présenter le ticket.
      - Une signature : La Direction d'Assirou Sécurité.`,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || "Merci pour votre inscription.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Inscription confirmée.";
  }
};
