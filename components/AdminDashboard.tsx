
import React, { useState, useEffect } from 'react';
import { getParticipants, isRegistrationActive, setRegistrationStatus, exportParticipantsToCSV } from '../utils/storage';
import { Participant } from '../types';

const AdminDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [active, setActive] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getParticipants();
      const status = await isRegistrationActive();
      setParticipants(data);
      setActive(status);
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleStatus = async () => {
    const newState = !active;
    await setRegistrationStatus(newState);
    setActive(newState);
  };

  const filtered = participants.filter(p => 
    p.nom_complet.toLowerCase().includes(search.toLowerCase()) || 
    p.adresse_email.toLowerCase().includes(search.toLowerCase()) ||
    p.numero_ticket.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00153a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <i className="fas fa-circle-notch fa-spin text-4xl text-assirou-gold"></i>
          <p className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Chargement des données...</p>
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
            <button onClick={exportParticipantsToCSV} className="flex-1 lg:flex-none px-8 py-4 bg-white/5 border border-white/10 hover:bg-assirou-gold hover:text-assirou-navy rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
              <i className="fas fa-file-export"></i> Export CSV
            </button>
            <button onClick={toggleStatus} className={`flex-1 lg:flex-none px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${active ? 'bg-green-600 shadow-green-600/20' : 'bg-red-600 shadow-red-600/20'}`}>
              <i className={`fas ${active ? 'fa-unlock' : 'fa-lock'}`}></i>
              {active ? 'Inscriptions Ouvertes' : 'Inscriptions Fermées'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Inscrits</p>
            <div className="flex items-end gap-3"><span className="text-6xl font-black text-white">{participants.length}</span></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Besoin Formation</p>
            <div className="flex items-end gap-3"><span className="text-6xl font-black text-assirou-gold">{participants.filter(p => p.souhait_formation === 'Oui').length}</span></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Intérêt Services</p>
            <div className="flex items-end gap-3"><span className="text-6xl font-black text-blue-400">{participants.filter(p => p.interet_services === 'Oui').length}</span></div>
          </div>
          <div className="bg-assirou-gold/10 border border-assirou-gold/20 p-8 rounded-3xl">
            <p className="text-[10px] font-black text-assirou-gold uppercase tracking-widest mb-4">Progression</p>
            <div className="space-y-2">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-assirou-gold" style={{ width: `${Math.min((participants.length / 500) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
          <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <h3 className="text-2xl font-black uppercase tracking-tight">Soumissions</h3>
            <input type="text" placeholder="Chercher..." className="w-full md:w-96 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-assirou-gold transition-all font-bold text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5"><th className="px-10 py-8">Participant</th><th className="px-10 py-8">Profil</th><th className="px-10 py-8 text-right">Détails</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-colors"><td className="px-10 py-8"><div className="font-black">{p.nom_complet}</div><div className="text-xs text-slate-500">{p.adresse_email}</div></td><td className="px-10 py-8"><span className="text-assirou-gold text-[10px] font-black">{p.participation}</span></td><td className="px-10 py-8 text-right"><button onClick={() => setSelected(p)} className="p-4 bg-white/5 hover:bg-assirou-gold hover:text-assirou-navy rounded-2xl transition-all"><i className="fas fa-expand-alt"></i></button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#000d26]/90 backdrop-blur-md">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] p-12 max-w-3xl w-full shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-12 relative z-10">
              <div><h3 className="text-4xl font-black mb-2">{selected.nom_complet}</h3><p className="text-assirou-gold font-black mono text-sm">{selected.numero_ticket}</p></div>
              <button onClick={() => setSelected(null)} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-red-500 transition-all"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="grid grid-cols-2 gap-10 mb-12">
              <div className="space-y-4">
                <div><p className="text-[10px] text-slate-500 uppercase">Téléphone</p><p className="font-bold">{selected.telephone}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Formation</p><p className="font-bold">{selected.souhait_formation}</p></div>
              </div>
              <div className="space-y-4">
                <div><p className="text-[10px] text-slate-500 uppercase">Structure</p><p className="font-bold">{selected.organisation_entreprise || 'N/A'}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Avis</p><p className="text-sm text-slate-300 italic">"{selected.avis_theme || '...'}"</p></div>
              </div>
            </div>
            <div className="flex gap-4">
              <a href={`#/ticket/${selected.numero_ticket}`} target="_blank" rel="noreferrer" className="flex-1 px-8 py-5 bg-assirou-gold text-assirou-navy rounded-2xl font-black text-center text-[10px] uppercase tracking-widest shadow-xl">Voir Ticket</a>
              <button onClick={() => setSelected(null)} className="flex-1 px-8 py-5 bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
