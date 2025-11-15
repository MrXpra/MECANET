/**
 * @file Quotations.jsx
 * @description Gestión de Cotizaciones - Crear presupuestos y convertirlos en ventas
 * 
 * Características:
 * - Listar cotizaciones con filtros (estado, cliente, fechas)
 * - Crear nueva cotización
 * - Ver detalle de cotización
 * - Editar cotización (solo si está Pendiente)
 * - Convertir cotización a venta
 * - Eliminar cotización (solo admin)
 * - Badges de estado con colores
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertQuotationToSale,
  updateQuotationStatus,
  getCustomers,
  getProducts,
} from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  ShoppingCart,
  Calendar,
  User,
  Package,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [quotations, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [quotationsRes, customersRes, productsRes] = await Promise.all([
        getQuotations(),
        getCustomers({ limit: 1000 }),
        getProducts({ limit: 1000 }),
      ]);

      setQuotations(Array.isArray(quotationsRes.data) ? quotationsRes.data : []);
      setCustomers(Array.isArray(customersRes.data?.customers) ? customersRes.data.customers : []);
      setProducts(Array.isArray(productsRes.data?.products) ? productsRes.data.products : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
      setQuotations([]);
      setCustomers([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuotations = () => {
    let filtered = quotations;

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }

    setFilteredQuotations(filtered);
  };

  const handleCreateOrEdit = async (data) => {
    try {
      if (editingQuotation) {
        await updateQuotation(editingQuotation._id, data);
        toast.success('Cotización actualizada');
      } else {
        await createQuotation(data);
        toast.success('Cotización creada');
      }
      setShowCreateModal(false);
      setEditingQuotation(null);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Error al guardar cotización');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta cotización?')) return;
    
    try {
      await deleteQuotation(id);
      toast.success('Cotización eliminada');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleConvert = async (quotation) => {
    const paymentMethod = prompt('Método de pago (Efectivo/Tarjeta/Transferencia):');
    if (!paymentMethod) return;

    if (!['Efectivo', 'Tarjeta', 'Transferencia'].includes(paymentMethod)) {
      toast.error('Método de pago inválido');
      return;
    }

    try {
      await convertQuotationToSale(quotation._id, { paymentMethod });
      toast.success('Cotización convertida en venta');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Error al convertir');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pendiente': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      'Aprobada': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'Rechazada': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      'Convertida': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'Vencida': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400',
    };
    return styles[status] || styles['Pendiente'];
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading && quotations.length === 0) {
    return (
      <div className="animate-fade-in p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary-600" />
            Cotizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona presupuestos y conviértelos en ventas
          </p>
        </div>
        <button
          onClick={() => {
            setEditingQuotation(null);
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Cotización
        </button>
      </div>

      {/* Filters */}
      <div className="card-glass p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-48"
          >
            <option value="all">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
            <option value="Convertida">Convertida</option>
            <option value="Vencida">Vencida</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card-glass p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{quotations.length}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{quotations.filter(q => q.status === 'Pendiente').length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Convertidas</p>
              <p className="text-2xl font-bold text-blue-600">{quotations.filter(q => q.status === 'Convertida').length}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
              <p className="text-2xl font-bold text-gray-600">{quotations.filter(q => q.status === 'Vencida').length}</p>
            </div>
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Productos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Válida hasta
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No se encontraron cotizaciones' 
                      : 'No hay cotizaciones. Crea una nueva para comenzar.'}
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quotation) => (
                  <tr key={quotation._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {quotation.quotationNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {quotation.customer?.fullName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {quotation.customer?.phone || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {quotation.items?.length || 0} producto(s)
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(quotation.total || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(quotation.status)}`}>
                          {quotation.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(quotation.validUntil)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setShowDetailModal(true);
                          }}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {quotation.status === 'Pendiente' && (
                          <>
                            <button
                              onClick={() => {
                                setEditingQuotation(quotation);
                                setShowCreateModal(true);
                              }}
                              className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleConvert(quotation)}
                              className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400"
                              title="Convertir a venta"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(quotation._id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <QuotationModal
          quotation={editingQuotation}
          customers={customers}
          products={products}
          onSave={handleCreateOrEdit}
          onClose={() => {
            setShowCreateModal(false);
            setEditingQuotation(null);
          }}
        />
      )}

      {showDetailModal && selectedQuotation && (
        <DetailModal
          quotation={selectedQuotation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedQuotation(null);
          }}
        />
      )}
    </div>
  );
};

// Modal de creación/edición (simplificado por ahora)
const QuotationModal = ({ quotation, customers, products, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    customer: quotation?.customer?._id || '',
    items: quotation?.items?.map(item => ({
      product: item.product._id || item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
    })) || [],
    validUntil: quotation?.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
    notes: quotation?.notes || '',
    terms: quotation?.terms || '',
  });

  const [cart, setCart] = useState(formData.items);
  const [searchTerm, setSearchTerm] = useState('');

  const addProduct = (product) => {
    const exists = cart.find(item => item.product === product._id);
    if (exists) {
      toast.error('Producto ya agregado');
      return;
    }

    setCart([...cart, {
      product: product._id,
      productData: product,
      quantity: 1,
      unitPrice: product.sellingPrice,
      discount: 0,
    }]);
  };

  const removeProduct = (productId) => {
    setCart(cart.filter(item => item.product !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCart(cart.map(item => 
      item.product === productId ? { ...item, quantity: parseInt(quantity) || 1 } : item
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer) {
      toast.error('Selecciona un cliente');
      return;
    }

    if (cart.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    if (!formData.validUntil) {
      toast.error('Selecciona fecha de vencimiento');
      return;
    }

    onSave({
      ...formData,
      items: cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
      })),
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 100000 }}>
      <div className="glass-strong rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {quotation ? 'Editar Cotización' : 'Nueva Cotización'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex gap-4 p-6">
          {/* Left: Products */}
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="flex-1 overflow-auto border rounded-lg p-2 space-y-2">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex justify-between items-center"
                  onClick={() => addProduct(product)}
                >
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                  </div>
                  <span className="text-sm font-bold">
                    ${product.sellingPrice.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="w-96 flex flex-col">
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cliente *</label>
                <select
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Válida hasta *</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input w-full"
                  rows="2"
                />
              </div>
            </div>

            {/* Cart */}
            <div className="flex-1 overflow-auto border rounded-lg p-2 mb-4">
              <h3 className="font-semibold mb-2">Productos ({cart.length})</h3>
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Selecciona productos de la izquierda
                </p>
              ) : (
                cart.map(item => (
                  <div key={item.product} className="p-2 bg-gray-50 dark:bg-gray-800 rounded mb-2">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium">{item.productData?.name}</p>
                      <button
                        type="button"
                        onClick={() => removeProduct(item.product)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product, e.target.value)}
                        className="input text-sm w-20"
                      />
                      <span className="text-xs self-center">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={cart.length === 0}>
                {quotation ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// Modal de detalle (simplificado)
const DetailModal = ({ quotation, onClose }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(value);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 100000 }}>
      <div className="glass-strong rounded-2xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{quotation.quotationNumber}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
            <p className="font-medium">{quotation.customer?.fullName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Productos</p>
            {quotation.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b">
                <span>{item.product?.name} x{item.quantity}</span>
                <span className="font-bold">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(quotation.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Quotations;
