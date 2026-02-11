
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
      // ticketId peut être encodé ou faire partie d'une URL, storage.ts s'en occupe
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
      await new Promise(r => setTimeout(r, 800));
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        skipFonts: false,
      });
      const imgWidth = ticketRef.current.offsetWidth;
      const imgHeight = ticketRef.current.offsetHeight;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Badge_2026_${participant.nom_complet.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erreur PDF:', err);
      alert("Erreur de génération.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#00153a]">
        <div className="text-center animate-pulse">
          <i className="fas fa-id-card text-5xl text-assirou-gold mb-4"></i>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Validation en cours...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#00153a] text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-xs">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-6"></i>
          <h2 className="text-xl font-black text-navy uppercase mb-2">Badge Inexistant</h2>
          <p className="text-slate-400 text-xs mb-8">Ce ticket est introuvable ou a été désactivé.</p>
          <Link to="/" className="inline-block w-full bg-navy text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Retour</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      
      {/* Badge container */}
      <div className="relative animate-in zoom-in-95 duration-500" ref={ticketRef}>
        {/* Validation Overlay (Uniquement visible au scan/validation) */}
        <div className="absolute -top-4 -right-4 z-30 bg-green-500 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 border-2 border-white no-print">
          <i className="fas fa-check-circle"></i> Valide
        </div>
        
        <TicketCard participant={participant} />
      </div>

      {/* Simple actions below the badge */}
      <div className="mt-8 flex gap-3 w-full max-w-[400px] no-print">
        <button 
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 bg-white text-navy border-2 border-navy/5 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
          <span className="uppercase tracking-widest text-[9px]">Enregistrer</span>
        </button>
        
        <button 
          onClick={() => window.print()}
          className="flex-1 bg-navy text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl"
        >
          <i className="fas fa-print"></i>
          <span className="uppercase tracking-widest text-[9px]">Imprimer</span>
        </button>
      </div>

      <div className="mt-12 text-center opacity-30 no-print">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">Assirou Sécurité • 2026</p>
      </div>
    </div>
  );
};

export default TicketView;
