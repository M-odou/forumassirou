
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
      // Un court délai permet au QR Code de se charger complètement
      await new Promise(r => setTimeout(r, 800));

      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        // On évite d'inclure les polices distantes si elles causent des erreurs CORS
        // car elles sont déjà rendues par le navigateur dans le DOM cloné
        skipFonts: false, 
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const imgWidth = ticketRef.current.offsetWidth;
      const imgHeight = ticketRef.current.offsetHeight;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      const fileName = `Badge_Forum_2026_${participant.nom_complet.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      console.error('Erreur technique PDF (CORS/Network):', err);
      alert("Le badge ne peut pas être généré automatiquement à cause de restrictions de sécurité de votre navigateur. Veuillez utiliser l'option 'Imprimer' et choisir 'Enregistrer au format PDF'.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-assirou-navy">
        <div className="text-center space-y-4">
          <i className="fas fa-shield-cat fa-bounce text-4xl text-assirou-gold"></i>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Validation du badge...</p>
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
          <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Badge Invalide</h2>
          <p className="text-slate-400 mb-8 text-sm">Ce badge n'existe pas ou a été supprimé.</p>
          <Link to="/" className="bg-assirou-gold text-assirou-navy px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]">
            Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 flex flex-col items-center bg-slate-50">
      
      <div className="no-print mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white">
           <i className="fas fa-check text-3xl"></i>
        </div>
        <h1 className="text-3xl font-black text-assirou-navy uppercase tracking-tighter mb-2">Accès Autorisé</h1>
        <p className="text-slate-500 font-bold text-sm">Badge validé pour le Forum Sécurité 2026 (10h-16h).</p>
      </div>

      <div className="relative animate-in zoom-in-95 duration-700" ref={ticketRef}>
        <div className="absolute -inset-20 bg-assirou-gold/5 blur-[120px] rounded-full opacity-50 no-print"></div>
        <TicketCard participant={participant} />
      </div>

      <div className="no-print mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button 
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 bg-assirou-gold text-assirou-navy px-8 py-5 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-file-pdf'} text-xl`}></i>
          <span className="uppercase tracking-widest text-[11px]">Enregistrer le Badge</span>
        </button>
        
        <button 
          onClick={() => window.print()}
          className="flex-1 bg-assirou-navy text-white px-8 py-5 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3"
        >
          <i className="fas fa-print text-xl"></i>
          <span className="uppercase tracking-widest text-[11px]">Imprimer</span>
        </button>
      </div>

      <div className="no-print mt-16 text-center">
        <Link to="/" className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px] hover:text-assirou-navy">
          Assirou Sécurité • 2026 • Kaarange bi dall xel
        </Link>
      </div>
    </div>
  );
};

export default TicketView;
