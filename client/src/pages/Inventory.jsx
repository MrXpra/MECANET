/**
 * @file Inventory.jsx
 * @description Gestión de inventario de productos (CRUD completo)
 * 
 * Responsabilidades:
 * - Listar productos con búsqueda y filtros
 * - Crear nuevo producto (modal)
 * - Editar producto existente (modal)
 * - Eliminar producto (con confirmación)
 * - Filtros: categoría, marca, bajo stock, orden
 * - Exportar inventario (CSV/Excel)
 * - Mostrar indicadores de bajo stock
 * 
 * Estados:
 * - products: Array de productos desde backend
 * - filteredProducts: Array filtrado por búsqueda y filtros
 * - searchTerm: Búsqueda por nombre/SKU
 * - categoryFilter, brandFilter, stockFilter: Filtros activos
 * - sortBy: Campo de ordenamiento (name, stock, price)
 * - sortOrder: 'asc' o 'desc'
 * - showProductModal: Boolean para modal crear/editar
 * - editingProduct: Producto en edición o null para crear
 * 
 * APIs:
 * - GET /api/products
 * - POST /api/products (solo admin)
 * - PUT /api/products/:id (solo admin)
 * - DELETE /api/products/:id (solo admin)
 * - GET /api/suppliers (para dropdown)
 * 
 * Validaciones:
 * - SKU único (backend valida)
 * - Campos requeridos: sku, name, purchasePrice, sellingPrice, stock
 * - Precios > 0
 * - Stock >= 0
 * 
 * UI Features:
 * - Tabla con skeleton loader
 * - Badge de bajo stock (rojo) según minStock
 * - Modal con formulario completo
 * - Confirmación antes de eliminar
 * - Tooltips informativos
 * - Filtros expandibles
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { createProduct, updateProduct, deleteProduct, getSuppliers } from '../services/api';
import { useSettingsStore } from '../store/settingsStore';
import { useProductStore } from '../store/productStore'; // Importar nuevo store
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/SkeletonLoader';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Filter,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  Info,
  Barcode,
  Tag,
  Grid,
  Award,
  Truck,
  FileText,
  DollarSign,
  Percent,
  Hash,
} from 'lucide-react';

const Inventory = () => {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  
  // Usar el store global en lugar de estado local
  const { 
    products, 
    fetchProducts, 
    isLoading, 
    invalidateCache 
  } = useProductStore();

  // const [products, setProducts] = useState([]); // ELIMINADO
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  // const [isLoading, setIsLoading] = useState(false); // ELIMINADO
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'stock', 'price'
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Categories, Brands and Suppliers
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchProducts(); // Usar función del store con caché
  }, [fetchProducts]);

  // Filter products
  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, categoryFilter, brandFilter, supplierFilter, stockFilter, sortBy, sortOrder]);

  // Cerrar modal con tecla ESC
  useEffect(() => {
    if (showProductModal) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowProductModal(false);
          setEditingProduct(null);
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showProductModal]);

  const fetchSuppliers = async () => {
    try {
      const response = await getSuppliers({ limit: 1000 });
      const suppliersData = response?.data?.suppliers || response?.data || [];
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setSuppliers([]);
    }
  };

  // Filter and sort products based on various criteria
  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    // Brand filter
    if (brandFilter) {
      filtered = filtered.filter((product) => product.brand === brandFilter);
    }

    // Supplier filter
    if (supplierFilter) {
      filtered = filtered.filter((product) => 
        product.supplier?._id === supplierFilter || product.supplier === supplierFilter
      );
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter((product) => product.stock <= product.lowStockThreshold && product.stock > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter((product) => product.stock === 0);
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'stock':
          compareValue = a.stock - b.stock;
          break;
        case 'price':
          compareValue = a.sellingPrice - b.sellingPrice;
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredProducts(filtered);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete._id);
      toast.success('Producto eliminado exitosamente');
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      invalidateCache(); // Invalidar caché
      fetchProducts(true); // Recargar
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar producto');
    }
  };

  const handleCreateProduct = async (productData) => {
    try {
      await createProduct(productData);
      toast.success('Producto creado exitosamente');
      setShowProductModal(false);
      invalidateCache(); // Invalidar caché para forzar recarga
      fetchProducts(true); // Recargar inmediatamente
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.message || 'Error al crear producto');
    }
  };

  const handleUpdateProduct = async (productData) => {
    try {
      await updateProduct(editingProduct._id, productData);
      toast.success('Producto actualizado exitosamente');
      setShowProductModal(false);
      setEditingProduct(null);
      invalidateCache(); // Invalidar caché
      fetchProducts(true); // Recargar
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar producto');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(value);
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) {
      return { text: 'Agotado', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
    } else if (product.stock <= product.lowStockThreshold) {
      return { text: 'Bajo', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    }
    return { text: 'Disponible', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
  };

  const getLowStockCount = () => {
    return products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length;
  };

  const getOutOfStockCount = () => {
    return products.filter(p => p.stock === 0).length;
  };

  const getTotalValue = () => {
    return products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
  };

  // Mostrar skeleton mientras carga
  if (isLoading && products.length === 0) {
    return <TableSkeleton rows={10} columns={9} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventario</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión completa de productos
          </p>
        </div>
        <div className="flex gap-3">
          {settings.autoCreatePurchaseOrders && (
            <button
              onClick={() => navigate('/ordenes-compra?auto=true')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              Generar Orden de Restock
            </button>
          )}
          <button onClick={handleAddProduct} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-glass p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className="card-glass p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bajo Stock</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{getLowStockCount()}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="card-glass p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Agotados</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{getOutOfStockCount()}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="card-glass p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(getTotalValue())}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card-glass p-4 space-y-4">
        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn flex items-center justify-center ${showFilters ? 'bg-primary-600 text-white' : 'btn-secondary'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="input"
            >
              <option value="">Todas las marcas</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            {/* Supplier Filter */}
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los proveedores</option>
              {suppliers.filter(s => s.isActive).map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="input"
            >
              <option value="all">Todos los stocks</option>
              <option value="low">Bajo stock</option>
              <option value="out">Agotados</option>
            </select>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input flex-1"
              >
                <option value="name">Nombre</option>
                <option value="stock">Stock</option>
                <option value="price">Precio</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn-secondary"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precio Compra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precio Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          {product.brand && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.brand}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {product.category || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {product.supplier?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {product.stock}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {' '}/ {product.lowStockThreshold}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {formatCurrency(product.purchasePrice)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(product.sellingPrice)}
                        {product.discountPercentage > 0 && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            -{product.discountPercentage}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
                        >
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setProductToDelete(product);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!isLoading && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} productos
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrevPage}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pagination.hasPrevPage
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                Página {pagination.page} de {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pagination.hasNextPage
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onSave={editingProduct ? handleUpdateProduct : handleCreateProduct}
          onClose={() => setShowProductModal(false)}
          categories={categories}
          brands={brands}
          allProducts={products}
          suppliers={suppliers}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && productToDelete && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 100000 }}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Confirmar Eliminación
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                ¿Está seguro de que desea eliminar el producto <span className="font-semibold">{productToDelete.name}</span>? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProduct}
                className="btn-danger flex-1"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Eliminar Producto
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ product, onSave, onClose, categories, brands, allProducts, suppliers }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    category: product?.category || '',
    brand: product?.brand || '',
    purchasePrice: product?.purchasePrice || 0,
    sellingPrice: product?.sellingPrice || 0,
    stock: product?.stock || 0,
    lowStockThreshold: product?.lowStockThreshold || 5,
    discountPercentage: product?.discountPercentage || 0,
    supplier: product?.supplier?._id || product?.supplier || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isRestockMode, setIsRestockMode] = useState(false);
  const [existingProduct, setExistingProduct] = useState(null);
  const [restockAmount, setRestockAmount] = useState(0);
  const [targetStock, setTargetStock] = useState(0);
  const skuInputRef = React.useRef(null);
  const restockInputRef = React.useRef(null);

  // Auto-focus en el campo SKU cuando se abre el modal
  useEffect(() => {
    if (skuInputRef.current && !product) {
      setTimeout(() => skuInputRef.current.focus(), 100);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Detectar si el SKU ya existe (para modo ReStock)
  const handleSkuChange = (e) => {
    const skuValue = e.target.value.trim();
    setFormData((prev) => ({ ...prev, sku: skuValue }));

    // Solo buscar si no estamos editando un producto existente
    if (!product && skuValue) {
      const found = allProducts.find(p => p.sku.toLowerCase() === skuValue.toLowerCase());
      
      if (found) {
        // Producto encontrado - Modo ReStock
        setExistingProduct(found);
        setIsRestockMode(true);
        setFormData({
          name: found.name,
          sku: found.sku,
          description: found.description || '',
          category: found.category || '',
          brand: found.brand || '',
          purchasePrice: found.purchasePrice,
          sellingPrice: found.sellingPrice,
          stock: found.stock,
          lowStockThreshold: found.lowStockThreshold,
          discountPercentage: found.discountPercentage || 0,
        });
        setRestockAmount(0);
        setTargetStock(found.stock);
        
        // Hacer focus en el campo de cantidad después de cargar los datos
        setTimeout(() => {
          if (restockInputRef.current) {
            restockInputRef.current.focus();
            restockInputRef.current.select();
          }
        }, 100);
        
        toast.success(`Producto encontrado: ${found.name} - Modo ReStock activado`);
      } else {
        // SKU no existe - Modo normal
        setIsRestockMode(false);
        setExistingProduct(null);
        setRestockAmount(0);
        setTargetStock(0);
      }
    }

    // Clear error
    if (errors.sku) {
      setErrors((prev) => ({ ...prev, sku: '' }));
    }
  };

  // Manejar cambio en cantidad a agregar (Modo ReStock)
  const handleRestockAmountChange = (value) => {
    const amount = parseInt(value) || 0;
    setRestockAmount(amount);
    setTargetStock(existingProduct.stock + amount);
  };

  // Manejar cambio en stock objetivo (Modo ReStock)
  const handleTargetStockChange = (value) => {
    const target = parseInt(value) || 0;
    setTargetStock(target);
    const amount = Math.max(0, target - existingProduct.stock);
    setRestockAmount(amount);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido';
    if (formData.purchasePrice <= 0) newErrors.purchasePrice = 'El precio de compra debe ser mayor a 0';
    if (formData.sellingPrice <= 0) newErrors.sellingPrice = 'El precio de venta debe ser mayor a 0';
    if (formData.stock < 0) newErrors.stock = 'El stock no puede ser negativo';
    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.discountPercentage = 'El descuento debe estar entre 0 y 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Modo ReStock
    if (isRestockMode && existingProduct) {
      if (restockAmount <= 0) {
        toast.error('Debe agregar al menos 1 unidad al stock');
        return;
      }

      setIsLoading(true);
      try {
        const updatedData = {
          ...formData,
          stock: targetStock,
        };
        await onSave(updatedData, existingProduct._id);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Modo normal
    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfit = () => {
    const profit = formData.sellingPrice - formData.purchasePrice;
    const profitMargin = formData.purchasePrice > 0 
      ? ((profit / formData.purchasePrice) * 100).toFixed(2) 
      : 0;
    return { profit, profitMargin };
  };

  const { profit, profitMargin } = calculateProfit();

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 100000 }}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRestockMode ? '📦 Modo ReStock' : product ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            {isRestockMode && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                Agregar Stock
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SKU Field - Always first */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SKU * {!product && <span className="text-xs text-gray-500">(Escanee el código de barras)</span>}
            </label>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
              <input
                ref={skuInputRef}
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleSkuChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevenir submit del formulario al escanear
                  }
                }}
                disabled={!!product || isRestockMode}
                className={`input pl-10 ${errors.sku ? 'border-red-500' : ''} ${(product || isRestockMode) ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                placeholder="Ej: FLT-001"
                autoComplete="off"
              />
            </div>
            {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku}</p>}
          </div>

          {/* Modo ReStock - Campos especiales */}
          {isRestockMode && existingProduct && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-3">
                <Package className="w-5 h-5" />
                <span className="font-semibold">Producto: {existingProduct.name}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    value={existingProduct.stock}
                    disabled
                    className="input bg-gray-100 dark:bg-gray-800 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Agregar *
                  </label>
                  <input
                    ref={restockInputRef}
                    type="number"
                    min="0"
                    value={restockAmount}
                    onChange={(e) => handleRestockAmountChange(e.target.value)}
                    className="input font-bold text-center text-green-600 dark:text-green-400 border-green-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Final
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={targetStock}
                    onChange={(e) => handleTargetStockChange(e.target.value)}
                    className="input font-bold text-center text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>

              {restockAmount > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 py-2 rounded">
                  <Check className="w-4 h-4" />
                  Se agregarán {restockAmount} unidades ({existingProduct.stock} → {targetStock})
                </div>
              )}
            </div>
          )}

          {/* Campos normales - Ocultos en modo ReStock */}
          {!isRestockMode && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Producto *
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`input pl-10 ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Ej: Filtro de aceite"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
              </div>

          {/* Category and Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <div className="relative">
                <Grid className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                <input
                  className="input pl-10"
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  list="categories"
                  placeholder="Ej: Filtros"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marca
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                <input
                  className="input pl-10"
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  list="brands"
                  placeholder="Ej: Bosch"
                />
                <datalist id="brands">
                  {brands.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proveedor
            </label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
              <select
                className="input pl-10 pr-10"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <textarea
                className="input pl-10"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Descripción del producto..."
              />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio de Compra *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  step="0.01"
                  className={`input pl-10 ${errors.purchasePrice ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.purchasePrice && (
                <p className="text-xs text-red-600 mt-1">{errors.purchasePrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio de Venta *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  step="0.01"
                  className={`input pl-10 ${errors.sellingPrice ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.sellingPrice && (
                <p className="text-xs text-red-600 mt-1">{errors.sellingPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descuento (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`input pl-10 ${errors.discountPercentage ? 'border-red-500' : ''}`}
                  placeholder="0"
                />
              </div>
              {errors.discountPercentage && (
                <p className="text-xs text-red-600 mt-1">{errors.discountPercentage}</p>
              )}
            </div>
          </div>

          {/* Profit Margin Display */}
          {formData.purchasePrice > 0 && formData.sellingPrice > 0 && (
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Ganancia:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${profit.toFixed(2)} ({profitMargin}%)
                </span>
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Inicial *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className={`input pl-10 ${errors.stock ? 'border-red-500' : ''}`}
                  placeholder="0"
                />
              </div>
              {errors.stock && <p className="text-xs text-red-600 mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Umbral de Bajo Stock
              </label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                <input
                  type="number"
                  name="lowStockThreshold"
                  value={formData.lowStockThreshold}
                  onChange={handleChange}
                  min="0"
                  className="input pl-10"
                  placeholder="5"
                />
              </div>
            </div>
          </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  {isRestockMode ? 'Actualizando Stock...' : 'Guardando...'}
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>{isRestockMode ? 'Agregar al Stock' : product ? 'Actualizar Producto' : 'Crear Producto'}</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default Inventory;
