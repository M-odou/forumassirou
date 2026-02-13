
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveParticipant, generateTicketNumber, isRegistrationActive } from '../utils/storage';
import { Participant } from '../types';
import { sendConfirmationEmail } from '../services/mailService';

const DISCOVERY_FORUM = ["Facebook", "LinkedIn", "WhatsApp", "Bouche à oreille", "Média/Presse", "Affiche/Flyer", "Autre"];
const CANAL_ASSIROU = ["Site Web", "Réseaux Sociaux", "Newsletter", "Contact Direct", "Recommandation"];
const PARTICIPATIONS = ["Individuel", "Représentant d'une entreprise", "Professionnel de la sécurité", "Étudiant / Chercheur", "Autre"];
const FORMATIONS_LIST = ["Agents de Sécurité Pro", "Gestion de Foule", "Secourisme / SST", "Sécurité Incendie", "Vidéoprotection"];
const SERVICES_LIST = ["Gardiennage", "Sécurité Événementielle", "Audit & Conseil", "Escorte / Protection", "Systèmes Électroniques"];

const PublicForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
        setIsActive(true); // Par défaut on laisse ouvert si erreur
      } finally {
        setInitialLoading(false);
      }
    };
    checkStatus();
  }, []);

  const nextStep = () => {
    if (step === 1) {
      if (!formData.nom_complet || !formData.adresse_email || !formData.telephone || !formData.organisation_entreprise || !formData.fonction) {
        alert("Veuillez remplir toutes les informations d'identité (personnelles et professionnelles).");
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelection = (field: keyof Participant, value: string) => {
    const current = (formData[field] as string[]) || [];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    setFormData({ ...formData, [field]: next });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive || !confirmed || loading) return;
    
    setLoading(true);

    try {
      const ticketNum = await generateTicketNumber();
      const participantToSave = {
        ...formData,
        numero_ticket: ticketNum,
        date_inscription: new Date().toISOString(),
        statut_email: 'pending' as const
      } as Omit<Participant, 'id' | 'token'>;

      const success = await saveParticipant(participantToSave);
      
      if (success) {
        sendConfirmationEmail({ ...participantToSave, id: 'temp', token: 'temp' } as Participant)
          .catch(err => console.error("Notification error:", err));
          
        setTimeout(() => {
          setLoading(false);
          navigate(`/ticket/${ticketNum}`);
        }, 1000);
      } else {
        throw new Error("Erreur enregistrement");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setLoading(false);
      alert("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-assirou-navy">
        <div className="text-center">
          <div className="w-16 h-16 bg-assirou-gold rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce shadow-2xl">
            <span className="text-assirou-navy font-black text-2xl">AS</span>
          </div>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Initialisation...</p>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-assirou-navy p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md text-center">
           <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600 font-black text-2xl">AS</div>
           <h2 className="text-2xl font-black text-assirou-navy uppercase">Inscriptions Closes</h2>
           <p className="text-slate-500 mt-4 leading-relaxed">Les inscriptions sont terminées pour cette édition. Merci de votre fidélité.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-assirou-navy pb-24 font-sans selection:bg-assirou-gold selection:text-assirou-navy">
      {/* Barre de progression fixe */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
        <div 
          className="h-full bg-assirou-gold transition-all duration-700 ease-in-out shadow-[0_0_20px_#C5A022]" 
          style={{ width: `${(step/3)*100}%` }}
        ></div>
      </div>

      {/* Header Assirou */}
      <div className="assirou-gradient w-full py-20 md:py-28 text-center text-white px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A022_1px,transparent_1px)] [background-size:32px_32px]"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform rotate-3">
             <span className="text-assirou-navy text-3xl font-black">AS</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black uppercase mb-6 tracking-tighter leading-tight">
            DEUXIÈME FORUM SUR LES MÉTIERS <br className="hidden md:block" /> DE LA SÉCURITÉ PRIVÉE AU SÉNÉGAL
          </h1>
          <div className="inline-flex items-center gap-3 bg-white/10 px-8 py-3 rounded-full border border-white/20 backdrop-blur-md">
            <span className="text-xs font-black uppercase tracking-widest text-assirou-gold">05 MARS 2026 • CSC THIAROYE</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,33,87,0.15)] p-8 md:p-16 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* ÉTAPE 1 : IDENTITÉ & PROFIL PROFESSIONNEL */}
            {step === 1 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="space-y-3">
                  <span className="text-assirou-gold font-black text-[11px] uppercase tracking-[0.3em]">Étape 01/03</span>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Identité & Profil Pro</h2>
                </div>
                
                <div className="space-y-8">
                  <div className="flex gap-3">
                    {['Homme', 'Femme'].map(s => (
                      <button key={s} type="button" onClick={() => setFormData({...formData, sexe: s as any})} className={`flex-1 py-5 rounded-2xl font-black text-[11px] uppercase border-2 transition-all ${formData.sexe === s ? 'bg-assirou-navy border-assirou-navy text-white shadow-xl translate-y-[-2px]' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>{s}</button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <input required placeholder="Nom et Prénom complet *" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[1.5rem] outline-none font-bold transition-all shadow-inner" value={formData.nom_complet} onChange={e => setFormData({...formData, nom_complet: e.target.value})} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required type="email" placeholder="Adresse Email *" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[1.5rem] outline-none font-bold transition-all shadow-inner" value={formData.adresse_email} onChange={e => setFormData({...formData, adresse_email: e.target.value})} />
                      <input required type="tel" placeholder="Téléphone *" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[1.5rem] outline-none font-bold transition-all shadow-inner" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required placeholder="Organisation / Entreprise *" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[1.5rem] outline-none font-bold transition-all shadow-inner" value={formData.organisation_entreprise} onChange={e => setFormData({...formData, organisation_entreprise: e.target.value})} />
                      <input required placeholder="Fonction / Poste *" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[1.5rem] outline-none font-bold transition-all shadow-inner" value={formData.fonction} onChange={e => setFormData({...formData, fonction: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : PARTICIPATION & RÉSEAUX */}
            {step === 2 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="space-y-3">
                  <span className="text-assirou-gold font-black text-[11px] uppercase tracking-[0.3em]">Étape 02/03</span>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Participation & Réseaux</h2>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Vous participez en tant que :</label>
                    <div className="flex flex-wrap gap-2">
                      {PARTICIPATIONS.map(p => (
                        <button key={p} type="button" onClick={() => setFormData({...formData, participation: p as any})} className={`px-5 py-3.5 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${formData.participation === p ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg translate-y-[-2px]' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>{p}</button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Comment avez-vous connu ce forum ?</p>
                      <div className="flex flex-wrap gap-2">
                        {DISCOVERY_FORUM.map(c => (
                          <button key={c} type="button" onClick={() => toggleSelection('canal_forum', c)} className={`px-4 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.canal_forum?.includes(c) ? 'bg-assirou-navy border-assirou-navy text-white shadow-md' : 'bg-white border-transparent text-slate-400 hover:border-assirou-gold/30'}`}>{c}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Comment suivez-vous Assirou Sécurité ?</p>
                      <div className="flex flex-wrap gap-2">
                        {CANAL_ASSIROU.map(c => (
                          <button key={c} type="button" onClick={() => toggleSelection('canal_assirou', c)} className={`px-4 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.canal_assirou?.includes(c) ? 'bg-assirou-navy border-assirou-navy text-white shadow-md' : 'bg-white border-transparent text-slate-400 hover:border-assirou-gold/30'}`}>{c}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : VISION & BESOINS */}
            {step === 3 && (
              <div className="space-y-12 animate-in zoom-in-95 duration-700">
                <div className="space-y-3 text-center">
                  <span className="text-assirou-gold font-black text-[11px] uppercase tracking-[0.3em]">Étape 03/03</span>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Vision & Besoins</h2>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest pl-1">Votre avis sur le thème du Forum :</p>
                    <textarea placeholder="Exprimez vos attentes ou votre vision du thème..." rows={3} className="w-full p-7 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-[2rem] outline-none font-medium text-sm transition-all resize-none shadow-inner" value={formData.avis_theme} onChange={e => setFormData({...formData, avis_theme: e.target.value})} />
                  </div>

                  <div className="space-y-12">
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <label className="text-[11px] font-black uppercase text-assirou-navy tracking-widest">Souhaitez-vous suivre une formation spécifique ?</label>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                          {['Non', 'Oui'].map(opt => (
                            <button key={opt} type="button" onClick={() => setFormData({...formData, souhait_formation: opt as any})} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${formData.souhait_formation === opt ? 'bg-white text-assirou-navy shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{opt}</button>
                          ))}
                        </div>
                      </div>
                      {formData.souhait_formation === 'Oui' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in slide-in-from-top-4 duration-500">
                          {FORMATIONS_LIST.map(f => (
                            <button key={f} type="button" onClick={() => toggleSelection('type_formation', f)} className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 ${formData.type_formation?.includes(f) ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                              <span className="text-[10px] font-black uppercase">{f}</span>
                              {formData.type_formation?.includes(f) ? <i className="fas fa-check-circle text-assirou-gold"></i> : <i className="far fa-circle opacity-20"></i>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-6 border-t border-slate-100 pt-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <label className="text-[11px] font-black uppercase text-assirou-navy tracking-widest">Êtes-vous intéressé par nos services de sécurité ?</label>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                          {['Non', 'Oui'].map(opt => (
                            <button key={opt} type="button" onClick={() => setFormData({...formData, interet_services: opt as any})} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${formData.interet_services === opt ? 'bg-white text-assirou-navy shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{opt}</button>
                          ))}
                        </div>
                      </div>
                      {formData.interet_services === 'Oui' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in slide-in-from-top-4 duration-500">
                          {SERVICES_LIST.map(s => (
                            <button key={s} type="button" onClick={() => toggleSelection('services_interesses', s)} className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 ${formData.services_interesses?.includes(s) ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                              <span className="text-[10px] font-black uppercase">{s}</span>
                              {formData.services_interesses?.includes(s) ? <i className="fas fa-check-circle text-assirou-gold"></i> : <i className="far fa-circle opacity-20"></i>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-8">
                    <label className="flex items-start gap-6 p-8 bg-assirou-navy/[0.03] rounded-[2.5rem] cursor-pointer border-2 border-transparent hover:border-assirou-gold/20 transition-all text-left group">
                      <input type="checkbox" checked={confirmed} onChange={() => setConfirmed(!confirmed)} className="w-7 h-7 rounded-xl accent-assirou-gold cursor-pointer" />
                      <span className="text-xs font-bold text-slate-600 leading-relaxed group-hover:text-assirou-navy transition-colors">
                        Je confirme mon inscription et j'accepte d'être contacté par Assirou Sécurité. Je m'engage à présenter mon QR Code au CSC Thiaroye le 05 Mars 2026.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons de Navigation */}
            <div className="flex flex-col md:flex-row gap-4 pt-8">
              {step > 1 && (
                <button type="button" onClick={prevStep} disabled={loading} className="w-full md:flex-1 py-6 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 border-2 border-slate-100 hover:bg-slate-50 transition-all">Précédent</button>
              )}
              {step < 3 ? (
                <button type="button" onClick={nextStep} className="w-full md:flex-[2] bg-assirou-navy text-white py-6 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:translate-y-[-4px] transition-all">Continuer</button>
              ) : (
                <button type="submit" disabled={!confirmed || loading} className={`w-full md:flex-[2] py-6 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 ${confirmed && !loading ? 'bg-assirou-gold text-assirou-navy hover:scale-[1.02]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  {loading ? <><i className="fas fa-circle-notch fa-spin"></i> Traitement...</> : <><i className="fas fa-id-card-clip"></i> Obtenir mon Badge</>}
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div className="mt-16 text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[1em] text-assirou-navy">Assirou Sécurité</p>
        </div>
      </div>
    </div>
  );
};

export default PublicForm;
