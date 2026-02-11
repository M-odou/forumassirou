
import React from 'react';
import { Participant } from '../types';

interface TicketCardProps {
  participant: Participant;
}

const TicketCard: React.FC<TicketCardProps> = ({ participant }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${participant.numero_ticket}&color=002157`;

  return (
    <div className="relative w-full max-w-[380px] mx-auto overflow-hidden rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,33,87,0.3)] bg-white text-assirou-navy border border-slate-100">
      
      {/* Top Section - Assirou Navy */}
      <div className="bg-assirou-navy text-white p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-assirou-gold opacity-10 blur-3xl -mr-20 -mt-20 rounded-full"></div>
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-shield-cat text-assirou-gold"></i>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-assirou-gold">Assirou Sécurité</span>
            </div>
            <h2 className="text-xl font-black leading-tight uppercase">Forum Métiers<br/><span className="text-assirou-gold">Sécurité 2026</span></h2>
          </div>
          <div className="bg-assirou-gold text-assirou-navy px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
            PASS
          </div>
        </div>

        <div className="relative z-10 pt-4">
          <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-1">Détenteur du Pass</p>
          <h3 className="text-2xl font-black truncate">{participant.nom_complet}</h3>
          <p className="text-assirou-gold text-[10px] font-bold uppercase tracking-wider mt-1 opacity-80">{participant.organisation_entreprise}</p>
        </div>
      </div>

      {/* Decorative Cutout */}
      <div className="relative flex items-center h-10 bg-slate-50">
        <div className="absolute -left-5 w-10 h-10 bg-slate-50 border-r-2 border-slate-100 rounded-full"></div>
        <div className="flex-1 border-t-4 border-dotted border-slate-200 mx-8"></div>
        <div className="absolute -right-5 w-10 h-10 bg-slate-50 border-l-2 border-slate-100 rounded-full"></div>
      </div>

      {/* Info Section - White/Slate */}
      <div className="px-10 pb-10 pt-4 bg-slate-50">
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Date</p>
            <p className="text-sm font-black text-assirou-navy uppercase">05 Mars 2026</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Lieu</p>
            <p className="text-[10px] font-black text-assirou-navy uppercase leading-tight">CSC Thiaroye<br/>sur Mer</p>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-slate-200 pt-8">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">ID Ticket</p>
              <p className="text-xl font-black text-assirou-navy mono tracking-tighter">{participant.numero_ticket.split('-').pop()}</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-assirou-gold/10 border border-assirou-gold/20 rounded-full">
               <div className="w-1.5 h-1.5 rounded-full bg-assirou-gold animate-pulse"></div>
               <span className="text-[8px] font-black text-assirou-gold uppercase tracking-widest">Inscrit & Validé</span>
            </div>
          </div>
          
          <div className="p-2.5 bg-white rounded-2xl shadow-inner border border-slate-200">
            <img src={qrUrl} alt="Accreditation QR" className="w-20 h-20 grayscale brightness-90" />
          </div>
        </div>

        <p className="mt-10 text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic">
          Ticket personnel – À présenter à l'entrée
        </p>
      </div>
    </div>
  );
};

export default TicketCard;
