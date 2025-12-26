
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Trash2, Printer, ChevronRight, Wand2, FileText, Layout, Loader2, Download, Upload, RotateCcw } from 'lucide-react';
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
  const importInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('swiftclaim_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(parsed);
      }
    } catch (e) {
      console.error("Failed to load from storage", e);
    }
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
        originalImage: croppedBase64,
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
    if (confirm("Remove this claim?")) {
      setState(prev => ({
        ...prev,
        receipts: prev.receipts.filter(r => r.id !== id)
      }));
    }
  };

  const handleAddCustomCategory = () => {
    const name = prompt("Enter new category name:");
    if (name && !DEFAULT_CATEGORIES.includes(name) && !state.customCategories.includes(name)) {
      setState(prev => ({ ...prev, customCategories: [...prev.customCategories, name] }));
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `claims_${state.name || 'export'}_${state.month}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const imported = JSON.parse(re.target?.result as string);
          if (imported && Array.isArray(imported.receipts)) {
            setState(imported);
            alert("Data imported successfully!");
          } else {
            alert("Invalid claim file format.");
          }
        } catch (err) {
          alert("Failed to parse JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset? All local data will be permanently cleared.")) {
      localStorage.removeItem('swiftclaim_state');
      setState({
        name: '',
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        receipts: [],
        customCategories: []
      });
      setActiveStep('dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 flex flex-col p-4 items-center">
      <div className="w-full">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 pt-6">
          <div className="text-center sm:text-left">
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Preview</span>
            </button>
          ) : (
            <button 
              onClick={() => setActiveStep('dashboard')}
              className="flex flex-col items-center justify-center p-3 bg-white shadow-sm border border-slate-200 rounded-2xl hover:border-blue-500 transition"
            >
              <Layout className="text-blue-600 mb-1" size={24} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dash</span>
            </button>
          )}
        </header>

        {activeStep === 'dashboard' ? (
          <div className="flex flex-col items-center w-full">
            {/* Form Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 w-full">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Staff Name</label>
                <input 
                  type="text" 
                  value={state.name}
                  onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Employee Name"
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
            <div className="grid grid-cols-3 gap-3 mb-10 w-full">
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

            {/* Data Management Section */}
            <div className="w-full bg-slate-200/50 p-4 rounded-3xl mb-8 flex flex-wrap justify-center gap-4">
               <button 
                onClick={handleExportJSON}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition"
              >
                <Download size={16} /> Export JSON
              </button>
              <button 
                onClick={() => importInputRef.current?.click()}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition"
              >
                <Upload size={16} /> Import JSON
              </button>
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition"
              >
                <RotateCcw size={16} /> Reset App
              </button>
              <input 
                type="file" 
                ref={importInputRef} 
                onChange={handleImportJSON} 
                accept=".json" 
                className="hidden" 
              />
            </div>

            {/* Claims List */}
            <div className="space-y-4 pb-24 w-full">
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
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 pb-10 overflow-x-auto w-full">
            <div className="flex gap-4 mb-4 no-print w-full">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Printer size={20} />
                Print as A4
              </button>
              <button 
                onClick={() => setActiveStep('dashboard')}
                className="bg-white border border-slate-200 text-slate-500 font-bold px-6 py-4 rounded-2xl shadow-sm active:scale-95 transition"
              >
                Back
              </button>
            </div>

            <div className="space-y-20 flex flex-col items-center w-full">
              <div className="shadow-2xl">
                <ClaimForm state={state} />
              </div>

              {state.receipts.some(r => !!r.croppedImage) && (
                <div className="shadow-2xl">
                  <AttachmentBoard 
                    receipts={state.receipts} 
                    onUpdateReceipt={updateLayout}
                  />
                </div>
              )}
            </div>
            
            <div className="no-print mt-10 text-center px-6 w-full max-w-lg">
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                <Wand2 className="text-blue-500 mt-1 shrink-0" />
                <div className="text-left">
                  <h4 className="font-bold text-blue-900 mb-1">Layout Tip</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    On the attachment page, you can <strong>drag</strong> receipts to move them and <strong>pull the corner handle</strong> to resize them freely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
