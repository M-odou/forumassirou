
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
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getParticipants();
    if (error && typeof error === 'string' && error.includes('401')) {
      setErrorMsg("Erreur d'authentification (401). Vérifiez vos clés API Supabase ou vos politiques RLS.");
    } else if (error) {
      setErrorMsg(String(error));
    } else {
      setErrorMsg(null);
    }
    setParticipants(data);
    
    const regStatus = await isRegistrationActive();
    setActive(regStatus);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
    
    let channel: any = null;
    if (supabase) {
      setRealtimeStatus('connecting');
      channel = subscribeToParticipants(() => {
        refreshData();
      });

      const timer = setTimeout(() => setRealtimeStatus('online'), 1000);
      return () => {
        clearTimeout(timer);
        if (channel) supabase.removeChannel(channel);
      };
    } else {
      setRealtimeStatus('offline');
    }
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
    (p.adresse_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.organisation_entreprise || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header avec indicateurs de statut */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl gap-6 shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black uppercase tracking-tighter">Gestion <span className="text-assirou-gold">Participants</span></h1>
              
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase ${
                realtimeStatus === 'online' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                realtimeStatus === 'connecting' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${realtimeStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-current'}`}></span>
                {realtimeStatus === 'online' ? 'Temps Réel Actif' : realtimeStatus === 'connecting' ? 'Connexion...' : 'Mode Hors-Ligne'}
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest pl-1">Forum Sécurité 2026 - Administration</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
              <i className="fas fa-file-csv text-assirou-gold"></i> Exporter
            </button>
            <button 
              onClick={async () => { const n = !active; await setRegistrationStatus(n); setActive(n); }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${active ? 'bg-green-600/10 text-green-500 border-green-500/30' : 'bg-red-600/10 text-red-500 border-red-500/30'}`}
            >
              Inscriptions {active ? 'Ouvertes' : 'Fermées'}
            </button>
            <button onClick={refreshData} className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin text-assirou-gold' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Message d'erreur détaillé */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top duration-500">
             <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shrink-0">
               <i className="fas fa-exclamation-triangle text-xl"></i>
             </div>
             <div>
               <p className="text-xs font-black uppercase text-red-400 tracking-widest mb-1">Diagnostic du Système</p>
               <p className="text-sm font-bold text-white leading-relaxed">{errorMsg}</p>
               <p className="text-[10px] text-slate-400 mt-2 italic">Si ce message persiste, vérifiez que votre table 'participants' existe sur Supabase et que le Realtime est activé.</p>
             </div>
             <button onClick={refreshData} className="md:ml-auto px-6 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">Réessayer</button>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Total Inscrits</p>
            <span className="text-5xl font-black text-white">{participants.length}</span>
          </div>
          <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Présences</p>
            <span className="text-5xl font-black text-green-500">{participants.filter(p => p.scan_valide).length}</span>
          </div>
          <div className="md:col-span-2 relative">
            <i className="fas fa-search absolute left-8 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un nom, email, entreprise..." 
              className="w-full h-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-6 outline-none focus:border-assirou-gold/50 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Table des participants */}
        <div className="bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.02]">
                  <th className="px-10 py-7">Participant</th>
                  <th className="px-10 py-7">Organisation</th>
                  <th className="px-10 py-7">Ticket</th>
                  <th className="px-10 py-7">Statut</th>
                  <th className="px-10 py-7 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length > 0 ? filtered.map(p => (
                  <tr key={p.id} className="group hover:bg-white/[0.03] transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-white uppercase text-base tracking-tight">{p.nom_complet}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{p.adresse_email}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-300 uppercase">{p.organisation_entreprise || 'INDIVIDUEL'}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{p.fonction}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="mono text-[11px] font-bold text-assirou-gold bg-assirou-gold/10 px-3 py-1 rounded-lg border border-assirou-gold/20">
                        {p.numero_ticket}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      {p.scan_valide ? (
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[9px] font-black uppercase">PRÉSENT</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-500 rounded-lg text-[9px] font-black uppercase">ABSENT</span>
                      )}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setSelected(p)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-assirou-gold hover:text-assirou-navy transition-all">
                          <i className="fas fa-eye"></i>
                        </button>
                        {!p.scan_valide && (
                          <button onClick={() => handleValidate(p)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-green-600 text-green-500 hover:text-white transition-all">
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        <button onClick={() => handleDelete(p)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-600 text-red-500 hover:text-white transition-all">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-20 text-center text-slate-500 uppercase font-black text-xs tracking-widest">
                      {loading ? 'Chargement...' : 'Aucun inscrit trouvé'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#020817]/90 backdrop-blur-xl overflow-y-auto">
          <div className="bg-[#0c111d] border border-white/10 rounded-[3rem] shadow-2xl max-w-4xl w-full p-12 animate-in zoom-in-95 duration-500">
             <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{selected.nom_complet}</h3>
                  <p className="text-assirou-gold text-xs font-black uppercase tracking-widest">{selected.numero_ticket}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"><i className="fas fa-times text-xl"></i></button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <div className="space-y-2 pb-4 border-b border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Identité & Contact</p>
                      <p className="text-sm font-bold text-white uppercase">{selected.sexe} • {selected.telephone}</p>
                      <p className="text-sm text-slate-400">{selected.adresse_email}</p>
                   </div>
                   <div className="space-y-2 pb-4 border-b border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Profil Pro</p>
                      <p className="text-sm font-bold text-white uppercase">{selected.organisation_entreprise || 'Particulier'}</p>
                      <p className="text-xs text-slate-400 uppercase">{selected.fonction}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Type de participation</p>
                      <p className="text-sm font-bold text-white uppercase">{selected.participation}</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-white/5 p-6 rounded-3xl space-y-4">
                      <p className="text-[9px] font-black text-assirou-gold uppercase tracking-widest">Besoins exprimés</p>
                      <div className="space-y-4">
                         <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Formations ({selected.souhait_formation})</p>
                            <div className="flex flex-wrap gap-2">
                               {selected.type_formation?.map(t => <span key={t} className="px-2 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-slate-300 border border-white/5">{t}</span>)}
                            </div>
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Services ({selected.interet_services})</p>
                            <div className="flex flex-wrap gap-2">
                               {selected.services_interesses?.map(s => <span key={s} className="px-2 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-slate-300 border border-white/5">{s}</span>)}
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Avis sur le thème</p>
                      <p className="text-xs text-slate-300 italic bg-white/5 p-4 rounded-2xl border border-white/5">{selected.avis_theme || 'Aucun avis laissé.'}</p>
                   </div>
                </div>
             </div>

             <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row gap-4">
                <button onClick={() => openMailClient(selected)} className="flex-1 py-4 bg-assirou-gold text-assirou-navy rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2">
                   <i className="fas fa-paper-plane"></i> Envoyer Confirmation
                </button>
                <button onClick={() => handleDelete(selected)} className="px-8 py-4 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-500/20 transition-all">
                   Supprimer
                </button>
                <button onClick={() => setSelected(null)} className="px-8 py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10">Fermer</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
