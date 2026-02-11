
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
    const load = async () => {
      if (!ticketId) return;
      setLoading(true);
      const found = await getParticipantByTicket(ticketId);
      setParticipant(found);
      setLoading(false);
    };
    load();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#00153a]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-assirou-gold mb-4"></i>
          <p className="text-[10px] font-black uppercase tracking-widest text-white">Validation...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#00153a] text-center">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-xs">
          <i className="fas fa-times-circle text-4xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-black text-assirou-navy uppercase">Badge Inexistant</h2>
          <p className="text-slate-400 text-xs mb-6 mt-2">Ce ticket n'est pas dans notre base de données.</p>
          <Link to="/" className="inline-block w-full bg-assirou-navy text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest">Retour</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      {/* Badge Valide Banner */}
      <div className="mb-6 bg-green-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-lg animate-bounce no-print">
        <i className="fas fa-check-circle mr-2"></i> Pass Officiel Valide
      </div>

      {/* Affichage direct du Badge */}
      <div className="animate-in zoom-in-95 duration-500">
        <TicketCard participant={participant} />
      </div>

      {/* Actions simples */}
      <div className="mt-8 flex gap-3 no-print">
        <button onClick={() => window.print()} className="bg-assirou-navy text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">
          <i className="fas fa-print mr-2"></i> Imprimer
        </button>
        <Link to="/" className="bg-white text-slate-400 border border-slate-200 px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
          Retour
        </Link>
      </div>
    </div>
  );
};

export default TicketView;
