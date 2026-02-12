
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
    if (window.confirm(`Supprimer ${name} ?`)) {
      setLoading(true);
      await deleteParticipant(id);
      await loadData();
      setLoading(false);
    }
  };

  const handleManualValidate = async (p: Participant) => {
    if (p.scan_valide) return;
    if (window.confirm(`Confirmer l'entrée de ${p.nom_complet} ?`)) {
      setLoading(true);
      await validateTicket(p.id);
      await loadData();
      setLoading(false);
    }
  };

  const filtered = participants.filter(p => 
    p.nom_complet.toLowerCase().includes(search.toLowerCase()) || 
    p.numero_ticket.includes(search)
  );

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ACTION HEADER RESPONSIVE */}
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white/5 p-6 md:p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl gap-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
               <span className="text-assirou-navy font-black text-2xl">AS</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Admin <span className="text-assirou-gold">Panel</span></h1>
                {isLive && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live Connection Active"></span>}
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Gestion Forum 2026</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center w-full lg:w-auto">
            <button onClick={exportParticipantsToCSV} className="flex-1 lg:flex-none px-6 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-download"></i> EXPORT CSV
            </button>
            <button 
              onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} 
              className={`flex-1 lg:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl ${active ? 'bg-green-600' : 'bg-red-600'}`}
            >
              INSCRIPTIONS: {active ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={async () => { const s = !scanActive; await setScanSystemStatus(s); setScanActive(s); }} 
              className={`flex-1 lg:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl flex items-center justify-center gap-2 ${scanActive ? 'bg-assirou-gold text-assirou-navy' : 'bg-slate-700 text-slate-400'}`}
            >
              <i className="fas fa-qrcode"></i> SCAN: {scanActive ? 'ACTIF' : 'OFF'}
            </button>
          </div>
        </div>

        {/* LIST TABLE */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
          <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input 
                placeholder="Chercher un nom ou ticket..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-assirou-gold transition-all text-sm" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2 text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span> 
                {participants.filter(p => p.scan_valide).length} Présents
              </div>
              <div className="text-slate-400">Total: {participants.length}</div>
              <button onClick={loadData} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-6">Participant</th>
                  <th className="px-8 py-6">Statut Entrée</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="group hover:bg-white/[0.04] transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-base">{p.nom_complet}</div>
                      <div className="text-[10px] text-assirou-gold font-bold uppercase tracking-wider">{p.numero_ticket}</div>
                    </td>
                    <td className="px-8 py-6">
                      {p.scan_valide ? (
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase">
                          <i className="fas fa-check-circle"></i> PRÉSENT
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleManualValidate(p)}
                          className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase hover:bg-assirou-gold hover:text-assirou-navy hover:border-assirou-gold transition-all"
                        >
                          Valider manuellement
                        </button>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button onClick={() => setSelected(p)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-assirou-navy transition-all border border-white/5"><i className="fas fa-eye"></i></button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-red-600 transition-all border border-white/5 text-red-400 hover:text-white"><i className="fas fa-trash-alt"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PARTICIPANT */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-8 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selected.nom_complet}</h3>
                <p className="text-assirou-gold text-[10px] font-black uppercase tracking-widest">{selected.numero_ticket}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Email</p>
                  <p className="text-sm font-bold text-white break-all">{selected.adresse_email}</p>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Téléphone</p>
                  <p className="text-sm font-bold text-white">{selected.telephone}</p>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <h4 className="text-[10px] font-black uppercase text-assirou-gold tracking-widest mb-4">Profil</h4>
                <div className="space-y-3">
                  <p className="text-sm"><span className="text-slate-500">Organisation:</span> <span className="font-bold">{selected.organisation_entreprise || 'N/A'}</span></p>
                  <p className="text-sm"><span className="text-slate-500">Fonction:</span> <span className="font-bold">{selected.fonction || 'N/A'}</span></p>
                  <p className="text-sm"><span className="text-slate-500">Catégorie:</span> <span className="font-bold">{selected.participation}</span></p>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-white/10 bg-black/20 flex gap-4">
              <button onClick={() => setSelected(null)} className="flex-1 py-4 rounded-2xl bg-white/5 font-black text-[10px] uppercase hover:bg-white/10 transition-all">Fermer</button>
              <button onClick={() => openMailClient(selected)} className="flex-1 py-4 rounded-2xl bg-assirou-gold text-assirou-navy font-black text-[10px] uppercase hover:brightness-110 transition-all">Contacter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
