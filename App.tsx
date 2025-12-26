
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Trash2, Printer, ChevronRight, Wand2, FileText, Layout, Loader2, Download, Upload, RotateCcw, ImagePlus, Settings, FileInput } from 'lucide-react';
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
    const exportFileDefaultName = `claims_${state.name.replace(/\s+/g, '_') || 'export'}_${state.month.replace(/\s+/g, '_')}.json`;
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

  const totalAmount = state.receipts.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <FileText size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">SwiftClaim</span>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveStep('dashboard')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeStep === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveStep('preview')}
                disabled={state.receipts.length === 0}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeStep === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'}`}
              >
                Preview & Print
              </button>
            </div>
          </div>
        </div>
      </nav>

      {activeStep === 'dashboard' ? (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Top Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Staff Name</label>
                <input 
                  type="text" 
                  value={state.name}
                  onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Claim Month</label>
                <input 
                  type="text" 
                  value={state.month}
                  onChange={(e) => setState(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg">
                  <span className="text-sm font-semibold text-blue-700">Total Claimable</span>
                  <span className="text-xl font-bold text-blue-800">RM {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm active:scale-95 transition"
            >
              <Camera size={18} />
              Add Receipt
            </button>
            <button 
              onClick={handleManualAdd}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 px-5 py-2.5 rounded-lg font-medium shadow-sm active:scale-95 transition"
            >
              <Plus size={18} />
              Manual Entry
            </button>
            <button 
              onClick={handleAddCustomCategory}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 px-5 py-2.5 rounded-lg font-medium shadow-sm active:scale-95 transition"
            >
              <Layout size={18} />
              New Category
            </button>
            
            <div className="h-8 w-px bg-slate-300 mx-2 hidden sm:block"></div>
            
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={handleExportJSON} title="Export Data" className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <Download size={20} />
              </button>
              <button onClick={() => importInputRef.current?.click()} title="Import Data" className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <Upload size={20} />
              </button>
              <button onClick={handleReset} title="Reset All" className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <RotateCcw size={20} />
              </button>
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
          />
          <input 
            type="file" 
            ref={importInputRef} 
            onChange={handleImportJSON} 
            accept=".json" 
            className="hidden" 
          />

          {/* AI Loader */}
          {isAnalyzing && (
            <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-center gap-3 text-blue-700 animate-pulse">
              <Loader2 className="animate-spin" size={20} />
              <span className="font-medium">AI is analyzing your receipt...</span>
            </div>
          )}

          {/* Content Area */}
          {state.receipts.length === 0 && !isAnalyzing ? (
            <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
                <ImagePlus className="text-slate-300" size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No receipts yet</h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">Upload a receipt image or take a photo to get started. The AI will automatically detect the amount.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 text-blue-600 font-medium hover:underline"
              >
                Upload your first receipt
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {state.receipts.map(receipt => (
                <div key={receipt.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">
                  <div className="h-48 bg-slate-100 relative group">
                     {receipt.croppedImage ? (
                      <img src={receipt.croppedImage} className="w-full h-full object-contain p-2" alt="Receipt" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FileText size={48} />
                      </div>
                    )}
                    <button 
                      onClick={() => removeReceipt(receipt.id)}
                      className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-full shadow-sm hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                       <select 
                        value={receipt.category}
                        onChange={(e) => updateReceipt(receipt.id, { category: e.target.value })}
                        className="block w-full py-1.5 px-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded border-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        {[...DEFAULT_CATEGORIES, ...state.customCategories].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="text-sm font-medium text-slate-500">RM</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={receipt.amount}
                        onChange={(e) => updateReceipt(receipt.id, { amount: parseFloat(e.target.value) || 0 })}
                        className="text-xl font-bold w-full outline-none text-slate-900 bg-transparent placeholder-slate-300"
                        placeholder="0.00"
                      />
                    </div>

                    <input 
                      type="text"
                      value={receipt.remark}
                      onChange={(e) => updateReceipt(receipt.id, { remark: e.target.value })}
                      placeholder="Add a remark (optional)..."
                      className="w-full text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      ) : (
        <div className="flex-1 bg-slate-200/50 flex flex-col items-center py-8 px-4 overflow-hidden relative">
          
          {/* Preview Toolbar */}
          <div className="flex items-center gap-4 mb-6 no-print sticky top-0 z-10 p-2 bg-slate-200/50 backdrop-blur-sm rounded-xl">
             <button 
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg flex items-center gap-2 transition"
            >
              <Printer size={18} />
              Print / Save PDF
            </button>
          </div>

          <div className="w-full h-full overflow-y-auto preview-container">
            <div className="flex flex-col items-center gap-12 pb-20">
              
              {/* Page 1: Claim Form */}
              <div className="shadow-xl bg-white">
                <ClaimForm state={state} />
              </div>

              {/* Page 2: Attachments */}
              {state.receipts.some(r => !!r.croppedImage) && (
                <div className="relative">
                  <div className="absolute -left-64 top-10 w-60 hidden xl:block no-print">
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                           <Wand2 size={16} />
                           <span className="font-bold text-sm">Layout Tips</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Drag receipts to rearrange. Drag the bottom-right corner of a receipt to resize it.
                        </p>
                     </div>
                  </div>
                  
                  <div className="shadow-xl bg-white">
                    <AttachmentBoard 
                      receipts={state.receipts} 
                      onUpdateReceipt={updateLayout}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Crop Tool Overlay */}
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
