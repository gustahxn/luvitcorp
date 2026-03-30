import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      
      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find(i => i.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map(i =>
                i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        });
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(i => i.id !== productId),
        }));
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map(i =>
            i.id === productId ? { ...i, quantity } : i
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'luvitcorp-cart-storage',
    }
  )
);
