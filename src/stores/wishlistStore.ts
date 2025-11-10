import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ShopifyProduct } from '@/lib/shopify';

interface WishlistStore {
  items: ShopifyProduct[];
  
  addItem: (item: ShopifyProduct) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const exists = items.find(i => i.node.id === item.node.id);
        
        if (!exists) {
          set({ items: [...items, item] });
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.node.id !== productId)
        });
      },

      isInWishlist: (productId) => {
        return get().items.some(item => item.node.id === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      }
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
