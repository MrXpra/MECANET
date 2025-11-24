import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import {
  getProducts,
  getProductBySku,
  createSale,
  getCustomers,
  createCustomer as createCustomerAPI,
} from '../services/api';
import toast from 'react-hot-toast';
import { BillingSkeleton } from '../components/SkeletonLoader';
import {
  Search,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  User,
  X,
  Check,
  Printer,
  Filter,
  LayoutGrid,
  List as ListIcon,
  TrendingUp,
  CreditCard,
  Banknote,
  ArrowRightLeft
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { showGroupedToast } from '../utils/toastUtils';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActionArea,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  FormControl,
  InputLabel,
  useTheme,
  Alert,
  CircularProgress
} from '@mui/material';

const Billing = () => {
  const theme = useTheme();
  const { invalidateCache } = useProductStore();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [notes, setNotes] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountAmount, setGlobalDiscountAmount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [highlightedItems, setHighlightedItems] = useState(new Set());
  const searchInputRef = useRef(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateDiscount,
    clearCart,
    getSubtotal,
    getTotalDiscount,
    getTotal,
    selectedCustomer,
    setCustomer,
  } = useCartStore();

  useEffect(() => {
    fetchProducts();
    searchInputRef.current?.focus();
  }, [pagination.page, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await getProducts({
        page: pagination.page,
        limit: pagination.limit,
        category: selectedCategory || undefined
      });

      const productsData = response?.data?.products || response?.data || [];
      const paginationData = response?.data?.pagination || {};

      setProducts(productsData);
      setPagination(prev => ({ ...prev, ...paginationData }));

      if (pagination.page === 1 && !selectedCategory) {
        const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      const aSold = a.soldCount || 0;
      const bSold = b.soldCount || 0;
      return bSold - aSold;
    });

    return filtered;
  }, [products, searchTerm, selectedCategory]);

  const handleSearchKeyPress = async (e) => {
    if (e.key === 'Enter' && searchTerm) {
      try {
        const response = await getProductBySku(searchTerm);
        if (response.data) {
          handleAddToCart(response.data);
          setSearchTerm('');
          showGroupedToast(`${response.data.name} añadido al carrito`);
        }
      } catch (error) {
        if (filteredProducts.length === 1) {
          handleAddToCart(filteredProducts[0]);
          setSearchTerm('');
        }
      }
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Producto sin stock disponible');
      return;
    }

    const existingItem = items.find((item) => item.product._id === product._id);
    if (existingItem && existingItem.quantity >= product.stock) {
      toast.error('Stock insuficiente');
      return;
    }

    addItem(product);
    setHighlightedItems(prev => new Set(prev).add(product._id));

    setTimeout(() => {
      const itemElement = document.getElementById(`cart-item-${product._id}`);
      if (itemElement) {
        itemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);

    setTimeout(() => {
      setHighlightedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(product._id);
        return newSet;
      });
    }, 2000);

    showGroupedToast(`${product.name} añadido`);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const product = items.find((item) => item.product._id === productId)?.product;

    if (newQuantity === '' || newQuantity === null || newQuantity === undefined) {
      updateQuantity(productId, '');
      return;
    }

    const qty = parseInt(newQuantity);
    if (isNaN(qty) || qty < 1) return;

    if (qty > product.stock) {
      toast.error('Stock insuficiente');
      return;
    }

    updateQuantity(productId, qty);
  };

  const handleRemoveItem = (productId) => {
    removeItem(productId);
    toast.success('Producto eliminado del carrito');
  };

  const handleDiscountChange = (productId, discount) => {
    if (discount === '' || discount === null || discount === undefined) {
      updateDiscount(productId, 0);
      return;
    }

    const disc = parseFloat(discount);
    if (isNaN(disc) || disc < 0 || disc > 100) {
      toast.error('El descuento debe estar entre 0 y 100');
      return;
    }
    updateDiscount(productId, disc);
  };

  const handleProceedToPayment = () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleCompleteSale = async () => {
    try {
      const discountAmount = globalDiscountAmount || ((globalDiscount / 100) * (getSubtotal() - getTotalDiscount()));
      const finalTotal = getTotal() - discountAmount;

      if (paymentMethod === 'Efectivo') {
        const received = parseFloat(amountReceived) || 0;
        if (received < finalTotal) {
          toast.error('El monto recibido debe ser mayor o igual al total');
          return;
        }
      }

      setIsLoading(true);

      const saleData = {
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          discountApplied: item.customDiscount,
        })),
        paymentMethod,
        customer: selectedCustomer?._id,
        subtotal: getSubtotal(),
        totalDiscount: getTotalDiscount() + discountAmount,
        total: finalTotal,
        amountReceived: paymentMethod === 'Efectivo' ? parseFloat(amountReceived) : finalTotal,
        change: paymentMethod === 'Efectivo' ? change : 0,
        notes: notes
      };

      const response = await createSale(saleData);
      invalidateCache();
      fetchProducts();
      toast.success('¡Venta completada exitosamente!');
      setCompletedSale(response.data);
      setShowPaymentModal(false);
      setShowPrintModal(true);
      clearCart();
      setGlobalDiscount(0);
      setGlobalDiscountAmount(0);
      setAmountReceived('');
      setChange(0);
      setNotes('');
      fetchProducts();
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error(error.response?.data?.message || 'Error al completar la venta');
    } finally {
      setIsLoading(false);
    }
  };

  const printInvoice = (sale) => {
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, sale.invoiceNumber, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        margin: 0,
        height: 40,
        width: 1.5
      });
    } catch (error) {
      console.error("Error generating barcode:", error);
    }
    const barcodeDataUrl = canvas.toDataURL("image/png");

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Error: No se pudo abrir la ventana de impresión.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Factura ${sale.invoiceNumber}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; font-size: 12px; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="center bold">MECANET</div>
          <div class="line"></div>
          <div>Factura: ${sale.invoiceNumber}</div>
          <div>Fecha: ${new Date(sale.createdAt).toLocaleString('es-DO')}</div>
          ${sale.customer ? `<div>Cliente: ${sale.customer.fullName}</div>` : ''}
          <div class="line"></div>
          <table>
            ${sale.items.map(item => `
              <tr>
                <td>${item.quantity} x ${item.product.name}</td>
                <td class="right">${formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </table>
          <div class="line"></div>
          <table>
            <tr><td>Subtotal:</td><td class="right">${formatCurrency(sale.subtotal)}</td></tr>
            ${sale.totalDiscount > 0 ? `<tr><td>Descuento:</td><td class="right">-${formatCurrency(sale.totalDiscount)}</td></tr>` : ''}
            <tr class="bold"><td>TOTAL:</td><td class="right">${formatCurrency(sale.total)}</td></tr>
            ${sale.paymentMethod === 'Efectivo' ? `
              <tr><td>Recibido:</td><td class="right">${formatCurrency(parseFloat(amountReceived))}</td></tr>
              <tr><td>Cambio:</td><td class="right">${formatCurrency(change)}</td></tr>
            ` : ''}
          </table>
          <div class="center" style="margin-top: 20px;">
            <img src="${barcodeDataUrl}" style="width: 100%; max-width: 200px;" />
          </div>
          <div class="center" style="margin-top: 10px;">¡Gracias por su compra!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 500);
    }, 250);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(value);
  };

  const calculateItemTotal = (item) => {
    const productDiscount = item.product.discountPercentage || 0;
    const customDiscount = item.customDiscount || 0;
    const totalDiscount = productDiscount + customDiscount;
    const priceAfterDiscount = item.product.sellingPrice * (1 - totalDiscount / 100);
    return priceAfterDiscount * item.quantity;
  };

  if (isLoading && products.length === 0) {
    return <BillingSkeleton />;
  }

  return (
    <Container maxWidth={false} sx={{ height: 'calc(100vh - 100px)', py: 2 }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Left Side - Product Catalog */}
        <Grid item xs={12} md={7} lg={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Search and Filters */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                inputRef={searchInputRef}
                fullWidth
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />

              <FormControl size="small" sx={{ minWidth: 150, display: { xs: 'none', lg: 'block' } }}>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Todas las categorías</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <IconButton onClick={() => { setSearchTerm(''); setSelectedCategory(''); }} title="Limpiar filtros">
                <Filter size={20} />
              </IconButton>

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="list"><ListIcon size={20} /></ToggleButton>
                <ToggleButton value="grid"><LayoutGrid size={20} /></ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Paper>

          {/* Product Grid/List */}
          <Paper sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'background.default' }} elevation={0}>
            {filteredProducts.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                <ShoppingCart size={64} />
                <Typography variant="h6" sx={{ mt: 2 }}>No se encontraron productos</Typography>
              </Box>
            ) : viewMode === 'grid' ? (
              <Grid container spacing={2}>
                {filteredProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                    <ProductCard product={product} onAdd={handleAddToCart} formatCurrency={formatCurrency} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Stack spacing={1}>
                {filteredProducts.map((product) => (
                  <ProductListItem key={product._id} product={product} onAdd={handleAddToCart} formatCurrency={formatCurrency} />
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right Side - Cart */}
        <Grid item xs={12} md={5} lg={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Cart Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCart size={20} /> Carrito ({items.length})
                </Typography>
                {items.length > 0 && (
                  <Button color="error" size="small" onClick={() => window.confirm('¿Limpiar carrito?') && clearCart()}>
                    Limpiar
                  </Button>
                )}
              </Box>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<User size={18} />}
                onClick={() => setShowCustomerModal(true)}
                sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1 }}
              >
                <Box sx={{ flex: 1 }}>
                  {selectedCustomer ? (
                    <>
                      <Typography variant="subtitle2">{selectedCustomer.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{selectedCustomer.phone || selectedCustomer.email}</Typography>
                    </>
                  ) : (
                    <Typography color="text.secondary">Seleccionar cliente (opcional)</Typography>
                  )}
                </Box>
                {selectedCustomer && (
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setCustomer(null); }}>
                    <X size={16} />
                  </IconButton>
                )}
              </Button>
            </Box>

            {/* Cart Items */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {items.length === 0 ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  opacity: 0.7,
                  p: 4,
                  textAlign: 'center'
                }}>
                  <Box sx={{
                    p: 3,
                    borderRadius: '50%',
                    bgcolor: 'action.hover',
                    mb: 2
                  }}>
                    <ShoppingCart size={48} strokeWidth={1.5} />
                  </Box>
                  <Typography variant="h6" gutterBottom>Tu carrito está vacío</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Selecciona productos del catálogo para comenzar una nueva venta.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {items.map((item) => (
                    <CartItem
                      key={item.product._id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onDiscountChange={handleDiscountChange}
                      onRemove={handleRemoveItem}
                      calculateItemTotal={calculateItemTotal}
                      formatCurrency={formatCurrency}
                      isHighlighted={highlightedItems.has(item.product._id)}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            {/* Cart Summary */}
            {items.length > 0 && (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(getSubtotal())}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="success.main">Descuento:</Typography>
                    <Typography variant="body2" color="success.main">-{formatCurrency(getTotalDiscount())}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6">{formatCurrency(getTotal())}</Typography>
                  </Box>
                </Stack>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Check />}
                  onClick={handleProceedToPayment}
                >
                  Proceder al Pago
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Modals */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        subtotal={getSubtotal()}
        itemsDiscount={getTotalDiscount()}
        globalDiscount={globalDiscount}
        setGlobalDiscount={setGlobalDiscount}
        globalDiscountAmount={globalDiscountAmount}
        setGlobalDiscountAmount={setGlobalDiscountAmount}
        total={getTotal()}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountReceived={amountReceived}
        setAmountReceived={setAmountReceived}
        change={change}
        notes={notes}
        setNotes={setNotes}
        onConfirm={handleCompleteSale}
        isLoading={isLoading}
        formatCurrency={formatCurrency}
      />

      <CustomerModal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={(customer) => {
          setCustomer(customer);
          setShowCustomerModal(false);
        }}
      />

      <PrintConfirmationModal
        open={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setCompletedSale(null);
        }}
        sale={completedSale}
        onPrint={() => {
          printInvoice(completedSale);
          setShowPrintModal(false);
          setCompletedSale(null);
        }}
        formatCurrency={formatCurrency}
      />
    </Container>
  );
};

const ProductCard = ({ product, onAdd, formatCurrency }) => {
  const isLowStock = product.stock <= product.lowStockThreshold;
  const hasDiscount = product.discountPercentage > 0;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CardActionArea onClick={() => onAdd(product)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {product.sku}
          </Typography>
          {hasDiscount && (
            <Chip label={`-${product.discountPercentage}%`} color="success" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
          )}
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, flex: 1, fontWeight: 'bold', lineHeight: 1.2 }}>
          {product.name}
        </Typography>

        <Box sx={{ width: '100%' }}>
          {product.brand && (
            <Typography variant="caption" display="block" color="text.secondary">
              {product.brand}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
            <Box>
              {hasDiscount && (
                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {formatCurrency(product.sellingPrice)}
                </Typography>
              )}
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(product.sellingPrice * (1 - (product.discountPercentage || 0) / 100))}
              </Typography>
            </Box>
            <Typography variant="caption" color={isLowStock ? 'error.main' : 'text.secondary'} fontWeight={isLowStock ? 'bold' : 'normal'}>
              Stock: {product.stock}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
};

const ProductListItem = ({ product, onAdd, formatCurrency }) => {
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.discountPercentage > 0;

  return (
    <Card variant="outlined" sx={{ opacity: isOutOfStock ? 0.6 : 1, '&:hover': { borderColor: 'primary.main' } }}>
      <CardActionArea onClick={() => !isOutOfStock && onAdd(product)} sx={{ p: 2 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} sm>
            <Typography variant="subtitle1" fontWeight="bold">{product.name}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {product.sku} {product.brand && `• ${product.brand}`}
            </Typography>
          </Grid>
          <Grid item xs={6} sm="auto">
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              {hasDiscount && (
                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', display: 'block' }}>
                  {formatCurrency(product.sellingPrice)}
                </Typography>
              )}
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {formatCurrency(product.sellingPrice * (1 - (product.discountPercentage || 0) / 100))}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm="auto">
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={isOutOfStock ? "Agotado" : `${product.stock} un.`}
                color={isOutOfStock ? "error" : "default"}
                variant={isOutOfStock ? "filled" : "outlined"}
                size="small"
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<Plus size={16} />}
                disabled={isOutOfStock}
                disableElevation
                sx={{ minWidth: '100px' }}
              >
                Agregar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </CardActionArea>
    </Card>
  );
};

const CartItem = ({ item, onQuantityChange, onDiscountChange, onRemove, calculateItemTotal, formatCurrency, isHighlighted }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        transition: 'all 0.3s',
        borderColor: isHighlighted ? 'primary.main' : 'divider',
        bgcolor: isHighlighted ? 'action.hover' : 'background.paper'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" noWrap>{item.product.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {item.product.sku} • {formatCurrency(item.product.sellingPrice)}
          </Typography>
        </Box>
        <IconButton size="small" color="error" onClick={() => onRemove(item.product._id)}>
          <Trash2 size={16} />
        </IconButton>
      </Box>

      <Grid container spacing={1} alignItems="center">
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <IconButton size="small" onClick={() => onQuantityChange(item.product._id, item.quantity - 1)}>
              <Minus size={14} />
            </IconButton>
            <Typography variant="body2" sx={{ px: 1, minWidth: 30, textAlign: 'center' }}>{item.quantity}</Typography>
            <IconButton size="small" onClick={() => onQuantityChange(item.product._id, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>
              <Plus size={14} />
            </IconButton>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <TextField
            size="small"
            label="Desc %"
            type="number"
            value={item.customDiscount || 0}
            onChange={(e) => onDiscountChange(item.product._id, e.target.value)}
            InputProps={{ inputProps: { min: 0, max: 100 } }}
            sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption">Total:</Typography>
        <Typography variant="subtitle2" fontWeight="bold">{formatCurrency(calculateItemTotal(item))}</Typography>
      </Box>
    </Paper>
  );
};

const PaymentModal = ({ open, onClose, subtotal, itemsDiscount, globalDiscount, setGlobalDiscount, globalDiscountAmount, setGlobalDiscountAmount, total, paymentMethod, setPaymentMethod, amountReceived, setAmountReceived, change, notes, setNotes, onConfirm, isLoading, formatCurrency }) => {
  const [discountType, setDiscountType] = useState('percentage');
  const [finalPriceInput, setFinalPriceInput] = useState('');

  const calculateFinalTotal = () => {
    if (discountType === 'finalPrice' && finalPriceInput) {
      return parseFloat(finalPriceInput) || 0;
    }
    const discountAmount = (globalDiscount / 100) * (subtotal - itemsDiscount);
    return total - discountAmount;
  };

  const calculatedChange = useMemo(() => {
    if (paymentMethod !== 'Efectivo' || !amountReceived) return 0;
    const received = parseFloat(amountReceived) || 0;
    const finalTotal = calculateFinalTotal();
    return received - finalTotal;
  }, [amountReceived, paymentMethod, finalPriceInput, discountType, globalDiscount, subtotal, itemsDiscount, total]);

  const handleFinalPriceChange = (value) => {
    setFinalPriceInput(value);
    const targetPrice = parseFloat(value) || 0;
    const currentTotal = subtotal - itemsDiscount;
    if (targetPrice < currentTotal && targetPrice >= 0) {
      const discountAmount = currentTotal - targetPrice;
      const discountPercentage = (discountAmount / currentTotal) * 100;
      setGlobalDiscountAmount(discountAmount);
      setGlobalDiscount(discountPercentage);
    } else {
      setGlobalDiscount(0);
      setGlobalDiscountAmount(0);
    }
  };

  const handlePercentageChange = (value) => {
    setGlobalDiscount(value);
    setFinalPriceInput('');
    const currentTotal = subtotal - itemsDiscount;
    setGlobalDiscountAmount((value / 100) * currentTotal);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Completar Venta</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Subtotal:</Typography>
                <Typography>{formatCurrency(subtotal)}</Typography>
              </Box>
              {itemsDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Descuento ítems:</Typography>
                  <Typography color="error">-{formatCurrency(itemsDiscount)}</Typography>
                </Box>
              )}

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Descuento Adicional</Typography>
              <ToggleButtonGroup
                value={discountType}
                exclusive
                onChange={(e, val) => val && setDiscountType(val)}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              >
                <ToggleButton value="percentage">Porcentaje</ToggleButton>
                <ToggleButton value="finalPrice">Precio Final</ToggleButton>
              </ToggleButtonGroup>

              {discountType === 'percentage' ? (
                <TextField
                  fullWidth
                  label="Porcentaje %"
                  type="number"
                  value={globalDiscount || ''}
                  onChange={(e) => handlePercentageChange(parseFloat(e.target.value) || 0)}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Precio Final"
                  type="number"
                  value={finalPriceInput}
                  onChange={(e) => handleFinalPriceChange(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              )}
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'center' }}>
              <Typography variant="caption">Total a Pagar</Typography>
              <Typography variant="h4" fontWeight="bold">{formatCurrency(calculateFinalTotal())}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Método de Pago</Typography>
            <ToggleButtonGroup
              value={paymentMethod}
              exclusive
              onChange={(e, val) => val && setPaymentMethod(val)}
              fullWidth
              sx={{ mb: 3 }}
            >
              <ToggleButton value="Efectivo"><Banknote size={18} style={{ marginRight: 8 }} /> Efectivo</ToggleButton>
              <ToggleButton value="Tarjeta"><CreditCard size={18} style={{ marginRight: 8 }} /> Tarjeta</ToggleButton>
              <ToggleButton value="Transferencia"><ArrowRightLeft size={18} style={{ marginRight: 8 }} /> Transf.</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              fullWidth
              label="Notas de la Venta"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 3 }}
            />

            {paymentMethod === 'Efectivo' && (
              <Box>
                <TextField
                  fullWidth
                  label="Monto Recibido"
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  sx={{ mb: 2 }}
                />
                {amountReceived && (
                  <Alert severity={calculatedChange >= 0 ? "success" : "error"}>
                    Cambio: <strong>{formatCurrency(calculatedChange)}</strong>
                  </Alert>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isLoading || (paymentMethod === 'Efectivo' && calculatedChange < 0)}
          startIcon={isLoading ? <CircularProgress size={20} /> : <Check />}
        >
          Confirmar Venta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CustomerModal = ({ open, onClose, onSelect }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ fullName: '', cedula: '', phone: '', email: '', address: '' });

  useEffect(() => {
    if (open) fetchCustomers();
  }, [open, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await getCustomers({ search: searchTerm, limit: 20 });
      setCustomers(response?.data?.customers || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      setIsLoading(true);
      const response = await createCustomerAPI(newCustomer);
      toast.success('Cliente creado');
      onSelect(response.data);
    } catch (error) {
      toast.error('Error al crear cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{showNewCustomer ? 'Nuevo Cliente' : 'Seleccionar Cliente'}</DialogTitle>
      <DialogContent dividers>
        {!showNewCustomer ? (
          <>
            <TextField
              fullWidth
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {customers.map((customer) => (
                <ListItem button key={customer._id} onClick={() => onSelect(customer)}>
                  <ListItemText
                    primary={customer.fullName}
                    secondary={`${customer.cedula || ''} • ${customer.phone || ''}`}
                  />
                </ListItem>
              ))}
              {customers.length === 0 && !isLoading && (
                <Typography align="center" color="text.secondary" sx={{ py: 2 }}>No se encontraron clientes</Typography>
              )}
            </List>
            <Button fullWidth startIcon={<Plus />} onClick={() => setShowNewCustomer(true)} sx={{ mt: 1 }}>
              Crear Nuevo Cliente
            </Button>
          </>
        ) : (
          <Stack spacing={2}>
            <TextField label="Nombre Completo" fullWidth value={newCustomer.fullName} onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })} />
            <TextField label="Cédula" fullWidth value={newCustomer.cedula} onChange={(e) => setNewCustomer({ ...newCustomer, cedula: e.target.value })} />
            <TextField label="Teléfono" fullWidth value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
            <TextField label="Email" fullWidth value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
            <TextField label="Dirección" fullWidth multiline rows={2} value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setShowNewCustomer(false)}>Cancelar</Button>
              <Button fullWidth variant="contained" onClick={handleCreateCustomer} disabled={isLoading}>Crear</Button>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PrintConfirmationModal = ({ open, onClose, sale, onPrint, formatCurrency }) => {
  if (!sale) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Box sx={{ bgcolor: 'success.light', color: 'success.dark', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <Check size={32} />
        </Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom>¡Venta Completada!</Typography>
        <Typography color="text.secondary">Factura: {sale.invoiceNumber}</Typography>
        <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ my: 2 }}>
          {formatCurrency(sale.total)}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>¿Desea imprimir la factura?</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={onClose}>No Imprimir</Button>
          <Button fullWidth variant="contained" startIcon={<Printer />} onClick={onPrint}>Imprimir</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Billing;
