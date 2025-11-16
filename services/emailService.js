/**
 * EMAIL SERVICE - Servicio de envío de correos electrónicos
 * 
 * Lee la configuración SMTP desde la base de datos (Settings)
 * y la usa para enviar emails desde la cuenta de la empresa.
 * 
 * Funcionalidades:
 * - Órdenes de compra a proveedores con PDF adjunto
 * - Notificaciones a clientes
 * - Reportes automáticos
 */

import { createTransport } from 'nodemailer';
import PDFDocument from 'pdfkit';
import Settings from '../models/Settings.js';

/**
 * Crear transportador de email dinámico
 * Lee la configuración SMTP desde la base de datos
 * 
 * @returns {Promise<{transporter: Object, settings: Object}>}
 * @throws {Error} Si no hay configuración SMTP
 */
const getEmailTransporter = async () => {
  // Obtener configuración de la empresa (incluye password con select: false)
  const settings = await Settings.findOne().select('+smtp.password');
  
  // Validar que existe configuración
  if (!settings) {
    throw new Error('❌ Configuración del sistema no encontrada. Debe configurar los datos del negocio primero.');
  }
  
  if (settings.smtp?.enabled === false) {
    throw new Error('El envío de correos está desactivado desde Configuración > Email (SMTP).');
  }

  // Validar que existe configuración SMTP completa
  if (!settings.smtp?.user) {
    throw new Error('❌ No se ha configurado el correo electrónico SMTP. Vaya a Configuración > Negocio y configure el Email/SMTP.');
  }
  
  if (!settings.smtp?.password) {
    throw new Error('❌ No se ha configurado la contraseña del correo SMTP. Vaya a Configuración > Negocio y configure la contraseña de aplicación.');
  }
  
  if (!settings.smtp?.host) {
    throw new Error('❌ No se ha configurado el servidor SMTP. Vaya a Configuración > Negocio y configure el host SMTP (ej: smtp.gmail.com).');
  }
  
  // Crear transporter con configuración dinámica desde la BD
  const transporter = createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: settings.smtp.secure, // true para 465 (SSL), false para 587 (TLS)
    auth: {
      user: settings.smtp.user,
      pass: settings.smtp.password
    },
    tls: {
      rejectUnauthorized: false // Permitir certificados autofirmados
    }
  });
  
  return { transporter, settings };
};

