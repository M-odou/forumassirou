
import React from 'react';
import { Participant } from '../types';

interface TicketCardProps {
  participant: Participant;
}

const TicketCard: React.FC<TicketCardProps> = ({ participant }) => {
  const origin = window.location.origin + window.location.pathname;
  const validationUrl = `${origin.split('#')[0]}#/ticket/${participant.numero_ticket}`;
  
  // QR Code haute résolution avec correction d'erreur
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(validationUrl)}&color=002157&bgcolor=ffffff&qzone=1&ecc=H`;

  return (
    <div className="relative w-full max-w-[440px] mx-auto group">
      {/* Effet de lueur arrière */}
      <div className="absolute -inset-1 bg-gradient-to-r from-assirou-gold/20 via-assirou-navy/10 to-assirou-gold/20 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
      
      <div id="badge-capture" className="relative bg-white rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,33,87,0.4)] overflow-hidden border border-slate-100 flex flex-col transition-all duration-500 hover:translate-y-[-5px]">
        
        {/* HEADER : CARBON FIBRE + CHIP */}
        <div className="relative h-48 bg-assirou-navy flex items-center px-10 overflow-hidden">
          {/* Texture Carbone */}
          <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          {/* Effet Holographique Subtil */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          
          <div className="relative z-10 w-full flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-assirou-gold rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(197,160,34,0.4)]">
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

            {/* Visual Chip (Puce électronique) */}
            <div className="w-14 h-11 bg-gradient-to-br from-yellow-300 via-yellow-600 to-yellow-800 rounded-lg shadow-inner relative overflow-hidden border border-white/20">
               <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                 {[...Array(9)].map((_, i) => <div key={i} className="border border-black/20"></div>)}
               </div>
               <div className="absolute inset-2 border-l border-t border-black/10 rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* BODY : INFOS DU TITULAIRE */}
        <div className="p-10 pt-12 relative">
          {/* Badge Catégorie Flottant */}
          <div className="absolute top-0 right-10 -translate-y-1/2 bg-white px-6 py-2 rounded-full shadow-lg border border-slate-50 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-assirou-navy">{participant.participation}</span>
          </div>

          <div className="mb-10 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4">Détenteur Autorisé</p>
            <h3 className="text-4xl font-black text-assirou-navy uppercase tracking-tighter leading-none mb-2 break-words">
              {participant.nom_complet}
            </h3>
            <p className="text-assirou-gold text-xs font-black uppercase tracking-widest">{participant.organisation_entreprise || 'Participant Individuel'}</p>
            <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">{participant.fonction || 'Visiteur'}</p>
          </div>

          {/* SÉPARATION TECHNIQUE */}
          <div className="flex items-center gap-4 mb-10">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-slate-100"></div>
            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Détails Access</div>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-slate-100"></div>
          </div>

          {/* GRID DETAILS */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Session</p>
              <p className="text-sm font-black text-assirou-navy uppercase">05 MARS 2026</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">10:00 — 16:00 GMT</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Zone</p>
              <p className="text-sm font-black text-assirou-navy uppercase">CSC THIAROYE</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SUR MER, SÉNÉGAL</p>
            </div>
          </div>

          {/* FOOTER : QR CODE + SERIAL */}
          <div className="flex items-end justify-between gap-6 pt-10 border-t-2 border-dashed border-slate-100">
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass ID</p>
                <p className="mono text-xl font-black text-assirou-navy bg-slate-50 px-4 py-1 rounded-xl border border-slate-100">{participant.numero_ticket.split('-').pop()}</p>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-green-500 text-lg"></i>
                <div className="leading-none">
                  <span className="block text-[8px] font-black uppercase tracking-widest text-assirou-navy">Identité Vérifiée</span>
                  <span className="block text-[7px] font-bold text-slate-400 uppercase">Système Assirou 2.0</span>
                </div>
              </div>
            </div>

            <div className="relative group/qr">
              <div className="absolute inset-0 bg-assirou-navy opacity-0 group-hover/qr:opacity-5 transition-opacity rounded-2xl"></div>
              <div className="bg-white p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,33,87,0.1)] border border-slate-100">
                <img src={qrUrl} alt="Validation QR" className="w-24 h-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Bande de Sécurité Magnétique à l'arrière / effet visuel */}
        <div className="h-6 bg-assirou-navy flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <p className="relative z-10 text-[8px] font-black text-white/40 uppercase tracking-[1.5em] ml-4">CONFIDENTIEL • SÉCURITÉ PRIVÉE • CONFIDENTIEL</p>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-assirou-gold/80 skew-x-[30deg] translate-x-12"></div>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
