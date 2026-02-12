
import React from 'react';
import { Participant } from '../types';

interface TicketCardProps {
  participant: Participant;
}

const TicketCard: React.FC<TicketCardProps> = ({ participant }) => {
  const baseUrl = window.location.origin + window.location.pathname;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const validationUrl = `${cleanBase}/#/ticket/${participant.numero_ticket}`;
  
  // Utilisation de qrserver.com avec crossOrigin pour html-to-image
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(validationUrl)}&color=002157&bgcolor=ffffff&qzone=1&ecc=H`;

  return (
    <div className="relative w-full max-w-[440px] mx-auto group">
      {/* Background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-assirou-gold/20 via-assirou-navy/10 to-assirou-gold/20 rounded-[3rem] blur-xl opacity-50"></div>
      
      {/* Container de capture forcé sans overflow-hidden pour éviter les coupures */}
      <div id="badge-capture" className="relative bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col transition-all duration-500 overflow-visible min-h-[600px]">
        
        {/* HEADER */}
        <div className="relative h-48 bg-assirou-navy flex items-center px-10 rounded-t-[3rem] overflow-hidden">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="relative z-10 w-full flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-assirou-gold rounded-xl flex items-center justify-center shadow-lg">
                   <i className="fas fa-shield-halved text-assirou-navy text-lg"></i>
                </div>
                <div className="leading-none">
                  <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-assirou-gold">Assirou</span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-white">Sécurité</span>
                </div>
              </div>
              <h2 className="text-white text-lg font-black leading-tight uppercase tracking-tighter max-w-[200px]">
                Forum Métiers <br/><span className="text-assirou-gold">Sécurité 2026</span>
              </h2>
            </div>
            <div className="w-14 h-11 bg-gradient-to-br from-yellow-300 via-yellow-600 to-yellow-800 rounded-lg shadow-inner relative border border-white/20">
               <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                 {[...Array(9)].map((_, i) => <div key={i} className="border border-black/20"></div>)}
               </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-10 pt-12 relative flex-1">
          <div className="absolute top-0 right-10 -translate-y-1/2 bg-white px-6 py-2 rounded-full shadow-lg border border-slate-50 flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${participant.scan_valide ? 'bg-green-500' : 'bg-assirou-gold'} animate-pulse`}></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-assirou-navy">{participant.participation}</span>
          </div>

          <div className="mb-10 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4">Porteur Officiel</p>
            <h3 className="text-4xl font-black text-assirou-navy uppercase tracking-tighter leading-none mb-2 break-words">
              {participant.nom_complet}
            </h3>
            <p className="text-assirou-gold text-xs font-black uppercase tracking-widest">{participant.organisation_entreprise || 'Participant individuel'}</p>
          </div>

          <div className="flex items-center gap-4 mb-10">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-slate-100"></div>
            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Détails Access</div>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-slate-100"></div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Session</p>
              <p className="text-sm font-black text-assirou-navy uppercase">05 MARS 2026</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Zone</p>
              <p className="text-sm font-black text-assirou-navy uppercase">THIAROYE / MER</p>
            </div>
          </div>

          {/* FOOTER AVEC QR CODE */}
          <div className="flex items-end justify-between gap-6 pt-10 border-t-2 border-dashed border-slate-100">
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass ID</p>
                <p className="mono text-xl font-black text-assirou-navy bg-slate-50 px-4 py-1 rounded-xl border border-slate-100">{participant.numero_ticket.split('-').pop()}</p>
              </div>
              <div className="flex items-center gap-2">
                <i className={`fas ${participant.scan_valide ? 'fa-check-double text-green-500' : 'fa-check-circle text-slate-200'} text-lg`}></i>
                <span className={`text-[8px] font-black uppercase tracking-widest ${participant.scan_valide ? 'text-green-600' : 'text-assirou-navy'}`}>
                  {participant.scan_valide ? 'PASS VALIDÉ PAR ASSIROU' : 'IDENTITÉ CERTIFIÉE'}
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100">
               <img 
                src={qrUrl} 
                alt="QR Code" 
                className="w-28 h-28 block" 
                crossOrigin="anonymous" 
                loading="eager"
               />
            </div>
          </div>
        </div>

        <div className="h-6 bg-assirou-navy rounded-b-[3rem] flex items-center justify-center relative overflow-hidden">
          <p className="relative z-10 text-[8px] font-black text-white/40 uppercase tracking-[1em]">ASSIROU SÉCURITÉ • KAARANGE BI</p>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
