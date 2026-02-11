
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveParticipant, generateTicketNumber, isRegistrationActive } from '../utils/storage';
import { Participant } from '../types';
import { sendConfirmationEmail } from '../services/mailService';

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
      const active = await isRegistrationActive();
      setIsActive(active);
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
    setLoadingMsg('Génération du badge...');

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
        setLoadingMsg('Envoi de l\'e-mail...');
        try {
          // Utilisation de l'API Gemini pour générer le contenu de l'email
          await sendConfirmationEmail({ ...participantToSave, id: 'temp' } as Participant);
        } catch (mailError) {
          console.error("Mail error:", mailError);
        }
        
        setLoadingMsg('Succès !');
        setTimeout(() => navigate(`/ticket/${ticketNum}`), 1000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Une erreur est survenue lors de l'inscription.");
      setLoading(false);
    }
  };

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-assirou-navy text-white p-10 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md text-assirou-navy">
           <i className="fas fa-calendar-times text-4xl text-red-500 mb-6"></i>
           <h2 className="text-2xl font-black mb-4 uppercase">Inscriptions Closes</h2>
           <p className="text-slate-500 mb-8">Les inscriptions pour le Forum 2026 sont terminées.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-assirou-navy pb-24 font-sans">
      {/* Barre de progression */}
      <div className="fixed top-0 left-0 w-full h-2 bg-slate-200 z-50">
        <div className="h-full bg-assirou-gold transition-all duration-500 ease-out" style={{ width: `${(step/5)*100}%` }}></div>
      </div>

      {/* Header */}
      <div className="assirou-gradient w-full py-16 text-center text-white px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-assirou-gold">
             <img src="https://api.dicebear.com/7.x/initials/svg?seed=AS&backgroundColor=002157" alt="Logo" className="w-10 h-10 rounded-full" />
          </div>
          <h1 className="text-xl md:text-3xl font-black uppercase max-w-3xl mx-auto leading-tight mb-4 tracking-tighter">
            DEUXIÈME FORUM SUR LES MÉTIERS DE LA SÉCURITÉ PRIVÉE AU SÉNÉGAL
          </h1>
          <div className="flex flex-wrap justify-center gap-4 text-[10px] font-black tracking-[0.2em] uppercase">
            <span className="bg-white/10 px-6 py-2 rounded-xl border border-white/5 backdrop-blur-md">05 Mars 2026</span>
            <span className="bg-assirou-gold text-assirou-navy px-6 py-2 rounded-xl shadow-lg font-black">10h00 - 16h00</span>
            <span className="bg-white/10 px-6 py-2 rounded-xl border border-white/5 backdrop-blur-md">CSC Thiaroye sur Mer</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-100">
          
          <div className="mb-10 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Étape {step} / 5</span>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(s => (
                <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${step >= s ? 'bg-assirou-gold scale-125' : 'bg-slate-100'}`}></div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Identité & Contact</h2>
                <div className="grid gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nom Complet *</label>
                    <input required placeholder="Prénom et Nom" className="w-full text-lg p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all" value={formData.nom_complet} onChange={e => setFormData({...formData, nom_complet: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">E-mail *</label>
                      <input required type="email" placeholder="votre@email.com" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all" value={formData.adresse_email} onChange={e => setFormData({...formData, adresse_email: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Téléphone *</label>
                      <input required type="tel" placeholder="7x xxx xx xx" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entreprise ou Organisation</label>
                    <input placeholder="Nom de votre structure (facultatif)" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all" value={formData.organisation_entreprise} onChange={e => setFormData({...formData, organisation_entreprise: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Votre Profil</h2>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vous participez en tant que :</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PARTICIPATIONS.map(p => (
                        <button key={p} type="button" onClick={() => setFormData({...formData, participation: p as any})} className={`p-5 rounded-2xl border-2 text-left font-bold text-sm transition-all ${formData.participation === p ? 'bg-assirou-navy border-assirou-navy text-white shadow-xl translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-400 hover:border-assirou-gold'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Votre avis sur le thème :</label>
                    <textarea placeholder="Que pensez-vous du rôle de la sécurité privée dans les grands événements ?" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold focus:bg-white rounded-2xl outline-none transition-all h-32 resize-none" value={formData.avis_theme} onChange={e => setFormData({...formData, avis_theme: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Communication</h2>
                <div className="space-y-8">
                  <div>
                    <label className="text-[11px] font-black uppercase text-assirou-gold mb-4 block tracking-wider">Comment avez-vous connu ce FORUM ?</label>
                    <div className="flex flex-wrap gap-2">
                      {CANAUX_FORUM.map(c => (
                        <button key={c} type="button" onClick={() => toggleSelection('canal_forum', c)} className={`px-5 py-3 rounded-full text-[10px] font-black border-2 transition-all ${formData.canal_forum?.includes(c) ? 'bg-assirou-gold border-assirou-gold text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-assirou-gold'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase text-assirou-navy mb-4 block tracking-wider">Comment avez-vous connu ASSIROU SÉCURITÉ ?</label>
                    <div className="flex flex-wrap gap-2">
                      {CANAUX_ASSIROU.map(c => (
                        <button key={c} type="button" onClick={() => toggleSelection('canal_assirou', c)} className={`px-5 py-3 rounded-full text-[10px] font-black border-2 transition-all ${formData.canal_assirou?.includes(c) ? 'bg-assirou-navy border-assirou-navy text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-assirou-gold'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Besoins & Intérêts</h2>
                
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <p className="font-black text-sm uppercase tracking-tight">Souhaitez-vous une formation ?</p>
                      <div className="flex gap-2">
                        {['Oui', 'Non'].map(v => (
                          <button key={v} type="button" onClick={() => handleYesNoChange('souhait_formation', v as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${formData.souhait_formation === v ? 'bg-assirou-navy text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}>{v}</button>
                        ))}
                      </div>
                    </div>
                    {formData.souhait_formation === 'Oui' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-300">
                        {FORMATIONS_LIST.map(f => (
                          <button key={f} type="button" onClick={() => toggleSelection('type_formation', f)} className={`p-3 rounded-xl text-[9px] font-black border-2 transition-all ${formData.type_formation?.includes(f) ? 'bg-assirou-gold border-assirou-gold text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{f}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <p className="font-black text-sm uppercase tracking-tight">Intéressé par nos services ?</p>
                      <div className="flex gap-2">
                        {['Oui', 'Non'].map(v => (
                          <button key={v} type="button" onClick={() => handleYesNoChange('interet_services', v as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${formData.interet_services === v ? 'bg-assirou-navy text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}>{v}</button>
                        ))}
                      </div>
                    </div>
                    {formData.interet_services === 'Oui' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-300">
                        {SERVICES_LIST.map(s => (
                          <button key={s} type="button" onClick={() => toggleSelection('services_interesses', s)} className={`p-3 rounded-xl text-[9px] font-black border-2 transition-all ${formData.services_interesses?.includes(s) ? 'bg-assirou-navy border-assirou-navy text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-assirou-navy border-l-6 border-assirou-gold pl-5">Validation Finale</h2>
                <div className="bg-assirou-navy/5 p-8 rounded-[2rem] border-2 border-dashed border-assirou-navy/10">
                  <p className="text-sm font-bold text-assirou-navy/70 leading-relaxed mb-6">
                    En confirmant, votre badge sera généré avec vos accès pour le 05 Mars 2026. Vous recevrez également une confirmation par e-mail.
                  </p>
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-1">
                      <input type="checkbox" className="peer hidden" checked={confirmed} onChange={() => setConfirmed(!confirmed)} />
                      <div className="w-6 h-6 border-2 border-assirou-navy rounded-lg peer-checked:bg-assirou-navy transition-all flex items-center justify-center">
                        <i className="fas fa-check text-white text-xs opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                      </div>
                    </div>
                    <span className="text-[12px] font-black text-assirou-navy uppercase tracking-wide">
                      Je confirme ma participation et l'exactitude des informations fournies.
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="px-10 py-5 rounded-2xl bg-slate-100 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-200 transition-all">Retour</button>
              )}
              {step < 5 ? (
                <button type="button" onClick={nextStep} className="flex-1 px-10 py-5 rounded-2xl bg-assirou-navy text-white font-black text-[11px] uppercase tracking-widest hover:bg-[#001a45] shadow-xl transition-all">Continuer</button>
              ) : (
                <button type="submit" disabled={!confirmed || loading} className="flex-1 px-10 py-5 rounded-2xl bg-assirou-gold text-assirou-navy font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-[#b08e1e] transition-all disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <i className="fas fa-spinner fa-spin"></i> {loadingMsg}
                    </span>
                  ) : 'Valider & Générer mon Badge'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <footer className="mt-16 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">ASSIRU SÉCURITÉ • KAARANGE BI DALL XEL • 2026</p>
      </footer>
    </div>
  );
};

export default PublicForm;
