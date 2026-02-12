
import React, { useState, useEffect, useCallback } from 'react';
import { getParticipants, isRegistrationActive, setRegistrationStatus, exportParticipantsToCSV, deleteParticipant, validateTicket, subscribeToParticipants, supabase } from '../utils/storage';
import { Participant } from '../types';
import { openMailClient } from '../services/mailService';

const AdminDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [active, setActive] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'cloud' | 'local' | 'error'>('cloud');

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getParticipants();
      setParticipants(data);
      const regStatus = await isRegistrationActive();
      setActive(regStatus);
      setStatus(supabase ? 'cloud' : 'local');
    } catch (e) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const channel = subscribeToParticipants(refreshData);
    return () => { if (channel && supabase) supabase.removeChannel(channel); };
  }, [refreshData]);

  const handleDelete = async (p: Participant) => {
    if (window.confirm(`Supprimer définitivement ${p.nom_complet} ?`)) {
      await deleteParticipant(p.id);
      refreshData();
    }
  };

  const handleValidate = async (p: Participant) => {
    if (window.confirm(`Valider manuellement l'entrée de ${p.nom_complet} ?`)) {
      await validateTicket(p.id);
      refreshData();
    }
  };

  const filtered = participants.filter(p => 
    (p.nom_complet || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.numero_ticket || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.adresse_email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl gap-6 shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black uppercase tracking-tighter">Tableau de <span className="text-assirou-gold">Bord</span></h1>
              {status === 'cloud' ? (
                <span className="bg-green-500/10 text-green-500 text-[8px] font-black uppercase px-2 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span> Connecté Cloud
                </span>
              ) : (
                <span className="bg-orange-500/10 text-orange-500 text-[8px] font-black uppercase px-2 py-1 rounded-full border border-orange-500/20 flex items-center gap-1">
                  Mode Local
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Forum Sécurité 2026 • Gestion des Inscriptions</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
              <i className="fas fa-file-export text-assirou-gold"></i> Export CSV
            </button>
            <button 
              onClick={async () => { const n = !active; await setRegistrationStatus(n); setActive(n); }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${active ? 'bg-green-600/10 text-green-500 border-green-500/30' : 'bg-red-600/10 text-red-500 border-red-500/30'}`}
            >
              Inscriptions: {active ? 'Ouvertes' : 'Fermées'}
            </button>
            <button onClick={refreshData} className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin text-assirou-gold' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Participants</p>
            <p className="text-4xl font-black text-white">{participants.length}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Présences Validées</p>
            <p className="text-4xl font-black text-green-500">{participants.filter(p => p.scan_valide).length}</p>
          </div>
          <div className="md:col-span-2 relative">
            <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un nom, email ou numéro de ticket..." 
              className="w-full h-full bg-white/5 border border-white/10 rounded-3xl pl-14 pr-6 py-4 outline-none focus:border-assirou-gold/50 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.02]">
                  <th className="px-8 py-6">Participant</th>
                  <th className="px-8 py-6">Organisation</th>
                  <th className="px-8 py-6">Type</th>
                  <th className="px-8 py-6">Ticket</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length > 0 ? filtered.map(p => (
                  <tr key={p.id || p.numero_ticket} className="group hover:bg-white/[0.03] transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-white group-hover:text-assirou-gold transition-colors">{p.nom_complet}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">{p.adresse_email}</div>
                    </td>
                    <td className="px-8 py-6 text-sm font-medium text-slate-400">
                      {p.organisation_entreprise || '—'}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-assirou-gold uppercase">{p.participation}</span>
                    </td>
                    <td className="px-8 py-6 mono text-[10px] font-bold text-slate-500">
                      {p.numero_ticket}
                    </td>
                    <td className="px-8 py-6">
                      {p.scan_valide ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[9px] font-black uppercase">
                          <i className="fas fa-check-circle"></i> Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-500 rounded-lg text-[9px] font-black uppercase">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelected(p)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center hover:bg-assirou-gold hover:text-assirou-navy transition-all border border-white/5">
                          <i className="fas fa-eye text-xs"></i>
                        </button>
                        {!p.scan_valide && (
                          <button onClick={() => handleValidate(p)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center hover:bg-green-600 text-green-500 hover:text-white transition-all border border-white/5">
                            <i className="fas fa-user-check text-xs"></i>
                          </button>
                        )}
                        <button onClick={() => handleDelete(p)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-600 text-red-500 hover:text-white transition-all border border-white/5">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-32 text-center">
                      {loading ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-10 h-10 border-2 border-assirou-gold border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Chargement des données...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <i className="fas fa-folder-open text-4xl text-slate-800"></i>
                          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Aucune soumission trouvée</p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Détails */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl transition-all">
          <div className="bg-[#0c111d] border border-white/10 rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selected.nom_complet}</h3>
                <p className="text-assirou-gold text-[10px] font-black uppercase mt-1 tracking-widest">{selected.numero_ticket}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white border border-white/5">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-white">{selected.adresse_email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Téléphone</p>
                  <p className="text-sm font-bold text-white">{selected.telephone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Organisation</p>
                  <p className="text-sm font-bold text-white">{selected.organisation_entreprise || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fonction</p>
                  <p className="text-sm font-bold text-white">{selected.fonction || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-assirou-gold uppercase tracking-widest mb-3">Avis sur le thème</p>
                <p className="text-sm text-slate-300 italic leading-relaxed">
                  {selected.avis_theme ? `"${selected.avis_theme}"` : "Aucun avis laissé."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Formations</p>
                    <p className="text-xs font-bold text-white">{selected.souhait_formation === 'Oui' ? selected.type_formation.join(', ') : 'Aucune'}</p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Services</p>
                    <p className="text-xs font-bold text-white">{selected.interet_services === 'Oui' ? selected.services_interesses.join(', ') : 'Aucun'}</p>
                 </div>
              </div>
            </div>
            <div className="p-8 border-t border-white/10 flex gap-4 bg-black/20">
              <button onClick={() => setSelected(null)} className="flex-1 py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Fermer</button>
              <button onClick={() => openMailClient(selected)} className="flex-1 py-4 bg-assirou-gold text-assirou-navy rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-paper-plane"></i> Contacter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
