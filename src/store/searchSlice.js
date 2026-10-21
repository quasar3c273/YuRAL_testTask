import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getBrands, getOffers, searchParts } from '../api/parts.js';

export const fetchBrands = createAsyncThunk('search/brands', async (number, { signal }) => {
  return getBrands(await searchParts({ number, signal }));
});

export const fetchOffers = createAsyncThunk('search/offers', async ({ number, brand }, { signal }) => {
  return getOffers(await searchParts({ number, brand, signal }));
});

const initialState = {
  number: '',
  selectedBrand: '',
  brands: [],
  offers: [],
  brandsStatus: 'idle',
  offersStatus: 'idle',
  brandsError: '',
  offersError: '',
  brandsRequestId: null,
  offersRequestId: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    numberChanged: (_, action) => ({ ...initialState, number: action.payload }),

    brandSelected(state, action) {
      if (state.selectedBrand === action.payload) {
        return;
      }

      state.selectedBrand = action.payload;
      state.offers = [];
      state.offersStatus = 'idle';
      state.offersError = '';
      state.offersRequestId = null;
    },
  },
  extraReducers(builder) {
    const requests = [
      [fetchBrands, 'brands'],
      [fetchOffers, 'offers'],
    ];

    for (const [thunk, field] of requests) {
      builder
        .addCase(thunk.pending, (state, action) => {
          state[`${field}Status`] = 'loading';
          state[`${field}Error`] = '';
          state[`${field}RequestId`] = action.meta.requestId;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          if (state[`${field}RequestId`] !== action.meta.requestId) {
            return;
          }

          state[`${field}Status`] = 'succeeded';
          state[field] = action.payload;
        })
        .addCase(thunk.rejected, (state, action) => {
          if (state[`${field}RequestId`] !== action.meta.requestId) {
            return;
          }

          state[`${field}Status`] = action.meta.aborted ? 'idle' : 'failed';
          state[`${field}Error`] = action.meta.aborted ? '' : action.error.message;
        });
    }
  },
});

export const { numberChanged, brandSelected } = searchSlice.actions;
export default searchSlice.reducer;
