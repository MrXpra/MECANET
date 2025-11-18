import { create } from 'zustand';
import { getProducts } from '../services/api';

export const useProductStore = create((set, get) => ({
  products: [],
  lastFetched: null,
  isLoading: false,
  error: null,

  // Duración del caché en milisegundos (5 minutos)
  CACHE_DURATION: 5 * 60 * 1000,

  fetchProducts: async (force = false) => {
    const { products, lastFetched, CACHE_DURATION, isLoading } = get();
    const now = Date.now();

    // Si tenemos datos, son recientes y no forzamos actualización, retornamos (CACHÉ HIT)
    if (!force && products.length > 0 && lastFetched && (now - lastFetched < CACHE_DURATION)) {
      return; 
    }

    // Evitar doble petición si ya está cargando
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const response = await getProducts();
      // Asumiendo que response.data es el array de productos
      set({ 
        products: response.data, 
        lastFetched: Date.now(),
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar productos', 
        isLoading: false 
      });
      console.error(error);
    }
  },

  // Invalidar caché (usar después de crear/editar/eliminar)
  invalidateCache: () => set({ lastFetched: null }),
  
  // Actualización optimista (opcional, para UI instantánea)
  addProduct: (newProduct) => set((state) => ({ 
    products: [...state.products, newProduct] 
  })),
  
  updateProduct: (updatedProduct) => set((state) => ({
    products: state.products.map(p => p._id === updatedProduct._id ? updatedProduct : p)
  })),
  
  removeProduct: (productId) => set((state) => ({
    products: state.products.filter(p => p._id !== productId)
  }))
}));
