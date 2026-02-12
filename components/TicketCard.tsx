
import React from 'react';
import { Participant } from '../types';
import Barcode from 'react-barcode';

interface TicketCardProps {
  participant: Participant;
}

const TicketCard: React.FC<TicketCardProps> = ({ participant }) => {
  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      {/* Badge Capture Container */}
      <div 
        id="badge-capture" 
        className="relative bg-white w-full rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        style={{ minHeight: '700px', width: '400px' }}
      >
        {/* TOP DECORATIVE BAR */}
        <div className="h-4 bg-assirou-gold w-full"></div>

        {/* HEADER SECTION */}
        <div className="bg-assirou-navy p-8 relative overflow-hidden">
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
          <div className="bg-slate-50 border border-slate-100 px-5 py-2 rounded-full mb-8 flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${participant.scan_valide ? 'bg-green-500' : 'bg-assirou-gold'} animate-pulse`}></div>
             <span className="text-[11px] font-black uppercase tracking-widest text-assirou-navy">{participant.participation}</span>
          </div>

          {/* Participant Info */}
          <div className="mb-10 w-full">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Participant</p>
            <h3 className="text-3xl font-black text-assirou-navy uppercase tracking-tighter leading-tight break-words mb-2 px-2">
              {participant.nom_complet}
            </h3>
            <div className="flex items-center justify-center gap-2">
               <i className="fas fa-building text-xs text-assirou-gold"></i>
               <p className="text-assirou-navy/70 text-xs font-bold uppercase tracking-wide">
                 {participant.organisation_entreprise || 'Participation Individuelle'}
               </p>
            </div>
          </div>

          {/* Logistics Grid */}
          <div className="grid grid-cols-2 gap-px bg-slate-100 w-full rounded-2xl overflow-hidden border border-slate-100 mb-10 shadow-sm">
            <div className="bg-white p-5 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date & Heure</p>
              <p className="text-xs font-black text-assirou-navy uppercase">05 MARS 2026<br/>10H - 16H</p>
            </div>
            <div className="bg-white p-5 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lieu</p>
              <p className="text-xs font-black text-assirou-navy uppercase">CSC Thiaroye</p>
            </div>
          </div>

          {/* REFERENCE & BARCODE SECTION (AT THE BOTTOM) */}
          <div className="mt-auto w-full pt-6 border-t border-dashed border-slate-200">
            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <i className="fas fa-fingerprint text-assirou-gold text-xs"></i>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Pass Officiel</p>
              </div>
              
              <div className="w-full flex justify-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <Barcode 
                  value={participant.numero_ticket} 
                  width={1.5} 
                  height={50} 
                  fontSize={12}
                  font="JetBrains Mono"
                  background="transparent"
                  margin={0}
                />
              </div>

              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl ${participant.scan_valide ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-assirou-gold/10 text-assirou-navy border border-assirou-gold/20'}`}>
                <i className={`fas ${participant.scan_valide ? 'fa-check-circle' : 'fa-shield-halved'} text-[10px]`}></i>
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {participant.scan_valide ? 'PASS VALIDÉ' : 'AUTHENTICITÉ GARANTIE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER INFO BAR */}
        <div className="bg-slate-50 py-4 px-8 flex justify-between items-center border-t border-slate-100">
           <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Certifié par Assirou Sécurité</span>
           <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-assirou-navy/20"></div>
              <div className="w-2 h-2 rounded-full bg-assirou-navy/20"></div>
              <div className="w-2 h-2 rounded-full bg-assirou-navy/20"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
