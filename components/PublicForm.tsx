
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveParticipant, generateTicketNumber, isRegistrationActive } from '../utils/storage';
import { Participant } from '../types';
import { sendConfirmationEmail } from '../services/mailService';

const CANAUX_FORUM = ["Facebook", "Youtube", "Tiktok", "Siteweb", "Instagram", "Média", "Bouche à oreille"];
const CANAUX_ASSIROU = ["Réseaux Sociaux", "Site Web Officiel", "Ancien Client", "Recommandation", "Publicité", "Autre"];
const PARTICIPATIONS = ["Individuel", "Représentant d'une entreprise", "Professionnel de la sécurité", "Étudiant / Chercheur", "Autre"];
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
    sexe: 'Homme',
    adresse_email: '',
    telephone: '',
    organisation_entreprise: '',
    fonction: '',
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
      alert("Veuillez remplir les champs obligatoires (Nom, Email, Téléphone).");
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelection = (field: keyof Participant, value: string) => {
    const current = (formData[field] as string[]) || [];
    const next = current.includes(value) 
      ? current.filter(v => v !== value) 
      : [...current, value];
    setFormData({ ...formData, [field]: next });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive || !confirmed) return;
    
    setLoading(true);
    setLoadingMsg('Enregistrement de votre profil...');

    try {
      const ticketNum = await generateTicketNumber();
      const participantToSave = {
        ...formData,
        numero_ticket: ticketNum,
        date_inscription: new Date().toISOString(),
        statut_email: 'pending' as const
      } as Omit<Participant, 'id'>;

      const saved = await saveParticipant(participantToSave);
      
      if (saved) {
        setLoadingMsg('Pass validé ! Préparation du badge...');
        
        sendConfirmationEmail({ ...participantToSave, id: 'temp' } as Participant).catch(err => {
          console.warn("Échec mail non-critique :", err);
        });
        
        setTimeout(() => {
          navigate(`/ticket/${ticketNum}`);
        }, 800);
      } else {
        alert("Impossible d'enregistrer vos données. Veuillez vérifier votre connexion.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Critical Submit Error:", error);
      alert("Une erreur technique est survenue.");
      setLoading(false);
    }
  };

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-assirou-navy p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md text-center">
           <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-sm">
             <span className="font-black text-2xl">AS</span>
           </div>
           <h2 className="text-2xl font-black uppercase text-assirou-navy tracking-tighter">Inscriptions Closes</h2>
           <p className="text-slate-500 mt-4 font-medium">Le portail d'inscription au forum est actuellement fermé.</p>
           <button onClick={() => window.location.reload()} className="mt-8 px-8 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-assirou-gold hover:text-navy transition-all">Actualiser</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-assirou-navy pb-24 font-sans">
      <div className="fixed top-0 left-0 w-full h-2 bg-slate-200 z-50">
        <div className="h-full bg-assirou-gold transition-all duration-500 ease-out shadow-[0_0_10px_#C5A022]" style={{ width: `${(step/5)*100}%` }}></div>
      </div>

      <div className="assirou-gradient w-full py-24 text-center text-white px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="relative z-10 animate-in fade-in duration-1000">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-assirou-gold">
             <span className="text-assirou-navy text-4xl font-black tracking-tighter">AS</span>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-assirou-gold">Assirou Sécurité</p>
          </div>
          <h1 className="text-3xl md:text-6xl font-black uppercase max-w-4xl mx-auto leading-[0.9] mb-8 tracking-tighter drop-shadow-lg">
            FORUM MÉTIERS SÉCURITÉ 2026
          </h1>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-black tracking-[0.2em] uppercase">
            <div className="bg-white/10 px-8 py-3 rounded-2xl border border-white/5 backdrop-blur-md flex items-center gap-4">
              <span>05 MARS 2026</span>
              <span className="text-assirou-gold">•</span>
              <span>10H - 16H</span>
            </div>
            <span className="bg-assirou-gold text-assirou-navy px-8 py-3 rounded-2xl shadow-xl">CSC THIAROYE</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-[3.5rem] shadow-2xl p-10 md:p-16 border border-slate-100">
          
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-black text-assirou-navy border-l-8 border-assirou-gold pl-8 uppercase tracking-tighter">1. Identité</h2>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Étape 1/5</span>
                </div>
                <div className="grid gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Civilité</label>
                    <div className="flex gap-4">
                      {['Homme', 'Femme'].map(s => (
                        <button key={s} type="button" onClick={() => setFormData({...formData, sexe: s as any})} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase border-2 transition-all ${formData.sexe === s ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-assirou-gold'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom Complet *</label>
                    <input required placeholder="Prénom et Nom" className="w-full text-lg p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[2rem] outline-none transition-all shadow-inner" value={formData.nom_complet} onChange={e => setFormData({...formData, nom_complet: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Email *</label>
                      <input required type="email" placeholder="votre@email.com" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[2rem] outline-none transition-all shadow-inner" value={formData.adresse_email} onChange={e => setFormData({...formData, adresse_email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Téléphone * (chiffres uniquement)</label>
                      <input 
                        required 
                        type="tel" 
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="7x xxx xx xx" 
                        className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[2rem] outline-none transition-all shadow-inner" 
                        value={formData.telephone} 
                        onChange={e => setFormData({...formData, telephone: e.target.value.replace(/\D/g, '')})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-black text-assirou-navy border-l-8 border-assirou-gold pl-8 uppercase tracking-tighter">2. Profil Pro</h2>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Étape 2/5</span>
                </div>
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Structure / Entreprise</label>
                    <input placeholder="Nom de l'organisation" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[2rem] outline-none shadow-inner" value={formData.organisation_entreprise} onChange={e => setFormData({...formData, organisation_entreprise: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Fonction</label>
                    <input placeholder="Votre rôle" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[2rem] outline-none shadow-inner" value={formData.fonction} onChange={e => setFormData({...formData, fonction: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Comment voyez-vous le thème du forum ?</label>
                    <textarea 
                      placeholder="Ex: Un thème essentiel pour l'avenir de la sécurité..." 
                      className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[2rem] outline-none shadow-inner min-h-[120px] resize-none" 
                      value={formData.avis_theme} 
                      onChange={e => setFormData({...formData, avis_theme: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Type de Participation</label>
                  <div className="grid grid-cols-1 gap-3">
                    {PARTICIPATIONS.map(p => (
                      <button key={p} type="button" onClick={() => setFormData({...formData, participation: p as any})} className={`p-6 rounded-[2rem] border-2 text-left font-bold transition-all ${formData.participation === p ? 'bg-assirou-navy border-assirou-navy text-white shadow-xl translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-400 hover:border-assirou-gold'}`}>
                        <div className="flex justify-between items-center">
                          <span>{p}</span>
                          {formData.participation === p && <i className="fas fa-check-circle text-assirou-gold"></i>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-black text-assirou-navy border-l-8 border-assirou-gold pl-8 uppercase tracking-tighter">3. Enquête</h2>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Étape 3/5</span>
                </div>
                <div className="space-y-6">
                  <label className="text-xs font-black uppercase text-assirou-gold tracking-widest">Source de découverte du Forum ?</label>
                  <div className="flex flex-wrap gap-2">
                    {CANAUX_FORUM.map(c => (
                      <button key={c} type="button" onClick={() => toggleSelection('canal_forum', c)} className={`px-6 py-4 rounded-full text-[10px] font-black border-2 transition-all ${formData.canal_forum?.includes(c) ? 'bg-assirou-gold border-assirou-gold text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-assirou-gold'}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <label className="text-xs font-black uppercase text-assirou-navy tracking-widest">Comment suivez-vous Assirou ?</label>
                  <div className="flex flex-wrap gap-2">
                    {CANAUX_ASSIROU.map(c => (
                      <button key={c} type="button" onClick={() => toggleSelection('canal_assirou', c)} className={`px-6 py-4 rounded-full text-[10px] font-black border-2 transition-all ${formData.canal_assirou?.includes(c) ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-assirou-navy'}`}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-black text-assirou-navy border-l-8 border-assirou-gold pl-8 uppercase tracking-tighter">4. Besoins</h2>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Étape 4/5</span>
                </div>
                
                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                  <p className="text-xs font-black uppercase mb-8 text-assirou-navy tracking-widest">Intéressé par une formation ?</p>
                  <div className="flex gap-4 mb-8">
                    {['Oui', 'Non'].map(v => (
                      <button key={v} type="button" onClick={() => setFormData({...formData, souhait_formation: v as any})} className={`flex-1 py-5 rounded-[2rem] font-black text-xs uppercase border-2 transition-all ${formData.souhait_formation === v ? 'bg-assirou-gold border-assirou-gold text-white shadow-xl' : 'bg-white border-slate-200 text-slate-400'}`}>{v}</button>
                    ))}
                  </div>
                  {formData.souhait_formation === 'Oui' && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in-95">
                      {FORMATIONS_LIST.map(f => (
                        <button key={f} type="button" onClick={() => toggleSelection('type_formation', f)} className={`px-5 py-3 rounded-2xl text-[10px] font-black border uppercase transition-all ${formData.type_formation?.includes(f) ? 'bg-assirou-gold text-white border-assirou-gold' : 'bg-white text-slate-400 border-slate-200 hover:border-assirou-gold'}`}>{f}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                  <p className="text-xs font-black uppercase mb-8 text-assirou-navy tracking-widest">Intéressé par nos prestations ?</p>
                  <div className="flex gap-4 mb-8">
                    {['Oui', 'Non'].map(v => (
                      <button key={v} type="button" onClick={() => setFormData({...formData, interet_services: v as any})} className={`flex-1 py-5 rounded-[2rem] font-black text-xs uppercase border-2 transition-all ${formData.interet_services === v ? 'bg-assirou-navy border-assirou-navy text-white shadow-xl' : 'bg-white border-slate-200 text-slate-400'}`}>{v}</button>
                    ))}
                  </div>
                  {formData.interet_services === 'Oui' && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in-95">
                      {SERVICES_LIST.map(s => (
                        <button key={s} type="button" onClick={() => toggleSelection('services_interesses', s)} className={`px-5 py-3 rounded-2xl text-[10px] font-black border uppercase transition-all ${formData.services_interesses?.includes(s) ? 'bg-assirou-navy text-white border-assirou-navy' : 'bg-white text-slate-400 border-slate-200 hover:border-assirou-navy'}`}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-black text-assirou-navy border-l-8 border-assirou-gold pl-8 uppercase tracking-tighter">5. Validation</h2>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Récapitulatif</span>
                </div>
                
                <div className="space-y-8">
                  <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                    <h3 className="text-xs font-black uppercase text-assirou-gold tracking-[0.2em] mb-4">Résumé du Pass</h3>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-400">Titulaire</span>
                      <span className="font-black text-lg text-assirou-navy">{formData.nom_complet}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400">Badge</span>
                      <span className="bg-assirou-navy text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{formData.participation}</span>
                    </div>
                  </div>

                  <div 
                    className={`flex items-start gap-4 p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all ${confirmed ? 'bg-green-50 border-green-200 shadow-xl' : 'bg-white border-slate-100 hover:border-assirou-gold'}`}
                    onClick={() => setConfirmed(!confirmed)}
                  >
                    <div className={`mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${confirmed ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
                      {confirmed && <i className="fas fa-check text-white text-sm"></i>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-assirou-navy uppercase tracking-tight mb-2">Consentement</p>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                        Je confirme vouloir participer au Forum Sécurité 2026 et accepte de recevoir mon badge numérique certifié.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-12 border-t border-slate-100">
              {step > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep} 
                  disabled={loading}
                  className="flex-1 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-assirou-navy transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-chevron-left"></i> Retour
                </button>
              )}
              
              {step < 5 ? (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="flex-[2] bg-assirou-navy text-white py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-assirou-gold transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  Suivant <i className="fas fa-chevron-right"></i>
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={!confirmed || loading} 
                  className={`flex-[2] py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-2 ${confirmed && !loading ? 'bg-assirou-gold text-assirou-navy hover:scale-[1.02] active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-shield-check"></i>}
                  {loading ? loadingMsg : "Générer mon Pass Officiel"}
                </button>
              )}
            </div>

          </form>

        </div>
        
        <div className="mt-12 text-center">
           <p className="text-[9px] font-black uppercase text-slate-300 tracking-[1em]">ASSIROU SÉCURITÉ • KAARANGE BI</p>
        </div>
      </div>
    </div>
  );
};

export default PublicForm;
