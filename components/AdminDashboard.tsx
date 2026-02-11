
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
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatisation de l'envoi des mails en attente
  useEffect(() => {
    if (!isAutomating) return;
    const autoProcess = async () => {
      const pending = participants.filter(p => p.statut_email === 'pending');
      for (const p of pending) {
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
    if (window.confirm(`⚠️ SUPPRIMER DÉFINITIVEMENT ${name} ?`)) {
      const success = await deleteParticipant(id);
      if (success) {
        setParticipants(prev => prev.filter(p => p.id !== id));
        if (selected?.id === id) setSelected(null);
      }
    }
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
          <i className="fas fa-circle-notch fa-spin text-4xl text-assirou-gold"></i>
          <p className="text-white font-black text-[10px] uppercase tracking-widest">Connexion sécurisée...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/5 p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Panel <span className="text-assirou-gold">Admin</span></h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Gestion des inscriptions - Forum 2026</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center min-w-[100px]">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Inscrits</span>
              <span className="text-2xl font-black">{participants.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setIsAutomating(!isAutomating)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${isAutomating ? 'bg-assirou-gold text-assirou-navy border-assirou-gold' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                {isAutomating ? 'Auto-Mail: ACTIF' : 'Auto-Mail: PAUSE'}
              </button>
              <button onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all shadow-lg ${active ? 'bg-green-600' : 'bg-red-600'}`}>
                Portail {active ? 'OUVERT' : 'FERMÉ'}
              </button>
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-96 group">
             <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-assirou-gold transition-colors"></i>
             <input type="text" placeholder="Rechercher par nom, mail ou ticket..." className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm outline-none focus:border-assirou-gold focus:bg-white/10 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
           </div>
           <button onClick={exportParticipantsToCSV} className="w-full md:w-auto px-8 py-4 bg-white text-assirou-navy rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-assirou-gold transition-all shadow-xl">
             <i className="fas fa-file-csv mr-2 text-lg"></i> Exporter CSV
           </button>
        </div>

        {/* Main List */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-6">Participant</th>
                  <th className="px-8 py-6">Profil</th>
                  <th className="px-8 py-6">Statut Mail</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.04] group transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-sm">{p.nom_complet}</div>
                      <div className="text-[10px] text-assirou-gold font-bold tracking-tighter">{p.numero_ticket}</div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[10px] font-bold text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{p.participation}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-md ${p.statut_email === 'sent' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : p.statut_email === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-assirou-gold/20 text-assirou-gold border border-assirou-gold/20 animate-pulse'}`}>
                          {p.statut_email}
                        </span>
                        {p.statut_email !== 'sent' && (
                          <button onClick={() => openMailClient(p)} className="text-[9px] font-black text-assirou-gold hover:underline">
                            <i className="fas fa-paper-plane mr-1"></i> Envoyer
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button onClick={() => setSelected(p)} className="w-10 h-10 inline-flex items-center justify-center bg-white/5 rounded-xl hover:bg-assirou-gold hover:text-assirou-navy transition-all shadow-lg border border-white/5"><i className="fas fa-eye text-sm"></i></button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-10 h-10 inline-flex items-center justify-center bg-white/5 rounded-xl hover:bg-red-600 transition-all text-red-400 hover:text-white shadow-lg border border-white/5"><i className="fas fa-trash text-sm"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Détails Modal Ultra-Complet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <button onClick={() => setSelected(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-2xl"></i></button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-assirou-gold text-assirou-navy rounded-2xl flex items-center justify-center text-2xl font-black">
                {selected.nom_complet.charAt(0)}
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tight">{selected.nom_complet}</h3>
                <p className="text-assirou-gold text-[10px] font-black uppercase tracking-[0.4em]">{selected.numero_ticket}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Infos Contact */}
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-3">Coordonnées de contact</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-bold bg-white/5 p-3 rounded-xl border border-white/5">
                      <i className="fas fa-envelope text-assirou-gold w-4"></i> {selected.adresse_email}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold bg-white/5 p-3 rounded-xl border border-white/5">
                      <i className="fas fa-phone text-assirou-gold w-4"></i> {selected.telephone}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold bg-white/5 p-3 rounded-xl border border-white/5">
                      <i className="fas fa-building text-assirou-gold w-4"></i> {selected.organisation_entreprise || 'Aucune structure renseignée'}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-3">Profil & Participation</p>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black uppercase text-assirou-gold mb-1">Type de profil</p>
                    <p className="text-sm font-bold mb-4">{selected.participation}</p>
                    <p className="text-[10px] font-black uppercase text-assirou-gold mb-1">Avis sur le thème</p>
                    <p className="text-xs italic text-slate-400 leading-relaxed font-medium">"{selected.avis_theme || 'Aucun avis laissé'}"</p>
                  </div>
                </div>
              </div>

              {/* Infos Marketing & Besoins */}
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-3">Canaux d'acquisition</p>
                  <div className="space-y-3">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-slate-500 mb-2">Via le FORUM</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.canal_forum.length > 0 ? selected.canal_forum.map(c => <span key={c} className="text-[9px] font-black bg-assirou-gold/20 text-assirou-gold px-2 py-1 rounded-md">{c}</span>) : <span className="text-[9px] text-slate-600">N/A</span>}
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-slate-500 mb-2">Via ASSIROU SÉCURITÉ</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.canal_assirou.length > 0 ? selected.canal_assirou.map(c => <span key={c} className="text-[9px] font-black bg-white/10 text-white px-2 py-1 rounded-md">{c}</span>) : <span className="text-[9px] text-slate-600">N/A</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-3">Intérêts spécifiques</p>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div>
                      <p className="text-[9px] font-black uppercase text-assirou-gold mb-2">Formations souhaitées</p>
                      {selected.souhait_formation === 'Oui' ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selected.type_formation.map(f => <span key={f} className="text-[9px] font-black bg-green-500/20 text-green-400 px-2 py-1 rounded-md">{f}</span>)}
                        </div>
                      ) : <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Aucune</p>}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-assirou-gold mb-2">Services intéressés</p>
                      {selected.interet_services === 'Oui' ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selected.services_interesses.map(s => <span key={s} className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md">{s}</span>)}
                        </div>
                      ) : <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Aucun</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-white/5">
              <button onClick={() => openMailClient(selected)} className="flex-1 bg-assirou-gold text-assirou-navy py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-[#d4b035] transition-all">
                <i className="fas fa-paper-plane mr-2"></i> Envoyer E-mail Manuel
              </button>
              <button onClick={() => setSelected(null)} className="flex-1 bg-white/5 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">
                Fermer les Détails
              </button>
              <button onClick={() => handleDelete(selected.id, selected.nom_complet)} className="px-8 py-5 bg-red-600/10 text-red-500 border border-red-600/20 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
