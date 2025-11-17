import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QRCode, QRDesign } from '../../types';

interface QRCodesState {
  qrCodes: QRCode[];
  designs: QRDesign[];
  loading: boolean;
  error: string | null;
}

const initialState: QRCodesState = {
  qrCodes: [],
  designs: [
    {
      id: '1',
      name: 'Minimal',
      description: 'Clean and simple design',
      template: 'minimal',
    },
    {
      id: '2',
      name: 'Branded',
      description: 'Restaurant branded design',
      template: 'branded',
    },
    {
      id: '3',
      name: 'Elegant',
      description: 'Sophisticated gradient design',
      template: 'elegant',
    },
    {
      id: '4',
      name: 'Fun',
      description: 'Playful design with icons',
      template: 'fun',
    },
    {
      id: '5',
      name: 'Compact',
      description: 'Space-efficient design',
      template: 'compact',
    },
  ],
  loading: false,
  error: null,
};

const qrCodesSlice = createSlice({
  name: 'qrCodes',
  initialState,
  reducers: {
    addQRCode: (state, action: PayloadAction<Omit<QRCode, 'id' | 'generatedAt'>>) => {
      const newQRCode: QRCode = {
        ...action.payload,
        id: Date.now().toString(),
        generatedAt: new Date().toISOString(),
      };
      state.qrCodes.unshift(newQRCode);
    },
    deleteQRCode: (state, action: PayloadAction<string>) => {
      state.qrCodes = state.qrCodes.filter(qr => qr.id !== action.payload);
    },
  },
});

export const { addQRCode, deleteQRCode } = qrCodesSlice.actions;
export default qrCodesSlice.reducer;