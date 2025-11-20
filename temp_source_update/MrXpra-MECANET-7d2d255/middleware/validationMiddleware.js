/**
 * @file validationMiddleware.js
 * @description Middleware de validación de datos usando express-validator
 * 
 * Exports:
 * - validate: Middleware que verifica errores de validación
 * - productValidation: Reglas de validación para productos
 * - userValidation: Reglas de validación para usuarios
 * - customerValidation: Reglas de validación para clientes
 * - saleValidation: Reglas de validación para ventas
 * 
 * Uso:
 * router.post('/', protect, productValidation, validate, createProduct);
 * 
 * Primero se ejecutan las reglas (productValidation), luego validate verifica errores.
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware para verificar errores de validación
 * @description Verifica si hay errores de express-validator y retorna 400 si los hay
 * @returns {Object} JSON con errores de validación si los hay
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Errores de validación',
      errors: errors.array() 
    });
  }
  
  next();
};

// Validaciones para productos
export const productValidation = [
  body('sku').trim().notEmpty().withMessage('El SKU es requerido'),
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('El precio de compra debe ser mayor o igual a 0'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('El precio de venta debe ser mayor o igual a 0'),
  body('stock').isInt({ min: 0 }).withMessage('El stock debe ser mayor o igual a 0')
];

// Validaciones para usuarios
export const userValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role').isIn(['admin', 'cajero']).withMessage('Rol inválido')
];

// Validaciones para clientes
export const customerValidation = [
  body('fullName').trim().notEmpty().withMessage('El nombre completo es requerido'),
  body('cedula').trim().notEmpty().withMessage('La cédula es requerida'),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Email inválido'),
  body('address').optional({ checkFalsy: true }).trim()
];

// Validaciones para ventas
export const saleValidation = [
  body('items').isArray({ min: 1 }).withMessage('Debe haber al menos un producto'),
  body('items.*.product').notEmpty().withMessage('ID de producto requerido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
  body('paymentMethod').isIn(['Efectivo', 'Tarjeta', 'Transferencia']).withMessage('Método de pago inválido')
];
