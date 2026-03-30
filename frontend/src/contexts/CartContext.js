import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Zustand simplifica bastante o estado global e tem persistência no localStorage nativa
export const useCartStore = create(
  persist(
    (set, get) => ({
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
      
      get cartTotal() {
        return get().items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
      },
      
      get itemsCount() {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      }
    }),
    {
      name: 'luvitcorp-cart-storage',
    }
  )
);
