
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
      - Un rappel des détails (05 mars 2026, 10h00 - 16h00, CSC Thiaroye sur Mer).
      - Une instruction claire pour présenter ce badge numérique (le QR code sera scanné à l'entrée).
      - Une signature : La Direction d'Assirou Sécurité.`,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || "Merci pour votre inscription au Forum Sécurité 2026.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Votre inscription au Forum Sécurité 2026 est confirmée. Rendez-vous le 05 Mars à 10h.";
  }
};