/**
 * Generar PDF de orden de compra
 * @param {Object} purchaseOrder - Orden de compra
 * @param {Object} supplier - Datos del proveedor
 * @param {Object} settings - Configuración del negocio
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
const generatePurchaseOrderPDF = (purchaseOrder, supplier, settings) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const chunks = [];

      // Capturar el PDF en memoria
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header con información del negocio
      doc.fontSize(20).font('Helvetica-Bold').text(settings.businessName || 'AutoParts Manager', { align: 'center' });
      doc.fontSize(10).font('Helvetica').moveDown(0.5);
      
      if (settings.businessAddress) {
        doc.text(settings.businessAddress, { align: 'center' });
      }
      if (settings.businessPhone) {
        doc.text(`Tel: ${settings.businessPhone}`, { align: 'center' });
      }
      if (settings.businessEmail) {
        doc.text(`Email: ${settings.businessEmail}`, { align: 'center' });
      }

      doc.moveDown(1);
      doc.fontSize(16).font('Helvetica-Bold').text('ORDEN DE COMPRA', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`#${purchaseOrder.orderNumber}`, { align: 'center' });
      doc.moveDown(1);

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(1);

      // Información del proveedor (columna izquierda) y fecha (columna derecha)
      const startY = doc.y;
      
      // Proveedor
      doc.fontSize(10).font('Helvetica-Bold').text('PROVEEDOR:', 50, startY);
      doc.font('Helvetica').fontSize(10);
      doc.text(supplier.name, 50, doc.y);
      if (supplier.address) doc.text(supplier.address, 50, doc.y);
      if (supplier.phone) doc.text(`Tel: ${supplier.phone}`, 50, doc.y);
      if (supplier.email) doc.text(`Email: ${supplier.email}`, 50, doc.y);

      // Fecha esperada (derecha)
      const expectedDate = new Date(purchaseOrder.expectedDate).toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(10).font('Helvetica-Bold').text('FECHA ESPERADA:', 350, startY);
      doc.font('Helvetica').text(expectedDate, 350, doc.y);
      
      const createdDate = new Date(purchaseOrder.createdAt).toLocaleDateString('es-DO');
      doc.font('Helvetica-Bold').text('FECHA EMISIÓN:', 350, doc.y + 10);
      doc.font('Helvetica').text(createdDate, 350, doc.y);

      doc.moveDown(2);

      // Notas (si existen)
      if (purchaseOrder.notes) {
        doc.fontSize(9).font('Helvetica-Bold').text('NOTAS:', 50, doc.y);
        doc.font('Helvetica').fontSize(9).text(purchaseOrder.notes, 50, doc.y, { width: 500 });
        doc.moveDown(1);
      }

      // Tabla de productos
      const tableTop = doc.y + 10;
      const itemHeight = 25;

      // Headers de la tabla
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('#', 50, tableTop);
      doc.text('Producto', 80, tableTop);
      doc.text('Cantidad', 320, tableTop, { width: 70, align: 'center' });
      doc.text('Precio Unit.', 400, tableTop, { width: 80, align: 'right' });
      doc.text('Total', 490, tableTop, { width: 72, align: 'right' });

      // Línea debajo del header
      doc.moveTo(50, tableTop + 15).lineTo(562, tableTop + 15).stroke();

      // Items
      doc.font('Helvetica').fontSize(9);
      let currentY = tableTop + 20;

      purchaseOrder.items.forEach((item, index) => {
        // Si no cabe en la página, crear nueva página
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.text((index + 1).toString(), 50, currentY);
        doc.text(item.productName || 'Producto', 80, currentY, { width: 230 });
        doc.text(item.quantity.toString(), 320, currentY, { width: 70, align: 'center' });
        doc.text(`$${item.unitCost.toFixed(2)}`, 400, currentY, { width: 80, align: 'right' });
        doc.text(`$${item.total.toFixed(2)}`, 490, currentY, { width: 72, align: 'right' });

        currentY += itemHeight;
      });

      // Línea antes del total
      doc.moveTo(50, currentY + 5).lineTo(562, currentY + 5).stroke();
      currentY += 15;

      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 400, currentY, { width: 80, align: 'right' });
      doc.text(`$${purchaseOrder.totalAmount.toFixed(2)}`, 490, currentY, { width: 72, align: 'right' });

      // Footer
      doc.fontSize(8).font('Helvetica').text(
        'Por favor confirme la disponibilidad y fecha de entrega de los productos solicitados.',
        50,
        doc.page.height - 100,
        { align: 'center', width: 512 }
      );

      doc.fontSize(7).text(
        `Documento generado automáticamente por ${settings.businessName || 'AutoParts Manager'}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: 512 }
      );

      // Finalizar PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Enviar orden de compra por email al proveedor (con PDF adjunto)
 * @param {Object} purchaseOrder - Orden de compra con items
 * @param {Object} supplier - Datos del proveedor
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendPurchaseOrderEmail = async (purchaseOrder, supplier) => {
  try {
    // Validar que el proveedor tenga email
    if (!supplier.email) {
      throw new Error('El proveedor no tiene email configurado');
    }

    // Crear transporter con configuración dinámica de la BD
    const { transporter, settings } = await getEmailTransporter();

  // Generar tabla HTML de items
  const itemsRows = purchaseOrder.items
    .map((item, index) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.productName || 'Producto'}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">$${item.unitCost.toFixed(2)}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${item.total.toFixed(2)}</td>
      </tr>
    `)
    .join('');

  // Formatear fecha esperada
  const expectedDate = new Date(purchaseOrder.expectedDate).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Contenido HTML del email
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Orden de Compra</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Orden de Compra</h1>
          <p style="margin: 10px 0 0 0; font-size: 20px; opacity: 0.9;">#${purchaseOrder.orderNumber}</p>
        </div>

        <!-- Información del negocio y proveedor -->
        <div style="padding: 30px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            
            <!-- De -->
            <div>
              <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">De:</h3>
              <p style="margin: 5px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${settings.businessName || 'Mi Negocio'}</p>
              ${settings.businessAddress ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${settings.businessAddress}</p>` : ''}
              ${settings.businessPhone ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Tel: ${settings.businessPhone}</p>` : ''}
              ${settings.businessEmail ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Email: ${settings.businessEmail}</p>` : ''}
            </div>

            <!-- Para -->
            <div>
              <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Para:</h3>
              <p style="margin: 5px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${supplier.name}</p>
              ${supplier.address ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${supplier.address}</p>` : ''}
              ${supplier.phone ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Tel: ${supplier.phone}</p>` : ''}
              <p style="margin: 5px 0; color: #3b82f6; font-size: 14px;">${supplier.email}</p>
            </div>
          </div>

          <!-- Mensaje -->
          <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px;">
            <p style="margin: 0; color: #374151; line-height: 1.6;">
              Estimado/a proveedor <strong>${supplier.name}</strong>,<br><br>
              Por medio de la presente le enviamos la siguiente orden de compra. Por favor confirme la disponibilidad 
              y fecha de entrega de los productos solicitados.<br><br>
              <strong>📎 Adjuntamos el PDF de la orden completa para su referencia.</strong>
            </p>
          </div>

          <!-- Tabla de productos -->
          <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px;">Productos Solicitados</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px 10px; border: 1px solid #e5e7eb; text-align: center; color: #374151; font-weight: 600;">#</th>
                <th style="padding: 12px 10px; border: 1px solid #e5e7eb; text-align: left; color: #374151; font-weight: 600;">Producto</th>
                <th style="padding: 12px 10px; border: 1px solid #e5e7eb; text-align: center; color: #374151; font-weight: 600;">Cantidad</th>
                <th style="padding: 12px 10px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-weight: 600;">Precio Unit.</th>
                <th style="padding: 12px 10px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="padding: 15px 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-size: 16px; color: #374151;">
                  TOTAL:
                </td>
                <td style="padding: 15px 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: 700; font-size: 18px; color: #3b82f6;">
                  $${purchaseOrder.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- Detalles adicionales -->
          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">📅 Fecha Esperada de Entrega</h4>
            <p style="margin: 0; color: #78350f; font-size: 18px; font-weight: 600;">${expectedDate}</p>
          </div>

          ${purchaseOrder.notes ? `
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 16px;">📝 Notas Adicionales</h4>
            <p style="margin: 0; color: #6b7280; line-height: 1.6;">${purchaseOrder.notes}</p>
          </div>
          ` : ''}

          <!-- Instrucciones -->
          <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
            <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">Por favor confirme:</p>
            <ul style="margin: 0; padding-left: 20px; color: #6b7280; line-height: 1.8;">
              <li>Disponibilidad de todos los productos</li>
              <li>Fecha de entrega estimada</li>
              <li>Precio total final</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
            Gracias por su atención y servicio
          </p>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            Este es un correo automático generado por ${settings.businessName || 'AutoParts Manager'}
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

    // Determinar email del remitente
    const fromEmail = settings.smtp.fromEmail || settings.smtp.user;
    const fromName = settings.smtp.fromName || settings.businessName;

    // Generar PDF
    console.log('📄 Generando PDF de la orden...');
    const pdfBuffer = await generatePurchaseOrderPDF(purchaseOrder, supplier, settings);
    console.log('✅ PDF generado exitosamente');

    // Opciones del email con PDF adjunto
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: supplier.email,
      subject: `Orden de Compra #${purchaseOrder.orderNumber} - ${settings.businessName}`,
      html: htmlContent,
      attachments: [
        {
          filename: `Orden_Compra_${purchaseOrder.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    console.log('📧 Enviando email a:', supplier.email);
    console.log('📧 Desde:', `"${fromName}" <${fromEmail}>`);
    console.log('📧 Asunto:', mailOptions.subject);
    console.log('📎 Adjunto: Orden_Compra_' + purchaseOrder.orderNumber + '.pdf');

    // Enviar email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);

    return {
      success: true,
      messageId: info.messageId,
      recipient: supplier.email
    };
    
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    console.error('❌ Error completo:', error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }
};

/**
 * Verificar configuración SMTP
 * Prueba la conexión con el servidor SMTP usando la configuración actual
 * 
 * @returns {Promise<Object>} Resultado de la verificación
 */
export const verifySmtpConfig = async () => {
  try {
    const { transporter } = await getEmailTransporter();
    await transporter.verify();
    return { 
      success: true, 
      message: '✅ Configuración SMTP válida. Conexión exitosa.' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `❌ Error de conexión: ${error.message}` 
    };
  }
};

export default {
  sendPurchaseOrderEmail,
  verifySmtpConfig
};
