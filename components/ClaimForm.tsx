
import React from 'react';
import { ClaimState, DEFAULT_CATEGORIES } from '../types';

interface ClaimFormProps {
  state: ClaimState;
}

export const ClaimForm: React.FC<ClaimFormProps> = ({ state }) => {
  const allCategories = [...DEFAULT_CATEGORIES, ...state.customCategories];
  
  const categorySummary = allCategories.map((cat, index) => {
    const relevantReceipts = state.receipts.filter(r => r.category === cat);
    const totalAmount = relevantReceipts.reduce((sum, r) => sum + r.amount, 0);
    const remarks = relevantReceipts.map(r => r.remark).filter(rem => rem.trim() !== "").join(', ');
    
    return {
      index: index + 1,
      name: cat,
      amount: totalAmount,
      description: remarks ? `(${remarks})` : ""
    };
  });

  const totalClaim = categorySummary.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="a4-preview print-page p-8 text-[12px] font-sans flex flex-col">
      <div className="text-center mb-4">
        <h1 className="text-base font-bold uppercase tracking-widest">Elcomp Technologies Sdn Bhd (589723-U)</h1>
        <h2 className="text-sm font-bold mt-1 underline">STAFF MONTHLY CLAIM FORM</h2>
      </div>

      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="font-bold">Name:</span>
          <span className="border-b border-black min-w-[200px] pb-0.5">{state.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">Month:</span>
          <span className="border-b border-black min-w-[150px] pb-0.5">{state.month}</span>
        </div>
      </div>

      <table className="w-full border-collapse border border-black mb-6">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-black px-2 py-1 w-12">Items</th>
            <th className="border border-black px-2 py-1 text-left">Descriptions</th>
            <th className="border border-black px-2 py-1 w-32 text-right">Amount (RM)</th>
          </tr>
        </thead>
        <tbody>
          {categorySummary.map((item) => (
            <tr key={item.index} className="h-7">
              <td className="border border-black text-center">{item.index}</td>
              <td className="border border-black px-2 py-1">
                {item.name} <span className="text-slate-500 italic ml-1">{item.description}</span>
              </td>
              <td className="border border-black px-2 py-1 text-right">
                {item.amount > 0 ? item.amount.toFixed(2) : ""}
              </td>
            </tr>
          ))}
          {/* Pad to 10 rows (reduced from 15 due to landscape height constraint) */}
          {Array.from({ length: Math.max(0, 10 - categorySummary.length) }).map((_, i) => (
            <tr key={`pad-${i}`} className="h-7">
              <td className="border border-black text-center">{categorySummary.length + i + 1}</td>
              <td className="border border-black px-2 py-1"></td>
              <td className="border border-black px-2 py-1 text-right"></td>
            </tr>
          ))}
          <tr className="font-bold h-10">
            <td className="border border-black"></td>
            <td className="border border-black px-2 py-1 text-right">Total:</td>
            <td className="border border-black px-2 py-1 text-right">{totalClaim.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-auto flex justify-between items-end pb-4">
        <div className="text-center w-64">
          <div className="border-t border-black pt-2">Claimed By:</div>
        </div>
        <div className="text-center w-64">
          <div className="border-t border-black pt-2">Authorised By:</div>
        </div>
      </div>
    </div>
  );
};
