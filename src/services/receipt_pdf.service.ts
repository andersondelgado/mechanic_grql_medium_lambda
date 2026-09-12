import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ReceiptPdfData {
  receipt_number?: string;
  entry_date: string;
  exit_date?: string;
  owner_name?: string;
  owner_tax_id?: string;
  phone?: string;
  address?: string;
  license_plate: string;
  brand: string;
  model: string;
  color?: string;
  mileage?: string;
  fuel_level?: string;
  reason_for_entry?: string;
  observations?: string;
  received_by?: string;
  delivered_by?: string;
  assigned_technician?: string;
  authorized_services?: string;
  client_signature?: string;
  mechanic_signature?: string;
  checklist_external?: Array<{ name: string; status: string; notes?: string }>;
  checklist_internal?: Array<{ name: string; status: string; notes?: string }>;
  damage_points?: Array<{ view: string; type: string; notes?: string }>;
}

export class ReceiptPdfService {
  /**
   * Genera el documento PDF oficial de recepción de vehículo (2 páginas)
   * basado en el formato reporte de entrada de vehiculo 222444.pdf
   */
  static async generateReceiptPdf(data: ReceiptPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // ─── PÁGINA 1: Identificación, Custodia, Combustible y Daños ─────────
    const page1 = pdfDoc.addPage([612, 792]); // Standard Letter
    const { width, height } = page1.getSize();

    // Encabezado
    page1.drawRectangle({
      x: 30,
      y: height - 85,
      width: width - 60,
      height: 60,
      color: rgb(0.08, 0.12, 0.18),
    });

    page1.drawText('TALLER INTEGRALE$ 360 GARAGE C.A.', {
      x: 45,
      y: height - 50,
      size: 14,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    page1.drawText('REPORTE Y CONTROL DE RECEPCIÓN DE VEHÍCULO', {
      x: 45,
      y: height - 68,
      size: 9,
      font: helvetica,
      color: rgb(0.7, 0.8, 0.9),
    });

    const receiptNum = data.receipt_number || `REC-${data.license_plate}`;
    page1.drawText(`N° ${receiptNum}`, {
      x: width - 180,
      y: height - 50,
      size: 12,
      font: helveticaBold,
      color: rgb(0.9, 0.75, 0.2),
    });

    page1.drawText(`Fecha Entrada: ${data.entry_date}`, {
      x: width - 180,
      y: height - 66,
      size: 8,
      font: helvetica,
      color: rgb(1, 1, 1),
    });

    // Subtítulo
    page1.drawRectangle({
      x: 30,
      y: height - 105,
      width: width - 60,
      height: 16,
      color: rgb(0.93, 0.94, 0.96),
    });
    page1.drawText('DATOS GENERALES DE ENTRADA Y CUSTODIA', {
      x: 45,
      y: height - 101,
      size: 8,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Bloque Cliente (Izquierda)
    page1.drawRectangle({
      x: 30,
      y: height - 200,
      width: (width - 70) / 2,
      height: 90,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    page1.drawText('DATOS DEL PROPIETARIO / CLIENTE', {
      x: 38,
      y: height - 120,
      size: 8,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page1.drawText(`Nombre: ${data.owner_name || '-'}`, { x: 38, y: height - 138, size: 8, font: helvetica });
    page1.drawText(`C.I. / RIF: ${data.owner_tax_id || '-'}`, { x: 38, y: height - 152, size: 8, font: helvetica });
    page1.drawText(`Teléfono: ${data.phone || '-'}`, { x: 38, y: height - 166, size: 8, font: helvetica });
    page1.drawText(`Dirección: ${data.address || '-'}`, { x: 38, y: height - 180, size: 8, font: helvetica });

    // Bloque Vehículo (Derecha)
    page1.drawRectangle({
      x: 35 + (width - 70) / 2,
      y: height - 200,
      width: (width - 70) / 2,
      height: 90,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    page1.drawText('DATOS DEL VEHÍCULO', {
      x: 43 + (width - 70) / 2,
      y: height - 120,
      size: 8,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page1.drawText(`Placa: ${data.license_plate}`, { x: 43 + (width - 70) / 2, y: height - 138, size: 9, font: helveticaBold, color: rgb(0.1, 0.3, 0.8) });
    page1.drawText(`Marca / Modelo: ${data.brand} ${data.model}`, { x: 43 + (width - 70) / 2, y: height - 152, size: 8, font: helvetica });
    page1.drawText(`Color: ${data.color || '-'}`, { x: 43 + (width - 70) / 2, y: height - 166, size: 8, font: helvetica });
    page1.drawText(`Kilometraje: ${data.mileage ? `${data.mileage} km` : '-'}`, { x: 43 + (width - 70) / 2, y: height - 180, size: 8, font: helvetica });

    // Bloque Custodia
    page1.drawRectangle({
      x: 30,
      y: height - 250,
      width: width - 60,
      height: 42,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    page1.drawText(`Recibido por: ${data.received_by || '-'}`, { x: 38, y: height - 225, size: 8, font: helvetica });
    page1.drawText(`Entregado por: ${data.delivered_by || data.owner_name || '-'}`, { x: 220, y: height - 225, size: 8, font: helvetica });
    page1.drawText(`Técnico Asignado: ${data.assigned_technician || '-'}`, { x: 400, y: height - 225, size: 8, font: helvetica });

    // Nivel de Combustible y Motivo de Entrada
    page1.drawRectangle({
      x: 30,
      y: height - 330,
      width: 170,
      height: 70,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    page1.drawText('NIVEL DE COMBUSTIBLE', { x: 38, y: height - 275, size: 8, font: helveticaBold });
    page1.drawText(`Tanque: ${data.fuel_level || '1/2'}`, { x: 38, y: height - 300, size: 10, font: helveticaBold, color: rgb(0.1, 0.4, 0.7) });

    page1.drawRectangle({
      x: 210,
      y: height - 330,
      width: width - 240,
      height: 70,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    page1.drawText('MOTIVO DE INGRESO / FALLAS REPORTADAS', { x: 218, y: height - 275, size: 8, font: helveticaBold });
    const reasonText = (data.reason_for_entry || data.observations || 'Revisión regular en taller.').substring(0, 180);
    page1.drawText(reasonText, { x: 218, y: height - 295, size: 8, font: helvetica, maxWidth: width - 260 });

    // Diagrama y Registro de Daños
    page1.drawRectangle({
      x: 30,
      y: height - 480,
      width: width - 60,
      height: 140,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    const dmgs = data.damage_points || [];
    page1.drawText(`REGISTRO VISUAL DE DAÑOS EN CARROCERÍA (${dmgs.length} marcas)`, {
      x: 38,
      y: height - 355,
      size: 8,
      font: helveticaBold,
    });

    if (dmgs.length === 0) {
      page1.drawText('No se observaron averías ni daños visibles en la carrocería al momento de la recepción.', {
        x: 38,
        y: height - 380,
        size: 8,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else {
      let dy = height - 375;
      for (let i = 0; i < Math.min(dmgs.length, 6); i++) {
        const d = dmgs[i];
        page1.drawText(`• [${d.type.toUpperCase()}] Vista: ${d.view} - Detalle: ${d.notes || 'Avería observada'}`, {
          x: 38,
          y: dy,
          size: 7.5,
          font: helvetica,
        });
        dy -= 14;
      }
    }

    // Decodificar e incrustar firmas digitales en base64
    const embedSignatureImage = async (base64Str?: string) => {
      if (!base64Str || typeof base64Str !== 'string') return null;
      let clean = base64Str.trim();
      if (clean.includes('base64,')) {
        clean = clean.split('base64,')[1];
      } else if (clean.includes(',')) {
        clean = clean.split(',')[1];
      }
      clean = clean.replace(/\s+/g, '');
      if (!clean) return null;

      let imageBytes: Uint8Array;
      if (typeof Buffer !== 'undefined') {
        imageBytes = Buffer.from(clean, 'base64');
      } else {
        try {
          const binary = atob(clean);
          imageBytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            imageBytes[i] = binary.charCodeAt(i);
          }
        } catch {
          return null;
        }
      }

      if (!imageBytes || imageBytes.length === 0) return null;

      try {
        return await pdfDoc.embedPng(imageBytes);
      } catch (errPng) {
        try {
          return await pdfDoc.embedJpg(imageBytes);
        } catch (errJpg) {
          console.warn('No se pudo procesar la firma como PNG o JPG:', errPng, errJpg);
          return null;
        }
      }
    };

    const clientSigRaw = data.client_signature || (data as any).signature_client || (data as any).firma_cliente;
    const mechanicSigRaw = data.mechanic_signature || (data as any).signature_mechanic || (data as any).firma_mecanico || (data as any).firma_tecnico;

    const [clientSigImg, mechanicSigImg] = await Promise.all([
      embedSignatureImage(clientSigRaw),
      embedSignatureImage(mechanicSigRaw),
    ]);

    // Firmas Digitales
    page1.drawRectangle({ x: 30, y: 70, width: 260, height: 90, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page1.drawText('FIRMA DEL CLIENTE / PROPIETARIO', { x: 40, y: 145, size: 8, font: helveticaBold });

    if (clientSigImg) {
      const maxW = 210;
      const maxH = 44;
      const scale = Math.min(maxW / clientSigImg.width, maxH / clientSigImg.height, 1);
      const w = clientSigImg.width * scale;
      const h = clientSigImg.height * scale;
      const x = 30 + (260 - w) / 2;
      const y = 96 + (46 - h) / 2;
      page1.drawImage(clientSigImg, { x, y, width: w, height: h });
    }

    page1.drawLine({ start: { x: 45, y: 95 }, end: { x: 275, y: 95 }, color: rgb(0.7, 0.7, 0.7), thickness: 1 });
    page1.drawText(data.owner_name || 'Cliente', { x: 45, y: 82, size: 8, font: helvetica });

    page1.drawRectangle({ x: 320, y: 70, width: 262, height: 90, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page1.drawText('FIRMA DEL TÉCNICO RECEPTOR', { x: 330, y: 145, size: 8, font: helveticaBold });

    if (mechanicSigImg) {
      const maxW = 210;
      const maxH = 44;
      const scale = Math.min(maxW / mechanicSigImg.width, maxH / mechanicSigImg.height, 1);
      const w = mechanicSigImg.width * scale;
      const h = mechanicSigImg.height * scale;
      const x = 320 + (262 - w) / 2;
      const y = 96 + (46 - h) / 2;
      page1.drawImage(mechanicSigImg, { x, y, width: w, height: h });
    }

    page1.drawLine({ start: { x: 335, y: 95 }, end: { x: 565, y: 95 }, color: rgb(0.7, 0.7, 0.7), thickness: 1 });
    page1.drawText(data.received_by || data.assigned_technician || 'Taller Integrale$ 360 Garage C.A.', { x: 335, y: 82, size: 8, font: helvetica });

    page1.drawText('Página 1 de 2 • Taller Integrale$ 360 Garage C.A.', { x: width - 240, y: 40, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

    // ─── PÁGINA 2: Inventario 77 Puntos y Servicios Autorizados ──────────
    const page2 = pdfDoc.addPage([612, 792]);
    
    page2.drawRectangle({
      x: 30,
      y: height - 55,
      width: width - 60,
      height: 30,
      color: rgb(0.08, 0.12, 0.18),
    });
    page2.drawText('INVENTARIO DE COMPONENTES Y ESTADO FÍSICO (77 PUNTOS)', {
      x: 45,
      y: height - 42,
      size: 10,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    const extItems = data.checklist_external || [];
    const intItems = data.checklist_internal || [];

    // Columna Externa
    page2.drawRectangle({ x: 30, y: 220, width: 265, height: height - 290, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page2.drawText('REVISIÓN EXTERNA (CARROCERÍA / RUEDAS)', { x: 38, y: height - 75, size: 7.5, font: helveticaBold });
    let extY = height - 90;
    for (let i = 0; i < Math.min(extItems.length, 36); i++) {
      const it = extItems[i];
      const st = (it.status || 'OK').toUpperCase();
      page2.drawText(`${it.name.substring(0, 32)}: [${st}]`, { x: 38, y: extY, size: 6.5, font: helvetica });
      extY -= 12.5;
    }

    // Columna Interna
    page2.drawRectangle({ x: 315, y: 220, width: 267, height: height - 290, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page2.drawText('REVISIÓN INTERNA (HABITÁCULO / MANDOS)', { x: 323, y: height - 75, size: 7.5, font: helveticaBold });
    let intY = height - 90;
    for (let i = 0; i < Math.min(intItems.length, 36); i++) {
      const it = intItems[i];
      const st = (it.status || 'OK').toUpperCase();
      page2.drawText(`${it.name.substring(0, 32)}: [${st}]`, { x: 323, y: intY, size: 6.5, font: helvetica });
      intY -= 12.5;
    }

    // Servicios Autorizados
    page2.drawRectangle({ x: 30, y: 100, width: width - 60, height: 105, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page2.drawText('SERVICIOS Y REPARACIONES APROBADAS A REALIZAR', { x: 40, y: 190, size: 8, font: helveticaBold });
    const authText = (data.authorized_services || 'Inspección diagnóstica inicial autorizada.').substring(0, 300);
    page2.drawText(authText, { x: 40, y: 172, size: 8, font: helvetica, maxWidth: width - 80 });

    page2.drawText('CLÁUSULA LEGAL: El cliente autoriza los trabajos indicados y las pruebas de manejo correspondientes.', {
      x: 40,
      y: 115,
      size: 6.5,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });

    page2.drawText('Página 2 de 2 • Taller Integrale$ 360 Garage C.A.', { x: width - 240, y: 40, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

    return await pdfDoc.save();
  }
}
