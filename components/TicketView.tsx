
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getParticipantByTicket } from '../utils/storage';
import { Participant } from '../types';
import TicketCard from './TicketCard';

const TicketView: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-assirou-navy">
        <i className="fas fa-circle-notch fa-spin text-4xl text-assirou-gold"></i>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-assirou-navy">
        <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10">
          <h2 className="text-2xl font-black text-white mb-2 uppercase">Ticket Introuvable</h2>
          <p className="text-slate-400 mb-8 max-w-xs mx-auto">L'identifiant {ticketId} ne correspond à aucune inscription.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-assirou-gold font-black uppercase tracking-widest text-xs hover:text-white transition-all">
            <i className="fas fa-arrow-left"></i> Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4 flex flex-col items-center bg-slate-50">
      <div className="no-print mb-16 text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-assirou-navy text-assirou-gold flex items-center justify-center mx-auto mb-6 shadow-2xl">
           <i className="fas fa-check-circle text-3xl"></i>
        </div>
        <h1 className="text-3xl font-black text-assirou-navy uppercase tracking-tight mb-2">Inscription Confirmée !</h1>
        <p className="text-slate-500 font-bold text-sm">Votre badge officiel est prêt pour le Forum 2026.</p>
      </div>

      <div className="relative group animate-in zoom-in-95 duration-700">
        <div className="absolute -inset-4 bg-assirou-gold/5 blur-[80px] rounded-full opacity-50"></div>
        <TicketCard participant={participant} />
      </div>

      <div className="no-print mt-16 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button 
          onClick={() => window.print()}
          className="flex-1 bg-white text-assirou-navy border-2 border-assirou-navy px-8 py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-95"
        >
          <i className="fas fa-print"></i> Imprimer
        </button>
        <button 
          className="flex-1 bg-assirou-navy text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-95"
          onClick={() => window.print()}
        >
          <i className="fas fa-download"></i> Télécharger
        </button>
      </div>

      <Link to="/" className="no-print mt-12 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-assirou-navy transition-all">
        <i className="fas fa-plus mr-2"></i> Nouvelle Inscription
      </Link>
    </div>
  );
};

export default TicketView;
