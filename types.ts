
export interface Receipt {
  id: string;
  originalImage: string;
  croppedImage: string | null;
  amount: number;
  category: string;
  remark: string;
  date: string;
  isManual: boolean;
  // Positioning for the attachment board
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const DEFAULT_CATEGORIES = [
  "Handphone",
  "Petrol",
  "Toll",
  "Parking Fee",
  "Car Maintenance",
  "Outstation Allowance",
  "Travelling & Accomodation",
  "Transportation",
  "Staff Welfare",
  "Entertainment",
  "OT Claim",
  "Medical",
  "Misc"
];

export interface ClaimState {
  name: string;
  month: string;
  receipts: Receipt[];
  customCategories: string[];
}
