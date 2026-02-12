
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
                      <button onClick={() => setSelected(p)} title="Voir tout le profil" className="w-9 h-9 bg-white/5 rounded-lg hover:bg-assirou-gold hover:text-navy transition-all"><i className="fas fa-eye text-xs"></i></button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} title="Supprimer" className="w-9 h-9 bg-white/5 rounded-lg hover:bg-red-600 transition-all text-red-400 hover:text-white"><i className="fas fa-trash text-xs"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL : FICHE PARTICIPANT COMPLETE */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-300">
            
            {/* Header Modale */}
            <div className="p-8 pb-4 flex justify-between items-start border-b border-white/10">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">{selected.nom_complet}</h3>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-assirou-gold text-[10px] font-black tracking-[0.2em] uppercase">{selected.numero_ticket}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{selected.sexe}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Corps défilable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              
              {/* Statut & Validation */}
              <div className={`p-6 rounded-3xl border ${selected.scan_valide ? 'bg-green-500/10 border-green-500/20' : 'bg-assirou-gold/5 border-assirou-gold/10'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">État du Pass</p>
                    <p className={`text-sm font-black uppercase ${selected.scan_valide ? 'text-green-400' : 'text-assirou-gold'}`}>
                      {selected.scan_valide ? '✓ Pass Validé à l\'entrée' : '○ En attente de scan'}
                    </p>
                  </div>
                  {selected.scan_valide && (
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Validé le</p>
                      <p className="text-xs font-bold text-white">{new Date(selected.date_validation!).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Téléphone</p>
                  <p className="text-base font-bold text-white">{selected.telephone}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Email</p>
                  <p className="text-base font-bold text-white break-all">{selected.adresse_email}</p>
                </div>
              </div>

              {/* Section Profil Pro */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-assirou-gold tracking-[0.3em] border-l-2 border-assirou-gold pl-3">Profil Professionnel</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Organisation</p>
                    <p className="text-sm font-bold text-white">{selected.organisation_entreprise || 'N/A'}</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Fonction</p>
                    <p className="text-sm font-bold text-white">{selected.fonction || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Catégorie Participation</p>
                  <p className="text-sm font-bold text-white">{selected.participation}</p>
                </div>
              </div>

              {/* Avis Thème */}
              {selected.avis_theme && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-assirou-gold tracking-[0.3em] border-l-2 border-assirou-gold pl-3">Avis sur le thème</h4>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 italic text-slate-300 text-sm leading-relaxed">
                    "{selected.avis_theme}"
                  </div>
                </div>
              )}

              {/* Section Enquête Marketing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-assirou-gold tracking-[0.3em] border-l-2 border-assirou-gold pl-3">Source Forum</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.canal_forum.map((c, i) => (
                      <span key={i} className="px-3 py-1.5 bg-assirou-navy border border-white/10 rounded-lg text-[10px] font-bold text-slate-300">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-assirou-gold tracking-[0.3em] border-l-2 border-assirou-gold pl-3">Source Assirou</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.canal_assirou.map((c, i) => (
                      <span key={i} className="px-3 py-1.5 bg-assirou-navy border border-white/10 rounded-lg text-[10px] font-bold text-slate-300">{c}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section Besoins & Formations */}
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Intérêt Formations</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${selected.souhait_formation === 'Oui' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {selected.souhait_formation}
                    </span>
                  </div>
                  {selected.souhait_formation === 'Oui' && (
                    <div className="flex flex-wrap gap-2">
                      {selected.type_formation.map((f, i) => (
                        <span key={i} className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white uppercase">{f}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Intérêt Services Assirou</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${selected.interet_services === 'Oui' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {selected.interet_services}
                    </span>
                  </div>
                  {selected.interet_services === 'Oui' && (
                    <div className="flex flex-wrap gap-2">
                      {selected.services_interesses.map((s, i) => (
                        <span key={i} className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white uppercase">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Infos */}
              <div className="pt-6 border-t border-white/5 flex flex-col gap-2 opacity-40">
                <p className="text-[8px] font-black uppercase tracking-[0.2em]">Inscrit le : {new Date(selected.date_inscription).toLocaleString()}</p>
                <p className="text-[8px] font-black uppercase tracking-[0.2em]">ID Unique : {selected.id}</p>
                <p className="text-[8px] font-black uppercase tracking-[0.2em]">Statut Mail : {selected.statut_email.toUpperCase()}</p>
              </div>
            </div>

            {/* Actions Pied de Modale */}
            <div className="p-8 border-t border-white/10 flex gap-4 bg-[#001c4d]/50 rounded-b-[3rem]">
              <button 
                onClick={() => setSelected(null)} 
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Fermer
              </button>
              <button 
                onClick={() => openMailClient(selected)} 
                className="flex-1 py-4 rounded-2xl bg-assirou-gold text-assirou-navy font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
              >
                <i className="fas fa-envelope mr-2"></i> Contacter
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
