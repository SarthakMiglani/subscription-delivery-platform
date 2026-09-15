package com.juiceplatform.service;

import com.juiceplatform.dto.deliverysheet.DeliverySheetOrderEntry;
import com.juiceplatform.dto.deliverysheet.DeliverySheetResponse;
import com.juiceplatform.dto.deliverysheet.JuiceSummaryEntry;
import com.juiceplatform.dto.ingredient.IngredientSummaryEntry;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

/**
 * Renders a {@link DeliverySheetResponse} as a real PDF document using OpenPDF.
 * Used by GET /admin/delivery-sheets/{date}/download/pdf.
 */
@Service
public class DeliverySheetPdfService {

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
    private static final Font SECTION_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
    private static final Font BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9);
    private static final Font META_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);
    private static final Color HEADER_BG = new Color(46, 125, 50);

    public byte[] render(DeliverySheetResponse sheet) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("Delivery Sheet — " + sheet.getDeliveryDate(), TITLE_FONT));
            if (sheet.getGeneratedAt() != null) {
                document.add(new Paragraph(
                        "Generated at " + sheet.getGeneratedAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
                        META_FONT));
            }
            document.add(Chunk.NEWLINE);

            // ── Juice summary ──────────────────────────────────────────────
            document.add(new Paragraph("Juice Preparation Summary", SECTION_FONT));
            document.add(Chunk.NEWLINE);
            if (sheet.getJuiceSummary() == null || sheet.getJuiceSummary().isEmpty()) {
                document.add(new Paragraph("No orders for this date.", BODY_FONT));
            } else {
                PdfPTable juiceTable = new PdfPTable(2);
                juiceTable.setWidthPercentage(100);
                addHeaderCell(juiceTable, "Product");
                addHeaderCell(juiceTable, "Total Quantity");
                for (JuiceSummaryEntry entry : sheet.getJuiceSummary()) {
                    addBodyCell(juiceTable, entry.getProductName());
                    addBodyCell(juiceTable, String.valueOf(entry.getTotalQuantity()));
                }
                document.add(juiceTable);
            }
            document.add(Chunk.NEWLINE);

            // ── Ingredient shopping list ────────────────────────────────────
            if (sheet.getIngredientSummary() != null && !sheet.getIngredientSummary().isEmpty()) {
                document.add(new Paragraph("Ingredient Shopping List", SECTION_FONT));
                document.add(Chunk.NEWLINE);
                PdfPTable ingredientTable = new PdfPTable(3);
                ingredientTable.setWidthPercentage(100);
                addHeaderCell(ingredientTable, "Ingredient");
                addHeaderCell(ingredientTable, "Total Needed");
                addHeaderCell(ingredientTable, "Unit");
                for (IngredientSummaryEntry entry : sheet.getIngredientSummary()) {
                    addBodyCell(ingredientTable, entry.getIngredientName());
                    addBodyCell(ingredientTable, entry.getTotalQuantity().stripTrailingZeros().toPlainString());
                    addBodyCell(ingredientTable, entry.getUnit());
                }
                document.add(ingredientTable);
                document.add(Chunk.NEWLINE);
            }

            if (sheet.getProductsWithoutRecipe() != null && !sheet.getProductsWithoutRecipe().isEmpty()) {
                Paragraph warning = new Paragraph(
                        "Note: the following products have orders but no ingredient recipe configured — "
                                + "their ingredients are NOT included above: "
                                + String.join(", ", sheet.getProductsWithoutRecipe()),
                        META_FONT);
                document.add(warning);
                document.add(Chunk.NEWLINE);
            }

            // ── Delivery list ───────────────────────────────────────────────
            document.add(new Paragraph("Delivery List", SECTION_FONT));
            document.add(Chunk.NEWLINE);
            if (sheet.getOrders() == null || sheet.getOrders().isEmpty()) {
                document.add(new Paragraph("No deliveries for this date.", BODY_FONT));
            } else {
                PdfPTable table = new PdfPTable(5);
                table.setWidthPercentage(100);
                table.setWidths(new float[]{2.2f, 3.2f, 1.6f, 0.8f, 2.2f});
                addHeaderCell(table, "Customer");
                addHeaderCell(table, "Address");
                addHeaderCell(table, "Product");
                addHeaderCell(table, "Qty");
                addHeaderCell(table, "Notes");

                for (DeliverySheetOrderEntry order : sheet.getOrders()) {
                    addBodyCell(table, order.getCustomerName() + "\n" + nullToDash(order.getPhone()));
                    addBodyCell(table, order.getAddress());
                    addBodyCell(table, order.getProductName());
                    addBodyCell(table, String.valueOf(order.getQuantity()));
                    addBodyCell(table, nullToDash(order.getDeliveryNotes()));
                }
                document.add(table);
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate delivery sheet PDF", e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, HEADER_FONT));
        cell.setBackgroundColor(HEADER_BG);
        cell.setPadding(5f);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", BODY_FONT));
        cell.setPadding(5f);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private String nullToDash(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }
}
