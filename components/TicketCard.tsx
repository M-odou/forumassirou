
import React from 'react';
import { Participant } from '../types';

interface TicketCardProps {
  participant: Participant;
}

const TicketCard: React.FC<TicketCardProps> = ({ participant }) => {
  const baseUrl = window.location.origin + window.location.pathname;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const validationUrl = `${cleanBase}/#/ticket/${participant.numero_ticket}`;
  
  // URL QR stable avec proxy CORS optionnel si besoin, mais qrserver supporte CORS par défaut
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(validationUrl)}&color=002157&bgcolor=ffffff&qzone=1&ecc=H`;

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      {/* Container de capture avec des dimensions fixes pour html-to-image */}
      <div 
        id="badge-capture" 
        className="relative bg-white w-full rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-visible"
        style={{ minHeight: '620px', width: '420px' }}
      >
        
        {/* EN-TÊTE BLEU */}
        <div className="relative h-44 bg-assirou-navy flex items-center px-8 rounded-t-[2.5rem] overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="relative z-10 w-full flex justify-between items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-assirou-gold rounded-lg flex items-center justify-center">
                   <i className="fas fa-shield-halved text-assirou-navy text-base"></i>
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-assirou-gold leading-none">Assirou</span>
                  <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-white leading-none">Sécurité</span>
                </div>
              </div>
              <h2 className="text-white text-base font-black uppercase tracking-tight leading-tight">
                Forum Métiers <br/><span className="text-assirou-gold">Sécurité 2026</span>
              </h2>
            </div>
            <div className="w-12 h-9 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800 rounded shadow-inner border border-white/20"></div>
          </div>
        </div>

        {/* CONTENU CENTRAL */}
        <div className="p-8 pt-10 flex-1 flex flex-col items-center text-center relative">
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-white px-4 py-1.5 rounded-full shadow-lg border border-slate-50 flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${participant.scan_valide ? 'bg-green-500' : 'bg-assirou-gold'} animate-pulse`}></div>
             <span className="text-[8px] font-black uppercase tracking-widest text-assirou-navy">{participant.participation}</span>
          </div>

          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Porteur de Pass Certifié</p>
          <h3 className="text-3xl font-black text-assirou-navy uppercase tracking-tighter leading-tight mb-2 px-4 break-words w-full">
            {participant.nom_complet}
          </h3>
          <p className="text-assirou-gold text-[10px] font-black uppercase tracking-widest mb-8">{participant.organisation_entreprise || 'Participation Individuelle'}</p>

          <div className="w-full flex items-center gap-3 mb-8">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Détails Access</span>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          <div className="grid grid-cols-2 gap-8 w-full mb-10">
            <div className="text-left">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">DATE</p>
              <p className="text-xs font-black text-assirou-navy uppercase">05 MARS 2026</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ZONE</p>
              <p className="text-xs font-black text-assirou-navy uppercase">THIAROYE / MER</p>
            </div>
          </div>

          {/* PIED DE PAGE AVEC QR CODE */}
          <div className="w-full flex items-end justify-between pt-8 border-t border-dashed border-slate-200 mt-auto">
            <div className="text-left space-y-4">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PASS ID</p>
                <p className="mono text-lg font-black text-assirou-navy bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                  {participant.numero_ticket.split('-').pop()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <i className={`fas ${participant.scan_valide ? 'fa-check-double text-green-500' : 'fa-certificate text-assirou-gold'} text-base`}></i>
                <span className={`text-[8px] font-black uppercase tracking-widest ${participant.scan_valide ? 'text-green-600' : 'text-assirou-navy'}`}>
                  {participant.scan_valide ? 'PASS VALIDÉ' : 'CERTIFIÉ ASSIROU'}
                </span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-100">
               <img 
                 src={qrUrl} 
                 alt="QR Code Validation" 
                 className="w-24 h-24 block" 
                 crossOrigin="anonymous" 
                 loading="eager"
               />
            </div>
          </div>
        </div>

        {/* BANDEAU BAS */}
        <div className="h-5 bg-assirou-navy rounded-b-[2.5rem] flex items-center justify-center relative overflow-hidden">
          <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.8em]">ASSIROU SÉCURITÉ • FORUM MÉTIERS 2026</p>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
