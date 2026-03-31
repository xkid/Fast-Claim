
import React from 'react';
import { ClaimState, DEFAULT_CATEGORIES } from '../types';

interface ClaimFormProps {
  state: ClaimState;
}

export const ClaimForm: React.FC<ClaimFormProps> = ({ state }) => {
  const allCategories = [...DEFAULT_CATEGORIES, ...state.customCategories];
  
  const categorySummary = allCategories.map((cat) => {
    const relevantReceipts = state.receipts.filter(r => r.category === cat);
    const totalAmount = relevantReceipts.reduce((sum, r) => sum + r.amount, 0);
    const remarks = relevantReceipts.map(r => r.remark).filter(rem => rem.trim() !== "").join(', ');
    
    return {
      name: cat,
      amount: totalAmount,
      description: remarks ? `(${remarks})` : ""
    };
  }).filter(item => item.amount > 0).map((item, index) => ({
    ...item,
    index: index + 1
  }));

  const totalClaim = categorySummary.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="a4-preview print-page text-[12px] font-sans flex flex-col shadow-xl bg-white mx-auto p-[15mm]">
      <div className="text-center mb-4">
        <h1 className="text-base font-bold uppercase tracking-widest">Elcomp Technologies Sdn Bhd (589723-U)</h1>
        <h2 className="text-sm font-bold mt-1 underline">STAFF MONTHLY CLAIM FORM</h2>
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-bold">Name:</span>
          <span className="border-b border-black min-w-[250px] pb-0.5 px-2">{state.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">Month:</span>
          <span className="border-b border-black min-w-[150px] pb-0.5 px-2">{state.month}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <table className="w-full border-collapse border border-black mb-2">
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
                  {item.amount.toFixed(2)}
                </td>
              </tr>
            ))}
            {categorySummary.length === 0 && (
              <tr className="h-7">
                <td colSpan={3} className="border border-black text-center text-slate-400 italic">No claims for this month</td>
              </tr>
            )}
            <tr className="font-bold h-9 bg-slate-50">
              <td className="border border-black"></td>
              <td className="border border-black px-2 py-1 text-right">Total:</td>
              <td className="border border-black px-2 py-1 text-right">{totalClaim.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-auto pt-4 flex justify-between items-end">
        <div className="text-center w-64">
          <div className="border-t border-black pt-2 font-medium">Claimed By:</div>
          <div className="h-8"></div> {/* Space for potential stamp if needed, though usually signed above line */}
        </div>
        <div className="text-center w-64">
          <div className="border-t border-black pt-2 font-medium">Authorised By:</div>
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
};
