
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getParticipantByTicket, validateTicket, isScanSystemActive } from '../utils/storage';
import { Participant } from '../types';
import TicketCard from './TicketCard';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

const TicketView: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [justValidated, setJustValidated] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!ticketId) return;
      setLoading(true);
      
      const found = await getParticipantByTicket(ticketId);
      
      if (found) {
        setParticipant(found);
        
        // AUTO-VALIDATION SI LE SYSTÈME EST ACTIF
        if (!found.scan_valide) {
          const scanActive = await isScanSystemActive();
          if (scanActive) {
            const success = await validateTicket(found.id);
            if (success) {
              setJustValidated(true);
              const updated = await getParticipantByTicket(ticketId);
              setParticipant(updated);
            }
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [ticketId]);

  const handleDownloadImage = async () => {
    const node = document.getElementById('badge-capture');
    if (!node) return;
    setDownloading(true);
    
    // Attente forcée pour le rendu du QR Code (CORS)
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const dataUrl = await toPng(node, { 
        quality: 1, 
        pixelRatio: 4, 
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `pass-assirou-${participant?.numero_ticket}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur capture:", err);
      alert("Erreur de capture. Veuillez patienter que le QR code s'affiche.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const node = document.getElementById('badge-capture');
    if (!node) return;
    setDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      const dataUrl = await toPng(node, { quality: 1, pixelRatio: 2, cacheBust: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`pass-officiel-${participant?.numero_ticket}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-assirou-navy">
        <div className="text-center">
          <i className="fas fa-shield-halved text-5xl text-assirou-gold animate-bounce mb-6"></i>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.5em]">Analyse du Pass...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5F5] p-6">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-red-100 max-w-lg w-full text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-8"><i className="fas fa-times text-4xl"></i></div>
          <h2 className="text-5xl font-black text-red-900 uppercase tracking-tighter mb-4 leading-none">PASS INVALIDE</h2>
          <p className="text-red-700/60 font-medium mb-12 italic">Ce ticket est introuvable ou a été annulé par le service de sécurité.</p>
          <Link to="/" className="w-full py-6 bg-red-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-20 relative font-sans overflow-x-hidden">
      
      {/* OVERLAY DE VALIDATION FLASH */}
      {(participant.scan_valide || justValidated) && (
        <div className="w-full max-w-5xl mb-12 animate-in slide-in-from-top duration-700">
           <div className="bg-green-600 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(22,163,74,0.3)] border-4 border-white/20">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-green-600 shadow-xl">
                    <i className="fas fa-check-double text-4xl"></i>
                 </div>
                 <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">PASS VALIDE</h2>
                    <p className="text-green-100 font-bold uppercase text-[10px] tracking-widest mt-1">Accès autorisé au forum métiers de la sécurité</p>
                 </div>
              </div>
              <div className="bg-white/10 px-8 py-4 rounded-3xl border border-white/20 text-center md:text-right">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Heure du Scan</p>
                 <p className="text-xl font-black">{new Date(participant.date_validation!).toLocaleTimeString()}</p>
                 <p className="text-[10px] font-bold opacity-80">{new Date(participant.date_validation!).toLocaleDateString()}</p>
              </div>
           </div>
        </div>
      )}

      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-16 gap-8 relative z-10">
        <div className="text-center md:text-left">
           <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <span className={`w-3 h-3 rounded-full ${participant.scan_valide ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-assirou-gold'}`}></span>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${participant.scan_valide ? 'text-green-600' : 'text-assirou-gold'}`}>
                {participant.scan_valide ? 'BADGE DÉJÀ VALIDÉ' : 'BADGE AUTHENTIFIÉ'}
              </span>
           </div>
           <h1 className="text-5xl font-black text-assirou-navy uppercase tracking-tighter leading-none">
             VOTRE PASS OFFICIEL
           </h1>
           <p className="text-slate-400 font-medium italic mt-2">Certifié par le service de sécurité Assirou 2.0</p>
        </div>
        <div className="flex gap-4 no-print shrink-0">
          <button onClick={handleDownloadImage} disabled={downloading} className="px-8 py-5 bg-white border border-slate-200 text-assirou-navy rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm active:scale-95">
            {downloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>} TÉLÉCHARGER IMAGE
          </button>
          <button onClick={handleDownloadPDF} disabled={downloading} className="px-8 py-5 bg-assirou-navy text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-assirou-gold transition-all flex items-center gap-3 shadow-xl active:scale-95">
            {downloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>} FORMAT PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start w-full max-w-6xl relative z-10">
        
        {/* LE BADGE */}
        <div className="flex justify-center animate-in zoom-in duration-700">
           <TicketCard participant={participant} />
        </div>

        {/* DETAILS DROITE */}
        <div className="space-y-8 animate-in fade-in slide-in-from-right-12 duration-700">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
            <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.8em] mb-10">Détenteur Autorisé</p>
            <h2 className="text-5xl font-black text-assirou-navy uppercase tracking-tighter leading-none mb-4">
               {participant.nom_complet}
            </h2>
            <p className="text-assirou-gold font-black uppercase text-xs tracking-widest mb-10">{participant.organisation_entreprise || 'Participant individuel'}</p>
            
            <div className="space-y-4 pt-10 border-t border-slate-50">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID RÉFÉRENCE</span>
                  <span className="mono font-black text-assirou-navy text-lg">{participant.numero_ticket}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TYPE ACCÈS</span>
                  <span className="bg-assirou-navy text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">{participant.participation}</span>
               </div>
            </div>
          </div>

          <div className="bg-assirou-navy p-10 rounded-[3rem] text-white flex items-center gap-8 shadow-2xl relative">
             <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/10">
                <i className={`fas ${participant.scan_valide ? 'fa-check-double text-green-400' : 'fa-qrcode text-assirou-gold'} text-4xl`}></i>
             </div>
             <div>
                <h4 className="font-black text-xl uppercase tracking-tight mb-2">Instructions</h4>
                <p className="text-xs text-white/50 leading-relaxed font-medium">
                  {participant.scan_valide 
                    ? "Votre accès a été certifié. Bienvenue parmi nous."
                    : "Veuillez présenter ce badge numérique (ou imprimé) lors du contrôle à l'entrée du CSC Thiaroye sur Mer."}
                </p>
             </div>
          </div>
          
          <div className="text-center pt-10">
             <Link to="/" className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-assirou-navy transition-all flex items-center justify-center gap-4 group">
               <i className="fas fa-arrow-left group-hover:-translate-x-2 transition-transform"></i> RETOUR PORTAIL
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketView;
