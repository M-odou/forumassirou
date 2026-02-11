
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
  const [isActive, setIsActive] = useState(true);
  
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

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
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
    if (!isActive) return;
    setLoading(true);

    try {
      const ticketNum = await generateTicketNumber();
      const newParticipant = {
        id: crypto.randomUUID(),
        ...formData,
        numero_ticket: ticketNum,
        date_inscription: new Date().toISOString(),
        statut_email: 'pending'
      } as Participant;

      const success = await saveParticipant(newParticipant);
      
      if (success) {
        await generateEmailContent(newParticipant);
        navigate(`/ticket/${ticketNum}`);
      } else {
        alert("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
      }
    } catch (error) {
      console.error(error);
    } finally {
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
           <p className="text-slate-500 mb-8 font-medium">Les inscriptions pour le Forum 2026 sont désormais terminées. Merci de votre intérêt.</p>
           <p className="text-xs font-black text-assirou-gold uppercase tracking-widest">Équipe Assirou Sécurité</p>
        </div>
      </div>
    );
  }

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-assirou-light text-assirou-navy pb-24">
      <div className="fixed top-0 left-0 w-full h-2 bg-slate-200 z-50">
        <div className="h-full bg-assirou-gold transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="assirou-gradient w-full py-12 md:py-24 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="relative z-10 text-center px-6 w-full max-w-4xl">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-assirou-gold p-2">
             <i className="fas fa-shield-cat text-assirou-navy text-4xl md:text-5xl"></i>
          </div>
          <h1 className="text-white text-2xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-8">
            Forum Métiers Sécurité Privée
          </h1>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-3 md:gap-8">
            <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/5 w-full md:w-auto">
              <i className="fas fa-calendar-alt text-assirou-gold text-lg"></i>
              <div className="text-left">
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Date</p>
                <p className="text-sm font-black text-white">05 Mars 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/5 w-full md:w-auto">
              <i className="fas fa-clock text-assirou-gold text-lg"></i>
              <div className="text-left">
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Heure</p>
                <p className="text-sm font-black text-white">12H – 17H</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/5 w-full md:w-auto">
              <i className="fas fa-map-marker-alt text-assirou-gold text-lg"></i>
              <div className="text-left">
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Lieu</p>
                <p className="text-sm font-black text-white">CSC Thiaroye sur Mer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-14 border border-slate-100">
          
          <div className="mb-14 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Étape {step} / 4</span>
            <div className="flex gap-2">
              {[1,2,3,4].map(s => (
                <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${step >= s ? 'bg-assirou-gold scale-125' : 'bg-slate-100'}`}></div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-black text-assirou-navy border-l-8 border-assirou-gold pl-6">Vos Informations</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom Complet *</label>
                    <input required type="text" placeholder="Prénom et Nom" className="w-full text-xl p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all" value={formData.nom_complet} onChange={e => setFormData({...formData, nom_complet: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail *</label>
                    <input required type="email" placeholder="votre@email.com" className="w-full text-xl p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all" value={formData.adresse_email} onChange={e => setFormData({...formData, adresse_email: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone *</label>
                      <input required type="tel" placeholder="+221 ..." className="w-full text-xl p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Structure (Optionnel)</label>
                      <input type="text" placeholder="Entreprise / Organisation" className="w-full text-xl p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all" value={formData.organisation_entreprise} onChange={e => setFormData({...formData, organisation_entreprise: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-black text-assirou-navy border-l-8 border-assirou-gold pl-6">Profil & Thème</h2>
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quel est votre profil ?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PARTICIPATIONS.map(p => (
                      <button key={p} type="button" onClick={() => setFormData({...formData, participation: p as any})} className={`p-5 rounded-2xl border-2 text-left font-black transition-all ${formData.participation === p ? 'bg-assirou-navy border-assirou-navy text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-assirou-gold'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-loose">Que pensez-vous du thème choisi : La sécurité privée dans les grands évènements sportifs et culturels ... ?</label>
                  <textarea placeholder="Donnez-nous votre avis..." className="w-full text-lg p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all min-h-[140px]" value={formData.avis_theme} onChange={e => setFormData({...formData, avis_theme: e.target.value})} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-black text-assirou-navy border-l-8 border-assirou-gold pl-6">Canaux de Com'</h2>
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                  <label className="text-xs font-black uppercase tracking-widest text-assirou-gold">Canal Forum 2026</label>
                  <div className="flex flex-wrap gap-2">
                    {CANAUX.map(c => (
                      <button key={c} type="button" onClick={() => toggleSelection('canal_forum', c)} className={`px-5 py-3 rounded-full border-2 text-[10px] font-black transition-all ${formData.canal_forum?.includes(c) ? 'bg-assirou-gold border-assirou-gold text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-8 bg-assirou-navy rounded-3xl space-y-6 shadow-2xl">
                  <label className="text-xs font-black uppercase tracking-widest text-assirou-gold">Canal Assirou Sécurité</label>
                  <div className="flex flex-wrap gap-2">
                    {CANAUX.map(c => (
                      <button key={c} type="button" onClick={() => toggleSelection('canal_assirou', c)} className={`px-5 py-3 rounded-full border-2 text-[10px] font-black transition-all ${formData.canal_assirou?.includes(c) ? 'bg-assirou-gold border-assirou-gold text-white' : 'bg-white/5 border-white/10 text-white/40 hover:border-assirou-gold'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
                <h2 className="text-3xl font-black text-assirou-navy border-l-8 border-assirou-gold pl-6">Intérêts & Services</h2>
                
                <div className="grid grid-cols-1 gap-10">
                  {/* Section Formation Dynamique */}
                  <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] space-y-8 hover:border-assirou-gold/30 transition-all duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <p className="font-black text-xl text-assirou-navy flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-assirou-gold/10 flex items-center justify-center text-assirou-gold">
                          <i className="fas fa-graduation-cap"></i>
                        </div>
                        Souhaitez-vous une formation certifiante ?
                      </p>
                      <div className="flex gap-2 w-full sm:w-auto">
                        {['Oui', 'Non'].map(v => (
                          <button key={v} type="button" onClick={() => handleYesNoChange('souhait_formation', v as any)} className={`flex-1 sm:flex-none px-8 py-4 rounded-xl border-2 font-black transition-all ${formData.souhait_formation === v ? 'bg-assirou-gold border-assirou-gold text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.souhait_formation === 'Oui' && (
                      <div className="pt-6 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-6">Sélectionnez les formations qui vous intéressent :</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {FORMATIONS_LIST.map(f => (
                            <button key={f} type="button" onClick={() => toggleSelection('type_formation', f)} className={`p-4 rounded-xl border-2 text-left text-xs font-bold transition-all ${formData.type_formation?.includes(f) ? 'bg-assirou-navy border-assirou-navy text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-assirou-gold'}`}>
                              <i className={`fas ${formData.type_formation?.includes(f) ? 'fa-check-circle' : 'fa-circle'} mr-2 text-assirou-gold`}></i>
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section Services Dynamique */}
                  <div className="p-8 bg-assirou-navy rounded-[2.5rem] space-y-8 shadow-2xl hover:shadow-assirou-navy/40 transition-all duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <p className="font-black text-xl text-white flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-assirou-gold flex items-center justify-center text-assirou-navy">
                          <i className="fas fa-handshake"></i>
                        </div>
                        Intéressé par nos services de sécurité ?
                      </p>
                      <div className="flex gap-2 w-full sm:w-auto">
                        {['Oui', 'Non'].map(v => (
                          <button key={v} type="button" onClick={() => handleYesNoChange('interet_services', v as any)} className={`flex-1 sm:flex-none px-8 py-4 rounded-xl border-2 border-transparent font-black transition-all ${formData.interet_services === v ? 'bg-white text-assirou-navy shadow-lg' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.interet_services === 'Oui' && (
                      <div className="pt-6 border-t border-white/10 animate-in fade-in zoom-in-95 duration-500">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-6">Cochez les services souhaités pour votre structure :</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {SERVICES_LIST.map(s => (
                            <button key={s} type="button" onClick={() => toggleSelection('services_interesses', s)} className={`p-4 rounded-xl border-2 text-left text-xs font-bold transition-all ${formData.services_interesses?.includes(s) ? 'bg-white border-white text-assirou-navy shadow-md' : 'bg-white/5 border-white/10 text-white/40 hover:border-assirou-gold'}`}>
                              <i className={`fas ${formData.services_interesses?.includes(s) ? 'fa-check-circle' : 'fa-circle-notch'} mr-2 ${formData.services_interesses?.includes(s) ? 'text-assirou-gold' : 'text-white/10'}`}></i>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="px-10 py-5 rounded-2xl font-black text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                   <i className="fas fa-arrow-left text-[10px]"></i> Retour
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={nextStep} className="flex-1 px-10 py-5 rounded-2xl font-black text-white bg-assirou-navy hover:bg-opacity-95 transition-all flex items-center justify-center gap-3 shadow-xl transform active:scale-95">
                   Suivant <i className="fas fa-arrow-right text-[10px] text-assirou-gold"></i>
                </button>
              ) : (
                <button disabled={loading} type="submit" className="flex-1 px-10 py-6 rounded-2xl font-black text-white bg-assirou-gold hover:bg-opacity-95 transition-all shadow-2xl shadow-assirou-gold/30 flex items-center justify-center gap-4 text-xl transform active:scale-95">
                   {loading ? <i className="fas fa-circle-notch fa-spin"></i> : "Valider mon inscription"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <footer className="mt-24 text-center pb-12">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">© 2026 Assirou Sécurité • Service Protection & Gardiennage</p>
      </footer>
    </div>
  );
};

export default PublicForm;
