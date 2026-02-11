
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getParticipantByTicket } from '../utils/storage';
import { Participant } from '../types';
import TicketCard from './TicketCard';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

const TicketView: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadParticipant = async () => {
      if (!ticketId) return;
      setLoading(true);
      const found = await getParticipantByTicket(ticketId);
      setParticipant(found);
      setLoading(false);
    };
    loadParticipant();
  }, [ticketId]);

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || !participant) return;
    
    setDownloading(true);
    try {
      // 1. Capture le ticket en PNG haute résolution
      // On utilise un pixelRatio de 2 ou 3 pour garantir la netteté sur le PDF
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      // 2. Calcul des dimensions
      const imgWidth = ticketRef.current.offsetWidth;
      const imgHeight = ticketRef.current.offsetHeight;
      
      // 3. Création du PDF (format personnalisé basé sur la taille du ticket)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // 4. Téléchargement
      const fileName = `Ticket_Forum_2026_${participant.nom_complet.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      console.error('Erreur PDF:', err);
      alert("Une erreur est survenue lors de la création du PDF. Essayez l'option Imprimer.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-assirou-navy">
        <div className="text-center space-y-4">
          <i className="fas fa-shield-cat fa-bounce text-4xl text-assirou-gold"></i>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Chargement de votre accès...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-assirou-navy">
        <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10 max-w-sm">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Accès introuvable</h2>
          <p className="text-slate-400 mb-8 text-sm">Ce numéro de ticket n'est pas répertorié dans notre base.</p>
          <Link to="/" className="inline-flex items-center gap-3 bg-assirou-gold text-assirou-navy px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
            <i className="fas fa-arrow-left"></i> Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 flex flex-col items-center bg-slate-50">
      
      {/* Statut de confirmation */}
      <div className="no-print mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/20 border-4 border-white">
           <i className="fas fa-check text-3xl"></i>
        </div>
        <h1 className="text-3xl font-black text-assirou-navy uppercase tracking-tighter mb-2">Inscription Confirmée</h1>
        <p className="text-slate-500 font-bold text-sm max-w-xs mx-auto">Votre badge électronique est prêt. Téléchargez le PDF pour le présenter le jour J.</p>
      </div>

      {/* Zone du Ticket (Celle qui sera capturée) */}
      <div className="relative animate-in zoom-in-95 duration-700" ref={ticketRef}>
        <div className="absolute -inset-20 bg-assirou-gold/5 blur-[120px] rounded-full opacity-50 no-print"></div>
        <TicketCard participant={participant} />
      </div>

      {/* Boutons d'action */}
      <div className="no-print mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button 
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 bg-assirou-gold text-assirou-navy px-8 py-5 rounded-2xl font-black shadow-2xl shadow-gold-500/30 transition-all flex items-center justify-center gap-3 transform hover:translate-y-[-4px] active:scale-95 disabled:opacity-50"
        >
          {downloading ? (
            <i className="fas fa-circle-notch fa-spin text-xl"></i>
          ) : (
            <i className="fas fa-file-pdf text-xl"></i>
          )}
          <span className="uppercase tracking-widest text-[11px]">Télécharger PDF</span>
        </button>
        
        <button 
          onClick={() => window.print()}
          className="flex-1 bg-assirou-navy text-white px-8 py-5 rounded-2xl font-black shadow-2xl shadow-navy-900/30 transition-all flex items-center justify-center gap-3 transform hover:translate-y-[-4px] active:scale-95"
        >
          <i className="fas fa-print text-xl"></i>
          <span className="uppercase tracking-widest text-[11px]">Imprimer</span>
        </button>
      </div>

      <div className="no-print mt-16 flex flex-col items-center gap-8">
        <Link to="/" className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px] hover:text-assirou-navy transition-all flex items-center gap-3">
          <i className="fas fa-plus-circle text-assirou-gold"></i> Nouvelle Inscription
        </Link>
        
        <div className="p-8 bg-white border border-slate-100 rounded-[2rem] max-w-sm shadow-xl shadow-slate-200/50">
           <div className="flex gap-4 items-start">
             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <i className="fas fa-envelope text-blue-500 text-sm"></i>
             </div>
             <div>
               <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                 Une copie de ce badge a été envoyée à :<br/>
                 <strong className="text-assirou-navy">{participant.adresse_email}</strong>
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
