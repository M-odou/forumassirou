
import React, { useState, useEffect, useCallback } from 'react';
import { getParticipants, isRegistrationActive, setRegistrationStatus, isScanSystemActive, setScanSystemStatus, exportParticipantsToCSV, deleteParticipant, subscribeToParticipants, supabase } from '../utils/storage';
import { Participant } from '../types';
import { sendConfirmationEmail, openMailClient } from '../services/mailService';

const AdminDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [active, setActive] = useState(true);
  const [scanActive, setScanActive] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const data = await getParticipants();
    const status = await isRegistrationActive();
    const sActive = await isScanSystemActive();
    setParticipants(data);
    setActive(status);
    setScanActive(sActive);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const sub = subscribeToParticipants(loadData);
    return () => { if (sub) supabase.removeChannel(sub); };
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`⚠️ SUPPRESSION DÉFINITIVE :\n\nÊtes-vous sûr de vouloir supprimer ${name} ?`)) {
      setLoading(true);
      const success = await deleteParticipant(id);
      if (success) {
        await loadData();
        if (selected?.id === id) setSelected(null);
      }
      setLoading(false);
    }
  };

  const toggleScanSystem = async () => {
    const next = !scanActive;
    await setScanSystemStatus(next);
    setScanActive(next);
  };

  const filtered = participants.filter(p => 
    p.nom_complet.toLowerCase().includes(search.toLowerCase()) || 
    p.numero_ticket.includes(search)
  );

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER AVEC BOUTON SCAN */}
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white/5 p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Forum <span className="text-assirou-gold">2026</span></h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestion Administrateur</p>
          </div>
          <div className="flex flex-wrap gap-4 mt-6 lg:mt-0 justify-center">
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-assirou-gold transition-all border border-white/5">Exporter CSV</button>
            <button onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all ${active ? 'bg-green-600' : 'bg-red-600'}`}>Inscriptions {active ? 'Ouvertes' : 'Fermées'}</button>
            <button 
              onClick={toggleScanSystem} 
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all flex items-center gap-3 ${scanActive ? 'bg-assirou-gold text-assirou-navy' : 'bg-slate-700 text-slate-300'}`}
            >
              <i className={`fas ${scanActive ? 'fa-qrcode' : 'fa-qrcode-slash'}`}></i>
              Scanner {scanActive ? 'ACTIF' : 'DÉSACTIVÉ'}
            </button>
          </div>
        </div>

        {/* LISTE */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-4 items-center justify-between">
            <input 
              placeholder="Rechercher par nom ou ticket..." 
              className="w-full md:w-96 bg-white/5 border border-white/10 rounded-xl px-6 py-4 outline-none focus:border-assirou-gold transition-all text-sm font-medium" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest">Entrées validées: {participants.filter(p => p.scan_valide).length}</span>
               </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-6">Participant</th>
                  <th className="px-8 py-6">Statut Scan</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.03] group transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-sm">{p.nom_complet}</div>
                      <div className="text-[10px] text-assirou-gold font-bold uppercase tracking-wider">{p.numero_ticket}</div>
                    </td>
                    <td className="px-8 py-6">
                      {p.scan_valide ? (
                        <span className="text-[9px] font-black text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2 w-fit">
                          <i className="fas fa-check-double"></i> PASS VALIDÉ
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest w-fit block">EN ATTENTE</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button onClick={() => setSelected(p)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-assirou-gold hover:text-navy transition-all"><i className="fas fa-eye text-xs"></i></button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-red-600 transition-all text-red-400 hover:text-white"><i className="fas fa-trash text-xs"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] p-12 max-w-2xl w-full relative shadow-2xl">
            <button onClick={() => setSelected(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><i className="fas fa-times text-2xl"></i></button>
            <h3 className="text-3xl font-black uppercase mb-1 tracking-tighter">{selected.nom_complet}</h3>
            <p className="text-assirou-gold text-[11px] font-black tracking-widest uppercase mb-10">{selected.numero_ticket}</p>
            
            <div className="space-y-6">
              <div className={`p-6 rounded-[2rem] border ${selected.scan_valide ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/5 text-slate-400'}`}>
                <p className="text-xs font-black uppercase tracking-widest mb-2">{selected.scan_valide ? '✅ ENTRÉE DÉJÀ VALIDÉE' : '⌛ SCAN EN ATTENTE'}</p>
                {selected.scan_valide && <p className="text-lg font-bold">Validé le : {new Date(selected.date_validation!).toLocaleString()}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Email</p>
                  <p className="text-sm font-bold truncate">{selected.adresse_email}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Téléphone</p>
                  <p className="text-sm font-bold">{selected.telephone}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-10 bg-white/10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all">Fermer la fiche</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
