
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { getParticipantByToken, getParticipantByTicket, validateTicket, isScanSystemActive } from '../utils/storage';
import { Participant } from '../types';

const ScanPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'valid' | 'used' | 'invalid' | 'idle'>('loading');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState(false);

  const processValidation = async (tokenOrTicket: string, isManual: boolean = false) => {
    setStatus('loading');
    setError('');

    try {
      // On cherche d'abord par Token (QR Code) puis par Numéro de Ticket (Manuel/Code-barres)
      let found = await getParticipantByToken(tokenOrTicket);
      if (!found) {
        found = await getParticipantByTicket(tokenOrTicket);
      }
      
      if (!found) {
        setError(isManual ? "Aucun badge trouvé avec ce numéro." : "Badge non reconnu.");
        setStatus('invalid');
        return;
      }

      setParticipant(found);

      if (found.scan_valide) {
        setStatus('used');
        return;
      }

      const isSystemActive = await isScanSystemActive();
      if (!isSystemActive) {
        setError("Système de validation désactivé.");
        setStatus('invalid');
        return;
      }

      const success = await validateTicket(found.id);
      if (success) {
        setStatus('valid');
      } else {
        setError("Erreur technique de validation.");
        setStatus('invalid');
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError("Erreur de connexion.");
      setStatus('invalid');
    }
  };

  useEffect(() => {
    // Extraction initiale du token
    let token = searchParams.get('token');
    if (!token && window.location.hash.includes('token=')) {
      token = window.location.hash.split('token=')[1]?.split('&')[0];
    }

    if (token) {
      processValidation(token);
    } else {
      setStatus('idle');
    }
  }, [searchParams, location]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processValidation(manualInput.trim(), true);
    }
  };

  return (
    <div className="min-h-screen bg-[#001c4d] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl shadow-2xl text-center relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-assirou-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 mb-8">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
              <span className="text-assirou-navy font-black text-2xl">AS</span>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-assirou-gold">Système de Contrôle d'Accès</p>
        </div>

        {status === 'loading' && (
          <div className="space-y-6">
            <div className="w-12 h-12 border-4 border-assirou-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Vérification en cours...</p>
          </div>
        )}

        {status === 'idle' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="bg-assirou-gold/10 p-6 rounded-3xl border border-assirou-gold/20">
               <i className="fas fa-qrcode text-4xl text-assirou-gold mb-4 block"></i>
               <h2 className="text-xl font-black uppercase tracking-tighter">Prêt pour Scan</h2>
               <p className="text-slate-400 text-xs mt-2 leading-relaxed">Scannez le QR Code ou le Code-Barres du badge pour valider l'entrée.</p>
            </div>
            
            <button 
              onClick={() => setIsManualMode(!isManualMode)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-assirou-gold transition-colors"
            >
              {isManualMode ? "Cacher la saisie manuelle" : "Saisir le numéro manuellement"}
            </button>

            {isManualMode && (
              <form onSubmit={handleManualSubmit} className="space-y-4 animate-in slide-in-from-top-2">
                 <input 
                   placeholder="Ex: FORUM-SEC-2026-0001" 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-assirou-gold transition-all text-center mono font-bold text-sm"
                   value={manualInput}
                   onChange={e => setManualInput(e.target.value)}
                 />
                 <button className="w-full py-4 bg-assirou-gold text-assirou-navy rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110">
                   Valider l'entrée
                 </button>
              </form>
            )}
          </div>
        )}

        {status === 'valid' && participant && (
          <div className="animate-in zoom-in duration-500 space-y-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white text-4xl shadow-[0_0_40px_rgba(34,197,94,0.3)]">
               <i className="fas fa-check"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-green-400">Validé</h2>
              <p className="text-slate-400 text-[10px] mt-2 font-black uppercase tracking-widest">Entrée autorisée</p>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-left">
              <p className="text-xl font-black text-white leading-tight mb-1">{participant.nom_complet}</p>
              <p className="text-[10px] font-bold text-assirou-gold uppercase">{participant.organisation_entreprise || 'Individuel'}</p>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                 <p className="text-[9px] font-black text-slate-500 uppercase">Catégorie</p>
                 <p className="text-[10px] font-black text-white uppercase">{participant.participation}</p>
              </div>
            </div>
            <button onClick={() => setStatus('idle')} className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
               Scanner un autre badge
            </button>
          </div>
        )}

        {status === 'used' && participant && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="w-20 h-20 bg-orange-500/20 border-2 border-orange-500 rounded-full flex items-center justify-center mx-auto text-orange-500 text-4xl">
               <i className="fas fa-history"></i>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-orange-400">Déjà Présent</h2>
            <div className="p-6 bg-orange-500/5 rounded-3xl border border-orange-500/20 text-left">
              <p className="text-lg font-black text-white">{participant.nom_complet}</p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase font-bold">Validé le {new Date(participant.date_validation!).toLocaleString()}</p>
            </div>
            <button onClick={() => setStatus('idle')} className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
               Scanner un autre badge
            </button>
          </div>
        )}

        {status === 'invalid' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto text-white text-4xl">
               <i className="fas fa-times"></i>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-red-500">Invalide</h2>
            <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
               <p className="text-slate-200 text-sm font-bold">{error}</p>
            </div>
            <button onClick={() => { setStatus('idle'); setManualInput(''); }} className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
               Réessayer
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ScanPage;
