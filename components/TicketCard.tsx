
import React from 'react';
import { Participant } from '../types';

interface TicketCardProps {
  participant: Participant;
}

const TicketCard: React.FC<TicketCardProps> = ({ participant }) => {
  // On utilise uniquement le domaine racine et le numéro du ticket pour le QR
  // Le système de validation est désormais assez robuste pour extraire l'ID peu importe l'URL
  const origin = window.location.origin + window.location.pathname;
  const validationUrl = `${origin.split('#')[0]}#/ticket/${participant.numero_ticket}`;
  
  // QR Code avec marges de sécurité (qzone) plus grandes pour faciliter la lecture sur écran
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(validationUrl)}&color=002157&bgcolor=ffffff&qzone=4&ecc=H`;

  return (
    <div className="relative w-full max-w-[400px] mx-auto overflow-hidden rounded-[3rem] shadow-2xl bg-white text-assirou-navy border border-slate-100">
      
      {/* Top Banner */}
      <div className="bg-assirou-navy text-white p-10 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-shield-halved text-assirou-gold"></i>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-assirou-gold">Assirou Sécurité</span>
          </div>
          <h2 className="text-[15px] font-black leading-tight uppercase border-l-4 border-assirou-gold pl-4 tracking-tighter">
            DEUXIÈME FORUM SUR LES MÉTIERS DE LA SÉCURITÉ PRIVÉE
          </h2>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-10 bg-slate-50">
        <div className="mb-8">
          <p className="text-[9px] text-slate-400 uppercase font-black mb-1 tracking-widest">Détenteur du Pass</p>
          <h3 className="text-2xl font-black text-assirou-navy truncate leading-tight">{participant.nom_complet}</h3>
          <p className="text-assirou-gold text-[10px] font-black uppercase tracking-widest">{participant.organisation_entreprise || 'Participant individuel'}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10 border-y border-slate-200 py-6">
          <div>
            <p className="text-[8px] text-slate-400 uppercase font-black mb-1 tracking-widest">Date & Heure</p>
            <p className="text-[11px] font-black text-assirou-navy">05 Mars 2026</p>
            <p className="text-[10px] font-black text-assirou-gold uppercase">10h00 - 16h00</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-400 uppercase font-black mb-1 tracking-widest">Lieu</p>
            <p className="text-[10px] font-black text-assirou-navy leading-tight uppercase">CSC Thiaroye<br/>sur Mer</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[9px] text-slate-400 uppercase font-black mb-1 tracking-widest">ID Ticket</p>
            <p className="text-xl font-black text-assirou-navy mono tracking-tighter">{participant.numero_ticket.split('-').pop()}</p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/10 whitespace-nowrap">
               <i className="fas fa-check-circle"></i> Pass Officiel
            </div>
          </div>
          
          <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center shrink-0">
            <img 
              src={qrUrl} 
              alt="Validation QR Code" 
              className="w-24 h-24 sm:w-28 sm:h-28" 
              loading="eager"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">kaarange bi dall xel</p>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
