
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveParticipant, generateTicketNumber, isRegistrationActive } from '../utils/storage';
import { Participant } from '../types';
import { sendConfirmationEmail } from '../services/mailService';

const DISCOVERY_SOURCES = ["Facebook", "Tiktok", "Média", "Site Web", "Ancien Client", "Recommandation", "Autre"];
const PARTICIPATIONS = ["Individuel", "Professionnel", "Entreprise", "Étudiant", "Autre"];
const FORMATIONS_LIST = ["SSIAP 1/2", "CQP-ASP", "Garde du corps", "Vidéosurveillance", "Secourisme"];
const SERVICES_LIST = ["Gardiennage", "Événementiel", "Audit/Conseil", "Équipement"];

const PublicForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
    souhait_formation: 'Non',
    type_formation: [],
    interet_services: 'Non',
    services_interesses: []
  });

  useEffect(() => {
    isRegistrationActive().then(setIsActive).catch(() => setIsActive(true));
  }, []);

  const nextStep = () => {
    if (step === 1 && (!formData.nom_complet || !formData.adresse_email || !formData.telephone)) {
      alert("Merci de renseigner vos coordonnées complètes."); return;
    }
    // L'avis sur le thème n'est plus obligatoire ici
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
    if (!isActive || !confirmed) return;
    setLoading(true);

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
        sendConfirmationEmail({ ...participantToSave, id: 'temp' } as Participant).catch(() => {});
        setTimeout(() => navigate(`/ticket/${ticketNum}`), 300);
      } else {
        alert("Erreur lors de l'enregistrement."); setLoading(false);
      }
    } catch (error) {
      alert("Une erreur technique est survenue."); setLoading(false);
    }
  };

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-assirou-navy p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md text-center border border-white/10">
           <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600 font-black text-2xl">AS</div>
           <h2 className="text-2xl font-black text-assirou-navy uppercase tracking-tighter">Inscriptions Closes</h2>
           <p className="text-slate-500 mt-4 leading-relaxed">Les inscriptions en ligne sont désormais terminées. Nous vous attendons directement sur place au CSC Thiaroye le 05 mars.</p>
           <button onClick={() => window.location.reload()} className="mt-8 px-8 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500">Actualiser</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-assirou-navy pb-24 font-sans">
      {/* Fixed Progress bar */}
      <div className="fixed top-0 left-0 w-full h-2 bg-slate-200 z-50">
        <div className="h-full bg-assirou-gold transition-all duration-700 ease-out" style={{ width: `${(step/3)*100}%` }}></div>
      </div>

      {/* Institutional Header */}
      <div className="assirou-gradient w-full py-16 md:py-24 text-center text-white px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A022_1px,transparent_1px)] [background-size:30px_30px]"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
             <span className="text-assirou-navy text-2xl md:text-3xl font-black">AS</span>
          </div>
          <h1 className="text-xl md:text-4xl font-black uppercase max-w-5xl mx-auto leading-tight mb-6 tracking-tighter">
            DEUXIÈME FORUM SUR LES MÉTIERS <br className="hidden md:block" /> DE LA SÉCURITÉ PRIVÉE AU SÉNÉGAL
          </h1>
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">05 MARS 2026 • 10H - 16H • CSC THIAROYE</span>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl p-8 md:p-14 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* STEP 1: CONTACT & IDENTITY */}
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black text-assirou-navy uppercase tracking-tighter">Étape 1 : Vos Informations</h2>
                  <p className="text-sm text-slate-400 font-medium">Commençons par vos coordonnées professionnelles.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-2">
                    {['Homme', 'Femme'].map(s => (
                      <button key={s} type="button" onClick={() => setFormData({...formData, sexe: s as any})} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${formData.sexe === s ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>{s}</button>
                    ))}
                  </div>
                  
                  <div className="grid gap-4">
                    <input required placeholder="Nom et Prénom *" className="w-full text-base p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold rounded-2xl outline-none font-semibold transition-all" value={formData.nom_complet} onChange={e => setFormData({...formData, nom_complet: e.target.value})} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required type="email" placeholder="Email *" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold rounded-2xl outline-none font-semibold transition-all" value={formData.adresse_email} onChange={e => setFormData({...formData, adresse_email: e.target.value})} />
                      <input required type="tel" placeholder="Téléphone *" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold rounded-2xl outline-none font-semibold transition-all" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value.replace(/\D/g, '')})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <input placeholder="Entreprise / École" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold rounded-2xl outline-none font-medium" value={formData.organisation_entreprise} onChange={e => setFormData({...formData, organisation_entreprise: e.target.value})} />
                       <input placeholder="Fonction" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-assirou-gold rounded-2xl outline-none font-medium" value={formData.fonction} onChange={e => setFormData({...formData, fonction: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Catégorie de participation :</p>
                    <div className="flex flex-wrap gap-2">
                      {PARTICIPATIONS.map(p => (
                        <button key={p} type="button" onClick={() => setFormData({...formData, participation: p as any})} className={`px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.participation === p ? 'bg-assirou-gold border-assirou-gold text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: VISION & THEME OPINION */}
            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black text-assirou-navy uppercase tracking-tighter">Étape 2 : Votre Vision</h2>
                  <p className="text-sm text-slate-400 font-medium">Votre avis compte pour enrichir les débats.</p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 pl-2">
                       <i className="fas fa-lightbulb text-assirou-gold text-xs"></i>
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Avis sur le thème du Forum (Facultatif)</span>
                    </label>
                    <textarea 
                      placeholder="Que pensez-vous du thème de cette année sur la sécurité privée dans les grands événements ?" 
                      rows={4}
                      className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-assirou-gold rounded-[2rem] outline-none font-medium text-sm leading-relaxed transition-all"
                      value={formData.avis_theme}
                      onChange={e => setFormData({...formData, avis_theme: e.target.value})}
                    />
                    <p className="text-[9px] text-slate-400 italic">Votre avis nous aide à mieux préparer les débats lors du forum.</p>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Intérêt pour une formation ?</p>
                        <div className="flex gap-2">
                           {['Oui', 'Non'].map(v => (
                             <button key={v} type="button" onClick={() => setFormData({...formData, souhait_formation: v as any})} className={`flex-1 py-4 rounded-xl font-black text-[10px] border-2 uppercase transition-all ${formData.souhait_formation === v ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg' : 'bg-white border-transparent text-slate-400 hover:bg-slate-100'}`}>{v}</button>
                           ))}
                        </div>
                        {formData.souhait_formation === 'Oui' && (
                          <div className="flex flex-wrap gap-2 mt-4 animate-in slide-in-from-top-2">
                             {FORMATIONS_LIST.map(f => (
                               <button key={f} type="button" onClick={() => toggleSelection('type_formation', f)} className={`px-4 py-2.5 rounded-lg text-[9px] font-black border-2 uppercase transition-all ${formData.type_formation?.includes(f) ? 'bg-assirou-gold border-assirou-gold text-white' : 'bg-white border-slate-100 text-slate-400'}`}>{f}</button>
                             ))}
                          </div>
                        )}
                     </div>

                     <div className="pt-6 border-t border-slate-200/50">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Besoin de services de sécurité ?</p>
                        <div className="flex gap-2">
                           {['Oui', 'Non'].map(v => (
                             <button key={v} type="button" onClick={() => setFormData({...formData, interet_services: v as any})} className={`flex-1 py-4 rounded-xl font-black text-[10px] border-2 uppercase transition-all ${formData.interet_services === v ? 'bg-assirou-navy border-assirou-navy text-white shadow-lg' : 'bg-white border-transparent text-slate-400 hover:bg-slate-100'}`}>{v}</button>
                           ))}
                        </div>
                        {formData.interet_services === 'Oui' && (
                          <div className="flex flex-wrap gap-2 mt-4 animate-in slide-in-from-top-2">
                             {SERVICES_LIST.map(s => (
                               <button key={s} type="button" onClick={() => toggleSelection('services_interesses', s)} className={`px-4 py-2.5 rounded-lg text-[9px] font-black border-2 uppercase transition-all ${formData.services_interesses?.includes(s) ? 'bg-assirou-gold border-assirou-gold text-white' : 'bg-white border-slate-100 text-slate-400'}`}>{s}</button>
                             ))}
                          </div>
                        )}
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SOURCE & FINALIZATION */}
            {step === 3 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black text-assirou-navy uppercase tracking-tighter">Étape 3 : Finalisation</h2>
                  <p className="text-sm text-slate-400 font-medium">Votre badge est presque prêt.</p>
                </div>

                <div className="space-y-10">
                  <div className="space-y-5">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Comment avez-vous entendu parler du Forum ?</p>
                    <div className="flex flex-wrap gap-2">
                      {DISCOVERY_SOURCES.map(c => (
                        <button key={c} type="button" onClick={() => toggleSelection('canal_forum', c)} className={`px-6 py-4 rounded-2xl text-[10px] font-black border-2 transition-all ${formData.canal_forum?.includes(c) ? 'bg-assirou-gold border-assirou-gold text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <i className="fas fa-shield-alt text-6xl text-assirou-navy"></i>
                    </div>
                    <p className="text-lg font-black text-assirou-navy mb-1">{formData.nom_complet}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Participant prêt pour enregistrement</p>
                  </div>

                  <label className="flex items-start gap-5 p-8 bg-assirou-navy/5 rounded-[2.5rem] cursor-pointer border-2 border-transparent hover:border-assirou-gold/20 transition-all">
                    <input type="checkbox" checked={confirmed} onChange={() => setConfirmed(!confirmed)} className="w-6 h-6 rounded-lg accent-assirou-gold cursor-pointer mt-0.5" />
                    <span className="text-xs font-semibold text-slate-600 leading-relaxed">
                      Je confirme mon inscription au Forum et accepte de recevoir mon badge numérique ainsi que les actualités liées à l'événement par email.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* NAV ACTIONS */}
            <div className="flex flex-col md:flex-row gap-4 pt-6">
              {step > 1 && (
                <button type="button" onClick={prevStep} disabled={loading} className="w-full md:flex-1 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                  <i className="fas fa-chevron-left text-[9px]"></i> Retour
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={nextStep} className="w-full md:flex-[2] bg-assirou-navy text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-assirou-navy/20 hover:bg-assirou-navy/90 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group">
                  Suivant <i className="fas fa-chevron-right text-[9px] group-hover:translate-x-1 transition-transform"></i>
                </button>
              ) : (
                <button type="submit" disabled={!confirmed || loading} className={`w-full md:flex-[2] py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${confirmed && !loading ? 'bg-assirou-gold text-assirou-navy shadow-assirou-gold/20 hover:-translate-y-1' : 'bg-slate-200 text-slate-400'}`}>
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Traitement...</>
                  ) : (
                    <><i className="fas fa-id-card"></i> Obtenir mon Badge</>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
        
        <p className="mt-16 text-center text-[9px] font-black uppercase tracking-[1em] text-slate-300">Assirou Sécurité • Kaarange Bi</p>
      </div>
    </div>
  );
};

export default PublicForm;
