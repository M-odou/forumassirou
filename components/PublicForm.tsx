
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveParticipant, generateTicketNumber, isRegistrationActive } from '../utils/storage';
import { Participant } from '../types';
import { generateEmailContent } from '../services/geminiService';

const CANAUX_FORUM = ["Facebook", "Youtube", "Tiktok", "Siteweb", "Instagram", "Média", "Bouche à oreille"];
const CANAUX_ASSIROU = ["Réseaux Sociaux", "Site Web Officiel", "Ancien Client", "Recommandation", "Publicité", "Autre"];
const PARTICIPATIONS = ["Individuel", "Représentant d'une entreprise", "Professionnel de la sécurité", "Étudiant / Chercheur"];
const FORMATIONS_LIST = ["CQP-ASP", "SSIAP 1", "SSIAP 2", "SST", "APR (Garde du corps)", "Agent Stadier", "Télésurveillance"];
const SERVICES_LIST = ["Gardiennage", "Protection Rapprochée", "Sécurité Événementielle", "Audit & Conseil", "Télésurveillance", "Maître-chien", "Vente d'équipement"];

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
      try {
        const active = await isRegistrationActive();
        setIsActive(active);
      } catch (e) {
        setIsActive(true);
      }
    };
    checkStatus();
  }, []);

  const nextStep = () => {
    if (step === 1 && (!formData.nom_complet || !formData.adresse_email || !formData.telephone)) {
      alert("Veuillez remplir les champs obligatoires.");
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
  };
  
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
      [subField]: value === 'Non' ? [] : (formData[subField] || []) 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive || !confirmed || step < 5) return;
    
    setLoading(true);
    setLoadingMsg('Génération du ticket en cours...');

    try {
      // 1. Génération du numéro de ticket
      const ticketNum = await generateTicketNumber();
      
      // 2. Préparation des données complètes
      const participantToSave = {
        nom_complet: formData.nom_complet || '',
        adresse_email: formData.adresse_email || '',
        telephone: formData.telephone || '',
        organisation_entreprise: formData.organisation_entreprise || '',
        participation: formData.participation || 'Individuel',
        avis_theme: formData.avis_theme || '',
        canal_forum: formData.canal_forum || [],
        canal_assirou: formData.canal_assirou || [],
        souhait_formation: formData.souhait_formation || 'Non',
        type_formation: formData.type_formation || [],
        interet_services: formData.interet_services || 'Non',
        services_interesses: formData.services_interesses || [],
        numero_ticket: ticketNum,
        date_inscription: new Date().toISOString(),
        statut_email: 'pending' as const
      };

      // 3. Sauvegarde
      await saveParticipant(participantToSave);
      
      // 4. Simulation Email AI (sans bloquer si échec)
      setLoadingMsg('AI : Envoi de votre copie par mail...');
      try {
        await generateEmailContent(participantToSave as Participant);
      } catch (mailError) {
        console.warn("L'envoi d'email AI a échoué mais l'inscription est validée.");
      }
      
      setLoadingMsg('Inscription validée !');
      
      // 5. Redirection
      setTimeout(() => {
        navigate(`/ticket/${ticketNum}`);
      }, 1000);

    } catch (error) {
      console.error("Submission Error Details:", error);
      alert("Désolé, une erreur technique est survenue. L'inscription n'a pas pu être finalisée.");
      setLoading(false);
    }
  };

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-assirou-navy text-white">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md text-assirou-navy">
           <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
             <i className="fas fa-calendar-times text-3xl"></i>
           </div>
           <h2 className="text-2xl font-black mb-4 uppercase">Inscriptions Closes</h2>
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

      <div className="assirou-gradient w-full py-12 md:py-16 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="relative z-10 text-center px-6 w-full max-w-4xl">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-assirou-gold">
             <img src="https://api.dicebear.com/7.x/initials/svg?seed=AS&backgroundColor=002157" alt="Logo" className="w-10 h-10 rounded-full" />
          </div>
          <h1 className="text-white text-lg md:text-2xl font-black uppercase tracking-tight leading-tight mb-2 px-4 max-w-3xl mx-auto">
            DEUXIÈME FORUM SUR LES MÉTIERS DE LA SÉCURITÉ PRIVÉE AU SÉNÉGAL
          </h1>
          <p className="text-assirou-gold text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-6">
            Organisé par Assirou Sécurité
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            <span className="bg-white/10 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-sm text-[10px] font-black text-white uppercase tracking-widest">05 Mars 2026</span>
            <span className="bg-white/10 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-sm text-[10px] font-black text-white uppercase tracking-widest">CSC Thiaroye sur Mer</span>
            <span className="bg-assirou-gold/20 px-4 py-2 rounded-xl border border-assirou-gold/30 backdrop-blur-sm text-[10px] font-black text-assirou-gold uppercase tracking-widest">12h - 17h</span>
          </div>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-100">
          
          <div className="mb-10 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Section {step} sur 5</span>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(s => (
                <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-assirou-gold' : 'bg-slate-100'}`}></div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8" onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}>
            
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Vos Coordonnées</h2>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom Complet *</label>
                    <input required type="text" placeholder="Prénom et Nom" className="w-full text-lg p-4 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-xl outline-none transition-all" value={formData.nom_complet} onChange={e => setFormData({...formData, nom_complet: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail *</label>
                      <input required type="email" placeholder="email@exemple.com" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-xl outline-none transition-all" value={formData.adresse_email} onChange={e => setFormData({...formData, adresse_email: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone *</label>
                      <input required type="tel" placeholder="7x xxx xx xx" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-xl outline-none transition-all" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organisation / Entreprise</label>
                    <input type="text" placeholder="Nom de votre structure (Optionnel)" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-xl outline-none transition-all" value={formData.organisation_entreprise} onChange={e => setFormData({...formData, organisation_entreprise: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Votre Profil & Avis</h2>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vous participez en tant que :</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PARTICIPATIONS.map(p => (
                        <button key={p} type="button" onClick={() => setFormData({...formData, participation: p as any})} className={`p-4 rounded-xl border-2 text-left font-bold text-sm transition-all ${formData.participation === p ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-assirou-gold'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Votre avis sur le thème du Forum :</label>
                    <p className="text-[11px] font-black text-assirou-gold uppercase italic mb-2 leading-tight">
                      "LA SÉCURITÉ PRIVÉE DANS LES GRANDS ÉVÉNEMENTS SPORTIFS ET CULTURELS"
                    </p>
                    <textarea placeholder="Partagez votre réflexion ou vos attentes concernant ce thème..." className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-xl outline-none transition-all h-32 resize-none" value={formData.avis_theme} onChange={e => setFormData({...formData, avis_theme: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Communication</h2>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-assirou-gold">Comment avez-vous connu ce FORUM ?</p>
                    <div className="flex flex-wrap gap-2">
                      {CANAUX_FORUM.map(c => (
                        <button key={c} type="button" onClick={() => toggleSelection('canal_forum', c)} className={`px-4 py-2 rounded-full border-2 text-[10px] font-black transition-all ${formData.canal_forum?.includes(c) ? 'bg-assirou-gold border-assirou-gold text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-assirou-gold'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-assirou-navy">Comment avez-vous connu ASSIROU SÉCURITÉ ?</p>
                    <div className="flex flex-wrap gap-2">
                      {CANAUX_ASSIROU.map(c => (
                        <button key={c} type="button" onClick={() => toggleSelection('canal_assirou', c)} className={`px-4 py-2 rounded-full border-2 text-[10px] font-black transition-all ${formData.canal_assirou?.includes(c) ? 'bg-assirou-navy border-assirou-navy text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-assirou-navy'}`}>
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
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Besoins & Intérêts</h2>
                <div className="space-y-8">
                  <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="font-black text-sm text-assirou-navy">Souhaitez-vous une formation ?</p>
                      <div className="flex gap-2">
                        {['Oui', 'Non'].map(v => (
                          <button key={v} type="button" onClick={() => handleYesNoChange('souhait_formation', v as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${formData.souhait_formation === v ? 'bg-assirou-navy text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    {formData.souhait_formation === 'Oui' && (
                      <div className="pt-4 border-t border-slate-200 space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sélectionnez la/les formation(s) :</p>
                        <div className="flex flex-wrap gap-2">
                          {FORMATIONS_LIST.map(f => (
                            <button key={f} type="button" onClick={() => toggleSelection('type_formation', f)} className={`px-3 py-2 rounded-lg text-[9px] font-bold border ${formData.type_formation?.includes(f) ? 'bg-assirou-gold text-white border-assirou-gold' : 'bg-white text-slate-400 border-slate-200'}`}>
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="font-black text-sm text-assirou-navy">Intéressé par nos services ?</p>
                      <div className="flex gap-2">
                        {['Oui', 'Non'].map(v => (
                          <button key={v} type="button" onClick={() => handleYesNoChange('interet_services', v as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${formData.interet_services === v ? 'bg-assirou-gold text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    {formData.interet_services === 'Oui' && (
                      <div className="pt-4 border-t border-slate-200 space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Services qui vous intéressent :</p>
                        <div className="flex flex-wrap gap-2">
                          {SERVICES_LIST.map(s => (
                            <button key={s} type="button" onClick={() => toggleSelection('services_interesses', s)} className={`px-3 py-2 rounded-lg text-[9px] font-bold border ${formData.services_interesses?.includes(s) ? 'bg-assirou-navy text-white border-assirou-navy' : 'bg-white text-slate-400 border-slate-200'}`}>
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

            {step === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Dernière étape</h2>
                
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-5">
                   <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Participant</span>
                      <span className="text-sm font-black text-assirou-navy">{formData.nom_complet}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Lieu de l'événement</span>
                      <span className="text-sm font-bold text-assirou-gold">CSC Thiaroye sur Mer</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Horaire</span>
                      <span className="text-sm font-bold text-slate-600">12h00 - 17h00</span>
                   </div>
                </div>

                <div className="pt-2">
                    <label className="flex items-start gap-4 cursor-pointer group p-5 bg-assirou-navy/5 rounded-2xl border-2 border-dashed border-assirou-navy/20 hover:bg-assirou-navy/10 transition-all">
                      <div className="relative mt-1">
                        <input type="checkbox" className="peer hidden" checked={confirmed} onChange={() => setConfirmed(!confirmed)} />
                        <div className="w-6 h-6 border-2 border-assirou-navy rounded-lg peer-checked:bg-assirou-navy transition-all flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-assirou-navy leading-relaxed">
                        Je confirme mon inscription au Forum et j'accepte de recevoir mon badge d'accès par e-mail.
                      </span>
                    </label>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100">
              {step > 1 && (
                <button disabled={loading} type="button" onClick={prevStep} className="px-8 py-4 rounded-xl font-black text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                   <i className="fas fa-chevron-left text-[10px]"></i> Précédent
                </button>
              )}
              
              {step < 5 ? (
                <button type="button" onClick={nextStep} className="flex-1 px-8 py-4 rounded-xl font-black text-white bg-assirou-navy hover:bg-[#001a45] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-navy-900/20">
                   Continuer <i className="fas fa-chevron-right text-[10px] text-assirou-gold"></i>
                </button>
              ) : (
                confirmed && (
                  <button disabled={loading} type="submit" className="flex-1 px-8 py-5 rounded-xl font-black text-white bg-assirou-gold hover:bg-[#b08e1e] transition-all shadow-xl flex items-center justify-center gap-4 text-lg animate-in zoom-in duration-300">
                     {loading ? (
                       <span className="flex items-center gap-3">
                          <i className="fas fa-spinner fa-spin"></i>
                          <span className="text-[10px] uppercase tracking-widest">{loadingMsg}</span>
                       </span>
                     ) : (
                       <>Générer mon Ticket <i className="fas fa-ticket-alt"></i></>
                     )}
                  </button>
                )
              )}
            </div>
          </form>
        </div>
      </div>

      <footer className="mt-16 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.6em] text-slate-400">ASSIRU SÉCURITÉ © 2026 • kaarange bi dall xel</p>
      </footer>
    </div>
  );
};

export default PublicForm;
