
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveParticipant, generateTicketNumber, isRegistrationActive } from '../utils/storage';
import { Participant } from '../types';
import { generateEmailContent } from '../services/geminiService';

const CANAUX = ["Facebook", "Youtube", "Tiktok", "Siteweb", "Instagram", "Média", "Autre"];
const PARTICIPATIONS = ["Individuel", "Représentant d'une entreprise", "Professionnel de la sécurité", "Autre"];
const FORMATIONS_LIST = ["CQP-ASP", "SSIAP 1", "SSIAP 2", "SST", "APR (Garde du corps)", "Agent Stadier"];
const SERVICES_LIST = ["Gardiennage", "Protection Rapprochée", "Sécurité Événementielle", "Audit & Conseil", "Télésurveillance", "Maître-chien"];

const PublicForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Participant>>({
    nom_complet: '',
    adresse_email: '',
    telephone: '',
    organisation_entreprise: '',
    participation: 'Individuel',
    avis_theme: '',
    canal_forum: [],
    canal_assirou: [],
    souhait_formation: 'Non',
    type_formation: [],
    interet_services: 'Non',
    services_interesses: []
  });

  useEffect(() => {
    const checkStatus = async () => {
      const active = await isRegistrationActive();
      setIsActive(active);
    };
    checkStatus();
  }, []);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const toggleSelection = (field: keyof Participant, value: string) => {
    const current = (formData[field] as string[]) || [];
    const next = current.includes(value) 
      ? current.filter(v => v !== value) 
      : [...current, value];
    setFormData({ ...formData, [field]: next });
  };

  const handleYesNoChange = (field: 'souhait_formation' | 'interet_services', value: 'Oui' | 'Non') => {
    const subField = field === 'souhait_formation' ? 'type_formation' : 'services_interesses';
    setFormData({ 
      ...formData, 
      [field]: value,
      [subField]: value === 'Non' ? [] : formData[subField] 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive || !confirmed || step < 5) return;
    setLoading(true);
    setLoadingMsg('Génération du badge...');

    try {
      const ticketNum = await generateTicketNumber();
      
      const newParticipant = {
        id: window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2),
        ...formData,
        numero_ticket: ticketNum,
        date_inscription: new Date().toISOString(),
        statut_email: 'pending'
      } as Participant;

      const success = await saveParticipant(newParticipant);
      
      if (success) {
        setLoadingMsg('Badge prêt !');
        generateEmailContent(newParticipant).catch(console.error);
        
        setTimeout(() => {
          navigate(`/ticket/${ticketNum}`);
        }, 800);
      } else {
        alert("Erreur de connexion au serveur.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-assirou-navy">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md">
           <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
             <i className="fas fa-calendar-times text-3xl"></i>
           </div>
           <h2 className="text-2xl font-black text-assirou-navy mb-4 uppercase">Inscriptions Closes</h2>
           <p className="text-slate-500 mb-8 font-medium">Les inscriptions pour le Forum 2026 sont désormais terminées.</p>
           <p className="text-xs font-black text-assirou-gold uppercase tracking-widest">Équipe Assirou Sécurité</p>
        </div>
      </div>
    );
  }

  const progress = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-assirou-light text-assirou-navy pb-24">
      <div className="fixed top-0 left-0 w-full h-2 bg-slate-200 z-50">
        <div className="h-full bg-assirou-gold transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="assirou-gradient w-full py-12 md:py-20 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="relative z-10 text-center px-6 w-full max-w-4xl">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-assirou-gold">
             <i className="fas fa-shield-cat text-assirou-navy text-3xl"></i>
          </div>
          <h1 className="text-white text-xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-8 px-4 max-w-3xl mx-auto">
            Deuxième Forum sur les Métiers de la Sécurité Privée au Sénégal
          </h1>
          
          <div className="flex flex-wrap justify-center items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/5 backdrop-blur-sm">
              <i className="fas fa-calendar-alt text-assirou-gold text-sm"></i>
              <span className="text-[11px] font-black text-white uppercase tracking-widest">05 Mars 2026</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/5 backdrop-blur-sm">
              <i className="fas fa-map-marker-alt text-assirou-gold text-sm"></i>
              <span className="text-[11px] font-black text-white uppercase tracking-widest">CSC Thiaroye sur Mer</span>
            </div>
          </div>
          
          <p className="mt-8 text-assirou-gold text-[9px] font-black uppercase tracking-[0.6em] opacity-60">Assirou Sécurité • Protection & Gardiennage</p>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-100">
          
          <div className="mb-10 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Étape {step} / 5</span>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(s => (
                <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-assirou-gold' : 'bg-slate-100'}`}></div>
              ))}
            </div>
          </div>

          <form 
            onSubmit={handleSubmit} 
            className="space-y-8"
            onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}
          >
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Identité</h2>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom Complet *</label>
                    <input required type="text" placeholder="Ex: Moussa Diop" className="w-full text-lg p-4 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-xl outline-none transition-all" value={formData.nom_complet} onChange={e => setFormData({...formData, nom_complet: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adresse E-mail *</label>
                    <input required type="email" placeholder="moussa@exemple.sn" className="w-full text-lg p-4 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-xl outline-none transition-all" value={formData.adresse_email} onChange={e => setFormData({...formData, adresse_email: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone *</label>
                      <input required type="tel" placeholder="77..." className="w-full text-lg p-4 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-xl outline-none transition-all" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Structure</label>
                      <input type="text" placeholder="Facultatif" className="w-full text-lg p-4 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-xl outline-none transition-all" value={formData.organisation_entreprise} onChange={e => setFormData({...formData, organisation_entreprise: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Profil</h2>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vous êtes :</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PARTICIPATIONS.map(p => (
                      <button key={p} type="button" onClick={() => setFormData({...formData, participation: p as any})} className={`p-4 rounded-xl border-2 text-left font-bold text-sm transition-all ${formData.participation === p ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-assirou-gold'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Canaux</h2>
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-assirou-gold mb-4">Source de l'information (Forum)</p>
                      <div className="flex flex-wrap gap-2">
                        {CANAUX.map(c => (
                          <button key={c} type="button" onClick={() => toggleSelection('canal_forum', c)} className={`px-4 py-2 rounded-full border-2 text-[10px] font-black transition-all ${formData.canal_forum?.includes(c) ? 'bg-assirou-gold border-assirou-gold text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Intérêts</h2>
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                    <div className="flex justify-between items-center">
                      <p className="font-black text-sm text-assirou-navy">Besoin d'une formation ?</p>
                      <div className="flex gap-2">
                        {['Oui', 'Non'].map(v => (
                          <button key={v} type="button" onClick={() => handleYesNoChange('souhait_formation', v as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${formData.souhait_formation === v ? 'bg-assirou-navy text-white' : 'bg-white text-slate-300 border border-slate-200'}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Vérification Finale</h2>
                
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                   <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Nom</span>
                      <span className="text-sm font-black uppercase">{formData.nom_complet}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">E-mail</span>
                      <span className="text-sm font-black">{formData.adresse_email}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</span>
                      <span className="text-sm font-black">{formData.telephone}</span>
                   </div>
                </div>

                <div className="pt-4">
                    <label className="flex items-start gap-4 cursor-pointer group p-4 bg-assirou-gold/5 rounded-2xl border-2 border-dashed border-assirou-gold/20">
                      <div className="relative mt-1">
                        <input 
                          type="checkbox" 
                          className="peer hidden" 
                          checked={confirmed} 
                          onChange={() => setConfirmed(!confirmed)} 
                        />
                        <div className="w-6 h-6 border-2 border-assirou-gold rounded-lg peer-checked:bg-assirou-gold transition-all flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-assirou-navy leading-relaxed">
                        Je confirme vouloir réserver mon ticket pour le Deuxième Forum sur les Métiers de la Sécurité Privée au Sénégal.
                      </span>
                    </label>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
              {step > 1 && (
                <button 
                  disabled={loading} 
                  type="button" 
                  onClick={prevStep} 
                  className="px-6 py-4 rounded-xl font-black text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                   <i className="fas fa-arrow-left text-[10px]"></i> Retour
                </button>
              )}
              
              {step < 5 ? (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="flex-1 px-6 py-4 rounded-xl font-black text-white bg-assirou-navy transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                   Suivant <i className="fas fa-arrow-right text-[10px] text-assirou-gold"></i>
                </button>
              ) : (
                confirmed && (
                  <button 
                    disabled={loading} 
                    type="submit" 
                    className="flex-1 px-6 py-5 rounded-xl font-black text-white bg-assirou-gold hover:bg-opacity-90 transition-all shadow-xl flex items-center justify-center gap-4 text-lg animate-in fade-in zoom-in duration-300"
                  >
                     {loading ? (
                       <span className="flex items-center gap-3">
                          <i className="fas fa-circle-notch fa-spin"></i>
                          <span className="text-[10px] uppercase tracking-widest">{loadingMsg}</span>
                       </span>
                     ) : "Confirmer ma Réservation"}
                  </button>
                )
              )}
            </div>
          </form>
        </div>
      </div>

      <footer className="mt-12 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">© 2026 Assirou Sécurité • Protection & Gardiennage</p>
      </footer>
    </div>
  );
};

export default PublicForm;
