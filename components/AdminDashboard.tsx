
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
  const [dbError, setDbError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!supabase) {
      setDbError("Configuration Incomplète : L'URL du projet Supabase est manquante.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setDbError(null);
    try {
      const data = await getParticipants();
      setParticipants(data);
      const regStatus = await isRegistrationActive();
      setActive(regStatus);
    } catch (e: any) {
      setDbError("Erreur de connexion : Impossible de joindre votre base de données. Vérifiez l'URL du projet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const channel = subscribeToParticipants(refreshData);
    return () => { 
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [refreshData]);

  const handleDelete = async (p: Participant) => {
    if (window.confirm(`Supprimer ${p.nom_complet} ?`)) {
      await deleteParticipant(p.id);
      refreshData();
    }
  };

  const handleValidate = async (p: Participant) => {
    if (window.confirm(`Valider l'entrée de ${p.nom_complet} ?`)) {
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
              <h1 className="text-3xl font-black uppercase tracking-tighter">Production <span className="text-assirou-gold">Live</span></h1>
              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full border flex items-center gap-1 ${supabase ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                <span className={`w-1 h-1 rounded-full ${supabase ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span> 
                {supabase ? 'Connecté' : 'Hors-ligne'}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Interface de gestion du Forum 2026</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
              <i className="fas fa-file-export text-assirou-gold"></i> Export Données
            </button>
            <button 
              onClick={async () => { if(supabase) { const n = !active; await setRegistrationStatus(n); setActive(n); } }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${active ? 'bg-green-600/10 text-green-500 border-green-500/30' : 'bg-red-600/10 text-red-500 border-red-500/30'}`}
            >
              Statut : {active ? 'OUVERT' : 'FERMÉ'}
            </button>
            <button onClick={refreshData} className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin text-assirou-gold' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Missing Configuration Help Box */}
        {dbError && (
          <div className="bg-red-500/10 border border-red-500/20 p-10 rounded-[2.5rem] space-y-6 animate-in zoom-in duration-300">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-red-500 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-lg">
                   <i className="fas fa-cloud-upload-alt"></i>
                </div>
                <div>
                   <h2 className="text-xl font-black uppercase tracking-tighter text-red-400">Action Requise : Liaison Cloud</h2>
                   <p className="text-slate-400 text-sm font-medium mt-1">{dbError}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Étape 1 : URL du Projet</p>
                   <p className="text-xs text-slate-300 leading-relaxed">Ajoutez <b>SUPABASE_URL</b> dans vos variables d'environnement sur Vercel.</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Étape 2 : Clé API</p>
                   <p className="text-xs text-slate-300 leading-relaxed">La clé fournie est déjà intégrée par défaut. Elle sera utilisée dès que l'URL sera valide.</p>
                </div>
             </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!dbError && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Inscrits</p>
                <p className="text-4xl font-black text-white">{participants.length}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Entrées Validées</p>
                <p className="text-4xl font-black text-green-500">{participants.filter(p => p.scan_valide).length}</p>
              </div>
              <div className="md:col-span-2 relative">
                <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-500"></i>
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filtrer la base de données..." 
                  className="w-full h-full bg-white/5 border border-white/10 rounded-3xl pl-14 pr-6 py-4 outline-none focus:border-assirou-gold/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.02]">
                    <th className="px-8 py-6">Participant</th>
                    <th className="px-8 py-6">Organisation</th>
                    <th className="px-8 py-6">ID Ticket</th>
                    <th className="px-8 py-6">Statut</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.length > 0 ? filtered.map(p => (
                    <tr key={p.id} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-black text-white group-hover:text-assirou-gold transition-colors">{p.nom_complet}</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{p.adresse_email}</div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-slate-400">{p.organisation_entreprise || '—'}</td>
                      <td className="px-8 py-6 mono text-[10px] font-bold text-slate-500">{p.numero_ticket}</td>
                      <td className="px-8 py-6">
                        {p.scan_valide ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[9px] font-black uppercase">Présent</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-500 rounded-lg text-[9px] font-black uppercase">Absent</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setSelected(p)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center hover:bg-assirou-gold hover:text-assirou-navy transition-all border border-white/5"><i className="fas fa-eye text-xs"></i></button>
                          {!p.scan_valide && <button onClick={() => handleValidate(p)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center hover:bg-green-600 text-green-500 hover:text-white transition-all border border-white/5"><i className="fas fa-user-check text-xs"></i></button>}
                          <button onClick={() => handleDelete(p)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-600 text-red-500 hover:text-white transition-all border border-white/5"><i className="fas fa-trash-alt text-xs"></i></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-8 py-32 text-center text-slate-500 text-[10px] font-black tracking-widest uppercase italic">Aucun participant en base de données</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
          <div className="bg-[#0c111d] border border-white/10 rounded-[3rem] shadow-2xl max-w-2xl w-full p-10 animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-start mb-10">
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selected.nom_complet}</h3>
                   <p className="text-assirou-gold text-[10px] font-black uppercase mt-1 tracking-widest">{selected.numero_ticket}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white border border-white/5"><i className="fas fa-times text-xl"></i></button>
             </div>
             
             <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</p><p className="text-sm font-bold text-white">{selected.adresse_email}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Téléphone</p><p className="text-sm font-bold text-white">{selected.telephone}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entreprise</p><p className="text-sm font-bold text-white">{selected.organisation_entreprise || 'N/A'}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Profil</p><p className="text-sm font-bold text-white">{selected.participation}</p></div>
             </div>

             <div className="flex gap-4">
                <button onClick={() => setSelected(null)} className="flex-1 py-5 bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest">Fermer</button>
                <button onClick={() => openMailClient(selected)} className="flex-1 py-5 bg-assirou-gold text-assirou-navy rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2">
                   <i className="fas fa-paper-plane"></i> Envoyer Email
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
