
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getParticipantByTicket } from '../utils/storage';
import { Participant } from '../types';
import TicketCard from './TicketCard';
import { toPng } from 'html-to-image';

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

  const handleDownload = async () => {
    if (!ticketRef.current || !participant) return;
    
    setDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        pixelRatio: 2, // Pour une meilleure qualité
      });
      
      const link = document.createElement('a');
      link.download = `Ticket-Forum2026-${participant.nom_complet.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur de téléchargement:', err);
      alert("Le téléchargement direct a échoué. Veuillez utiliser l'option Imprimer.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-assirou-navy">
        <div className="text-center space-y-4">
          <i className="fas fa-shield-cat fa-bounce text-4xl text-assirou-gold"></i>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Chargement du badge...</p>
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
          <h2 className="text-xl font-black text-white mb-2 uppercase">Identifiant Invalide</h2>
          <p className="text-slate-400 mb-8 text-sm">Ce ticket n'existe pas ou a été supprimé.</p>
          <Link to="/" className="inline-flex items-center gap-3 bg-assirou-gold text-assirou-navy px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
            <i className="fas fa-home"></i> Accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 flex flex-col items-center bg-slate-50">
      
      {/* Header Info */}
      <div className="no-print mb-12 text-center max-w-lg">
        <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20">
           <i className="fas fa-check text-2xl"></i>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-assirou-navy uppercase tracking-tight mb-2">Accréditation Validée</h1>
        <p className="text-slate-500 font-bold text-sm">Présentez ce badge à l'entrée du Forum le 05 Mars.</p>
      </div>

      {/* Ticket Container */}
      <div className="relative animate-in zoom-in-95 duration-700 ticket-container" ref={ticketRef}>
        <div className="absolute -inset-10 bg-assirou-gold/5 blur-[100px] rounded-full opacity-50 no-print"></div>
        <TicketCard participant={participant} />
      </div>

      {/* Actions */}
      <div className="no-print mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 bg-assirou-gold text-assirou-navy px-8 py-5 rounded-2xl font-black shadow-xl shadow-gold-500/20 transition-all flex items-center justify-center gap-3 transform hover:translate-y-[-2px] active:scale-95 disabled:opacity-50"
        >
          {downloading ? (
            <i className="fas fa-circle-notch fa-spin"></i>
          ) : (
            <i className="fas fa-image"></i>
          )}
          Télécharger Badge
        </button>
        
        <button 
          onClick={() => window.print()}
          className="flex-1 bg-assirou-navy text-white px-8 py-5 rounded-2xl font-black shadow-xl shadow-navy-900/20 transition-all flex items-center justify-center gap-3 transform hover:translate-y-[-2px] active:scale-95"
        >
          <i className="fas fa-print"></i> Imprimer PDF
        </button>
      </div>

      <div className="no-print mt-12 flex flex-col items-center gap-6">
        <Link to="/" className="text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-assirou-navy transition-all flex items-center gap-2">
          <i className="fas fa-plus-circle"></i> Ajouter un autre participant
        </Link>
        <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl max-w-sm">
           <p className="text-[10px] text-blue-600 font-bold text-center leading-relaxed">
             <i className="fas fa-info-circle mr-2"></i> Un e-mail de confirmation contenant votre badge a également été envoyé à l'adresse <strong>{participant.adresse_email}</strong>.
           </p>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
