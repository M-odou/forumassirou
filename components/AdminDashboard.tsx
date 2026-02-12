
import React, { useState, useEffect, useCallback } from 'react';
import { getParticipants, isRegistrationActive, setRegistrationStatus, isScanSystemActive, setScanSystemStatus, exportParticipantsToCSV, deleteParticipant, validateTicket, subscribeToParticipants, supabase } from '../utils/storage';
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
    if (window.confirm(`⚠️ SUPPRESSION DÉFINITIVE :\n\nConfirmez-vous la suppression de ${name} ?`)) {
      setLoading(true);
      await deleteParticipant(id);
      loadData();
      setLoading(false);
    }
  };

  const handleManualValidate = async (p: Participant) => {
    if (p.scan_valide) return;
    if (window.confirm(`Confirmer la validation manuelle de ${p.nom_complet} ?`)) {
      setLoading(true);
      await validateTicket(p.id);
      loadData();
      setLoading(false);
    }
  };

  const toggleScan = async () => {
    const next = !scanActive;
    await setScanSystemStatus(next);
    setScanActive(next);
  };

  const filtered = participants.filter(p => 
    p.nom_complet.toLowerCase().includes(search.toLowerCase()) || 
    p.numero_ticket.includes(search)
  );

  return (
    <div className="min-h-screen bg-[#00153a] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ACTION HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-xl gap-6">
          <div className="flex items-center gap-4 text-center lg:text-left">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
               <span className="text-assirou-navy font-black text-xl tracking-tighter">AS</span>
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-tight">PORTAIL <span className="text-assirou-gold">ADMIN</span></h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Gestion du Forum 2026</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase border border-white/10 hover:bg-white/20 transition-all">
              <i className="fas fa-file-export mr-2"></i> CSV
            </button>
            <button 
              onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} 
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${active ? 'bg-green-600' : 'bg-red-600'}`}
            >
              INSCRIPTIONS: {active ? 'OUVERTES' : 'FERMÉES'}
            </button>
            <button 
              onClick={toggleScan} 
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg flex items-center gap-2 ${scanActive ? 'bg-assirou-gold text-assirou-navy' : 'bg-slate-700 text-slate-400'}`}
            >
              <i className={`fas ${scanActive ? 'fa-qrcode' : 'fa-qrcode-slash'}`}></i>
              SYSTÈME SCAN: {scanActive ? 'ACTIF' : 'INACTIF'}
            </button>
          </div>
        </div>

        {/* LIST TABLE */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input 
                placeholder="Rechercher..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3.5 outline-none focus:border-assirou-gold transition-all text-sm" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Validés: {participants.filter(p => p.scan_valide).length}</div>
              <div>Total: {participants.length}</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-5">Participant</th>
                  <th className="px-8 py-5">Statut Validation</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-black text-sm">{p.nom_complet}</div>
                      <div className="text-[10px] text-assirou-gold font-bold uppercase">{p.numero_ticket}</div>
                    </td>
                    <td className="px-8 py-5">
                      {p.scan_valide ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full w-fit uppercase tracking-tighter">PASS VALIDÉ</span>
                          <span className="text-[8px] text-slate-500 mt-1 uppercase font-bold">{new Date(p.date_validation!).toLocaleString()}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleManualValidate(p)}
                          className="text-[9px] font-black text-slate-300 bg-white/5 px-3 py-1 rounded-full border border-white/5 uppercase tracking-tighter hover:bg-assirou-gold hover:text-navy hover:border-assirou-gold transition-all"
                        >
                          Valider manuellement
                        </button>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                      <button onClick={() => setSelected(p)} className="w-9 h-9 bg-white/5 rounded-lg hover:bg-assirou-gold hover:text-navy transition-all"><i className="fas fa-eye text-xs"></i></button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-9 h-9 bg-white/5 rounded-lg hover:bg-red-600 transition-all text-red-400 hover:text-white"><i className="fas fa-trash text-xs"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-[#001c4d] border border-white/10 rounded-[2.5rem] p-10 max-w-xl w-full relative">
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><i className="fas fa-times text-xl"></i></button>
            <h3 className="text-2xl font-black uppercase mb-1">{selected.nom_complet}</h3>
            <p className="text-assirou-gold text-[10px] font-black tracking-widest uppercase mb-8">{selected.numero_ticket}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Téléphone</p>
                <p className="text-sm font-bold">{selected.telephone}</p>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Email</p>
                <p className="text-sm font-bold truncate">{selected.adresse_email}</p>
              </div>
            </div>
            
            <div className={`mt-4 p-5 rounded-2xl border ${selected.scan_valide ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
               <p className="text-xs font-black uppercase tracking-widest">{selected.scan_valide ? '✅ PASS DÉJÀ VALIDÉ' : '❌ NON SCANNÉ'}</p>
               {selected.scan_valide && <p className="text-[10px] mt-1 font-bold">Le {new Date(selected.date_validation!).toLocaleString()}</p>}
            </div>
            
            <button onClick={() => setSelected(null)} className="w-full mt-8 bg-white/10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
