
import React, { useState, useEffect, useCallback } from 'react';
import { getParticipants, isRegistrationActive, setRegistrationStatus, exportParticipantsToCSV, deleteParticipant, subscribeToParticipants, supabase } from '../utils/storage';
import { Participant } from '../types';
import { sendConfirmationEmail } from '../services/mailService';

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

  // AUTOMATISATION : Traitement des emails dès qu'une inscription 'pending' est détectée
  useEffect(() => {
    if (!isAutomating) return;

    const autoProcess = async () => {
      const pending = participants.filter(p => p.statut_email === 'pending');
      for (const p of pending) {
        console.log(`Automation : Envoi du mail à ${p.nom_complet}`);
        // Optimiste : On met à jour localement pour ne pas traiter deux fois
        setParticipants(prev => prev.map(item => item.numero_ticket === p.numero_ticket ? {...item, statut_email: 'sent'} : item));
        await sendConfirmationEmail(p);
      }
    };

    const timer = setTimeout(autoProcess, 2000);
    return () => clearTimeout(timer);
  }, [participants, isAutomating]);

  // TEMPS RÉEL : Abonnement aux changements
  useEffect(() => {
    loadData();
    const subscription = subscribeToParticipants(() => loadData());
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [loadData]);

  const toggleStatus = async () => {
    const newState = !active;
    await setRegistrationStatus(newState);
    setActive(newState);
  };

  const filtered = participants.filter(p => 
    p.nom_complet.toLowerCase().includes(search.toLowerCase()) || 
    p.numero_ticket.toLowerCase().includes(search.toLowerCase()) ||
    p.adresse_email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && participants.length === 0) {
    return (
      <div className="min-h-screen bg-[#00153a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <i className="fas fa-microchip fa-spin text-4xl text-assirou-gold"></i>
          <p className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Connexion à la base de données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Automatisé */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[8px] font-black uppercase text-green-400">Live Database Sync</span>
          </div>

          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
              Security <span className="text-assirou-gold">Panel</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestion automatisée des accréditations 2026</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button onClick={() => setIsAutomating(!isAutomating)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${isAutomating ? 'bg-assirou-gold text-assirou-navy border-assirou-gold' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              <i className="fas fa-robot mr-2"></i> Auto-Pilot: {isAutomating ? 'ON' : 'OFF'}
            </button>
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              <i className="fas fa-download mr-2"></i> CSV
            </button>
            <button onClick={toggleStatus} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-green-600' : 'bg-red-600'}`}>
              Portail {active ? 'Ouvert' : 'Fermé'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Inscrits</p>
            <div className="text-4xl font-black">{participants.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Emails Envoyés</p>
            <div className="text-4xl font-black text-green-400">{participants.filter(p => p.statut_email === 'sent').length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">En attente</p>
            <div className="text-4xl font-black text-assirou-gold">{participants.filter(p => p.statut_email === 'pending').length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-center">
             <div className="text-center">
                <i className="fas fa-shield-alt text-assirou-gold/20 text-4xl"></i>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black uppercase">Dernières Inscriptions</h2>
            <input type="text" placeholder="Recherche rapide..." className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-sm outline-none focus:border-assirou-gold w-full md:w-80" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-6">Identité</th>
                  <th className="px-8 py-6">Statut Email</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id || p.numero_ticket} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-black text-sm">{p.nom_complet}</div>
                      <div className="text-[10px] text-slate-500">{p.numero_ticket}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${p.statut_email === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-assirou-gold/20 text-assirou-gold'}`}>
                        {p.statut_email}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => setSelected(p)} className="w-8 h-8 bg-white/5 rounded-lg hover:bg-assirou-gold hover:text-assirou-navy transition-all">
                        <i className="fas fa-eye text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#001c4d] border border-white/10 rounded-[2rem] p-10 max-w-lg w-full relative">
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-slate-400"><i className="fas fa-times text-xl"></i></button>
            <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">{selected.nom_complet}</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] uppercase font-black text-slate-500">Email</span>
                <span className="text-sm font-bold">{selected.adresse_email}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] uppercase font-black text-slate-500">Téléphone</span>
                <span className="text-sm font-bold">{selected.telephone}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] uppercase font-black text-slate-500">Formation</span>
                <span className="text-sm font-bold">{selected.souhait_formation === 'Oui' ? selected.type_formation.join(', ') : 'Non'}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => sendConfirmationEmail(selected)} className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-assirou-gold transition-all">Renvoyer Email</button>
              <a href={`#/ticket/${selected.numero_ticket}`} target="_blank" className="flex-1 bg-assirou-gold text-assirou-navy py-3 rounded-xl font-black text-[9px] uppercase tracking-widest text-center">Voir Ticket</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
