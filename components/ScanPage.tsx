
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getParticipantByToken, validateTicket, isScanSystemActive } from '../utils/storage';
import { Participant } from '../types';

const ScanPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'valid' | 'used' | 'invalid'>('loading');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const performScan = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }

      try {
        const found = await getParticipantByToken(token);
        
        if (!found) {
          setStatus('invalid');
          return;
        }

        setParticipant(found);

        // Si déjà validé par le passé
        if (found.scan_valide) {
          setStatus('used');
          return;
        }

        // Vérifier si le système de scan est activé globalement
        const isSystemActive = await isScanSystemActive();
        if (!isSystemActive) {
          setError("Le système de validation à l'entrée est temporairement désactivé par l'administration.");
          setStatus('invalid');
          return;
        }

        // Validation du badge (marquer comme used)
        const success = await validateTicket(found.id);
        if (success) {
          setStatus('valid');
        } else {
          setError("Erreur technique lors de la validation. Réessayez.");
          setStatus('invalid');
        }
      } catch (err) {
        console.error("Scan error:", err);
        setStatus('invalid');
      }
    };

    performScan();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#001c4d] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl shadow-2xl text-center">
        
        <div className="mb-8">
           <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
              <span className="text-assirou-navy font-black text-3xl">AS</span>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-assirou-gold">Système de Validation</p>
        </div>

        {status === 'loading' && (
          <div className="space-y-6">
            <div className="w-12 h-12 border-4 border-assirou-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Vérification du badge...</p>
          </div>
        )}

        {status === 'valid' && participant && (
          <div className="animate-in zoom-in duration-500 space-y-6">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white text-5xl shadow-[0_0_40px_rgba(34,197,94,0.3)]">
               <i className="fas fa-check"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-green-400">Badge Valide</h2>
              <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest">Accès autorisé au forum</p>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-left">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Participant</p>
              <p className="text-xl font-black text-white">{participant.nom_complet}</p>
              <p className="text-[11px] font-bold text-assirou-gold mt-1 uppercase">{participant.participation}</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase italic">Validé à l'instant • {new Date().toLocaleTimeString()}</p>
          </div>
        )}

        {status === 'used' && participant && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="w-24 h-24 bg-orange-500/20 border-2 border-orange-500 rounded-full flex items-center justify-center mx-auto text-orange-500 text-5xl">
               <i className="fas fa-history"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-orange-400">Déjà Scanné</h2>
              <p className="text-slate-400 text-sm mt-2 font-medium">Ce badge a déjà été validé à l'entrée.</p>
            </div>
            <div className="p-6 bg-orange-500/5 rounded-3xl border border-orange-500/20 text-left">
              <p className="text-[9px] font-black text-orange-500/50 uppercase mb-1">Détails Participant</p>
              <p className="text-lg font-black text-white">{participant.nom_complet}</p>
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase">Heure du premier scan</p>
                <p className="text-sm font-bold text-white">{new Date(participant.date_validation!).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto text-white text-5xl shadow-[0_0_40px_rgba(220,38,38,0.2)]">
               <i className="fas fa-times"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-red-500">Badge Invalide</h2>
              <p className="text-slate-400 text-sm mt-2">{error || "Ce badge n'existe pas ou le jeton est corrompu."}</p>
            </div>
            <Link to="/" className="inline-block px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
               Retour Accueil
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ScanPage;
