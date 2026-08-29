import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Wine, Liquidacion, PRICE_TYPE_LABELS } from '../types';
import { useCategoryStore } from '../store/categoryStore';
import { formatCurrency, formatDateShort } from './format';
import logoSrc from '../assets/logo.jpg';

type PriceColumn = 'bottle' | 'case' | 'market';

const PRICE_COLUMN_LABEL: Record<PriceColumn, string> = {
  bottle: 'Botella Suelta',
  case: 'Caja Entera',
  market: 'Mercado / Rest.',
};

// Pre-load logo at module init so it's ready when PDFs are generated
const _logoImg = new Image();
_logoImg.src = logoSrc;

function addLogo(doc: jsPDF, x: number, y: number, w: number, h: number): void {
  try {
    if (_logoImg.complete && _logoImg.naturalWidth > 0) {
      doc.addImage(_logoImg, 'JPEG', x, y, w, h);
    }
  } catch { /* skip if not ready */ }
}

// Compact header shared by remito and liquidacion PDFs
function drawHeader(
  doc: jsPDF,
  pageW: number,
  title: string,
  numberLine: string,
  dateStr: string,
  statusLabel?: string,
  statusColor?: [number, number, number],
): void {
  const headerH = 30;
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, pageW, headerH, 'F');

  // Logo (320×129 → 55×22 mm), vertically centered
  addLogo(doc, 10, 4, 55, 22);

  // Status badge — top-right corner, before everything else
  if (statusLabel && statusColor) {
    const [r, g, b] = statusColor;
    doc.setFillColor(r, g, b);
    const badgeW = 32;
    doc.roundedRect(pageW - 15 - badgeW, 2.5, badgeW, 5.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(statusLabel, pageW - 15 - badgeW / 2, 6.3, { align: 'center' });
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(title, pageW - 15, 15, { align: 'right' });

  // N°
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(numberLine, pageW - 15, 21.5, { align: 'right' });

  // Date
  doc.setFontSize(8);
  doc.text(dateStr, pageW - 15, 27.5, { align: 'right' });
}

export function generatePriceListPDF(
  wines: Wine[],
  categoryFilter: string | null = null,
  priceColumn: PriceColumn | null = null,
  wineryFilter: string | null = null,
  showNoStock: boolean = true,
): void {
  const getLabel = useCategoryStore.getState().getLabel;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  const filtered = wines
    .filter((w) => !categoryFilter || w.category === categoryFilter)
    .filter((w) => !wineryFilter || (w.winery ?? '') === wineryFilter)
    .filter((w) => showNoStock || w.stock > 0);

  // Header (34mm)
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, pageW, 34, 'F');

  addLogo(doc, 10, 5, 55, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('LISTA DE PRECIOS', pageW - 15, 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateShort(new Date().toISOString()), pageW - 15, 22, { align: 'right' });

  doc.setTextColor(196, 163, 90);
  doc.setFontSize(8.5);
  doc.text('WhatsApp +54 9 2945 68-8578', pageW - 15, 30, { align: 'right' });

  const NO_STOCK_LABEL = 'SIN STOCK';

  function buildHead(): string[][] {
    if (priceColumn) return [['Código', 'Nombre', 'Bodega / Varietal', 'Formato', PRICE_COLUMN_LABEL[priceColumn]]];
    return [['Código', 'Nombre', 'Bodega / Varietal', 'Formato', 'Bot. Suelta', 'Caja', 'Mdo/Rest.']];
  }

  function buildRow(w: Wine): (string | number)[] {
    const formato = `Caja ${w.bottlesPerCase}`;
    const base = [
      w.code,
      w.name,
      [w.winery, w.varietal].filter(Boolean).join(' · ') || '-',
      formato,
    ];
    if (w.stock < 6) {
      if (priceColumn) return [...base, NO_STOCK_LABEL];
      return [...base, NO_STOCK_LABEL, '', ''];
    }
    if (priceColumn) return [...base, formatCurrency(w.prices[priceColumn])];
    return [...base, formatCurrency(w.prices.bottle), formatCurrency(w.prices.case), formatCurrency(w.prices.market)];
  }

  function buildColumnStyles(): { [key: string]: object } {
    if (priceColumn) {
      // Barcode=32, Nombre=55, Bodega=48, Formato=20, Price=35 = 190
      return {
        0: { cellWidth: 32 },
        1: { cellWidth: 55 },
        2: { cellWidth: 48 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' },
      };
    }
    // Barcode=30, Nombre=50, Bodega=44, Formato=18, Bot=16, Caja=16, Mdo=16 = 190
    return {
      0: { cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { cellWidth: 44 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 16, halign: 'right' },
    };
  }

  const tableOptions = {
    theme: 'striped' as const,
    headStyles: { fillColor: [114, 47, 55] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: 'bold' as const },
    bodyStyles: { fontSize: 7.5, textColor: [45, 45, 45] as [number, number, number], cellPadding: 1.8 },
    alternateRowStyles: { fillColor: [250, 246, 240] as [number, number, number] },
    columnStyles: buildColumnStyles(),
    margin: { left: 10, right: 10 },
    didParseCell: (data: any) => {
      if (data.cell.raw === NO_STOCK_LABEL) {
        data.cell.styles.textColor = [180, 40, 40];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
      }
    },
  };

  const TABLE_START = 40;

  if (!categoryFilter) {
    const cats = Array.from(new Set(filtered.map((w) => w.category)));
    let startY = TABLE_START;

    for (const cat of cats) {
      const catWines = filtered.filter((w) => w.category === cat);
      if (catWines.length === 0) continue;

      doc.setFillColor(196, 163, 90);
      doc.roundedRect(10, startY, pageW - 20, 7, 2, 2, 'F');
      doc.setTextColor(74, 28, 35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(getLabel(cat).toUpperCase(), 15, startY + 5);
      doc.text(`${catWines.length} vino${catWines.length !== 1 ? 's' : ''}`, pageW - 15, startY + 5, { align: 'right' });

      autoTable(doc, { startY: startY + 9, head: buildHead(), body: catWines.map(buildRow), ...tableOptions });

      startY = (doc as any).lastAutoTable.finalY + 7;
      if (startY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        startY = 15;
      }
    }
  } else {
    autoTable(doc, { startY: TABLE_START, head: buildHead(), body: filtered.map(buildRow), ...tableOptions });
  }

  // Footer: page number only
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${pageCount}`, pageW - 10, footerY, { align: 'right' });
  }

  const catSuffix = categoryFilter ? `_${categoryFilter}` : '_todas';
  const winerySuffix = wineryFilter ? `_${wineryFilter.replace(/\s+/g, '_')}` : '';
  const priceSuffix = priceColumn ? `_${priceColumn}` : '';
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`BDA_ListaPrecios${catSuffix}${winerySuffix}${priceSuffix}_${date}.pdf`);
}

export function generateRemitoPDF(order: Order): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  const statusColors: Record<string, [number, number, number]> = {
    draft:     [130, 130, 130],
    confirmed: [59, 130, 246],
    delivered: [34, 160, 80],
    cancelled: [220, 60, 60],
  };
  const statusLabels: Record<string, string> = {
    draft: 'BORRADOR', confirmed: 'CONFIRMADO', delivered: 'ENTREGADO', cancelled: 'CANCELADO',
  };

  drawHeader(
    doc,
    pageW,
    'REMITO',
    `N° ${order.orderNumber}`,
    `Fecha: ${formatDateShort(order.createdAt)}`,
    statusLabels[order.status] ?? order.status,
    statusColors[order.status] ?? [100, 100, 100],
  );

  const boxTop = 36;
  const boxH = 30;

  // Client info box
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(10, boxTop, 90, boxH, 3, 3, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(10, boxTop, 90, boxH, 3, 3, 'S');

  doc.setTextColor(114, 47, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DATOS DEL CLIENTE', 15, boxTop + 6);

  doc.setTextColor(45, 45, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(order.client.company || order.client.name, 15, boxTop + 13);

  doc.setFontSize(8);
  let cy = boxTop + 20;
  if (order.client.company) {
    doc.setFont('helvetica', 'normal');
    doc.text(order.client.name, 15, cy);
    cy += 5;
  }
  if (order.client.cuit) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(114, 47, 55);
    doc.text(`CUIT: ${order.client.cuit}`, 15, cy);
    doc.setTextColor(45, 45, 45);
    doc.setFont('helvetica', 'normal');
  }

  // Order info box
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(110, boxTop, 90, boxH, 3, 3, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(110, boxTop, 90, boxH, 3, 3, 'S');

  doc.setTextColor(114, 47, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DETALLES DEL PEDIDO', 115, boxTop + 6);

  doc.setTextColor(45, 45, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Pedido N°: ${order.orderNumber}`, 115, boxTop + 13);
  doc.text(`Fecha: ${formatDateShort(order.createdAt)}`, 115, boxTop + 19);
  if (order.deliveryDate) {
    doc.text(`Entrega: ${formatDateShort(order.deliveryDate)}`, 115, boxTop + 25);
  }
  if (order.paymentMethod) {
    doc.text(`Pago: ${order.paymentMethod}`, 115, order.deliveryDate ? boxTop + 31 : boxTop + 25);
  }

  // Items table
  autoTable(doc, {
    startY: boxTop + boxH + 4,
    head: [['#', 'Producto', 'Unid.', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: order.items.map((item, i) => [
      i + 1,
      `${item.wineName}\n${item.wineCode} · ${PRICE_TYPE_LABELS[item.priceType]}`,
      item.unit === 'bottle' ? 'Bot.' : 'Caja',
      item.quantity,
      formatCurrency(item.unitPrice),
      formatCurrency(item.subtotal),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [27, 14, 56], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [45, 45, 45] as [number, number, number], cellPadding: 2 },
    alternateRowStyles: { fillColor: [250, 246, 240] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 75 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 13, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Totals box
  const totalsX = pageW - 80;
  const totalsH = order.discount > 0 ? 28 : 20;
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(totalsX - 5, finalY, 75, totalsH, 3, 3, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(totalsX - 5, finalY, 75, totalsH, 3, 3, 'S');

  let ty = finalY + 7;
  doc.setFontSize(8.5);
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

  ty += 8;
  doc.setFillColor(114, 47, 55);
  doc.roundedRect(totalsX - 5, ty - 5, 75, 11, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL:', totalsX, ty + 2.5);
  doc.text(formatCurrency(order.total), pageW - 15, ty + 2.5, { align: 'right' });

  // Notes
  if (order.notes) {
    const notesX = 10;
    const notesW = totalsX - 20;
    doc.setFillColor(255, 255, 225);
    doc.roundedRect(notesX, finalY, notesW, totalsH, 3, 3, 'F');
    doc.setDrawColor(200, 200, 80);
    doc.roundedRect(notesX, finalY, notesW, totalsH, 3, 3, 'S');
    doc.setTextColor(100, 100, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Observaciones:', notesX + 4, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(order.notes, notesW - 8);
    doc.text(noteLines, notesX + 4, finalY + 13);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(196, 163, 90);
  doc.setLineWidth(0.3);
  doc.line(10, footerY - 4, pageW - 10, footerY - 4);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('BDA · Bodega de Amigos', pageW / 2, footerY, { align: 'center' });
  doc.text(`Generado el ${formatDateShort(new Date().toISOString())}`, pageW / 2, footerY + 5, { align: 'center' });

  doc.save(`BDA_Remito_${order.orderNumber}.pdf`);
}

export function generateLiquidacionPDF(liq: Liquidacion): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  drawHeader(
    doc,
    pageW,
    'LIQUIDACIÓN',
    `N° ${liq.liquidacionNumber}`,
    `Fecha: ${formatDateShort(liq.createdAt)}`,
  );

  const boxTop = 36;
  const boxH = 30;

  // Client info box
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(10, boxTop, 90, boxH, 3, 3, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(10, boxTop, 90, boxH, 3, 3, 'S');

  doc.setTextColor(114, 47, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DATOS DEL CLIENTE', 15, boxTop + 6);

  doc.setTextColor(45, 45, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(liq.client.company || liq.client.name, 15, boxTop + 13);

  doc.setFontSize(8);
  let cy = boxTop + 20;
  if (liq.client.company) {
    doc.setFont('helvetica', 'normal');
    doc.text(liq.client.name, 15, cy);
    cy += 5;
  }
  if (liq.client.cuit) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(114, 47, 55);
    doc.text(`CUIT: ${liq.client.cuit}`, 15, cy);
    doc.setTextColor(45, 45, 45);
    doc.setFont('helvetica', 'normal');
    cy += 5;
  }
  if (liq.client.phone) {
    doc.text(`Tel: ${liq.client.phone}`, 15, cy);
  }

  // Details box
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(110, boxTop, 90, boxH, 3, 3, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(110, boxTop, 90, boxH, 3, 3, 'S');

  doc.setTextColor(114, 47, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DETALLES', 115, boxTop + 6);

  doc.setTextColor(45, 45, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`N°: ${liq.liquidacionNumber}`, 115, boxTop + 13);
  doc.text(`Fecha: ${formatDateShort(liq.createdAt)}`, 115, boxTop + 19);
  if (liq.paymentMethod) {
    doc.text(`Pago: ${liq.paymentMethod}`, 115, boxTop + 25);
  }

  // Items table
  autoTable(doc, {
    startY: boxTop + boxH + 4,
    head: [['#', 'Producto', 'Unid.', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: liq.items.map((item, i) => [
      i + 1,
      `${item.wineName}\n${item.wineCode}`,
      item.unit === 'bottle' ? 'Bot.' : 'Caja',
      item.quantity,
      formatCurrency(item.unitPrice),
      formatCurrency(item.subtotal),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [27, 14, 56], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [45, 45, 45] as [number, number, number], cellPadding: 2 },
    alternateRowStyles: { fillColor: [250, 246, 240] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 75 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 13, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Totals box
  const totalsX = pageW - 80;
  const totalsH = liq.discount > 0 ? 28 : 20;
  doc.setFillColor(250, 246, 240);
  doc.roundedRect(totalsX - 5, finalY, 75, totalsH, 3, 3, 'F');
  doc.setDrawColor(196, 163, 90);
  doc.roundedRect(totalsX - 5, finalY, 75, totalsH, 3, 3, 'S');

  let ty = finalY + 7;
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, ty);
  doc.text(formatCurrency(liq.subtotal), pageW - 15, ty, { align: 'right' });

  if (liq.discount > 0) {
    ty += 7;
    doc.setTextColor(34, 140, 34);
    doc.text(`Descuento (${liq.discount}%):`, totalsX, ty);
    doc.text(`-${formatCurrency(liq.subtotal * liq.discount / 100)}`, pageW - 15, ty, { align: 'right' });
  }

  ty += 8;
  doc.setFillColor(114, 47, 55);
  doc.roundedRect(totalsX - 5, ty - 5, 75, 11, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL:', totalsX, ty + 2.5);
  doc.text(formatCurrency(liq.total), pageW - 15, ty + 2.5, { align: 'right' });

  if (liq.notes) {
    const notesX = 10;
    const notesW = totalsX - 20;
    doc.setFillColor(255, 255, 225);
    doc.roundedRect(notesX, finalY, notesW, totalsH, 3, 3, 'F');
    doc.setDrawColor(200, 200, 80);
    doc.roundedRect(notesX, finalY, notesW, totalsH, 3, 3, 'S');
    doc.setTextColor(100, 100, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Observaciones:', notesX + 4, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(liq.notes, notesW - 8);
    doc.text(noteLines, notesX + 4, finalY + 13);
  }

  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(196, 163, 90);
  doc.setLineWidth(0.3);
  doc.line(10, footerY - 4, pageW - 10, footerY - 4);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('BDA · Bodega de Amigos', pageW / 2, footerY, { align: 'center' });
  doc.text(`Generado el ${formatDateShort(new Date().toISOString())}`, pageW / 2, footerY + 5, { align: 'center' });

  doc.save(`BDA_Liquidacion_${liq.liquidacionNumber}.pdf`);
}
