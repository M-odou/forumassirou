
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

  useEffect(() => {
    const load = async () => {
      if (!ticketId) return;
      setLoading(true);
      
      const found = await getParticipantByTicket(ticketId);
      
      if (found) {
        setParticipant(found);
        
        // AUTO-VALIDATION SI LE SYSTÈME EST ACTIF ET LE PASS PAS ENCORE VALIDÉ
        if (!found.scan_valide) {
          const scanActive = await isScanSystemActive();
          if (scanActive) {
            await validateTicket(found.id);
            // Re-fetch pour mettre à jour l'affichage
            const updated = await getParticipantByTicket(ticketId);
            setParticipant(updated);
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
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const dataUrl = await toPng(node, { 
        quality: 1, 
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: { borderRadius: '0' }
      });
      
      const link = document.createElement('a');
      link.download = `PASS_FORUM_2026_${participant?.nom_complet.replace(/\s+/g, '_').toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Capture Error:", err);
      alert("Erreur lors de la génération de l'image.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const node = document.getElementById('badge-capture');
    if (!node) return;
    setDownloading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const dataUrl = await toPng(node, { quality: 1, pixelRatio: 3 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const badgeWidth = 100;
      const badgeHeight = (node.offsetHeight * badgeWidth) / node.offsetWidth;
      const x = (pdfWidth - badgeWidth) / 2;
      const y = (pdfHeight - badgeHeight) / 4; 
      
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text("BADGE OFFICIEL - DEUXIÈME FORUM MÉTIERS SÉCURITÉ 2026", pdfWidth / 2, y - 10, { align: 'center' });
      pdf.addImage(dataUrl, 'PNG', x, y, badgeWidth, badgeHeight);
      pdf.setFontSize(8);
      pdf.text("Ce document doit être présenté à l'entrée du forum.", pdfWidth / 2, y + badgeHeight + 10, { align: 'center' });
      pdf.save(`PASS_OFFICIEL_${participant?.numero_ticket}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-assirou-navy">
        <div className="text-center">
          <div className="w-16 h-16 bg-assirou-gold rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce shadow-2xl">
            <span className="text-assirou-navy font-black text-2xl">AS</span>
          </div>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.5em]">Authentification...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Badge non trouvé</h2>
          <Link to="/" className="inline-block w-full py-5 bg-assirou-navy text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-12 font-sans">
      
      {/* Access Banner with explicit time validity */}
      {participant.scan_valide && (
        <div className="w-full max-w-4xl mb-12 animate-in slide-in-from-top duration-700">
           <div className="bg-green-600 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <i className="fas fa-check-circle text-9xl"></i>
              </div>
              <div className="flex items-center gap-6 relative z-10">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-xl">
                    <span className="font-black text-2xl">AS</span>
                 </div>
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Accès Confirmé</h2>
                    <div className="mt-3 flex flex-col gap-1">
                      <p className="text-green-100 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <i className="fas fa-clock"></i>
                        VALIDE JUSQU'AU 05 MARS À 18H00
                      </p>
                      <p className="text-white/70 text-[8px] font-bold uppercase tracking-wider">Pass authentifié par Assirou Sécurité</p>
                    </div>
                 </div>
              </div>
              <div className="text-center md:text-right bg-black/10 px-6 py-4 rounded-2xl relative z-10 border border-white/5 backdrop-blur-sm">
                 <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Pass Validé le</p>
                 <p className="text-base font-black tracking-tight">
                   {new Date(participant.date_validation!).toLocaleString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        <div className="space-y-10 order-2 lg:order-1 text-center lg:text-left">
           <div>
              <div className="inline-flex items-center gap-3 bg-white px-5 py-2 rounded-full shadow-sm border border-slate-100 mb-6">
                <span className={`w-2 h-2 rounded-full ${participant.scan_valide ? 'bg-green-500' : 'bg-assirou-gold'} animate-pulse`}></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-assirou-navy">Badge Certifié Officiel</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-assirou-navy uppercase tracking-tighter leading-[0.9] mb-6">
                Rendez-vous <br/><span className="text-assirou-gold">le 05 Mars !</span>
              </h1>
              <p className="text-slate-500 text-sm max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
                Votre inscription au Deuxième forum sur les métiers de la sécurité privée au Sénégal est confirmée. Merci de présenter ce badge à l'accueil du CSC Thiaroye.
              </p>
           </div>

           <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <button onClick={handleDownloadImage} disabled={downloading} className="px-8 py-5 bg-white border-2 border-slate-200 text-assirou-navy rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:border-assirou-gold transition-all flex items-center gap-3 shadow-sm disabled:opacity-50">
                <i className="fas fa-image text-assirou-gold"></i> Enregistrer Image
              </button>
              <button onClick={handleDownloadPDF} disabled={downloading} className="px-8 py-5 bg-assirou-navy text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-assirou-gold hover:text-assirou-navy transition-all flex items-center gap-3 shadow-xl disabled:opacity-50">
                <i className="fas fa-file-pdf"></i> Format PDF
              </button>
           </div>

           <div className="pt-8 border-t border-slate-200 inline-block">
              <Link to="/" className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-assirou-navy transition-all flex items-center gap-4 group">
                <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Nouvelle Inscription
              </Link>
           </div>
        </div>

        <div className="order-1 lg:order-2 flex justify-center perspective-1000">
           <div className="animate-in zoom-in duration-1000 hover:rotate-1 transition-transform cursor-default">
              <TicketCard participant={participant} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
