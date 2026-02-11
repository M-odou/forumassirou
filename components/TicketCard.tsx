
import React from 'react';
import { Participant } from '../types';

interface TicketCardProps {
  participant: Participant;
}

const TicketCard: React.FC<TicketCardProps> = ({ participant }) => {
  // L'URL doit être simple et directe.
  const origin = window.location.origin + window.location.pathname;
  // On utilise le format #/ticket/ID pour le HashRouter
  const validationUrl = `${origin.split('#')[0]}#/ticket/${participant.numero_ticket}`;
  
  // QR Code optimisé pour la lecture rapide (L correction level pour plus de simplicité visuelle)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(validationUrl)}&color=002157&bgcolor=ffffff&qzone=2&ecc=L`;

  return (
    <div className="relative w-[360px] sm:w-[400px] mx-auto overflow-hidden rounded-[3rem] shadow-2xl bg-white text-assirou-navy border border-slate-100 flex flex-col">
      
      {/* Top Banner (Identité Assirou) */}
      <div className="bg-assirou-navy text-white p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-shield-halved text-assirou-gold"></i>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-assirou-gold">Assirou Sécurité</span>
          </div>
          <h2 className="text-[14px] font-black leading-tight uppercase border-l-4 border-assirou-gold pl-4 tracking-tighter">
            DEUXIÈME FORUM SUR LES MÉTIERS DE LA SÉCURITÉ PRIVÉE
          </h2>
        </div>
      </div>

      {/* Main Info */}
      <div className="p-10 bg-slate-50 flex-1 flex flex-col">
        <div className="mb-6">
          <p className="text-[8px] text-slate-400 uppercase font-black mb-1 tracking-widest">Détenteur du Pass</p>
          <h3 className="text-2xl font-black text-assirou-navy truncate leading-none mb-1">{participant.nom_complet}</h3>
          <p className="text-assirou-gold text-[10px] font-black uppercase tracking-widest truncate">{participant.organisation_entreprise || 'Participant individuel'}</p>
        </div>

        {/* Event Details Row */}
        <div className="grid grid-cols-2 gap-4 border-y border-slate-200 py-6 mb-6">
          <div className="border-r border-slate-200">
            <p className="text-[7px] text-slate-400 uppercase font-black mb-1 tracking-widest">Quand</p>
            <p className="text-[11px] font-black text-assirou-navy">05 Mars 2026</p>
            <p className="text-[9px] font-black text-assirou-gold uppercase">10h00 - 16h00</p>
          </div>
          <div className="pl-4">
            <p className="text-[7px] text-slate-400 uppercase font-black mb-1 tracking-widest">Où</p>
            <p className="text-[10px] font-black text-assirou-navy leading-tight uppercase">CSC Thiaroye<br/>sur Mer</p>
          </div>
        </div>

        {/* QR & ID Section */}
        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="flex-1">
            <p className="text-[8px] text-slate-400 uppercase font-black mb-1 tracking-widest">N° Ticket</p>
            <p className="text-lg font-black text-assirou-navy mono tracking-tighter">{participant.numero_ticket.split('-').pop()}</p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/10">
               <i className="fas fa-certificate"></i> Pass Officiel
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 shrink-0">
            <img 
              src={qrUrl} 
              alt="Scan validation" 
              className="w-24 h-24" 
              loading="eager"
            />
          </div>
        </div>

        {/* Footer Slogan */}
        <div className="mt-10 pt-4 border-t border-slate-200 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">kaarange bi dall xel</p>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
