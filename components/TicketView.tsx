
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
    // Attendre que le QR code externe soit bien rendu
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const dataUrl = await toPng(node, { 
        quality: 1, 
        pixelRatio: 4, 
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: { transform: 'scale(1)', margin: '0' } // Assure que la capture est à 100%
      });
      const link = document.createElement('a');
      link.download = `pass-assirou-${participant?.numero_ticket}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Erreur lors de la capture du badge.");
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
      const dataUrl = await toPng(node, { quality: 1, pixelRatio: 2, cacheBust: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`badge-officiel-${participant?.numero_ticket}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001c4d]">
        <div className="text-center">
          <i className="fas fa-shield-halved text-4xl text-assirou-gold animate-pulse mb-4"></i>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Validation du Pass...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-red-50 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6"><i className="fas fa-times text-3xl"></i></div>
          <h2 className="text-3xl font-black text-red-900 uppercase tracking-tighter mb-4">PASS INTRUVABLE</h2>
          <p className="text-slate-500 text-sm mb-10">Ce numéro de ticket n'existe pas ou a été supprimé.</p>
          <Link to="/" className="inline-block w-full py-5 bg-assirou-navy text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Retour Accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-16 relative overflow-x-hidden font-sans">
      
      {/* MESSAGE "PASS VALIDE" */}
      {participant.scan_valide && (
        <div className="w-full max-w-4xl mb-10 animate-in slide-in-from-top duration-500">
           <div className="bg-green-600 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border-4 border-white/10">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-xl"><i className="fas fa-check-double text-3xl"></i></div>
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">PASS VALIDE</h2>
                    <p className="text-green-100 font-bold uppercase text-[9px] tracking-widest mt-1">Accès autorisé par le service de sécurité</p>
                 </div>
              </div>
              <div className="text-center md:text-right">
                 <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Validation le</p>
                 <p className="text-lg font-black">{new Date(participant.date_validation!).toLocaleString()}</p>
              </div>
           </div>
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-12 gap-8 relative z-10">
        <div className="text-center md:text-left">
           <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${participant.scan_valide ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-assirou-gold'}`}></span>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${participant.scan_valide ? 'text-green-600' : 'text-assirou-gold'}`}>
                {participant.scan_valide ? 'BADGE DÉJÀ VALIDÉ' : 'BADGE AUTHENTIFIÉ'}
              </span>
           </div>
           <h1 className="text-4xl font-black text-assirou-navy uppercase tracking-tighter">VOTRE BADGE OFFICIEL</h1>
        </div>
        <div className="flex gap-3 no-print">
          <button onClick={handleDownloadImage} disabled={downloading} className="px-6 py-4 bg-white border border-slate-200 text-assirou-navy rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            {downloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>} IMAGE
          </button>
          <button onClick={handleDownloadPDF} disabled={downloading} className="px-6 py-4 bg-assirou-navy text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-assirou-gold transition-all flex items-center gap-2 shadow-xl">
            {downloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>} PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start w-full max-w-5xl relative z-10">
        <div className="flex justify-center animate-in zoom-in duration-500">
           <TicketCard participant={participant} />
        </div>

        <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8">Détails de l'Inscription</p>
            <h2 className="text-4xl font-black text-assirou-navy uppercase tracking-tighter leading-none mb-3">{participant.nom_complet}</h2>
            <p className="text-assirou-gold font-black uppercase text-[11px] tracking-widest mb-8">{participant.organisation_entreprise || 'Participant individuel'}</p>
            
            <div className="space-y-4 pt-8 border-t border-slate-50">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID PASS</span>
                  <span className="mono font-black text-assirou-navy">{participant.numero_ticket}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TYPE</span>
                  <span className="bg-assirou-navy text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{participant.participation}</span>
               </div>
            </div>
          </div>

          <div className="bg-assirou-navy p-8 rounded-[2rem] text-white flex items-center gap-6 shadow-xl">
             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                <i className={`fas ${participant.scan_valide ? 'fa-check-double text-green-400' : 'fa-qrcode text-assirou-gold'} text-2xl`}></i>
             </div>
             <div>
                <h4 className="font-black text-base uppercase mb-1">{participant.scan_valide ? "Accès Confirmé" : "Badge Numérique"}</h4>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  {participant.scan_valide 
                    ? "Votre accès a été enregistré avec succès."
                    : "Présentez ce badge au contrôle d'entrée pour validation par QR Code."}
                </p>
             </div>
          </div>
          
          <div className="text-center pt-6">
             <Link to="/" className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-assirou-navy transition-all flex items-center justify-center gap-3 group">
               <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Retour Accueil
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
