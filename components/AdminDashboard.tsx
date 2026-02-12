
import React, { useState, useEffect, useCallback } from 'react';
import { getParticipants, isRegistrationActive, setRegistrationStatus, isScanSystemActive, setScanSystemStatus, exportParticipantsToCSV, deleteParticipant, validateTicket, subscribeToParticipants, supabase } from '../utils/storage';
import { Participant } from '../types';
import { openMailClient } from '../services/mailService';

const AdminDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [active, setActive] = useState(true);
  const [scanActive, setScanActive] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'local'>('loading');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("AdminDashboard: Tentative de récupération des données...");
      
      const data = await getParticipants();
      console.log("AdminDashboard: Participants reçus :", data.length);
      setParticipants(data);
      
      const regStatus = await isRegistrationActive();
      const sActive = await isScanSystemActive();
      setActive(regStatus);
      setScanActive(sActive);

      if (!supabase) setDbStatus('local');
      else setDbStatus('connected');
    } catch (err) {
      console.error("AdminDashboard Error:", err);
      setDbStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const channel = subscribeToParticipants(() => {
      console.log("AdminDashboard: Mise à jour en temps réel reçue");
      loadData();
    });
    if (channel) setIsLive(true);
    return () => { 
      if (channel && supabase) supabase.removeChannel(channel); 
    };
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Supprimer définitivement ${name} ?`)) {
      setLoading(true);
      const success = await deleteParticipant(id);
      if (success) await loadData();
      else {
        alert("Erreur lors de la suppression.");
        setLoading(false);
      }
    }
  };

  const handleManualValidate = async (p: Participant) => {
    if (window.confirm(`Valider manuellement l'entrée de ${p.nom_complet} ?`)) {
      setLoading(true);
      const success = await validateTicket(p.id);
      if (success) await loadData();
      else {
        alert("Erreur lors de la validation.");
        setLoading(false);
      }
    }
  };

  // Filtrage sécurisé contre les valeurs null/undefined
  const filtered = participants.filter(p => {
    const s = search.toLowerCase();
    return (
      (p.nom_complet?.toLowerCase() || '').includes(s) || 
      (p.numero_ticket?.toLowerCase() || '').includes(s) ||
      (p.adresse_email?.toLowerCase() || '').includes(s) ||
      (p.organisation_entreprise?.toLowerCase() || '').includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-4 md:p-10 font-sans selection:bg-assirou-gold selection:text-assirou-navy">
      <div className="max-w-[1400px] mx-auto space-y-10">
        
        {/* HEADER AREA */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white/5 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 backdrop-blur-xl gap-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-assirou-gold/50 via-assirou-gold to-transparent opacity-30"></div>
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
               <span className="text-assirou-navy font-black text-2xl">AS</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Soumissions <span className="text-assirou-gold">Participants</span></h1>
                
                <div className="flex gap-2">
                  {isLive && <div className="bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span><span className="text-[8px] font-black uppercase text-green-500">Live</span></div>}
                  {dbStatus === 'connected' ? (
                    <div className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase flex items-center gap-1.5"><i className="fas fa-database"></i> Cloud</div>
                  ) : (
                    <div className="bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 text-orange-400 text-[8px] font-black uppercase flex items-center gap-1.5"><i className="fas fa-hdd"></i> Local Only</div>
                  )}
                </div>
              </div>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.5em] mt-2">Forum Sécurité 2026 • Gestion des Inscriptions</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            <button onClick={exportParticipantsToCSV} className="flex-1 xl:flex-none px-6 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <i className="fas fa-download text-assirou-gold"></i> Export CSV
            </button>
            <button 
              onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} 
              className={`flex-1 xl:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${active ? 'bg-green-600/10 border-green-500 text-green-500' : 'bg-red-600/10 border-red-500 text-red-500'}`}
            >
              Statut: {active ? 'Ouvert' : 'Fermé'}
            </button>
            <button onClick={loadData} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
               <i className={`fas fa-sync-alt ${loading ? 'fa-spin text-assirou-gold' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* STATS & SEARCH */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 relative group">
            <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-assirou-gold transition-colors"></i>
            <input 
              placeholder="Chercher une soumission (Nom, Email, Ticket)..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-5 outline-none focus:border-assirou-gold/50 transition-all text-sm font-medium" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col justify-center">
             <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Inscrits</p>
             <p className="text-3xl font-black text-white">{participants.length}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col justify-center">
             <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Présence Réelle</p>
             <p className="text-3xl font-black text-green-500">{participants.filter(p => p.scan_valide).length}</p>
          </div>
        </div>

        {/* MAIN LISTING TABLE */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden backdrop-blur-md shadow-2xl relative min-h-[500px]">
          {loading && participants.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
               <div className="w-16 h-16 border-4 border-assirou-gold border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Chargement du registre...</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
               <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-700 text-4xl mb-6">
                  <i className="fas fa-clipboard-list"></i>
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Aucune soumission</h3>
               <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">Le registre est vide. Les inscriptions s'afficheront ici automatiquement après validation du formulaire public.</p>
               <button onClick={loadData} className="mt-8 px-8 py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white/20 transition-all">Actualiser la base</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.02]">
                    <th className="px-10 py-6">Participant & Ticket</th>
                    <th className="px-10 py-6">Type & Orga</th>
                    <th className="px-10 py-6">Contribution / Avis</th>
                    <th className="px-10 py-6">Besoins / Intérêts</th>
                    <th className="px-10 py-6">Validation</th>
                    <th className="px-10 py-6 text-right">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(p => (
                    <tr key={p.id || p.numero_ticket} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="px-10 py-6">
                        <div className="font-black text-base text-white group-hover:text-assirou-gold transition-colors">{p.nom_complet || 'Nom inconnu'}</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{p.numero_ticket}</div>
                        <div className="text-[9px] text-slate-600 font-medium mt-0.5">{p.adresse_email}</div>
                      </td>
                      <td className="px-10 py-6">
                         <div className="text-[10px] font-black text-assirou-gold uppercase tracking-tighter mb-1">{p.participation || 'Individuel'}</div>
                         <div className="text-xs font-bold text-slate-400 max-w-[150px] truncate">{p.organisation_entreprise || '—'}</div>
                      </td>
                      <td className="px-10 py-6 max-w-[250px]">
                         <p className="text-[11px] font-medium text-slate-300 italic leading-relaxed line-clamp-2">
                           {p.avis_theme ? `"${p.avis_theme}"` : <span className="text-slate-700">Aucun avis saisi</span>}
                         </p>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-wrap gap-2">
                           <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${p.souhait_formation === 'Oui' ? 'bg-green-500/20 text-green-500 border border-green-500/20' : 'bg-slate-800 text-slate-600'}`}>Form.</span>
                           <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${p.interet_services === 'Oui' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-600'}`}>Serv.</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        {p.scan_valide ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[9px] font-black uppercase">
                            <i className="fas fa-check-double"></i> Présent
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleManualValidate(p)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-slate-500 rounded-lg text-[9px] font-black uppercase hover:bg-assirou-gold hover:text-assirou-navy transition-all"
                          >
                            <i className="fas fa-user-clock"></i> Valider
                          </button>
                        )}
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelected(p)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-assirou-navy border border-white/5 transition-all flex items-center justify-center"><i className="fas fa-eye text-xs"></i></button>
                          <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-red-600 border border-white/5 text-red-500 hover:text-white transition-all flex items-center justify-center"><i className="fas fa-trash-alt text-xs"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && participants.length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-10 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs italic">
                         Aucun résultat pour "{search}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
          <div className="bg-[#0c111d] border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            {/* Modal Head */}
            <div className="p-8 md:p-10 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="px-3 py-1 bg-assirou-gold text-assirou-navy rounded-lg text-[10px] font-black uppercase">Dossier Complet</div>
                   <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{selected.numero_ticket}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">{selected.nom_complet}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all border border-white/5">
                <i className="fas fa-times text-xl md:text-2xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                  <p className="text-[10px] font-black text-assirou-gold uppercase tracking-[0.2em]">Coordonnées</p>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-white flex items-center gap-3"><i className="fas fa-envelope text-slate-600 w-4"></i> {selected.adresse_email}</p>
                    <p className="text-sm font-bold text-white flex items-center gap-3"><i className="fas fa-phone text-slate-600 w-4"></i> {selected.telephone}</p>
                    <p className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded w-fit mt-2 uppercase">{selected.sexe}</p>
                  </div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                  <p className="text-[10px] font-black text-assirou-gold uppercase tracking-[0.2em]">Parcours</p>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-white">{selected.organisation_entreprise || 'Personnel'}</p>
                    <p className="text-xs font-medium text-slate-400">{selected.fonction || 'Non renseigné'}</p>
                    <p className="text-[10px] font-black text-white bg-assirou-gold/20 px-2 py-1 rounded w-fit mt-2 uppercase">{selected.participation}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black text-assirou-gold uppercase tracking-[0.2em]">Contribution intellectuelle</p>
                 <div className="p-8 bg-assirou-gold/5 rounded-[2rem] border border-assirou-gold/10 relative">
                    <i className="fas fa-quote-left absolute top-6 left-6 text-assirou-gold/10 text-4xl"></i>
                    <p className="text-base font-medium text-slate-200 leading-relaxed italic pl-6 relative z-10">
                      {selected.avis_theme ? `"${selected.avis_theme}"` : "Aucun avis formulé."}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intérêt Formations</p>
                   {selected.souhait_formation === 'Oui' ? (
                     <div className="flex flex-wrap gap-2">
                        {selected.type_formation?.map(f => <span key={f} className="px-3 py-1.5 bg-assirou-navy border border-white/10 rounded-xl text-[9px] font-black text-white uppercase">{f}</span>)}
                     </div>
                   ) : <span className="text-xs text-slate-600 italic">Pas d'intérêt</span>}
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Besoins Services</p>
                   {selected.interet_services === 'Oui' ? (
                     <div className="flex flex-wrap gap-2">
                        {selected.services_interesses?.map(s => <span key={s} className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/20 rounded-xl text-[9px] font-black text-blue-400 uppercase">{s}</span>)}
                     </div>
                   ) : <span className="text-xs text-slate-600 italic">Pas de besoin</span>}
                </div>
              </div>
            </div>

            {/* Modal Foot */}
            <div className="p-8 md:p-10 border-t border-white/10 bg-black/20 flex flex-col md:flex-row gap-4">
              <button onClick={() => setSelected(null)} className="flex-1 py-5 rounded-2xl bg-white/5 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Fermer le dossier</button>
              <button onClick={() => openMailClient(selected)} className="flex-[1.5] py-5 rounded-2xl bg-assirou-gold text-assirou-navy font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-xl">
                <i className="fas fa-envelope"></i> Contacter par email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
