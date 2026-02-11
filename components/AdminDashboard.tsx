
import React, { useState, useEffect, useCallback } from 'react';
import { getParticipants, isRegistrationActive, setRegistrationStatus, exportParticipantsToCSV, deleteParticipant, subscribeToParticipants, supabase } from '../utils/storage';
import { Participant } from '../types';
import { sendConfirmationEmail, openMailClient } from '../services/mailService';

const AdminDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [active, setActive] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAutomating, setIsAutomating] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getParticipants();
      const status = await isRegistrationActive();
      setParticipants(data);
      setActive(status);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // AUTOMATISATION : Worker d'envoi d'e-mails
  useEffect(() => {
    if (!isAutomating) return;

    const autoProcess = async () => {
      const pending = participants.filter(p => p.statut_email === 'pending');
      if (pending.length === 0) return;

      console.log(`Automation: ${pending.length} mails en attente...`);
      for (const p of pending) {
        // Envoi via l'API (nécessite une clé configurée)
        await sendConfirmationEmail(p);
      }
    };

    const timer = setTimeout(autoProcess, 4000);
    return () => clearTimeout(timer);
  }, [participants, isAutomating]);

  // TEMPS RÉEL : Abonnement Supabase
  useEffect(() => {
    loadData();
    const subscription = subscribeToParticipants(() => loadData());
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Supprimer définitivement ${name} ?`)) {
      const success = await deleteParticipant(id);
      if (success) {
        setParticipants(prev => prev.filter(p => p.id !== id));
        if (selected?.id === id) setSelected(null);
      }
    }
  };

  const filtered = participants.filter(p => 
    p.nom_complet.toLowerCase().includes(search.toLowerCase()) || 
    p.numero_ticket.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && participants.length === 0) {
    return (
      <div className="min-h-screen bg-[#00153a] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-satellite-dish fa-spin text-4xl text-assirou-gold mb-4"></i>
          <p className="text-white font-black text-[10px] uppercase tracking-widest">Synchronisation Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/5 p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
          <div className="absolute top-4 right-8 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[8px] font-black uppercase text-green-400">Database Live</span>
          </div>

          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Command <span className="text-assirou-gold">Center</span></h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestion des accréditations Forum 2026</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button onClick={() => setIsAutomating(!isAutomating)} className={`px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${isAutomating ? 'bg-assirou-gold text-assirou-navy border-assirou-gold' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              <i className="fas fa-robot mr-2"></i> Auto-Mail: {isAutomating ? 'ON' : 'OFF'}
            </button>
            <button onClick={exportParticipantsToCSV} className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              <i className="fas fa-download mr-2"></i> CSV
            </button>
            <button onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} className={`px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${active ? 'bg-green-600' : 'bg-red-600'}`}>
              Accès {active ? 'OUVERT' : 'FERMÉ'}
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <h2 className="text-xl font-black uppercase tracking-widest">Base Participants ({participants.length})</h2>
            <input type="text" placeholder="Filtrer par nom ou ticket..." className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm outline-none focus:border-assirou-gold w-full md:w-96" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
                  <th className="px-10 py-8">Identité</th>
                  <th className="px-10 py-8">Statut Email</th>
                  <th className="px-10 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id || p.numero_ticket} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-10 py-8">
                      <div className="font-black text-sm">{p.nom_complet}</div>
                      <div className="text-[10px] text-assirou-gold font-bold">{p.numero_ticket}</div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${p.statut_email === 'sent' ? 'bg-green-500/20 text-green-400' : p.statut_email === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-assirou-gold/20 text-assirou-gold animate-pulse'}`}>
                          {p.statut_email}
                        </span>
                        {p.statut_email === 'failed' && (
                          <button onClick={() => openMailClient(p)} className="text-[9px] font-black text-assirou-gold hover:underline uppercase">
                            <i className="fas fa-envelope-open-text mr-1"></i> Envoyer via Gmail
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelected(p)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-assirou-gold hover:text-assirou-navy transition-all flex items-center justify-center">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-red-500 transition-all flex items-center justify-center text-red-400 hover:text-white">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Détails */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] p-12 max-w-xl w-full relative">
            <button onClick={() => setSelected(null)} className="absolute top-8 right-8 text-slate-400 hover:text-white"><i className="fas fa-times text-2xl"></i></button>
            <h3 className="text-3xl font-black mb-2 uppercase">{selected.nom_complet}</h3>
            <p className="text-assirou-gold font-bold text-xs mb-8 tracking-widest">{selected.numero_ticket}</p>
            
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black text-slate-500">Contact</p>
                <p className="text-sm font-bold truncate">{selected.adresse_email}</p>
                <p className="text-sm font-bold">{selected.telephone}</p>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black text-slate-500">Formation</p>
                <p className="text-sm font-bold">{selected.souhait_formation === 'Oui' ? selected.type_formation.join(', ') : 'Aucune'}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => openMailClient(selected)} className="flex-1 bg-white/5 border border-white/10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-assirou-gold">Envoyer via mon mail</button>
              <a href={`#/ticket/${selected.numero_ticket}`} target="_blank" className="flex-1 bg-assirou-gold text-assirou-navy py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-center">Badge Public</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
