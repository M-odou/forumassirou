
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

  const loadData = useCallback(async () => {
    const data = await getParticipants();
    const regStatus = await isRegistrationActive();
    const sActive = await isScanSystemActive();
    setParticipants(data);
    setActive(regStatus);
    setScanActive(sActive);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const channel = subscribeToParticipants(() => {
      loadData();
    });
    
    if (channel) setIsLive(true);

    return () => { 
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Supprimer définitivement le participant ${name} ?`)) {
      setLoading(true);
      await deleteParticipant(id);
      await loadData();
      setLoading(false);
    }
  };

  const handleManualValidate = async (p: Participant) => {
    if (p.scan_valide) return;
    if (window.confirm(`Valider manuellement l'entrée de ${p.nom_complet} ?`)) {
      setLoading(true);
      await validateTicket(p.id);
      await loadData();
      setLoading(false);
    }
  };

  const filtered = participants.filter(p => 
    p.nom_complet.toLowerCase().includes(search.toLowerCase()) || 
    p.numero_ticket.includes(search) ||
    p.adresse_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-assirou-navy text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & GLOBAL CONTROLS */}
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-xl gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-assirou-gold to-transparent opacity-30"></div>
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 shrink-0">
               <span className="text-assirou-navy font-black text-2xl">AS</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Tableau <span className="text-assirou-gold">de Bord</span></h1>
                {isLive && <div className="flex items-center gap-1.5 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span><span className="text-[8px] font-black uppercase text-green-500">Live</span></div>}
              </div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.4em] mt-1">Gestion des Inscriptions • Forum 2026</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center w-full lg:w-auto">
            <button onClick={exportParticipantsToCSV} className="px-6 py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
              <i className="fas fa-file-csv text-assirou-gold"></i> Export
            </button>
            <button 
              onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} 
              className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase transition-all shadow-xl border-2 ${active ? 'bg-green-600/10 border-green-500 text-green-500' : 'bg-red-600/10 border-red-500 text-red-500'}`}
            >
              Inscriptions: {active ? 'Ouvertes' : 'Fermées'}
            </button>
            <button 
              onClick={async () => { const s = !scanActive; await setScanSystemStatus(s); setScanActive(s); }} 
              className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase transition-all shadow-xl flex items-center justify-center gap-2 ${scanActive ? 'bg-assirou-gold text-assirou-navy' : 'bg-slate-700 text-slate-400'}`}
            >
              <i className="fas fa-qrcode"></i> Scan: {scanActive ? 'Actif' : 'Désactivé'}
            </button>
          </div>
        </div>

        {/* LISTING SECTION */}
        <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-6 md:p-10 border-b border-white/5 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="relative w-full md:w-96 group">
              <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-assirou-gold transition-colors"></i>
              <input 
                placeholder="Chercher un participant..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-assirou-gold transition-all text-sm font-medium" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Total Soumissions</p>
                <p className="text-2xl font-black text-white leading-none">{participants.length}</p>
              </div>
              <button onClick={loadData} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10">
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.02]">
                  <th className="px-10 py-6">Soumissionnaire</th>
                  <th className="px-10 py-6">Détails Soumission</th>
                  <th className="px-10 py-6">Besoins</th>
                  <th className="px-10 py-6">Statut</th>
                  <th className="px-10 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="group hover:bg-white/[0.03] transition-colors">
                    <td className="px-10 py-6">
                      <div className="font-black text-base group-hover:text-assirou-gold transition-colors">{p.nom_complet}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{p.numero_ticket}</div>
                    </td>
                    <td className="px-10 py-6">
                       <p className="text-[11px] font-bold text-slate-300 truncate max-w-[200px]">
                         {p.avis_theme ? p.avis_theme : <span className="text-slate-600 italic">Aucun avis saisi</span>}
                       </p>
                       <p className="text-[9px] text-slate-500 uppercase font-black mt-1">{p.organisation_entreprise || 'Particulier'}</p>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex gap-2">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${p.souhait_formation === 'Oui' ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-white/20'}`} title="Formation">F</span>
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${p.interet_services === 'Oui' ? 'bg-blue-500/20 text-blue-500' : 'bg-white/5 text-white/20'}`} title="Services">S</span>
                       </div>
                    </td>
                    <td className="px-10 py-6">
                      {p.scan_valide ? (
                        <span className="text-green-500 text-[9px] font-black uppercase flex items-center gap-1"><i className="fas fa-check-circle"></i> Présent</span>
                      ) : (
                        <span className="text-slate-500 text-[9px] font-black uppercase flex items-center gap-1"><i className="fas fa-clock"></i> Inscrit</span>
                      )}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button onClick={() => setSelected(p)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-assirou-gold hover:text-assirou-navy transition-all border border-white/5"><i className="fas fa-expand-alt"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DOSSIER COMPLET */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-assirou-navy/95 backdrop-blur-2xl">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{selected.nom_complet}</h3>
                <p className="text-assirou-gold text-[10px] font-black uppercase tracking-widest mt-2">{selected.numero_ticket} • Inscrit le {new Date(selected.date_inscription).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Contact & Identité</p>
                  <p className="text-sm font-bold text-white mb-1">{selected.adresse_email}</p>
                  <p className="text-sm font-bold text-white mb-3">{selected.telephone}</p>
                  <p className="text-[10px] font-black text-assirou-gold uppercase">{selected.sexe}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Profil Professionnel</p>
                  <p className="text-sm font-bold text-white mb-1">{selected.organisation_entreprise || 'Personnel'}</p>
                  <p className="text-sm font-bold text-white mb-1">{selected.fonction || 'Non renseigné'}</p>
                  <p className="text-[10px] font-black text-assirou-gold uppercase">{selected.participation}</p>
                </div>
              </div>

              <div className="p-8 bg-assirou-gold/5 rounded-[2.5rem] border border-assirou-gold/10">
                 <p className="text-[9px] text-assirou-gold font-black uppercase tracking-widest mb-4">Avis sur le thème du Forum :</p>
                 <p className="text-base font-medium text-slate-200 leading-relaxed italic">
                   {selected.avis_theme ? `"${selected.avis_theme}"` : "Le participant n'a pas laissé d'avis sur le thème."}
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                   <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest">Intérêt Formations</p>
                   {selected.souhait_formation === 'Oui' && selected.type_formation?.length ? (
                     <div className="flex flex-wrap gap-2">
                        {selected.type_formation.map(f => <span key={f} className="px-2 py-1 bg-assirou-gold/20 text-assirou-gold rounded text-[9px] font-black uppercase">{f}</span>)}
                     </div>
                   ) : <span className="text-xs text-slate-600">Aucun intérêt</span>}
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                   <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest">Besoins Services</p>
                   {selected.interet_services === 'Oui' && selected.services_interesses?.length ? (
                     <div className="flex flex-wrap gap-2">
                        {selected.services_interesses.map(s => <span key={s} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[9px] font-black uppercase">{s}</span>)}
                     </div>
                   ) : <span className="text-xs text-slate-600">Aucun besoin</span>}
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                 <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest">Comment il nous a connu</p>
                 <div className="flex flex-wrap gap-2">
                    {selected.canal_forum?.map(c => <span key={c} className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase text-white/50">{c}</span>)}
                 </div>
              </div>
            </div>

            <div className="p-10 border-t border-white/10 bg-black/20 flex gap-4">
              <button onClick={() => setSelected(null)} className="flex-1 py-5 rounded-2xl bg-white/5 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Fermer</button>
              <button onClick={() => handleDelete(selected.id, selected.nom_complet)} className="px-6 py-5 rounded-2xl bg-red-600/10 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash-alt"></i></button>
              <button onClick={() => openMailClient(selected)} className="flex-[1.5] py-5 rounded-2xl bg-assirou-gold text-assirou-navy font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-3">
                <i className="fas fa-envelope"></i> Contacter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
