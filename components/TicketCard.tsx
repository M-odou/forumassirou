
import React from 'react';
import { Participant } from '../types';

interface TicketCardProps {
  participant: Participant;
}

const TicketCard: React.FC<TicketCardProps> = ({ participant }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${participant.numero_ticket}&color=002157`;

  return (
    <div className="relative w-full max-w-[400px] mx-auto overflow-hidden rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,33,87,0.3)] bg-white text-assirou-navy border border-slate-100">
      
      {/* Top Section - Assirou Navy */}
      <div className="bg-assirou-navy text-white p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-assirou-gold opacity-10 blur-3xl -mr-20 -mt-20 rounded-full"></div>
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-shield-cat text-assirou-gold"></i>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-assirou-gold">Assirou Sécurité</span>
          </div>
          
          <h2 className="text-[14px] md:text-[16px] font-black leading-tight uppercase tracking-tight text-white border-l-4 border-assirou-gold pl-4 py-1">
            DEUXIÈME FORUM SUR LES MÉTIERS DE LA SÉCURITÉ PRIVÉE AU SÉNÉGAL
          </h2>
          <p className="text-[8px] font-bold text-assirou-gold/80 uppercase tracking-widest -mt-2">
            LA SÉCURITÉ PRIVÉE DANS LES GRANDS ÉVÉNEMENTS SPORTIFS ET CULTURELS
          </p>
          
          <div className="mt-4">
            <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-1">Pass Officiel</p>
            <h3 className="text-2xl font-black text-white truncate">{participant.nom_complet}</h3>
            <p className="text-assirou-gold text-[10px] font-bold uppercase tracking-wider">{participant.organisation_entreprise || 'Participant individuel'}</p>
          </div>
        </div>
        
        <div className="absolute top-10 right-8 bg-assirou-gold text-assirou-navy px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg rotate-12">
          2026
        </div>
      </div>

      {/* Decorative Cutout */}
      <div className="relative flex items-center h-12 bg-slate-50">
        <div className="absolute -left-6 w-12 h-12 bg-slate-50 border-r-2 border-slate-100 rounded-full"></div>
        <div className="flex-1 border-t-4 border-dotted border-slate-200 mx-10"></div>
        <div className="absolute -right-6 w-12 h-12 bg-slate-50 border-l-2 border-slate-100 rounded-full"></div>
      </div>

      {/* Info Section - White/Slate */}
      <div className="px-10 pb-10 pt-4 bg-slate-50">
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Date & Heure</p>
            <p className="text-[11px] font-black text-assirou-navy uppercase">05 Mars 2026</p>
            <p className="text-[10px] font-bold text-assirou-gold">12h00 - 17h00</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Lieu</p>
            <p className="text-[10px] font-black text-assirou-navy uppercase leading-tight">CSC Thiaroye<br/>sur Mer</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-8">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">ID Ticket</p>
              <p className="text-xl font-black text-assirou-navy mono tracking-tighter">{participant.numero_ticket.split('-').pop()}</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-assirou-gold/10 border border-assirou-gold/20 rounded-full">
               <div className="w-1.5 h-1.5 rounded-full bg-assirou-gold animate-pulse"></div>
               <span className="text-[8px] font-black text-assirou-gold uppercase tracking-widest">Inscrit</span>
            </div>
          </div>
          
          <div className="p-3 bg-white rounded-3xl shadow-inner border border-slate-200">
            <img src={qrUrl} alt="QR Code" className="w-20 h-20 grayscale brightness-90" />
          </div>
        </div>

        <p className="mt-10 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Valide pour 1 Personne
        </p>
      </div>
    </div>
  );
};

export default TicketCard;
