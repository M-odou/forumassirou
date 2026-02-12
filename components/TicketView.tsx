
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
      setParticipant(found);
      
      // LOGIQUE DE VALIDATION AU SCAN
      if (found && !found.scan_valide) {
        const scanActive = await isScanSystemActive();
        if (scanActive) {
          await validateTicket(found.id);
          // On recharge les données pour l'UI
          const updated = await getParticipantByTicket(ticketId);
          setParticipant(updated);
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
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const dataUrl = await toPng(node, { 
        quality: 1, 
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `badge-assirou-${participant?.numero_ticket}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur téléchargement image:", err);
      alert("Erreur lors de la génération de l'image.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const node = document.getElementById('badge-capture');
    if (!node) return;
    setDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const dataUrl = await toPng(node, { quality: 1, pixelRatio: 2, cacheBust: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`pass-officiel-${participant?.numero_ticket}.pdf`);
    } catch (err) {
      console.error("Erreur téléchargement PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-assirou-navy text-white">
        <div className="text-center animate-pulse">
          <i className="fas fa-shield-halved text-6xl text-assirou-gold mb-8"></i>
          <p className="text-[12px] font-black uppercase tracking-[0.6em]">Authentification en cours...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FFF5F5] font-sans">
        <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 max-w-lg w-full text-center flex flex-col items-center animate-in zoom-in duration-500">
          <div className="w-32 h-32 bg-[#FFEBEC] rounded-full flex items-center justify-center mb-12">
            <div className="w-16 h-16 bg-[#D32F2F] rounded-full flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-times text-3xl"></i>
            </div>
          </div>
          <h2 className="text-5xl font-black text-[#6B1414] uppercase tracking-tighter leading-none mb-6">Pass Invalide</h2>
          <p className="text-[#A35D5D] text-lg font-medium italic mb-16 max-w-xs leading-snug">Ce ticket n'existe pas ou a été révoqué.</p>
          <Link to="/" className="w-full py-6 bg-[#7B1717] text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-[0_10px_30px_rgba(123,23,23,0.3)] hover:bg-[#5A1111] transition-all transform hover:scale-105 active:scale-95">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-8 md:p-20 relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-16 gap-8 relative z-10">
        <div className="text-center md:text-left">
           <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <span className={`w-3 h-3 rounded-full ${participant.scan_valide ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-assirou-gold'}`}></span>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${participant.scan_valide ? 'text-green-600' : 'text-assirou-gold'}`}>
                {participant.scan_valide ? 'PASS VALIDÉ' : 'PASS AUTHENTIFIÉ'}
              </span>
           </div>
           <h1 className="text-4xl font-black text-assirou-navy uppercase tracking-tighter">VOTRE PASS OFFICIEL</h1>
           <p className="text-slate-400 font-medium italic text-sm">Veuillez présenter ce badge à l'entrée du forum.</p>
        </div>
        <div className="flex gap-4 no-print">
          <button onClick={handleDownloadImage} disabled={downloading} className="px-8 py-4 bg-white border border-slate-200 text-assirou-navy rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm">
            {downloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>} Sauvegarder Image
          </button>
          <button onClick={handleDownloadPDF} disabled={downloading} className="px-8 py-4 bg-assirou-navy text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-assirou-gold transition-all flex items-center gap-3 shadow-xl">
            {downloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>} Télécharger PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center w-full max-w-6xl relative z-10">
        <div className="flex justify-center animate-in fade-in slide-in-from-left-8 duration-700">
           <TicketCard participant={participant} />
        </div>

        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden group">
            {participant.scan_valide && (
              <div className="absolute top-0 right-0 bg-green-500 text-white px-8 py-2 rounded-bl-3xl font-black uppercase text-[10px] tracking-widest shadow-lg animate-in slide-in-from-top-4">
                <i className="fas fa-check-circle mr-2"></i> VALIDÉ
              </div>
            )}
            
            <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.8em] mb-8">Scan Rapide</p>
            <h2 className="text-6xl md:text-7xl font-black text-assirou-navy uppercase tracking-tighter leading-[0.85] mb-8 drop-shadow-sm">
               {participant.nom_complet.split(' ')[0]} <br/> 
               <span className="text-assirou-gold">{participant.nom_complet.split(' ').slice(1).join(' ')}</span>
            </h2>
            
            <div className="space-y-4 pt-8 border-t border-slate-50">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Numéro Unique</span>
                  <span className="mono font-black text-assirou-navy">{participant.numero_ticket}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</span>
                  <span className="bg-assirou-navy text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{participant.participation}</span>
               </div>
               {participant.scan_valide && (
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Validé le</span>
                     <span className="text-[11px] font-black text-green-600">{new Date(participant.date_validation!).toLocaleString()}</span>
                  </div>
               )}
            </div>
          </div>

          <div className="bg-assirou-navy p-10 rounded-[3rem] text-white flex items-center gap-8 shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
             <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-xl">
                <i className={`fas ${participant.scan_valide ? 'fa-check-double text-green-400' : 'fa-qrcode text-assirou-gold'} text-3xl`}></i>
             </div>
             <div>
                <h4 className="font-black text-lg uppercase tracking-tight mb-1">Badge de Sécurité</h4>
                <p className="text-xs text-white/50 leading-relaxed font-medium">
                  {participant.scan_valide 
                    ? "Ce pass a été scanné avec succès et enregistré dans notre système de sécurité."
                    : "Ce pass est strictement personnel. Il doit être présenté sous format numérique ou imprimé lors du contrôle."}
                </p>
             </div>
          </div>
          
          <div className="text-center pt-8">
             <Link to="/" className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-assirou-navy transition-all flex items-center justify-center gap-4 group">
               <i className="fas fa-arrow-left group-hover:-translate-x-2 transition-transform"></i> Retour au portail
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
