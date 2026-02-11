
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
      if (pending.length === 0) return;

      for (const p of pending) {
        console.log(`Automation : Tentative d'envoi à ${p.nom_complet}...`);
        // On marque localement comme traité pour éviter de renvoyer pendant l'exécution
        setParticipants(prev => prev.map(item => 
          item.numero_ticket === p.numero_ticket ? {...item, statut_email: 'sent'} : item
        ));
        await sendConfirmationEmail(p);
      }
    };

    const timer = setTimeout(autoProcess, 3000);
    return () => clearTimeout(timer);
  }, [participants, isAutomating]);

  // TEMPS RÉEL : Abonnement aux changements de la base
  useEffect(() => {
    loadData();
    const subscription = subscribeToParticipants(() => {
      console.log("Mise à jour base de données détectée !");
      loadData();
    });
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [loadData]);

  const toggleStatus = async () => {
    const newState = !active;
    await setRegistrationStatus(newState);
    setActive(newState);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`⚠️ ATTENTION : Supprimer définitivement l'inscription de ${name} ?`)) {
      const success = await deleteParticipant(id);
      if (success) {
        setParticipants(prev => prev.filter(p => p.id !== id));
        if (selected?.id === id) setSelected(null);
        alert("Inscription supprimée avec succès.");
      } else {
        alert("Erreur lors de la suppression.");
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
          <i className="fas fa-robot fa-spin text-4xl text-assirou-gold"></i>
          <p className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Initialisation du Worker IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Worker */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[8px] font-black uppercase text-green-400">Live Sync Enabled</span>
          </div>

          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
              Assirou <span className="text-assirou-gold">Admin</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Pilotage intelligent des accès au Forum 2026</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button onClick={() => setIsAutomating(!isAutomating)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${isAutomating ? 'bg-assirou-gold text-assirou-navy border-assirou-gold' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              <i className={`fas ${isAutomating ? 'fa-bolt' : 'fa-pause'} mr-2`}></i> {isAutomating ? 'Automatisation Active' : 'Auto-Mail Manuel'}
            </button>
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              <i className="fas fa-file-csv mr-2"></i> Export
            </button>
            <button onClick={toggleStatus} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${active ? 'bg-green-600' : 'bg-red-600'}`}>
              Portail {active ? 'OUVERT' : 'FERMÉ'}
            </button>
          </div>
        </div>

        {/* Tableau des Inscriptions */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black uppercase tracking-widest">Base de Données ({participants.length})</h2>
            <input type="text" placeholder="Recherche nom, email, ticket..." className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-sm outline-none focus:border-assirou-gold w-full md:w-96" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-6">Participant</th>
                  <th className="px-8 py-6">Ticket</th>
                  <th className="px-8 py-6">Email Statut</th>
                  <th className="px-8 py-6 text-right">Gestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id || p.numero_ticket} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-black text-sm">{p.nom_complet}</div>
                      <div className="text-[10px] text-slate-500">{p.telephone}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-assirou-gold font-bold text-xs">{p.numero_ticket}</div>
                      <div className="text-[10px] text-slate-600">{p.adresse_email}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded inline-flex items-center gap-2 ${p.statut_email === 'sent' ? 'bg-green-500/20 text-green-400' : p.statut_email === 'pending' ? 'bg-assirou-gold/20 text-assirou-gold' : 'bg-red-500/20 text-red-400'}`}>
                        {p.statut_email === 'pending' && <i className="fas fa-spinner fa-spin"></i>}
                        {p.statut_email}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelected(p)} className="w-9 h-9 bg-white/5 rounded-lg hover:bg-assirou-gold hover:text-assirou-navy transition-all flex items-center justify-center" title="Détails">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-9 h-9 bg-white/5 rounded-lg hover:bg-red-500 transition-all flex items-center justify-center text-red-400 hover:text-white" title="Supprimer">
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

      {/* Détails du Participant */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] p-10 max-w-xl w-full relative animate-in zoom-in duration-300">
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><i className="fas fa-times text-2xl"></i></button>
            
            <div className="mb-8">
              <h3 className="text-3xl font-black mb-1 uppercase">{selected.nom_complet}</h3>
              <p className="text-assirou-gold font-bold tracking-widest text-xs">{selected.numero_ticket}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Email</p>
                  <p className="text-sm font-bold truncate">{selected.adresse_email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Téléphone</p>
                  <p className="text-sm font-bold">{selected.telephone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Formation</p>
                  <p className="text-sm font-bold">{selected.souhait_formation === 'Oui' ? selected.type_formation.join(', ') : 'Aucune'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Statut Mail</p>
                  <p className="text-sm font-black text-assirou-gold uppercase">{selected.statut_email}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => sendConfirmationEmail(selected)} className="flex-1 bg-white/5 border border-white/10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-assirou-gold transition-all">Renvoyer Confirmation</button>
              <button onClick={() => handleDelete(selected.id, selected.nom_complet)} className="flex-1 bg-red-600/10 border border-red-600/20 text-red-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Supprimer</button>
              <a href={`#/ticket/${selected.numero_ticket}`} target="_blank" className="flex-1 bg-assirou-gold text-assirou-navy py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-center shadow-xl">Voir Badge</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
