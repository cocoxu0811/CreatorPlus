
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Loader2, 
  RefreshCw, 
  ShoppingBag, 
  Zap,
  Palette, 
  Globe,
  Download,
  RotateCcw,
  X,
  Plus,
  Shirt,
  Smartphone,
  PlusSquare,
  Library,
  MessageSquarePlus,
  Layout,
  Clock,
  ToggleRight,
  ToggleLeft
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiPost = async (path: string, body: Record<string, unknown>) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed`);
  }
  return res.json();
};

// --- Types & Config ---
type Platform = 'xiaohongshu' | 'instagram' | 'facebook';
type Language = 'zh' | 'en';
type AppTab = 'studio' | 'results' | 'archive';

interface GeneratedContent {
  title: string;
  body: string;
  hashtags: string[];
}

interface HistoryItem {
  id: string;
  images: string[];
  modelImage: string | null;
  desc: string;
  platform: Platform;
  content: GeneratedContent;
  timestamp: number;
}

interface AppState {
  originalImages: string[];
  modelImage: string | null;
  enhancedImages: string[];
  content: Record<Platform, GeneratedContent | null>;
  isGenerating: boolean;
  activePlatform: Platform;
  stylePreference: string;
  selectedVoiceStyles: Record<Platform, string>;
  isCustomizable: boolean;
  lang: Language;
  potentialHashtags: string[];
  isGeneratingHashtags: boolean;
  isAnalyzingImage: boolean;
  activeTab: AppTab;
  history: HistoryItem[];
  isFeedbackMode: boolean;
}

const VOICE_STYLES = {
  xiaohongshu: [
    { id: "exaggerated", name: { zh: "夸张吸睛", en: "Catchy" } },
    { id: "storytelling", name: { zh: "故事共鸣", en: "Story" }, default: true },
    { id: "tutorial", name: { zh: "干货教程", en: "Guide" } },
    { id: "soothing", name: { zh: "温柔治愈", en: "Soft" } }
  ],
  instagram: [
    { id: "minimalist", name: { zh: "极简美学", en: "Minimal" }, default: true },
    { id: "self_expression", name: { zh: "自我表达", en: "Vibe" } },
    { id: "light_story", name: { zh: "轻故事型", en: "Blog" } }
  ],
  facebook: [
    { id: "friendly_share", name: { zh: "亲切分享", en: "Friendly" }, default: true },
    { id: "practical_info", name: { zh: "实用资讯", en: "Info" } }
  ]
};

const PLATFORM_CONFIG = {
  xiaohongshu: {
    name: { zh: '小红书', en: 'RedNote' },
    color: 'bg-[#FF2442]',
    logo: '/logos/xiaohongshu.png',
    logoAlt: 'Xiaohongshu logo'
  },
  instagram: {
    name: { zh: 'Instagram', en: 'Instagram' },
    color: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    logo: '/logos/instagram.png',
    logoAlt: 'Instagram logo'
  },
  facebook: {
    name: { zh: 'Facebook', en: 'Facebook' },
    color: 'bg-[#1877F2]',
    logo: '/logos/facebook.png',
    logoAlt: 'Facebook logo'
  }
};

const TRANSLATIONS = {
  zh: {
    brand: 'CreatorPlus',
    studio: '创作室',
    results: '灵感库',
    archive: '历史',
    editorStudio: '产品编辑室',
    productPhotos: '产品照片 (1-3张)',
    modelPhoto: '模特参考 (可选)',
    uploadPrompt: '加图',
    uploadModelPrompt: '模特',
    autoModelHint: 'AI 将自动渲染模特效果',
    productDesc: '产品描述',
    productPlaceholder: '例如：毕加索串珠织片...',
    publishPlatform: '平台',
    voiceStyle: '创作语气',
    stylePref: '风格偏好',
    stylePlaceholder: '例如：极简工业风...',
    potentialHashtags: '可选标签',
    suggestTags: 'AI 联想',
    isCustom: '支持定制',
    generateBtn: '开启创作',
    generating: 'AI 渲染中...',
    outputTitle: '为您生成的灵感',
    outputSub: '生成结果将出现在这里',
    enhancedImg: 'AI 优化图',
    copyBtn: '复制',
    copyAll: '全部复制',
    suggestedTitle: '爆款标题',
    bodyText: '优化正文',
    notSatisfied: '不满意？告诉 AI 怎么改',
    submitFeedback: '重新生成',
    analyzingImage: '识别中...'
  },
  en: {
    brand: 'CreatorPlus',
    studio: 'Studio',
    results: 'Results',
    archive: 'Archive',
    editorStudio: 'Editing',
    productPhotos: 'Products (1-3)',
    modelPhoto: 'Model (Optional)',
    uploadPrompt: 'Add',
    uploadModelPrompt: 'Model',
    autoModelHint: 'AI will auto-render model visuals',
    productDesc: 'Description',
    productPlaceholder: 'e.g. Handmade ceramic vase...',
    publishPlatform: 'Platform',
    voiceStyle: 'Tone',
    stylePref: 'Style Preference',
    stylePlaceholder: 'e.g. Minimalist, Warm...',
    potentialHashtags: 'HashTags',
    suggestTags: 'AI Suggest',
    isCustom: 'Customizable',
    generateBtn: 'Generate All',
    generating: 'AI Rendering...',
    outputTitle: 'Your Inspiration',
    outputSub: 'Results will appear here',
    enhancedImg: 'AI Enhanced',
    copyBtn: 'Copy',
    copyAll: 'Copy All',
    suggestedTitle: 'Viral Title',
    bodyText: 'Optimized Copy',
    notSatisfied: 'Not satisfied? Tell AI',
    submitFeedback: 'Regenerate',
    analyzingImage: 'Analyzing...'
  }
};

const App = () => {
  const [state, setState] = useState<AppState>({
    originalImages: [],
    modelImage: null,
    enhancedImages: [],
    content: { xiaohongshu: null, instagram: null, facebook: null },
    isGenerating: false,
    activePlatform: 'xiaohongshu',
    stylePreference: '',
    selectedVoiceStyles: {
      xiaohongshu: 'storytelling',
      instagram: 'minimalist',
      facebook: 'friendly_share'
    },
    isCustomizable: false,
    lang: 'zh',
    potentialHashtags: [],
    isGeneratingHashtags: false,
    isAnalyzingImage: false,
    activeTab: 'studio',
    history: [],
    isFeedbackMode: false
  });
  const [productDesc, setProductDesc] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[state.lang];

  useEffect(() => {
    const triggerAutoDescription = async () => {
      if (state.originalImages.length > 0 && !productDesc && !state.isAnalyzingImage) {
        setState(prev => ({ ...prev, isAnalyzingImage: true }));
        try {
          const response = await apiPost('/api/vision', {
            images: state.originalImages,
            lang: state.lang,
          });
          if (response.text) setProductDesc(response.text.trim());
        } catch (err) {
          console.error("Auto-description error:", err);
        } finally {
          setState(prev => ({ ...prev, isAnalyzingImage: false }));
        }
      }
    };
    triggerAutoDescription();
  }, [state.originalImages.length, state.isAnalyzingImage, state.lang, productDesc]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 3 - state.originalImages.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setState(prev => ({ 
            ...prev, 
            originalImages: [...prev.originalImages, reader.result as string].slice(0, 3)
          }));
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, modelImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    if (modelInputRef.current) modelInputRef.current.value = '';
  };

  const suggestHashtags = async () => {
    if (!productDesc) return;
    setState(prev => ({ ...prev, isGeneratingHashtags: true }));
    try {
      const response = await apiPost('/api/hashtags', {
        productDesc,
        lang: state.lang,
      });
      setState(prev => ({ ...prev, potentialHashtags: Array.isArray(response.tags) ? response.tags : [], isGeneratingHashtags: false }));
    } catch (err) {
      setState(prev => ({ ...prev, isGeneratingHashtags: false }));
    }
  };

  const generateAI = async (withFeedback: boolean = false) => {
    if (state.originalImages.length === 0 || !productDesc) return;
    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const response = await apiPost('/api/generate', {
        images: state.originalImages,
        modelImage: state.modelImage,
        platform: state.activePlatform,
        platformName: PLATFORM_CONFIG[state.activePlatform].name.en,
        productDesc,
        stylePreference: state.stylePreference,
        potentialHashtags: state.potentialHashtags,
        isCustomizable: state.isCustomizable,
        lang: state.lang,
        voiceStyle: VOICE_STYLES[state.activePlatform].find(v => v.id === state.selectedVoiceStyles[state.activePlatform])?.name.en || '',
        feedbackText: withFeedback ? feedbackText : '',
      });

      const newImages: string[] = Array.isArray(response.images) ? response.images : [];
      const content = response.content || {};
      const activeData = content[state.activePlatform] || { title: "", body: "", hashtags: [] };

      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        images: state.originalImages,
        modelImage: state.modelImage,
        desc: productDesc,
        platform: state.activePlatform,
        content: activeData,
        timestamp: Date.now()
      };

      setState(prev => ({ 
        ...prev, 
        enhancedImages: newImages, 
        content: { ...prev.content, ...content }, 
        isGenerating: false, 
        activeTab: 'results',
        history: [newHistoryItem, ...prev.history],
        isFeedbackMode: false 
      }));
      setFeedbackText('');
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeContent = state.content[state.activePlatform];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col w-full relative antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* APP HEADER - Full Responsive Sticky */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-slate-100 flex-shrink-0 transition-all">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-blue-500/20 shadow-lg border border-slate-100">
            <img
              src="/logos/appicon.png"
              alt="CreatorPlus logo"
              className="w-5 h-5 object-contain"
            />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">{t.brand}</span>
        </div>
        <button 
          onClick={() => setState(prev => ({ ...prev, lang: prev.lang === 'zh' ? 'en' : 'zh' }))} 
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-600 flex items-center gap-2 active:bg-slate-50 transition-all shadow-sm"
        >
          <Globe size={14} className="text-blue-500" />
          {state.lang === 'zh' ? 'EN' : 'CN'}
        </button>
      </header>

      {/* APP SCROLL CONTENT */}
      <main className="flex-1 overflow-y-auto scroll-smooth w-full max-w-2xl mx-auto px-4">
        <div className="py-6">
          {state.activeTab === 'studio' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm space-y-7 border border-slate-100/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Smartphone size={16} className="text-blue-500" />{t.editorStudio}
                  </h2>
                  <div className="h-1.5 w-12 bg-slate-100 rounded-full" />
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                      {t.productPhotos}
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">1-3</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {state.originalImages.map((img, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all hover:scale-[1.02]">
                          <img src={img} className="w-full h-full object-cover" />
                          <button onClick={() => setState(p => ({ ...p, originalImages: p.originalImages.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 p-1 bg-black/50 backdrop-blur-md text-white rounded-full transition-transform active:scale-75 shadow-lg"><X size={12} /></button>
                        </div>
                      ))}
                      {state.originalImages.length < 3 && (
                        <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-white hover:border-blue-300 hover:text-blue-500 active:scale-95 transition-all">
                          <Plus size={28} strokeWidth={1.5} /><span className="text-[9px] font-black mt-1 uppercase">{t.uploadPrompt}</span>
                        </button>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*" />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">{t.modelPhoto}</label>
                    <div className="flex items-center gap-4">
                      {state.modelImage ? (
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-sm transition-all hover:scale-[1.02]">
                          <img src={state.modelImage} className="w-full h-full object-cover" />
                          <button onClick={() => setState(p => ({ ...p, modelImage: null }))} className="absolute top-1 right-1 p-1 bg-black/50 backdrop-blur-md text-white rounded-full active:scale-75"><X size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => modelInputRef.current?.click()} className="flex-1 h-14 border border-slate-200 bg-slate-50 rounded-2xl flex items-center justify-center gap-2 text-slate-600 text-[11px] font-black uppercase hover:bg-white hover:border-emerald-300 hover:text-emerald-600 active:scale-[0.98] transition-all">
                          <Shirt size={18} className="text-emerald-500" />{t.uploadModelPrompt}
                        </button>
                      )}
                      <input type="file" ref={modelInputRef} onChange={handleModelUpload} className="hidden" accept="image/*" />
                      {!state.modelImage && <p className="flex-1 text-[10px] italic text-slate-400 leading-tight uppercase font-medium">{t.autoModelHint}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">{t.productDesc}</label>
                      {state.isAnalyzingImage && <span className="text-[10px] text-blue-600 font-black animate-pulse uppercase tracking-widest">{t.analyzingImage}</span>}
                    </div>
                    <textarea 
                      value={productDesc} 
                      onChange={(e) => setProductDesc(e.target.value)} 
                      rows={3} 
                      placeholder={t.productPlaceholder} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-[1.75rem] p-5 text-[15px] font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100/50 focus:bg-white transition-all shadow-inner" 
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">{t.potentialHashtags}</label>
                      <button 
                        onClick={suggestHashtags} 
                        disabled={!productDesc || state.isGeneratingHashtags} 
                        className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-30"
                      >
                        {state.isGeneratingHashtags ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}{t.suggestTags}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-[1.75rem] min-h-[56px] shadow-inner items-center">
                      {state.potentialHashtags.length > 0 ? state.potentialHashtags.map((tag, i) => (
                        <span key={i} className="px-3.5 py-1.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-xl shadow-sm transition-all hover:border-blue-200 hover:text-blue-500">#{tag}</span>
                      )) : <span className="text-[10px] text-slate-300 italic p-1 uppercase tracking-tight">AI will find core tags...</span>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">{t.publishPlatform}</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-100/50 p-2 rounded-2xl shadow-inner">
                      {(['xiaohongshu', 'instagram', 'facebook'] as Platform[]).map(p => (
                        <button 
                          key={p} 
                          onClick={() => setState(prev => ({ ...prev, activePlatform: p }))} 
                          className={`py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 ${state.activePlatform === p ? 'bg-white shadow-md text-blue-600 scale-[1.02]' : 'text-slate-400 active:bg-slate-200'}`}
                        >
                          {PLATFORM_CONFIG[p].name[state.lang]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4 border-y border-slate-50">
                    <div className="flex items-center gap-3">
                      <Palette size={20} className="text-purple-400" />
                      <label className="text-[11px] font-bold text-slate-500 uppercase">{t.isCustom}</label>
                    </div>
                    <button onClick={() => setState(p => ({ ...p, isCustomizable: !p.isCustomizable }))} className="transition-transform active:scale-75">
                      {state.isCustomizable ? <ToggleRight className="text-blue-500" size={36} /> : <ToggleLeft className="text-slate-200" size={36} />}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">{t.voiceStyle}</label>
                    <div className="flex flex-wrap gap-2">
                      {VOICE_STYLES[state.activePlatform].map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => setState(p => ({ ...p, selectedVoiceStyles: { ...p.selectedVoiceStyles, [p.activePlatform]: s.id } }))} 
                          className={`px-4 py-2.5 rounded-xl text-[11px] font-black border transition-all ${state.selectedVoiceStyles[state.activePlatform] === s.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white border-slate-200 text-slate-500 active:border-blue-300'}`}
                        >
                          {s.name[state.lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => generateAI()} 
                  disabled={state.isGenerating || state.originalImages.length === 0 || !productDesc} 
                  className={`w-full py-5 rounded-[1.75rem] font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 active:shadow-sm ${state.isGenerating ? 'bg-slate-100 text-slate-300' : 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700'}`}
                >
                  {state.isGenerating ? <><Loader2 className="animate-spin" size={20} />{t.generating}</> : <><Sparkles size={20} />{t.generateBtn}</>}
                </button>
              </div>
            </div>
          )}

          {state.activeTab === 'results' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {!activeContent && !state.isGenerating ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-300 space-y-6">
                  <div className="bg-white p-10 rounded-full shadow-inner"><Layout size={48} strokeWidth={1} /></div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]">{t.outputSub}</p>
                </div>
              ) : state.isGenerating ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-8">
                  <div className="relative">
                    <div className="w-24 h-24 border-b-4 border-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center"><RefreshCw className="text-blue-500 animate-pulse" size={28} /></div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">{t.generating}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-[0.3em]">AI Synthesis Pipeline</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><ImageIcon size={16} />{t.enhancedImg}</h3>
                    <div className="flex overflow-x-auto gap-5 pb-6 snap-x hide-scrollbar px-1">
                      {state.enhancedImages.map((img, i) => (
                        <div key={i} className="min-w-[280px] h-[400px] rounded-[3rem] overflow-hidden shadow-2xl snap-center relative group">
                          <img src={img} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <button 
                            onClick={() => { const l = document.createElement('a'); l.href = img; l.download = `CreatorPlus-${i}.png`; l.click(); }} 
                            className="absolute bottom-6 right-6 p-4 bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-2xl active:scale-75 transition-all text-blue-600"
                          >
                            <Download size={24} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 space-y-8 relative overflow-hidden transition-all">
                    <div className={`absolute top-0 left-0 w-full h-2 ${PLATFORM_CONFIG[state.activePlatform].color}`} />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 ${PLATFORM_CONFIG[state.activePlatform].color} rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-black/5`}>
                          <img
                            src={PLATFORM_CONFIG[state.activePlatform].logo}
                            alt={PLATFORM_CONFIG[state.activePlatform].logoAlt}
                            className="w-7 h-7 object-contain"
                          />
                        </div>
                        <div>
                          <h4 className="font-black text-base text-slate-900">{PLATFORM_CONFIG[state.activePlatform].name[state.lang]}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Optimized Assets</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const tStr = `【${activeContent?.title}】\n\n${activeContent?.body}\n\n${activeContent?.hashtags.join(' ')}`;
                          copyToClipboard(tStr, 'all');
                        }} 
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-90 shadow-2xl shadow-blue-500/20 transition-all"
                      >
                        {copied === 'all' ? <Check size={16} /> : <><Copy size={16} className="inline mr-2" />{t.copyAll}</>}
                      </button>
                    </div>

                    <div className="space-y-7">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center"><label className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{t.suggestedTitle}</label><button onClick={() => copyToClipboard(activeContent?.title || '', 't')} className="text-slate-300 active:text-blue-600 hover:text-slate-400 transition-colors"><Copy size={16}/></button></div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] text-[17px] font-black text-slate-900 shadow-inner leading-relaxed">{activeContent?.title}</div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center"><label className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{t.bodyText}</label><button onClick={() => copyToClipboard(activeContent?.body || '', 'b')} className="text-slate-300 active:text-blue-600 hover:text-slate-400 transition-colors"><Copy size={16}/></button></div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] text-[14px] font-bold leading-loose text-slate-700 whitespace-pre-wrap shadow-inner">{activeContent?.body}</div>
                      </div>
                      <div className="flex flex-wrap gap-2.5 pt-2">
                        {activeContent?.hashtags.map((tag, i) => <span key={i} className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] font-black text-blue-600 uppercase transition-all hover:bg-blue-600 hover:text-white cursor-default">#{tag}</span>)}
                      </div>
                    </div>

                    <div className="pt-10 border-t border-slate-50">
                      {!state.isFeedbackMode ? (
                        <button onClick={() => setState(p => ({ ...p, isFeedbackMode: true }))} className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest active:text-blue-600 hover:text-slate-600 transition-colors transition-transform active:scale-[0.98]">
                          <MessageSquarePlus size={18} />{t.notSatisfied}
                        </button>
                      ) : (
                        <div className="space-y-5 animate-in fade-in slide-in-from-top-4">
                          <textarea 
                            value={feedbackText} 
                            onChange={(e) => setFeedbackText(e.target.value)} 
                            placeholder="Tell AI how to adjust (e.g., 'more professional', 'shorter', 'add emojis')" 
                            className="w-full bg-slate-50 rounded-[2rem] p-6 text-sm font-bold text-slate-800 shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-100/50" 
                          />
                          <div className="flex gap-4">
                            <button onClick={() => generateAI(true)} className="flex-1 py-4.5 bg-blue-600 text-white rounded-[1.5rem] text-[12px] font-black uppercase shadow-2xl active:scale-95 transition-all">{t.submitFeedback}</button>
                            <button onClick={() => setState(p => ({ ...p, isFeedbackMode: false }))} className="px-8 py-4.5 bg-slate-100 text-slate-500 rounded-[1.5rem] text-[12px] font-black uppercase transition-all active:scale-95">{state.lang === 'zh' ? '取消' : 'Back'}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {state.activeTab === 'archive' && (
            <div className="space-y-5 animate-in slide-in-from-left-4 duration-500">
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1 mb-6"><Library size={16} className="text-blue-500" />{t.archive}</h2>
               {state.history.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-40 text-slate-300 opacity-40"><Clock size={56} strokeWidth={1} /><p className="text-[11px] font-black uppercase tracking-[0.3em] mt-8 text-center">Your creative journey<br/>begins here</p></div>
               ) : state.history.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setState(p => ({ ...p, originalImages: item.images, activeTab: 'results', content: { ...p.content, [item.platform]: item.content }, activePlatform: item.platform }))} 
                    className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex gap-5 active:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer group"
                  >
                    <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shadow-md flex-shrink-0 group-hover:scale-105 transition-transform"><img src={item.images[0]} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg text-white ${PLATFORM_CONFIG[item.platform].color} shadow-sm inline-flex items-center gap-1`}>
                          <img
                            src={PLATFORM_CONFIG[item.platform].logo}
                            alt={PLATFORM_CONFIG[item.platform].logoAlt}
                            className="w-3 h-3 object-contain"
                          />
                          {PLATFORM_CONFIG[item.platform].name[state.lang]}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h5 className="text-[15px] font-black text-slate-800 truncate">{item.content.title}</h5>
                      <p className="text-[12px] text-slate-400 font-bold truncate italic mt-0.5 tracking-tight">{item.desc}</p>
                    </div>
                  </div>
               ))}
            </div>
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION - Responsive Sticky */}
      <nav className="sticky bottom-0 z-[100] bg-white/95 backdrop-blur-2xl border-t border-slate-100/80 flex items-center justify-around px-6 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] flex-shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] transition-all">
        <button onClick={() => setState(p => ({ ...p, activeTab: 'studio' }))} className={`flex flex-col items-center gap-2 transition-all ${state.activeTab === 'studio' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
          <div className={`p-2.5 rounded-2xl transition-all ${state.activeTab === 'studio' ? 'bg-blue-50 shadow-sm' : ''}`}><PlusSquare size={24} strokeWidth={state.activeTab === 'studio' ? 2.5 : 2} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest scale-90">{t.studio}</span>
        </button>
        <button onClick={() => setState(p => ({ ...p, activeTab: 'results' }))} className={`flex flex-col items-center gap-2 transition-all ${state.activeTab === 'results' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
          <div className={`p-2.5 rounded-2xl transition-all ${state.activeTab === 'results' ? 'bg-blue-50 shadow-sm' : ''}`}><Sparkles size={24} strokeWidth={state.activeTab === 'results' ? 2.5 : 2} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest scale-90">{t.results}</span>
        </button>
        <button onClick={() => setState(p => ({ ...p, activeTab: 'archive' }))} className={`flex flex-col items-center gap-2 transition-all ${state.activeTab === 'archive' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
          <div className={`p-2.5 rounded-2xl transition-all ${state.activeTab === 'archive' ? 'bg-blue-50 shadow-sm' : ''}`}><Library size={24} strokeWidth={state.activeTab === 'archive' ? 2.5 : 2} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest scale-90">{t.archive}</span>
        </button>
      </nav>

      {/* GLOBAL LOADING OVERLAYS */}
      {state.isGenerating && (
        <div className="fixed inset-0 z-[200] bg-slate-900/10 backdrop-blur-md flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
           <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center space-y-8 border border-white/50 animate-in zoom-in-95 duration-300">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-50 border-b-blue-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                   <Sparkles size={20} className="animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[13px] font-black text-blue-600 uppercase tracking-[0.4em] ml-[0.4em]">{t.generating}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Optimizing visual identity</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
