
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
    if (window.confirm(`⚠️ SUPPRESSION DÉFINITIVE :\n\nÊtes-vous sûr de vouloir supprimer ${name} ?\nCette action est irréversible.`)) {
      setLoading(true);
      const success = await deleteParticipant(id);
      if (success) {
        await loadData();
        if (selected?.id === id) setSelected(null);
      } else {
        alert("Erreur de suppression. Vérifiez que les Politiques RLS sont activées sur Supabase.");
      }
      setLoading(false);
    }
  };

  const handleResendMail = async (p: Participant) => {
    const success = await sendConfirmationEmail(p);
    if (!success) {
      if (window.confirm("L'API Resend bloque l'envoi direct (CORS). Voulez-vous envoyer manuellement via votre logiciel de messagerie ?")) {
        openMailClient(p);
      }
    }
    loadData();
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
        
        {/* HEADER DASHBOARD */}
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white/5 p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Forum <span className="text-assirou-gold">2026</span></h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestion des Inscriptions</p>
          </div>
          <div className="flex flex-wrap gap-4 mt-6 lg:mt-0 justify-center">
            <button onClick={exportParticipantsToCSV} className="px-6 py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-assirou-gold hover:text-navy transition-all border border-white/5">Exporter CSV</button>
            <button onClick={async () => { const s = !active; await setRegistrationStatus(s); setActive(s); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all ${active ? 'bg-green-600' : 'bg-red-600'}`}>Inscriptions {active ? 'Ouvertes' : 'Fermées'}</button>
            <button onClick={toggleScanSystem} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all ${scanActive ? 'bg-assirou-gold text-assirou-navy' : 'bg-slate-700 text-slate-300'}`}>Système Scan {scanActive ? 'Activé' : 'Désactivé'}</button>
          </div>
        </div>

        {/* LISTE PARTICIPANTS */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-4 items-center justify-between">
            <input 
              placeholder="Chercher un nom ou numéro de ticket..." 
              className="w-full md:w-96 bg-white/5 border border-white/10 rounded-xl px-6 py-4 outline-none focus:border-assirou-gold transition-all text-sm font-medium" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-green-500"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest">Validés: {participants.filter(p => p.scan_valide).length}</span>
               </div>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total: {participants.length}</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-6">Participant & Ticket</th>
                  <th className="px-8 py-6">Profil</th>
                  <th className="px-8 py-6">Scan Statut</th>
                  <th className="px-8 py-6">Mail</th>
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
                      <span className="text-[9px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase tracking-wider">{p.participation}</span>
                    </td>
                    <td className="px-8 py-6">
                      {p.scan_valide ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded w-fit uppercase tracking-widest">
                            <i className="fas fa-check-double mr-1"></i> Pass Validé
                          </span>
                          <span className="text-[8px] text-slate-500 mt-1 uppercase font-bold">{new Date(p.date_validation!).toLocaleDateString()} {new Date(p.date_validation!).toLocaleTimeString()}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase tracking-widest">En attente</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${
                          p.statut_email === 'sent' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          p.statut_email === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          'bg-assirou-gold/10 text-assirou-gold border-assirou-gold/20'
                        }`}>
                          {p.statut_email}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button onClick={() => setSelected(p)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-assirou-gold hover:text-navy transition-all border border-white/5"><i className="fas fa-eye text-xs"></i></button>
                      <button onClick={() => handleDelete(p.id, p.nom_complet)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-red-600 transition-all text-red-400 hover:text-white border border-white/5"><i className="fas fa-trash text-xs"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filtered.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
              Aucun résultat pour cette recherche
            </div>
          )}
        </div>
      </div>

      {/* MODAL DÉTAILS */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#001c4d] border border-white/10 rounded-[3rem] p-12 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button onClick={() => setSelected(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-2xl"></i></button>
            
            <div className="mb-10">
              <h3 className="text-3xl font-black uppercase mb-1 tracking-tighter">{selected.nom_complet}</h3>
              <p className="text-assirou-gold text-[11px] font-black tracking-[0.3em] uppercase">{selected.numero_ticket}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-500 block mb-3 tracking-widest">Informations de Contact</label>
                  <div className="space-y-2">
                    <p className="text-sm font-bold flex items-center gap-3"><i className="fas fa-envelope text-assirou-gold w-4"></i> {selected.adresse_email}</p>
                    <p className="text-sm font-bold flex items-center gap-3"><i className="fas fa-phone text-assirou-gold w-4"></i> {selected.telephone}</p>
                    <p className="text-sm font-bold flex items-center gap-3"><i className="fas fa-building text-assirou-gold w-4"></i> {selected.organisation_entreprise || 'Participant individuel'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-500 block mb-3 tracking-widest">Validation de Scan</label>
                  <div className={`p-4 rounded-2xl border ${selected.scan_valide ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/5 text-slate-400'}`}>
                    <p className="text-xs font-black uppercase tracking-widest mb-1">{selected.scan_valide ? '✅ Ticket Déjà Scanné' : '⌛ Pas encore scanné'}</p>
                    {selected.scan_valide && <p className="text-[10px] font-bold">Le {new Date(selected.date_validation!).toLocaleString()}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-500 block mb-3 tracking-widest">Besoins spécifiques</label>
                  <div className="space-y-3">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-green-400 uppercase mb-1 tracking-wider">Formations souhaitées</p>
                      <p className="text-[11px] font-bold">{selected.souhait_formation === 'Oui' ? selected.type_formation.join(', ') : 'Aucun souhait'}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-blue-400 uppercase mb-1 tracking-wider">Services intéressants</p>
                      <p className="text-[11px] font-bold">{selected.interet_services === 'Oui' ? selected.services_interesses.join(', ') : 'Aucun intérêt'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 flex flex-col sm:flex-row gap-4 border-t border-white/5 pt-10">
              <button onClick={() => { handleResendMail(selected); setSelected(null); }} className="flex-1 bg-assirou-gold text-navy py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl">Renvoyer Pass</button>
              <button onClick={() => { handleDelete(selected.id, selected.nom_complet); }} className="flex-1 bg-red-600/20 text-red-500 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-red-600/20 hover:bg-red-600 hover:text-white transition-all">Supprimer</button>
              <button onClick={() => setSelected(null)} className="flex-1 bg-white/10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
