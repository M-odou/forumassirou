
import React from 'react';
import { Participant } from '../types';

interface TicketCardProps {
  participant: Participant;
}

const TicketCard: React.FC<TicketCardProps> = ({ participant }) => {
  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      {/* Badge Capture Container */}
      <div 
        id="badge-capture" 
        className="relative bg-white w-full rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        style={{ minHeight: '640px', width: '400px' }}
      >
        {/* TOP DECORATIVE BAR */}
        <div className="h-4 bg-assirou-gold w-full"></div>

        {/* HEADER SECTION */}
        <div className="bg-assirou-navy p-8 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A022_1px,transparent_1px)] [background-size:20px_20px]"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                 <span className="text-assirou-navy font-black text-lg tracking-tighter">AS</span>
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-assirou-gold leading-none">Assirou</span>
                <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-white leading-none">Sécurité</span>
              </div>
            </div>
            
            <div className="h-[1px] w-12 bg-assirou-gold/50 my-1"></div>
            
            <h2 className="text-white text-center">
              <span className="block text-xs font-medium uppercase tracking-[0.3em] opacity-80 mb-2 leading-none">Deuxième Forum</span>
              <span className="block text-lg font-black uppercase tracking-tighter leading-tight">Métiers de la <span className="text-assirou-gold">Sécurité Privée</span> au Sénégal</span>
            </h2>
          </div>
        </div>

        {/* MAIN IDENTITY SECTION */}
        <div className="px-8 pt-10 pb-6 flex-1 flex flex-col items-center text-center">
          {/* Type Badge */}
          <div className="bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-full mb-8 flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${participant.scan_valide ? 'bg-green-500' : 'bg-assirou-gold'} animate-pulse`}></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-assirou-navy">{participant.participation}</span>
          </div>

          {/* Participant Info */}
          <div className="mb-8 w-full">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Participant</p>
            <h3 className="text-3xl font-black text-assirou-navy uppercase tracking-tighter leading-tight break-words mb-2 px-2">
              {participant.nom_complet}
            </h3>
            <div className="flex items-center justify-center gap-2">
               <i className="fas fa-building text-[10px] text-assirou-gold"></i>
               <p className="text-assirou-navy/70 text-[11px] font-bold uppercase tracking-wide">
                 {participant.organisation_entreprise || 'Participation Individuelle'}
               </p>
            </div>
          </div>

          {/* Logistics Grid */}
          <div className="grid grid-cols-2 gap-px bg-slate-100 w-full rounded-2xl overflow-hidden border border-slate-100 mb-8">
            <div className="bg-white p-4 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date & Heure</p>
              <p className="text-[11px] font-black text-assirou-navy uppercase">05 MARS 2026<br/>10H - 16H</p>
            </div>
            <div className="bg-white p-4 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lieu</p>
              <p className="text-xs font-black text-assirou-navy uppercase">CSC Thiaroye</p>
            </div>
          </div>

          {/* REFERENCE SECTION */}
          <div className="mt-auto w-full pt-6 border-t border-dashed border-slate-200">
            {participant.avis_theme && (
              <div className="mb-4 px-4">
                 <p className="text-[8px] italic text-slate-400 line-clamp-2 text-center">"{participant.avis_theme}"</p>
              </div>
            )}
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 mb-1">
                <i className="fas fa-fingerprint text-assirou-gold text-xs"></i>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Référence Unique du Badge</p>
              </div>
              
              <div className="mono text-lg font-black text-assirou-navy bg-white px-6 py-3 rounded-xl border-2 border-slate-100 shadow-sm w-full text-center tracking-wider">
                {participant.numero_ticket}
              </div>

              <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg ${participant.scan_valide ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-assirou-gold/10 text-assirou-navy border border-assirou-gold/20'}`}>
                <i className={`fas ${participant.scan_valide ? 'fa-check-circle' : 'fa-shield-halved'} text-xs`}></i>
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {participant.scan_valide ? 'PASS VALIDÉ' : 'AUTHENTICITÉ GARANTIE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER INFO BAR */}
        <div className="bg-slate-50 py-3 px-8 flex justify-between items-center border-t border-slate-100">
           <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Certifié par Assirou Sécurité</span>
           <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-assirou-navy/20"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-assirou-navy/20"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-assirou-navy/20"></div>
           </div>
        </div>
      </div>
      
      {/* Visual background element behind the card */}
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-assirou-navy/5 blur-[120px] rounded-full"></div>
    </div>
  );
};

export default TicketCard;
