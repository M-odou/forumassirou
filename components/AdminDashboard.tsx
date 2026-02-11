
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

  // AUTOMATISATION : Tentative d'envoi automatique
  useEffect(() => {
    if (!isAutomating) return;

    const autoProcess = async () => {
      const pending = participants.filter(p => p.statut_email === 'pending');
      if (pending.length === 0) return;

      for (const p of pending) {
        // Tentative d'envoi via l'API
        await sendConfirmationEmail(p);
      }
    };

    const timer = setTimeout(autoProcess, 5000);
    return () => clearTimeout(timer);
  }, [participants, isAutomating]);

  useEffect(() => {
    loadData();
    const subscription = subscribeToParticipants(() => loadData());
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`⚠️ SUPPRESSION DÉFINITIVE de ${name} ?\nCette action est irréversible.`)) {
      const success = await deleteParticipant(id);
      if (success) {
        setParticipants(prev => prev.filter(p => p.id !== id));
        if (selected?.id === id) setSelected(null);
        alert("Inscription supprimée.");
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
          <i className="fas fa-circle-notch fa-spin text-4xl text-assirou-gold mb-4"></i>
          <p className="text-white font-black text-[10px] uppercase tracking-widest">Accès sécurisé au Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/5 p-8 rounded-[2rem] border border-white/10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Assirou <span className="text-assirou-gold">Admin</span></h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestionnaire de flux - Forum 2026</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="px-5 py-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Inscrits</p>
              <p className="text-xl font-black">{participants.length}</p>
            </div>
            <button onClick={() => setIsAutomating(!isAutomating)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${isAutomating ? 'bg-assirou-gold text-assirou-navy border-assirou-gold' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              Auto-Mail: {isAutomating ? 'ACTIF' : 'PAUSE'}
            </button>
            <button onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${active ? 'bg-green-600' : 'bg-red-600'}`}>
              Portail {active ? 'OUVERT' : 'FERMÉ'}
            </button>
          </div>
        </div>

        {/* Liste */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4">
            <input type="text" placeholder="Rechercher un participant..." className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-sm outline-none focus:border-assirou-gold w-full md:w-80" value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={exportParticipantsToCSV} className="text-[10px] font-black uppercase text-assirou-gold hover:underline"><i className="fas fa-file-export mr-2"></i>Exporter CSV</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-500 uppercase border-b border-white/5">
                  <th className="px-8 py-6">Identité</th>
                  <th className="px-8 py-6">Statut Mail</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] group">
                    <td className="px-8 py-6">
                      <div className="font-black text-sm">{p.nom_complet}</div>
                      <div className="text-[10px] text-assirou-gold font-bold">{p.numero_ticket}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${p.statut_email === 'sent' ? 'bg-green-500/20 text-green-400' : p.statut_email === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-assirou-gold/20 text-assirou-gold animate-pulse'}`}>
                          {p.statut_email}
                        </span>
                        {p.statut_email !== 'sent' && (
                          <button onClick={() => openMailClient(p)} className="text-[9px] font-black text-assirou-gold hover:underline">
                            <i className="fas fa-paper-plane mr-1"></i> Envoyer Manuellement
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right flex justify-end gap-2">
                      <button onClick={() => setSelected(p)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg hover:bg-assirou-gold hover:text-assirou-navy transition-all"><i className="fas fa-eye text-xs"></i></button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg hover:bg-red-500 transition-all text-red-400 hover:text-white"><i className="fas fa-trash text-xs"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Détails Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#001c4d] border border-white/10 rounded-[2.5rem] p-10 max-w-lg w-full relative">
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><i className="fas fa-times text-xl"></i></button>
            <h3 className="text-2xl font-black mb-1 uppercase">{selected.nom_complet}</h3>
            <p className="text-assirou-gold text-[10px] font-black mb-8 tracking-widest">{selected.numero_ticket}</p>
            
            <div className="space-y-6 mb-10">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase">Email</span>
                <span className="text-sm font-bold">{selected.adresse_email}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase">Téléphone</span>
                <span className="text-sm font-bold">{selected.telephone}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase">Structure</span>
                <span className="text-sm font-bold">{selected.organisation_entreprise || '-'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => openMailClient(selected)} className="bg-assirou-gold text-assirou-navy py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Envoi Manuel</button>
              <button onClick={() => handleDelete(selected.id, selected.nom_complet)} className="bg-red-600/10 text-red-500 border border-red-500/20 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
