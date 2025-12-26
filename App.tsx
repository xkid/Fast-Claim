
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Plus, Trash2, Printer, ChevronLeft, ChevronRight, Wand2, FileText, Layout, X, Loader2 } from 'lucide-react';
import { Receipt, ClaimState, DEFAULT_CATEGORIES } from './types';
import { analyzeReceipt } from './services/geminiService';
import { CropTool } from './components/CropTool';
import { ClaimForm } from './components/ClaimForm';
import { AttachmentBoard } from './components/AttachmentBoard';

const App: React.FC = () => {
  const [state, setState] = useState<ClaimState>({
    name: '',
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    receipts: [],
    customCategories: []
  });

  const [activeStep, setActiveStep] = useState<'dashboard' | 'preview'>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('swiftclaim_state');
    if (saved) setState(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('swiftclaim_state', JSON.stringify(state));
  }, [state]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        setRawImageToCrop(re.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualAdd = () => {
    const newReceipt: Receipt = {
      id: Math.random().toString(36).substr(2, 9),
      originalImage: '',
      croppedImage: null,
      amount: 0,
      category: 'Misc',
      remark: '',
      date: new Date().toISOString().split('T')[0],
      isManual: true,
      layout: { x: 5, y: 5, width: 25, height: 25 }
    };
    setState(prev => ({ ...prev, receipts: [...prev.receipts, newReceipt] }));
  };

  const finalizeReceipt = async (croppedBase64: string) => {
    setRawImageToCrop(null);
    setIsAnalyzing(true);
    
    try {
      const { amount, categorySuggestion } = await analyzeReceipt(croppedBase64);
      
      const newReceipt: Receipt = {
        id: Math.random().toString(36).substr(2, 9),
        originalImage: croppedBase64, // using cropped as primary
        croppedImage: croppedBase64,
        amount: amount || 0,
        category: categorySuggestion || 'Misc',
        remark: '',
        date: new Date().toISOString().split('T')[0],
        isManual: false,
        layout: { 
          x: (state.receipts.length * 5) % 70, 
          y: (state.receipts.length * 10) % 70, 
          width: 30, 
          height: 30 
        }
      };
      
      setState(prev => ({ ...prev, receipts: [...prev.receipts, newReceipt] }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateReceipt = (id: string, updates: Partial<Receipt>) => {
    setState(prev => ({
      ...prev,
      receipts: prev.receipts.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const updateLayout = (id: string, layout: Receipt['layout']) => {
    updateReceipt(id, { layout });
  };

  const removeReceipt = (id: string) => {
    setState(prev => ({
      ...prev,
      receipts: prev.receipts.filter(r => r.id !== id)
    }));
  };

  const handleAddCustomCategory = () => {
    const name = prompt("Enter new category name:");
    if (name && !DEFAULT_CATEGORIES.includes(name) && !state.customCategories.includes(name)) {
      setState(prev => ({ ...prev, customCategories: [...prev.customCategories, name] }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 flex flex-col p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pt-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">SwiftClaim</h1>
          <p className="text-slate-500 font-medium">Monthly Expense Formatter</p>
        </div>
        {activeStep === 'dashboard' ? (
          <button 
            onClick={() => setActiveStep('preview')}
            disabled={state.receipts.length === 0}
            className="flex flex-col items-center justify-center p-3 bg-white shadow-sm border border-slate-200 rounded-2xl hover:border-blue-500 disabled:opacity-50 transition"
          >
            <Printer className="text-blue-600 mb-1" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Print Preview</span>
          </button>
        ) : (
          <button 
            onClick={() => setActiveStep('dashboard')}
            className="flex flex-col items-center justify-center p-3 bg-white shadow-sm border border-slate-200 rounded-2xl hover:border-blue-500 transition"
          >
            <Layout className="text-blue-600 mb-1" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dashboard</span>
          </button>
        )}
      </header>

      {activeStep === 'dashboard' ? (
        <>
          {/* Form Header Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Staff Name</label>
              <input 
                type="text" 
                value={state.name}
                onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Required"
                className="w-full bg-transparent font-bold text-lg outline-none focus:text-blue-600 transition"
              />
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Month</label>
              <input 
                type="text" 
                value={state.month}
                onChange={(e) => setState(prev => ({ ...prev, month: e.target.value }))}
                className="w-full bg-transparent font-bold text-lg outline-none focus:text-blue-600 transition"
              />
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-200 active:scale-95 transition"
            >
              <div className="p-2 bg-white/20 rounded-xl">
                <Camera size={28} />
              </div>
              <span className="font-bold text-sm">Capture</span>
            </button>
            <button 
              onClick={handleManualAdd}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-slate-200 rounded-3xl text-slate-700 active:scale-95 transition"
            >
              <div className="p-2 bg-slate-100 rounded-xl">
                <Plus size={28} />
              </div>
              <span className="font-bold text-sm">Manual</span>
            </button>
            <button 
              onClick={handleAddCustomCategory}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-100 rounded-3xl text-slate-600 active:scale-95 transition"
            >
              <div className="p-2 bg-slate-200 rounded-xl">
                <Layout size={28} />
              </div>
              <span className="font-bold text-sm">Category</span>
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
          />

          {/* Receipts List */}
          <div className="space-y-4 pb-24">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Claims ({state.receipts.length})</h3>
            
            {isAnalyzing && (
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-center gap-4 text-blue-600 animate-pulse">
                <Loader2 className="animate-spin" />
                <span className="font-bold">AI analyzing receipt...</span>
              </div>
            )}

            {state.receipts.length === 0 && !isAnalyzing && (
              <div className="bg-slate-100 p-12 rounded-3xl text-center border-2 border-dashed border-slate-200">
                <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-400 font-medium">No claims added yet.<br/>Start by capturing a receipt.</p>
              </div>
            )}

            {state.receipts.map(receipt => (
              <div key={receipt.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 items-start group">
                {receipt.croppedImage ? (
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                    <img src={receipt.croppedImage} className="w-full h-full object-cover" alt="Receipt thumbnail" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center shrink-0">
                    <Plus className="text-slate-300" />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <select 
                      value={receipt.category}
                      onChange={(e) => updateReceipt(receipt.id, { category: e.target.value })}
                      className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md outline-none border-none cursor-pointer"
                    >
                      {[...DEFAULT_CATEGORIES, ...state.customCategories].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => removeReceipt(receipt.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-slate-500">RM</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={receipt.amount}
                      onChange={(e) => updateReceipt(receipt.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="text-2xl font-black w-full outline-none text-slate-800"
                    />
                  </div>

                  <input 
                    type="text"
                    value={receipt.remark}
                    onChange={(e) => updateReceipt(receipt.id, { remark: e.target.value })}
                    placeholder="Add remark..."
                    className="w-full text-sm font-medium text-slate-400 placeholder:text-slate-200 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Actions */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 no-print">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full p-2 flex items-center justify-between">
              <div className="pl-6 py-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Claim</span>
                <span className="text-xl font-black text-slate-900">
                  RM {state.receipts.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                </span>
              </div>
              <button 
                onClick={() => setActiveStep('preview')}
                disabled={state.receipts.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-full flex items-center gap-2 shadow-lg transition"
              >
                Proceed
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-8 pb-10 overflow-x-auto">
          <div className="flex gap-4 mb-4 no-print w-full">
            <button 
              onClick={() => window.print()}
              className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Printer size={20} />
              Print as A4
            </button>
            <button 
              onClick={() => setState(prev => ({ ...prev, receipts: [], customCategories: [] }))}
              className="bg-white border border-slate-200 text-red-500 font-bold px-4 py-4 rounded-2xl shadow-sm active:scale-95 transition"
            >
              Reset
            </button>
          </div>

          <div className="space-y-20 flex flex-col items-center w-full">
            {/* Page 1: Claim Form */}
            <div className="shadow-2xl">
              <ClaimForm state={state} />
            </div>

            {/* Page 2: Attachments (Only if there are receipts) */}
            {state.receipts.some(r => !!r.croppedImage) && (
              <div className="shadow-2xl">
                <AttachmentBoard 
                  receipts={state.receipts} 
                  onUpdateReceipt={updateLayout}
                />
              </div>
            )}
          </div>
          
          <div className="no-print mt-10 text-center px-6">
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
              <Wand2 className="text-blue-500 mt-1 shrink-0" />
              <div className="text-left">
                <h4 className="font-bold text-blue-900 mb-1">Layout Tip</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  On the attachment page, you can <strong>drag</strong> receipts to move them and <strong>pull the corner handle</strong> to resize them freely to fit the page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      {rawImageToCrop && (
        <CropTool 
          imageSrc={rawImageToCrop} 
          onCrop={finalizeReceipt}
          onCancel={() => setRawImageToCrop(null)}
        />
      )}
    </div>
  );
};

export default App;
