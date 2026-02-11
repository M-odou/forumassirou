
import React, { useState, useEffect } from 'react';
import { getParticipants, isRegistrationActive, setRegistrationStatus, exportParticipantsToCSV, deleteParticipant } from '../utils/storage';
import { Participant } from '../types';

const AdminDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [active, setActive] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getParticipants();
      const status = await isRegistrationActive();
      setParticipants(data);
      setActive(status);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleStatus = async () => {
    const newState = !active;
    await setRegistrationStatus(newState);
    setActive(newState);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'inscription de ${name} ?`)) {
      setDeletingId(id);
      const success = await deleteParticipant(id);
      if (success) {
        setParticipants(prev => prev.filter(p => p.id !== id));
        if (selected?.id === id) setSelected(null);
      } else {
        alert("Erreur lors de la suppression.");
      }
      setDeletingId(null);
    }
  };

  const filtered = participants.filter(p => 
    p.nom_complet.toLowerCase().includes(search.toLowerCase()) || 
    p.adresse_email.toLowerCase().includes(search.toLowerCase()) ||
    p.numero_ticket.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && participants.length === 0) {
    return (
      <div className="min-h-screen bg-[#00153a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <i className="fas fa-circle-notch fa-spin text-4xl text-assirou-gold"></i>
          <p className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Chargement sécurisé...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/5 p-10 rounded-[3rem] border border-white/10">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-assirou-gold rounded-2xl flex items-center justify-center text-assirou-navy">
                <i className="fas fa-user-shield text-2xl"></i>
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">Console <span className="text-assirou-gold">Admin</span></h1>
            </div>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest pl-16">Gestion des Accréditations 2026</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <button onClick={loadData} className="w-12 h-12 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all flex items-center justify-center">
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>
            <button onClick={exportParticipantsToCSV} className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-assirou-gold hover:text-assirou-navy rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
              <i className="fas fa-file-export"></i> Export CSV
            </button>
            <button onClick={toggleStatus} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${active ? 'bg-green-600 shadow-green-600/20' : 'bg-red-600 shadow-red-600/20'}`}>
              <i className={`fas ${active ? 'fa-unlock' : 'fa-lock'}`}></i>
              {active ? 'Ouvert' : 'Fermé'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total</p>
            <div className="text-6xl font-black text-white">{participants.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Formations</p>
            <div className="text-6xl font-black text-assirou-gold">{participants.filter(p => p.souhait_formation === 'Oui').length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Services</p>
            <div className="text-6xl font-black text-blue-400">{participants.filter(p => p.interet_services === 'Oui').length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl flex items-center justify-center">
             <img src="https://api.dicebear.com/7.x/initials/svg?seed=AS&backgroundColor=C5A022" className="w-16 h-16 rounded-2xl opacity-50" />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
          <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <h3 className="text-2xl font-black uppercase tracking-tight">Soumissions</h3>
            <input type="text" placeholder="Recherche..." className="w-full md:w-96 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-assirou-gold transition-all font-bold text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
                  <th className="px-10 py-8">Participant</th>
                  <th className="px-10 py-8">Ticket</th>
                  <th className="px-10 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id || p.numero_ticket} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-10 py-8">
                      <div className="font-black">{p.nom_complet}</div>
                      <div className="text-xs text-slate-500">{p.adresse_email}</div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="text-assirou-gold font-bold mono text-xs">{p.numero_ticket}</div>
                    </td>
                    <td className="px-10 py-8 text-right flex justify-end gap-3">
                      <button onClick={() => setSelected(p)} className="w-10 h-10 bg-white/5 hover:bg-assirou-gold hover:text-assirou-navy rounded-xl transition-all flex items-center justify-center">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-10 h-10 bg-white/5 hover:bg-red-500 rounded-xl transition-all flex items-center justify-center">
                        <i className="fas fa-trash"></i>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#000d26]/90 backdrop-blur-md">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] p-12 max-w-3xl w-full shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
               <div>
                 <h3 className="text-3xl font-black mb-2">{selected.nom_complet}</h3>
                 <span className="bg-assirou-gold/10 text-assirou-gold px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest">{selected.participation}</span>
               </div>
               <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white"><i className="fas fa-times text-2xl"></i></button>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-10">
               <div>
                 <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Contact</p>
                 <p className="font-bold">{selected.telephone}</p>
                 <p className="font-bold text-slate-400 text-sm">{selected.adresse_email}</p>
               </div>
               <div>
                 <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Formation</p>
                 <p className="font-bold">{selected.souhait_formation === 'Oui' ? (selected.type_formation?.join(', ') || 'Oui') : 'Non'}</p>
               </div>
               <div className="col-span-2">
                 <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Avis Thème</p>
                 <p className="text-sm italic text-slate-300">"{selected.avis_theme || 'Aucun avis laissé.'}"</p>
               </div>
            </div>

            <div className="flex gap-4">
               <a href={`#/ticket/${selected.numero_ticket}`} target="_blank" className="flex-1 bg-assirou-gold text-assirou-navy py-4 rounded-2xl font-black text-center text-[10px] uppercase tracking-widest">Voir Ticket</a>
               <button onClick={() => setSelected(null)} className="flex-1 bg-white/10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
