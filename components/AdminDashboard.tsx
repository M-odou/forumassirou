
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

  const loadData = useCallback(async () => {
    const data = await getParticipants();
    const status = await isRegistrationActive();
    setParticipants(data);
    setActive(status);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const sub = subscribeToParticipants(loadData);
    return () => { if (sub) supabase.removeChannel(sub); };
  }, [loadData]);

  const filtered = participants.filter(p => p.nom_complet.toLowerCase().includes(search.toLowerCase()) || p.numero_ticket.includes(search));

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white/5 p-10 rounded-[2.5rem] border border-white/10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Forum <span className="text-assirou-gold">2026</span></h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Base de données complète</p>
          </div>
          <div className="flex gap-4 mt-6 lg:mt-0">
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-assirou-gold hover:text-navy transition-all">Exporter CSV</button>
            <button onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase ${active ? 'bg-green-600' : 'bg-red-600'}`}>Portail {active ? 'Ouvert' : 'Fermé'}</button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <input placeholder="Rechercher..." className="w-full md:w-80 bg-white/5 border border-white/10 rounded-xl px-6 py-3 outline-none focus:border-assirou-gold transition-all" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-8 py-6">Participant</th>
                <th className="px-8 py-6">Profil</th>
                <th className="px-8 py-6">Email Statut</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] group">
                  <td className="px-8 py-6">
                    <div className="font-black text-sm">{p.nom_complet}</div>
                    <div className="text-[10px] text-assirou-gold">{p.numero_ticket}</div>
                  </td>
                  <td className="px-8 py-6"><span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded">{p.participation}</span></td>
                  <td className="px-8 py-6">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${p.statut_email === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-assirou-gold/20 text-assirou-gold'}`}>{p.statut_email}</span>
                  </td>
                  <td className="px-8 py-6 text-right space-x-2">
                    <button onClick={() => setSelected(p)} className="w-9 h-9 bg-white/5 rounded-lg hover:bg-assirou-gold hover:text-navy transition-all"><i className="fas fa-eye"></i></button>
                    <button onClick={() => deleteParticipant(p.id)} className="w-9 h-9 bg-white/5 rounded-lg hover:bg-red-600 transition-all"><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button onClick={() => setSelected(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><i className="fas fa-times text-2xl"></i></button>
            <h3 className="text-3xl font-black uppercase mb-1">{selected.nom_complet}</h3>
            <p className="text-assirou-gold text-[11px] font-black mb-10 tracking-[0.3em] uppercase">{selected.numero_ticket}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-500 block mb-2">Coordonnées</label>
                  <p className="text-sm font-bold">{selected.adresse_email}</p>
                  <p className="text-sm font-bold">{selected.telephone}</p>
                  <p className="text-sm font-bold text-assirou-gold">{selected.organisation_entreprise || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-500 block mb-2">Avis sur le thème</label>
                  <p className="text-xs italic text-slate-400 leading-relaxed">"{selected.avis_theme || 'Aucun avis'}"</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-500 block mb-2">Canaux d'Information</label>
                  <p className="text-[10px] font-bold">Forum: {selected.canal_forum.join(', ') || 'N/A'}</p>
                  <p className="text-[10px] font-bold">Assirou: {selected.canal_assirou.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-500 block mb-2">Besoins exprimés</label>
                  <p className="text-[10px] font-bold text-green-400">Formations: {selected.souhait_formation === 'Oui' ? selected.type_formation.join(', ') : 'Non'}</p>
                  <p className="text-[10px] font-bold text-blue-400">Services: {selected.interet_services === 'Oui' ? selected.services_interesses.join(', ') : 'Non'}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button onClick={() => openMailClient(selected)} className="flex-1 bg-assirou-gold text-navy py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all">Envoyer Mail Manuel</button>
              <button onClick={() => setSelected(null)} className="flex-1 bg-white/5 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
