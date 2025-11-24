import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct, updateProduct, deleteProduct, getSuppliers } from '../services/api';
import { useSettingsStore } from '../store/settingsStore';
import { useProductStore } from '../store/productStore';
import toast from 'react-hot-toast';
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
  TrendingUp,
  TrendingDown,
  Info,
  Barcode,
  Tag,
  Grid as GridIcon,
  Award,
  Truck,
  FileText,
  DollarSign,
  Percent,
} from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Skeleton,
  useTheme,
  Alert,
  Collapse
} from '@mui/material';

const Inventory = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { settings } = useSettingsStore();
  const {
    products,
    fetchProducts,
    isLoading,
    invalidateCache
  } = useProductStore();

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Categories, Brands and Suppliers
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
      fetchSuppliers();
    }
  }, [products]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, categoryFilter, brandFilter, supplierFilter, stockFilter, sortBy, sortOrder]);

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

  const filterAndSortProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    if (brandFilter) {
      filtered = filtered.filter((product) => product.brand === brandFilter);
    }

    if (supplierFilter) {
      filtered = filtered.filter((product) =>
        product.supplier?._id === supplierFilter || product.supplier === supplierFilter
      );
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter((product) => product.stock <= product.lowStockThreshold && product.stock > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter((product) => product.stock === 0);
    }

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
    setPage(0);
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
      invalidateCache();
      fetchProducts(true);
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
      invalidateCache();
      fetchProducts(true);
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
      invalidateCache();
      fetchProducts(true);
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
      return { label: 'Agotado', color: 'error' };
    } else if (product.stock <= product.lowStockThreshold) {
      return { label: 'Bajo', color: 'warning' };
    }
    return { label: 'Disponible', color: 'success' };
  };

  const getLowStockCount = () => products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length;
  const getOutOfStockCount = () => products.filter(p => p.stock === 0).length;
  const getTotalValue = () => products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading && products.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={150} height={40} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={3} key={i}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Inventario
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión completa de productos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {settings.autoCreatePurchaseOrders && (
            <Button
              variant="outlined"
              startIcon={<Package size={20} />}
              onClick={() => navigate('/ordenes-compra?auto=true')}
            >
              Generar Orden de Restock
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddProduct}
          >
            Nuevo Producto
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Productos</Typography>
                <Typography variant="h5" fontWeight="bold">{products.length}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Package size={24} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Bajo Stock</Typography>
                <Typography variant="h5" fontWeight="bold" color="warning.main">{getLowStockCount()}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <AlertTriangle size={24} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Agotados</Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">{getOutOfStockCount()}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                <TrendingDown size={24} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Valor Total</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">{formatCurrency(getTotalValue())}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <TrendingUp size={24} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, SKU o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={<Filter size={20} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
        </Box>

        <Collapse in={showFilters}>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Categoría"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Marca</InputLabel>
                <Select
                  value={brandFilter}
                  label="Marca"
                  onChange={(e) => setBrandFilter(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Proveedor</InputLabel>
                <Select
                  value={supplierFilter}
                  label="Proveedor"
                  onChange={(e) => setSupplierFilter(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {suppliers.filter(s => s.isActive).map((supplier) => (
                    <MenuItem key={supplier._id} value={supplier._id}>{supplier.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock</InputLabel>
                <Select
                  value={stockFilter}
                  label="Stock"
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="low">Bajo stock</MenuItem>
                  <MenuItem value="out">Agotados</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ordenar por</InputLabel>
                  <Select
                    value={sortBy}
                    label="Ordenar por"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="name">Nombre</MenuItem>
                    <MenuItem value="stock">Stock</MenuItem>
                    <MenuItem value="price">Precio</MenuItem>
                  </Select>
                </FormControl>
                <IconButton onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {sortOrder === 'asc' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Precio Compra</TableCell>
              <TableCell>Precio Venta</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">No se encontraron productos</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow key={product._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{product.name}</Typography>
                          {product.brand && (
                            <Typography variant="caption" color="text.secondary">{product.brand}</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>{product.supplier?.name || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {product.stock}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          / {product.lowStockThreshold}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {formatCurrency(product.sellingPrice)}
                          {product.discountPercentage > 0 && (
                            <Chip label={`-${product.discountPercentage}%`} color="success" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={stockStatus.label} color={stockStatus.color} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Editar">
                            <IconButton onClick={() => handleEditProduct(product)} color="primary">
                              <Edit size={20} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              onClick={() => {
                                setProductToDelete(product);
                                setShowDeleteConfirm(true);
                              }}
                              color="error"
                            >
                              <Trash2 size={20} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
        />
      </TableContainer>

      {/* Product Modal */}
      <ProductModal
        open={showProductModal}
        product={editingProduct}
        onSave={async (data, id) => {
          if (id) {
            try {
              await updateProduct(id, data);
              toast.success('Stock actualizado exitosamente');
              setShowProductModal(false);
              setEditingProduct(null);
              invalidateCache();
              fetchProducts(true);
            } catch (error) {
              console.error('Error updating product:', error);
              toast.error(error.response?.data?.message || 'Error al actualizar producto');
            }
          } else {
            editingProduct ? await handleUpdateProduct(data) : await handleCreateProduct(data);
          }
        }}
        onClose={() => setShowProductModal(false)}
        categories={categories}
        brands={brands}
        allProducts={products}
        suppliers={suppliers}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar el producto <strong>{productToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained" startIcon={<Trash2 size={16} />}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const ProductModal = ({ open, product, onSave, onClose, categories, brands, allProducts, suppliers }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    brand: '',
    purchasePrice: 0,
    sellingPrice: 0,
    stock: 0,
    lowStockThreshold: 5,
    discountPercentage: 0,
    supplier: '',
    warranty: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isRestockMode, setIsRestockMode] = useState(false);
  const [existingProduct, setExistingProduct] = useState(null);
  const [restockAmount, setRestockAmount] = useState(0);
  const [targetStock, setTargetStock] = useState(0);
  const skuInputRef = useRef(null);
  const restockInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (product) {
        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          description: product.description || '',
          category: product.category || '',
          brand: product.brand || '',
          purchasePrice: product.purchasePrice || 0,
          sellingPrice: product.sellingPrice || 0,
          stock: product.stock || 0,
          lowStockThreshold: product.lowStockThreshold || 5,
          discountPercentage: product.discountPercentage || 0,
          supplier: product.supplier?._id || product.supplier || '',
          warranty: product.warranty || '',
        });
        setIsRestockMode(false);
        setExistingProduct(null);
      } else {
        setFormData({
          name: '',
          sku: '',
          description: '',
          category: '',
          brand: '',
          purchasePrice: 0,
          sellingPrice: 0,
          stock: 0,
          lowStockThreshold: 5,
          discountPercentage: 0,
          supplier: '',
          warranty: '',
        });
        setIsRestockMode(false);
        setExistingProduct(null);
        setTimeout(() => {
          if (skuInputRef.current) skuInputRef.current.focus();
        }, 100);
      }
      setErrors({});
      setRestockAmount(0);
      setTargetStock(0);
    }
  }, [open, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSkuChange = (e) => {
    const skuValue = e.target.value.trim();
    setFormData((prev) => ({ ...prev, sku: skuValue }));

    if (!product && skuValue) {
      const found = allProducts.find(p => p.sku.toLowerCase() === skuValue.toLowerCase());

      if (found) {
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
          warranty: found.warranty || '',
        });
        setRestockAmount(0);
        setTargetStock(found.stock);

        setTimeout(() => {
          if (restockInputRef.current) {
            restockInputRef.current.focus();
            restockInputRef.current.select();
          }
        }, 100);

        toast.success(`Producto encontrado: ${found.name} - Modo ReStock activado`);
      } else {
        setIsRestockMode(false);
        setExistingProduct(null);
        setRestockAmount(0);
        setTargetStock(0);
      }
    }
    if (errors.sku) setErrors((prev) => ({ ...prev, sku: '' }));
  };

  const handleRestockAmountChange = (value) => {
    const amount = parseInt(value) || 0;
    setRestockAmount(amount);
    setTargetStock((existingProduct?.stock || 0) + amount);
  };

  const handleTargetStockChange = (value) => {
    const target = parseInt(value) || 0;
    setTargetStock(target);
    const amount = Math.max(0, target - (existingProduct?.stock || 0));
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

    if (isRestockMode && existingProduct) {
      if (restockAmount <= 0) {
        toast.error('Debe agregar al menos 1 unidad al stock');
        return;
      }
      setIsLoading(true);
      try {
        const updatedData = { ...formData, stock: targetStock };
        await onSave(updatedData, existingProduct._id);
      } finally {
        setIsLoading(false);
      }
      return;
    }

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

  const profit = formData.sellingPrice - formData.purchasePrice;
  const profitMargin = formData.purchasePrice > 0 ? ((profit / formData.purchasePrice) * 100).toFixed(2) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isRestockMode ? <Package color={theme.palette.info.main} /> : <Tag />}
          <Typography variant="h6">
            {isRestockMode ? 'Modo ReStock' : product ? 'Editar Producto' : 'Nuevo Producto'}
          </Typography>
          {isRestockMode && <Chip label="Agregar Stock" color="info" size="small" />}
        </Box>
        <IconButton onClick={onClose}><X /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* SKU Field */}
          <TextField
            inputRef={skuInputRef}
            fullWidth
            label="SKU"
            name="sku"
            value={formData.sku}
            onChange={handleSkuChange}
            disabled={!!product || isRestockMode}
            error={!!errors.sku}
            helperText={errors.sku || (!product && "Escanee el código de barras")}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Barcode /></InputAdornment>,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          />

          {/* ReStock Mode Fields */}
          {isRestockMode && existingProduct && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.light', bgOpacity: 0.1, borderColor: 'info.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'info.dark' }}>
                <Package size={20} />
                <Typography fontWeight="bold">Producto: {existingProduct.name}</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Stock Actual"
                    value={existingProduct.stock}
                    disabled
                    inputProps={{ style: { textAlign: 'center', fontWeight: 'bold' } }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    inputRef={restockInputRef}
                    fullWidth
                    label="Agregar"
                    type="number"
                    value={restockAmount}
                    onChange={(e) => handleRestockAmountChange(e.target.value)}
                    inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 'bold', color: theme.palette.success.main } }}
                    focused
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Stock Final"
                    type="number"
                    value={targetStock}
                    onChange={(e) => handleTargetStockChange(e.target.value)}
                    inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 'bold', color: theme.palette.primary.main } }}
                  />
                </Grid>
              </Grid>
              {restockAmount > 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Se agregarán {restockAmount} unidades ({existingProduct.stock} → {targetStock})
                </Alert>
              )}
            </Paper>
          )}

          {/* Normal Fields */}
          {!isRestockMode && (
            <>
              <TextField
                fullWidth
                label="Nombre del Producto"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Tag /></InputAdornment>,
                }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Categoría"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><GridIcon /></InputAdornment>,
                    }}
                    select // Or autocomplete if we want free text + suggestions
                    SelectProps={{ native: false }} // Use MUI Select
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                    <MenuItem value={formData.category} sx={{ display: 'none' }}>{formData.category}</MenuItem> {/* Allow custom value if not in list? Actually Select restricts to options. If we want free text we need Autocomplete. For now let's stick to Select or Text with datalist equivalent. Original used datalist. */}
                  </TextField>
                  {/* Reverting to TextField with datalist equivalent using Autocomplete is better but complex. 
                      Let's use TextField but maybe add a way to pick? 
                      Actually, the original code used <input list="categories"> which allows free text.
                      MUI Autocomplete with freeSolo is the equivalent.
                  */}
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Marca"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Award /></InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth>
                <InputLabel>Proveedor</InputLabel>
                <Select
                  name="supplier"
                  value={formData.supplier}
                  label="Proveedor"
                  onChange={handleChange}
                  startAdornment={<InputAdornment position="start"><Truck /></InputAdornment>}
                >
                  <MenuItem value="">Sin proveedor</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier._id} value={supplier._id}>{supplier.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: <InputAdornment position="start" sx={{ mt: 1.5 }}><FileText /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Garantía"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Precio Compra"
                    name="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    error={!!errors.purchasePrice}
                    helperText={errors.purchasePrice}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><DollarSign /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Precio Venta"
                    name="sellingPrice"
                    type="number"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    error={!!errors.sellingPrice}
                    helperText={errors.sellingPrice}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><DollarSign /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Descuento (%)"
                    name="discountPercentage"
                    type="number"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    error={!!errors.discountPercentage}
                    helperText={errors.discountPercentage}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Percent /></InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>

              {formData.purchasePrice > 0 && formData.sellingPrice > 0 && (
                <Alert severity="info">
                  Ganancia: <strong>${profit.toFixed(2)}</strong> ({profitMargin}%)
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Stock Inicial"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                    error={!!errors.stock}
                    helperText={errors.stock}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Package /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Umbral Bajo Stock"
                    name="lowStockThreshold"
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><AlertTriangle /></InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <Skeleton variant="circular" width={20} height={20} /> : <Check />}
        >
          {isLoading ? 'Guardando...' : isRestockMode ? 'Agregar al Stock' : product ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Inventory;
