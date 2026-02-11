
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
      alert("Erreur de génération. Utilisez l'option Imprimer.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-assirou-navy text-white">
        <div className="text-center">
          <i className="fas fa-shield-halved fa-spin text-4xl text-assirou-gold mb-4"></i>
          <p className="text-[10px] font-black uppercase tracking-widest">Vérification du Badge...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-assirou-navy">
        <div className="bg-white p-12 rounded-[3rem] text-center max-w-sm">
          <i className="fas fa-circle-xmark text-5xl text-red-500 mb-6"></i>
          <h2 className="text-xl font-black text-assirou-navy uppercase mb-2 tracking-tight">Badge Inexistant</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">Ce ticket n'est plus valide ou a été supprimé.</p>
          <Link to="/" className="inline-block bg-assirou-gold text-assirou-navy px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Retour Accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center bg-slate-50">
      
      {/* AFFICHAGE DE VALIDATION IMPÉRATIF (VISIBLE AU SCAN) */}
      <div className="w-full max-w-md mb-8 animate-in slide-in-from-top duration-700">
        <div className="bg-green-600 text-white rounded-[2rem] p-6 shadow-2xl flex items-center gap-6 border-4 border-white">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0">
            <i className="fas fa-check text-green-600 text-3xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Badge Valide</h2>
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest mt-1">Accès autorisé - Forum 2026</p>
          </div>
        </div>
      </div>

      <div className="relative animate-in zoom-in-95 duration-500" ref={ticketRef}>
        <div className="absolute -inset-10 bg-assirou-gold/10 blur-[80px] rounded-full no-print"></div>
        <TicketCard participant={participant} />
      </div>

      <div className="no-print mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-[400px]">
        <button 
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 bg-assirou-gold text-assirou-navy px-6 py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
          <span className="uppercase tracking-widest text-[10px]">Télécharger</span>
        </button>
        
        <button 
          onClick={() => window.print()}
          className="flex-1 bg-assirou-navy text-white px-6 py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2"
        >
          <i className="fas fa-print"></i>
          <span className="uppercase tracking-widest text-[10px]">Imprimer</span>
        </button>
      </div>

      <div className="no-print mt-12 text-center opacity-40">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-assirou-navy">Assirou Sécurité • Systèmes de contrôle 2026</p>
      </div>
    </div>
  );
};

export default TicketView;
