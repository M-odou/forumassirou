
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
      setDbError("Erreur de connexion : Impossible de joindre votre base de données.");
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
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'inscription de ${p.nom_complet} ? Cette action est irréversible.`)) {
      await deleteParticipant(p.id);
      refreshData();
    }
  };

  const handleValidate = async (p: Participant) => {
    if (window.confirm(`Confirmer manuellement l'arrivée de ${p.nom_complet} ?`)) {
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
    <div className="min-h-screen bg-[#020817] text-slate-100 p-4 md:p-10 font-sans selection:bg-assirou-gold selection:text-assirou-navy">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl gap-6 shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black uppercase tracking-tighter">Gestion <span className="text-assirou-gold">Participants</span></h1>
              <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 ${supabase ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${supabase ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span> 
                {supabase ? 'Serveur Cloud Actif' : 'Mode Local'}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest pl-1">Tableau de bord - Forum Sécurité 2026</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
              <i className="fas fa-file-csv text-assirou-gold text-sm"></i> Exporter CSV
            </button>
            <button 
              onClick={async () => { if(supabase) { const n = !active; await setRegistrationStatus(n); setActive(n); } }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${active ? 'bg-green-600/10 text-green-500 border-green-500/30' : 'bg-red-600/10 text-red-500 border-red-500/30'}`}
            >
              Inscriptions : {active ? 'OUVERTES' : 'FERMÉES'}
            </button>
            <button onClick={refreshData} className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin text-assirou-gold' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Dashboard Statistics */}
        {!dbError && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Total Inscrits</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-white">{participants.length}</span>
                <span className="text-slate-500 text-xs font-bold mb-1.5 uppercase">Personnes</span>
              </div>
            </div>
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Présences</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-green-500">{participants.filter(p => p.scan_valide).length}</span>
                <span className="text-slate-500 text-xs font-bold mb-1.5 uppercase">Validés</span>
              </div>
            </div>
            <div className="md:col-span-2 relative group">
              <i className="fas fa-search absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-assirou-gold transition-colors"></i>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email, entreprise ou ticket..." 
                className="w-full h-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-6 outline-none focus:border-assirou-gold/50 transition-all text-sm font-medium"
              />
            </div>
          </div>
        )}

        {/* Main Table View */}
        {!dbError && (
          <div className="bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.02]">
                    <th className="px-10 py-7">Participant</th>
                    <th className="px-10 py-7">Profil & Organisation</th>
                    <th className="px-10 py-7">Ticket ID</th>
                    <th className="px-10 py-7">Pointage</th>
                    <th className="px-10 py-7 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.length > 0 ? filtered.map(p => (
                    <tr key={p.id} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-white group-hover:text-assirou-gold transition-colors text-base uppercase tracking-tight">{p.nom_complet}</span>
                          <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{p.adresse_email}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-slate-300 uppercase">{p.organisation_entreprise || 'INDIVIDUEL'}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{p.fonction || '—'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                          <span className="mono text-[11px] font-bold text-assirou-gold bg-assirou-gold/10 px-3 py-1 rounded-lg border border-assirou-gold/20">
                            {p.numero_ticket}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        {p.scan_valide ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[9px] font-black uppercase w-fit">PRÉSENT</span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase">{new Date(p.date_validation!).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-500 rounded-lg text-[9px] font-black uppercase w-fit">ABSENT</span>
                        )}
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => setSelected(p)} className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-assirou-gold hover:text-assirou-navy transition-all border border-white/10 shadow-lg" title="Voir détails complets">
                            <i className="fas fa-expand-alt text-sm"></i>
                          </button>
                          {!p.scan_valide && (
                            <button onClick={() => handleValidate(p)} className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-green-600 text-green-500 hover:text-white transition-all border border-white/10 shadow-lg" title="Valider présence">
                              <i className="fas fa-check-circle text-sm"></i>
                            </button>
                          )}
                          <button onClick={() => handleDelete(p)} className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-red-600 text-red-500 hover:text-white transition-all border border-white/10 shadow-lg" title="Supprimer">
                            <i className="fas fa-trash-alt text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-10 py-40 text-center text-slate-500 text-[10px] font-black tracking-[0.5em] uppercase italic">Aucun résultat trouvé pour cette recherche</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {dbError && (
          <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[3rem] text-center space-y-6">
             <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
             <h2 className="text-2xl font-black uppercase tracking-tighter text-red-400">Problème de Synchronisation</h2>
             <p className="text-slate-400 max-w-md mx-auto">{dbError}</p>
             <button onClick={refreshData} className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all">Réessayer la connexion</button>
          </div>
        )}
      </div>

      {/* Detail Modal : Vue complète de l'inscrit */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-[#020817]/95 backdrop-blur-3xl overflow-y-auto py-10">
          <div className="bg-[#0c111d] border border-white/10 rounded-[3rem] shadow-2xl max-w-4xl w-full p-8 md:p-12 animate-in zoom-in-95 duration-500 relative">
             
             {/* Header Modal */}
             <div className="flex justify-between items-start mb-12">
                <div className="flex gap-6 items-center">
                   <div className="w-20 h-20 bg-assirou-gold/10 rounded-[1.5rem] flex items-center justify-center text-assirou-gold text-3xl border border-assirou-gold/20">
                      {selected.sexe === 'Homme' ? <i className="fas fa-user-tie"></i> : <i className="fas fa-user-graduate"></i>}
                   </div>
                   <div>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{selected.nom_complet}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-assirou-gold text-[10px] font-black uppercase tracking-[0.3em]">{selected.numero_ticket}</span>
                        <span className="text-slate-600 text-[10px] font-black uppercase">•</span>
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Inscrit le {new Date(selected.date_inscription).toLocaleString('fr-FR')}</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white border border-white/5 transition-all"><i className="fas fa-times text-2xl"></i></button>
             </div>
             
             {/* Content Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                
                {/* Section 1 : Informations Identité */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                      <i className="fas fa-id-card text-assirou-gold text-xs"></i>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identité & Contact</h4>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sexe</p><p className="text-sm font-bold text-white uppercase">{selected.sexe}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Téléphone</p><p className="text-sm font-bold text-white uppercase">{selected.telephone}</p></div>
                      <div className="space-y-1 col-span-2"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Email</p><p className="text-sm font-bold text-white">{selected.adresse_email}</p></div>
                   </div>
                </div>

                {/* Section 2 : Profil Pro */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                      <i className="fas fa-briefcase text-assirou-gold text-xs"></i>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Profil Professionnel</h4>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1 col-span-2"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Organisation</p><p className="text-sm font-bold text-white uppercase">{selected.organisation_entreprise || 'PARTICULIER'}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Fonction</p><p className="text-sm font-bold text-white uppercase">{selected.fonction || 'NON SPÉCIFIÉ'}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Participation</p><p className="text-sm font-bold text-white uppercase">{selected.participation}</p></div>
                   </div>
                </div>

                {/* Section 3 : Sources & Vision */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                      <i className="fas fa-bullhorn text-assirou-gold text-xs"></i>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Vision & Réseaux</h4>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Canaux de découverte</p>
                        <div className="flex flex-wrap gap-2">
                           {(selected.canal_forum || []).length > 0 ? selected.canal_forum.map(c => <span key={c} className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-bold text-slate-300 border border-white/5 uppercase">{c}</span>) : <span className="text-[10px] text-slate-500 italic">Aucune donnée</span>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Suivi Assirou</p>
                        <div className="flex flex-wrap gap-2">
                           {(selected.canal_assirou || []).length > 0 ? selected.canal_assirou.map(c => <span key={c} className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-bold text-slate-300 border border-white/5 uppercase">{c}</span>) : <span className="text-[10px] text-slate-500 italic">Aucune donnée</span>}
                        </div>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Attentes / Avis thème</p>
                         <p className="text-xs text-slate-300 italic leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">{selected.avis_theme || 'Aucun avis laissé par le participant.'}</p>
                      </div>
                   </div>
                </div>

                {/* Section 4 : Besoins & Services */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                      <i className="fas fa-graduation-cap text-assirou-gold text-xs"></i>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Besoins & Intérêts</h4>
                   </div>
                   <div className="space-y-6">
                      <div className="bg-assirou-gold/5 border border-assirou-gold/10 p-5 rounded-3xl space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-assirou-gold uppercase tracking-widest">Formation souhaitée</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${selected.souhait_formation === 'Oui' ? 'bg-assirou-gold text-assirou-navy' : 'bg-slate-800 text-slate-500'}`}>{selected.souhait_formation}</span>
                         </div>
                         {selected.souhait_formation === 'Oui' && (
                            <div className="flex flex-wrap gap-2">
                               {selected.type_formation.map(t => <span key={t} className="text-[9px] font-bold text-slate-300 flex items-center gap-1.5"><i className="fas fa-check text-[7px] text-assirou-gold"></i> {t}</span>)}
                            </div>
                         )}
                      </div>

                      <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-3xl space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Services intéressés</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${selected.interet_services === 'Oui' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>{selected.interet_services}</span>
                         </div>
                         {selected.interet_services === 'Oui' && (
                            <div className="flex flex-wrap gap-2">
                               {selected.services_interesses.map(s => <span key={s} className="text-[9px] font-bold text-slate-300 flex items-center gap-1.5"><i className="fas fa-check text-[7px] text-blue-400"></i> {s}</span>)}
                            </div>
                         )}
                      </div>
                   </div>
                </div>

             </div>

             {/* Footer Modal Actions */}
             <div className="mt-16 flex flex-col md:flex-row gap-4">
                <button onClick={() => setSelected(null)} className="flex-1 py-5 bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-white/5 hover:bg-white/10 transition-all">Retour à la liste</button>
                <button onClick={() => openMailClient(selected)} className="flex-1 py-5 bg-assirou-gold text-assirou-navy rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 flex items-center justify-center gap-3 shadow-xl shadow-assirou-gold/10">
                   <i className="fas fa-paper-plane text-sm"></i> Envoyer Confirmation Manuelle
                </button>
                <button onClick={() => handleDelete(selected)} className="px-10 py-5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-red-500/20 transition-all">
                   Supprimer l'inscrit
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
