import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Wine, PRICE_TYPE_LABELS } from '../types';
import { useCategoryStore } from '../store/categoryStore';
import { formatCurrency, formatDateShort } from './format';

export function generatePriceListPDF(wines: Wine[], categoryFilter: string | null = null): void {
  const getLabel = useCategoryStore.getState().getLabel;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  const filtered = categoryFilter ? wines.filter((w) => w.category === categoryFilter) : wines;
  const categoryLabel = categoryFilter ? getLabel(categoryFilter) : 'Todas las categorías';

  // Header
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('BDA', 15, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Bodega de Amigos', 15, 25);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTA DE PRECIOS', pageW - 15, 18, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(categoryLabel, pageW - 15, 25, { align: 'right' });
  doc.text(formatDateShort(new Date().toISOString()), pageW - 15, 31, { align: 'right' });

  // Price channel explanation
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(10, 44, pageW - 20, 16, 2, 2, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(10, 44, pageW - 20, 16, 2, 2, 'S');

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Botella Suelta: precio por botella individual  ·  Caja Entera: precio por caja completa  ·  Mercado/Rest.: precio para restaurantes y mayoristas', pageW / 2, 54, { align: 'center' });

  // Group by category if "all" selected
  if (!categoryFilter) {
    const cats = Array.from(new Set(filtered.map((w) => w.category)));
    let startY = 68;

    for (const cat of cats) {
      const catWines = filtered.filter((w) => w.category === cat);
      if (catWines.length === 0) continue;

      // Category header
      doc.setFillColor(196, 163, 90);
      doc.roundedRect(10, startY, pageW - 20, 8, 2, 2, 'F');
      doc.setTextColor(74, 28, 35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(getLabel(cat).toUpperCase(), 15, startY + 5.5);
      doc.text(`${catWines.length} vino${catWines.length !== 1 ? 's' : ''}`, pageW - 15, startY + 5.5, { align: 'right' });

      autoTable(doc, {
        startY: startY + 10,
        head: [['Código', 'Nombre', 'Bodega / Varietal', 'Cosecha', 'Botella Suelta', 'Caja Entera', 'Mercado/Rest.']],
        body: catWines.map((w) => [
          w.code,
          w.name,
          [w.winery, w.varietal].filter(Boolean).join(' · ') || '-',
          w.vintage ?? '-',
          formatCurrency(w.prices.bottle),
          formatCurrency(w.prices.case),
          formatCurrency(w.prices.market),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [114, 47, 55], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [45, 45, 45] },
        alternateRowStyles: { fillColor: [250, 246, 240] },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 48 },
          2: { cellWidth: 44 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 22, halign: 'right' },
        },
        margin: { left: 10, right: 10 },
      });

      startY = (doc as any).lastAutoTable.finalY + 8;
      if (startY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        startY = 15;
      }
    }
  } else {
    autoTable(doc, {
      startY: 68,
      head: [['Código', 'Nombre', 'Bodega / Varietal', 'Cosecha', 'Botella Suelta', 'Caja Entera', 'Mercado/Rest.']],
      body: filtered.map((w) => [
        w.code,
        w.name,
        [w.winery, w.varietal].filter(Boolean).join(' · ') || '-',
        w.vintage ?? '-',
        formatCurrency(w.prices.bottle),
        formatCurrency(w.prices.case),
        formatCurrency(w.prices.market),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [114, 47, 55], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [45, 45, 45] },
      alternateRowStyles: { fillColor: [250, 246, 240] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 48 },
        2: { cellWidth: 44 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
      },
      margin: { left: 10, right: 10 },
    });
  }

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(196, 163, 90);
    doc.setLineWidth(0.3);
    doc.line(10, footerY - 4, pageW - 10, footerY - 4);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('BDA · Bodega de Amigos — Precios en pesos argentinos (ARS)', pageW / 2, footerY, { align: 'center' });
    doc.text(`Página ${i} de ${pageCount}`, pageW - 10, footerY, { align: 'right' });
  }

  const catSuffix = categoryFilter ? `_${categoryFilter}` : '_todas';
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`BDA_ListaPrecios${catSuffix}_${date}.pdf`);
}

export function generateRemitoPDF(order: Order): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(114, 47, 55); // burgundy
  doc.rect(0, 0, pageW, 45, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('BDA', 15, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Bodega de Amigos', 15, 28);

  // REMITO label
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REMITO', pageW - 15, 20, { align: 'right' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${order.orderNumber}`, pageW - 15, 28, { align: 'right' });
  doc.text(`Fecha: ${formatDateShort(order.createdAt)}`, pageW - 15, 35, { align: 'right' });

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    draft:     [156, 163, 175],
    confirmed: [59, 130, 246],
    delivered: [34, 197, 94],
    cancelled: [239, 68, 68],
  };
  const statusLabels: Record<string, string> = {
    draft: 'BORRADOR', confirmed: 'CONFIRMADO', delivered: 'ENTREGADO', cancelled: 'CANCELADO',
  };
  const [r, g, b] = statusColors[order.status] ?? [100, 100, 100];
  doc.setFillColor(r, g, b);
  doc.roundedRect(pageW - 55, 37, 40, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabels[order.status] ?? order.status, pageW - 35, 42.5, { align: 'center' });

  // Client info box
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(10, 52, 90, 45, 3, 3, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(10, 52, 90, 45, 3, 3, 'S');

  doc.setTextColor(114, 47, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATOS DEL CLIENTE', 15, 60);

  doc.setTextColor(45, 45, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(order.client.name, 15, 68);

  doc.setFontSize(9);
  let y = 75;
  if (order.client.phone) {
    doc.text(`Tel: ${order.client.phone}`, 15, y);
    y += 6;
  }
  if (order.client.address) {
    const lines = doc.splitTextToSize(`Dir: ${order.client.address}`, 78);
    doc.text(lines, 15, y);
    y += lines.length * 5;
  }
  if (order.client.cuit) {
    doc.text(`CUIT: ${order.client.cuit}`, 15, y);
  }

  // Order info box
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(110, 52, 90, 45, 3, 3, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(110, 52, 90, 45, 3, 3, 'S');

  doc.setTextColor(114, 47, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DETALLES DEL PEDIDO', 115, 60);

  doc.setTextColor(45, 45, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Pedido N°: ${order.orderNumber}`, 115, 68);
  doc.text(`Fecha: ${formatDateShort(order.createdAt)}`, 115, 74);
  if (order.deliveryDate) {
    doc.text(`Entrega: ${formatDateShort(order.deliveryDate)}`, 115, 80);
  }
  if (order.paymentMethod) {
    doc.text(`Pago: ${order.paymentMethod}`, 115, 86);
  }

  // Items table
  autoTable(doc, {
    startY: 105,
    head: [['#', 'Producto', 'Unid.', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: order.items.map((item, i) => [
      i + 1,
      `${item.wineName}\n${item.wineCode} · ${PRICE_TYPE_LABELS[item.priceType]}`,
      item.unit === 'bottle' ? 'Botella' : 'Caja',
      item.quantity,
      formatCurrency(item.unitPrice),
      formatCurrency(item.subtotal),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [114, 47, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [45, 45, 45] },
    alternateRowStyles: { fillColor: [250, 246, 240] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Totals box
  const totalsX = pageW - 80;
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(totalsX - 5, finalY, 75, order.discount > 0 ? 30 : 22, 3, 3, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(totalsX - 5, finalY, 75, order.discount > 0 ? 30 : 22, 3, 3, 'S');

  let ty = finalY + 8;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, ty);
  doc.text(formatCurrency(order.subtotal), pageW - 15, ty, { align: 'right' });

  if (order.discount > 0) {
    ty += 7;
    doc.setTextColor(34, 140, 34);
    doc.text(`Descuento (${order.discount}%):`, totalsX, ty);
    doc.text(`-${formatCurrency(order.subtotal * order.discount / 100)}`, pageW - 15, ty, { align: 'right' });
  }

  ty += 9;
  doc.setFillColor(114, 47, 55);
  doc.roundedRect(totalsX - 5, ty - 6, 75, 12, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL:', totalsX, ty + 2);
  doc.text(formatCurrency(order.total), pageW - 15, ty + 2, { align: 'right' });

  // Notes
  if (order.notes) {
    const notesY = finalY;
    doc.setFillColor(255, 255, 230);
    doc.roundedRect(10, notesY, totalsX - 25, order.discount > 0 ? 30 : 22, 3, 3, 'F');
    doc.setDrawColor(200, 200, 100);
    doc.roundedRect(10, notesY, totalsX - 25, order.discount > 0 ? 30 : 22, 3, 3, 'S');
    doc.setTextColor(100, 100, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Observaciones:', 15, notesY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(order.notes, totalsX - 35);
    doc.text(noteLines, 15, notesY + 14);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(196, 163, 90);
  doc.setLineWidth(0.3);
  doc.line(10, footerY - 5, pageW - 10, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('BDA · Bodega de Amigos', pageW / 2, footerY, { align: 'center' });
  doc.text(`Generado el ${formatDateShort(new Date().toISOString())}`, pageW / 2, footerY + 5, { align: 'center' });

  doc.save(`BDA_Remito_${order.orderNumber}.pdf`);
}
