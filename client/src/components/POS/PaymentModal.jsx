import React, { useState, useEffect } from 'react';
import { X, User, Plus, Banknote, CreditCard, Building2, FileText, Printer, Search } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, onConfirm }) => {
  const { items, total: cartTotal } = useCartStore();
  
  // Estados del formulario
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, card, transfer, credit
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percent'); // percent, amount
  const [note, setNote] = useState('');
  const [receiptType, setReceiptType] = useState('ticket'); // ticket, invoice
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  // --- LÓGICA DE CÁLCULO CORREGIDA ---
  
  // 1. Calcular el valor del descuento
  const discountValue = discountType === 'percent' 
    ? (cartTotal * (parseFloat(discount) || 0)) / 100 
    : (parseFloat(discount) || 0);

  // 2. Calcular el Total Final a Pagar
  const finalTotal = Math.max(0, cartTotal - discountValue);

  // 3. Calcular el Cambio/Vuelto (Reactivo al total final)
  const change = (parseFloat(amountPaid) || 0) - finalTotal;

  // Efecto para pre-llenar el monto a pagar con el total si es tarjeta/transferencia
  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setAmountPaid(finalTotal.toFixed(2));
    }
  }, [paymentMethod, finalTotal]);

  const handleConfirm = () => {
    if (paymentMethod === 'cash' && (parseFloat(amountPaid) || 0) < finalTotal) {
      toast.error('El monto pagado es insuficiente');
      return;
    }

    const saleData = {
      items,
      subtotal: cartTotal,
      discount: discountValue,
      total: finalTotal,
      paymentMethod,
      amountPaid: parseFloat(amountPaid) || 0,
      change: Math.max(0, change),
      client: selectedClient || { name: 'Consumidor Final' },
      note,
      receiptType
    };

    onConfirm(saleData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Contenedor Principal con estilo Glass */}
      <div className="bg-[#1a1f37] w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700/50 bg-[#13172a]">
          <h2 className="text-xl font-semibold text-white">Completar Venta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body - Grid Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* A. Selección de Cliente */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">A. Selección de Cliente</label>
                <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Plus size={14} /> Crear Nuevo
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-500 group-focus-within:text-blue-500" />
                </div>
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Buscar Cliente..."
                  className="w-full bg-[#0f1222] border border-gray-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full pl-10 p-3 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <User size={18} className="text-gray-500" />
                </div>
              </div>
              {/* Lista simulada de clientes (opcional) */}
              {!selectedClient && clientSearch && (
                <div className="bg-[#0f1222] border border-gray-700 rounded-lg mt-1 overflow-hidden">
                  <div className="p-2 hover:bg-blue-500/20 cursor-pointer text-sm text-gray-300 flex items-center gap-2" onClick={() => { setSelectedClient({name: 'Juan Pérez'}); setClientSearch('Juan Pérez'); }}>
                    <User size={14} /> Juan Pérez
                  </div>
                  <div className="p-2 hover:bg-blue-500/20 cursor-pointer text-sm text-gray-300 flex items-center gap-2" onClick={() => { setSelectedClient({name: 'Consumidor Final'}); setClientSearch('Consumidor Final'); }}>
                    <User size={14} /> Consumidor Final
                  </div>
                </div>
              )}
            </div>

            {/* C. Método de Pago */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">C. Método de Pago</label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 'cash', label: 'Efectivo', icon: Banknote },
                  { id: 'card', label: 'Tarjeta', icon: CreditCard },
                  { id: 'transfer', label: 'Transf.', icon: Building2 },
                  { id: 'credit', label: 'Crédito', icon: FileText },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      paymentMethod === method.id
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-[#0f1222] border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-[#151a30]'
                    }`}
                  >
                    <method.icon size={24} className="mb-2" />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* D. Detalles del Pago */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">D. Detalles del Pago</label>
              <div className="bg-[#0f1222] p-4 rounded-xl border border-gray-700 grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Paga con:</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-[#1a1f37] border border-blue-500/50 rounded-lg py-2 pl-7 pr-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cambio/Vuelto:</label>
                  <div className={`text-xl font-bold py-1 ${change < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    $ {change >= 0 ? change.toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA (5 cols) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            
            {/* B. Resumen Económico */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">B. Resumen Económico</label>
              <div className="bg-[#0f1222] rounded-xl border border-gray-700 p-6 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-gray-400 text-sm mb-1">Total a Pagar:</p>
                <h3 className="text-4xl font-bold text-yellow-400 tracking-tight">
                  $ {finalTotal.toFixed(2)}
                </h3>
                <p className="text-xs text-gray-500 mt-2">{items.length} artículos</p>
                
                {discountValue > 0 && (
                  <div className="mt-3 text-xs text-green-400 bg-green-400/10 py-1 px-2 rounded-full inline-block">
                    Ahorras: $ {discountValue.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* E. Opciones Adicionales */}
            <div className="space-y-4 flex-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">E. Opciones Adicionales</label>
              
              {/* Descuento */}
              <div className="bg-[#0f1222] p-3 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Descuento Global:</span>
                  <div className="flex bg-[#1a1f37] rounded p-0.5">
                    <button 
                      onClick={() => setDiscountType('percent')}
                      className={`px-2 py-0.5 text-xs rounded ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                    >%</button>
                    <button 
                      onClick={() => setDiscountType('amount')}
                      className={`px-2 py-0.5 text-xs rounded ${discountType === 'amount' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                    >$</button>
                  </div>
                </div>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full bg-[#1a1f37] border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                  placeholder={discountType === 'percent' ? "0%" : "0.00"}
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notas/Observaciones</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#0f1222] border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none resize-none h-20"
                  placeholder="Escribe una nota..."
                />
              </div>

              {/* Tipo de Comprobante */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo de Comprobante</label>
                <select
                  value={receiptType}
                  onChange={(e) => setReceiptType(e.target.value)}
                  className="w-full bg-[#0f1222] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value="ticket">Ticket de Venta</option>
                  <option value="invoice">Factura Electrónica</option>
                  <option value="note">Nota de Entrega</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Footer - Acciones */}
        <div className="p-5 border-t border-gray-700/50 bg-[#13172a] flex justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium w-1/3"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 w-2/3"
          >
            <Printer size={20} />
            Confirmar / Imprimir
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;