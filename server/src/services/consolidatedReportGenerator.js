import PDFDocument from 'pdfkit';

export const fetchTrialData = async (trial_id, trx) => {
    if (!trial_id) return null;

    const [trial_cards] = await trx.query(
        `SELECT tc.*, mc.part_name, mc.pattern_code, mc.chemical_composition AS spec_chem, mc.micro_structure AS spec_micro,
                mc.tensile AS spec_tensile, mc.yield AS spec_yield, mc.elongation AS spec_elongation,
                mc.hardness_surface AS spec_hardness_surface, mc.hardness_core AS spec_hardness_core
         FROM trial_cards tc 
         JOIN master_card mc ON tc.master_card_id = mc.id 
         WHERE tc.trial_id = @trial_id`, { trial_id }
    );
    const [pouring_details] = await trx.query(
        `SELECT * FROM pouring_details WHERE trial_id = @trial_id`, { trial_id }
    );
    const [sand_properties] = await trx.query(
        `SELECT * FROM sand_properties WHERE trial_id = @trial_id`, { trial_id }
    );
    const [mould_correction] = await trx.query(
        `SELECT * FROM mould_correction WHERE trial_id = @trial_id`, { trial_id }
    );
    const [metallurgical_inspection] = await trx.query(
        `SELECT * FROM metallurgical_inspection WHERE trial_id = @trial_id`, { trial_id }
    );
    const [visual_inspection] = await trx.query(
        `SELECT * FROM visual_inspection WHERE trial_id = @trial_id`, { trial_id }
    );
    const [dimensional_inspection] = await trx.query(
        `SELECT * FROM dimensional_inspection WHERE trial_id = @trial_id`, { trial_id }
    );
    const [machine_shop] = await trx.query(
        `SELECT * FROM machine_shop WHERE trial_id = @trial_id`, { trial_id }
    );
    const [material_correction] = await trx.query(
        `SELECT * FROM material_correction WHERE trial_id = @trial_id`, { trial_id }
    );
    const [documents] = await trx.query(
        `SELECT * FROM documents WHERE trial_id = @trial_id ORDER BY uploaded_at ASC, document_type`, { trial_id }
    );

    return {
        trial_cards,
        pouring_details,
        sand_properties,
        mould_correction,
        metallurgical_inspection,
        visual_inspection,
        dimensional_inspection,
        machine_shop,
        material_correction,
        documents
    };
};

export const getAllData = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    try {
        const data = await fetchTrialData(trial_id, trx);
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Error fetching trial data:", error);
        res.status(500).json({ success: false, message: "Error fetching data" });
    }
};

const safeParse = (data, fallback = []) => {
    if (!data) return fallback;
    try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
        return parsed || fallback;
    } catch (e) {
        return fallback;
    }
};

// Calculate Table Height without drawing
const getTableHeight = (doc, tableData, colWidths, fontSize = 7, padding = 3) => {
    doc.font('Helvetica-Bold').fontSize(fontSize);
    let headerHeight = 18;
    tableData.headers.forEach((header, i) => {
        const h = doc.heightOfString(header, { width: colWidths[i] - 2 * padding });
        if (h + padding * 2 > headerHeight) headerHeight = h + padding * 2;
    });

    let totalTableHeight = headerHeight;
    doc.font('Helvetica').fontSize(fontSize);
    tableData.rows.forEach(row => {
        let dataRowHeight = 18;
        row.forEach((cell, i) => {
            const text = cell !== null && cell !== undefined ? String(cell) : '-';
            const h = doc.heightOfString(text, { width: colWidths[i] - 2 * padding });
            if (h + padding * 2 > dataRowHeight) dataRowHeight = h + padding * 2;
        });
        totalTableHeight += dataRowHeight;
    });
    return totalTableHeight;
};

const drawTable = (doc, tableData, startX, startY, colWidths = [], customPadding = 3) => {
    let currentY = startY;
    const padding = customPadding;
    const fontSize = 7;
    const headerColor = '#f5f5f5';
    const pageBottom = 780;

    // 1. Calculate Heights
    const totalTableHeight = getTableHeight(doc, tableData, colWidths, fontSize, padding);

    // 2. Pagination Check
    if (startY + totalTableHeight > pageBottom && startY > 100) {
        doc.addPage();
        currentY = 40; // Top margin on new page
    }

    // 3. Draw Headers
    doc.font('Helvetica-Bold').fontSize(fontSize);
    let currentX = startX;
    doc.save();
    doc.fillColor(headerColor)
        .rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), 18) // simple header h
        .fill();
    doc.restore();

    // Re-calculate actual header height for drawing
    let headerHeight = 18;
    tableData.headers.forEach((header, i) => {
        const h = doc.heightOfString(header, { width: colWidths[i] - 2 * padding });
        if (h + padding * 2 > headerHeight) headerHeight = h + padding * 2;
    });

    tableData.headers.forEach((header, i) => {
        doc.fillColor('black')
            .text(header, currentX + padding, currentY + padding, { width: colWidths[i] - 2 * padding, align: 'left' });
        doc.rect(currentX, currentY, colWidths[i], headerHeight).strokeColor('#ddd').stroke();
        currentX += colWidths[i];
    });

    currentY += headerHeight;

    // 4. Draw Rows
    doc.font('Helvetica').fontSize(fontSize);
    tableData.rows.forEach((row, ri) => {
        currentX = startX;

        // Inline recalculation of row height
        let dataRowHeight = 18;
        row.forEach((cell, i) => {
            const text = cell !== null && cell !== undefined ? String(cell) : '-';
            const h = doc.heightOfString(text, { width: colWidths[i] - 2 * padding });
            if (h + padding * 2 > dataRowHeight) dataRowHeight = h + padding * 2;
        });

        row.forEach((cell, i) => {
            const text = cell !== null && cell !== undefined ? String(cell) : '-';
            doc.text(text, currentX + padding, currentY + padding, { width: colWidths[i] - 2 * padding, align: 'left' });
            doc.rect(currentX, currentY, colWidths[i], dataRowHeight).strokeColor('#ddd').stroke();
            currentX += colWidths[i];
        });
        currentY += dataRowHeight;
    });

    return currentY;
};

// Draw a Vertical key-value table - HIGHLY OPTIMIZED
const drawVerticalTable = (doc, data, startX, startY, width) => {
    let currentY = startY;
    const fontSize = 7;
    const labelWidth = width * 0.45;
    const valueWidth = width * 0.55;
    const padding = 3;
    const pageBottom = 780;

    // 1. Calculate total height
    doc.fontSize(fontSize);
    let totalHeight = 0;
    const rowHeights = [];
    data.forEach(item => {
        const labelText = item.label || "";
        const valueText = item.value !== null && item.value !== undefined ? String(item.value) : "-";

        doc.font('Helvetica-Bold');
        const h1 = doc.heightOfString(labelText, { width: labelWidth - 2 * padding });
        doc.font('Helvetica');
        const h2 = doc.heightOfString(valueText, { width: valueWidth - 2 * padding });

        const rowHeight = Math.max(h1, h2) + padding * 2 + 2;
        rowHeights.push(rowHeight);
        totalHeight += rowHeight;
    });

    // 2. Pagination check
    if (currentY + totalHeight > pageBottom) {
        doc.addPage();
        currentY = 40;
    }

    // 3. Draw rows
    data.forEach((item, i) => {
        const labelText = item.label || "";
        const valueText = item.value !== null && item.value !== undefined ? String(item.value) : "-";
        const rowHeight = rowHeights[i];

        // Label Bg
        doc.save();
        doc.fillColor('#fafafa').rect(startX, currentY, labelWidth, rowHeight).fill();
        doc.restore();

        // Borders
        doc.rect(startX, currentY, labelWidth, rowHeight).strokeColor('#e0e0e0').stroke();
        doc.rect(startX + labelWidth, currentY, valueWidth, rowHeight).strokeColor('#e0e0e0').stroke();

        // Text
        doc.font('Helvetica-Bold').text(labelText, startX + padding, currentY + padding + 1, { width: labelWidth - 2 * padding });
        doc.font('Helvetica').text(valueText, startX + labelWidth + padding, currentY + padding + 1, { width: valueWidth - 2 * padding });

        currentY += rowHeight;
    });

    return currentY;
};

const drawSectionTitle = (doc, title, x, y) => {
    if (y > 750) {
        doc.addPage();
        y = 40;
    }
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#2c3e50').text(title, x, y);
    const width = doc.widthOfString(title);
    doc.moveTo(x, y + 11).lineTo(x + width, y + 11).strokeColor('#2c3e50').stroke();
    return y + 18;
};

export const fetchAllTrialsDataForMasterCard = async (masterCardId, trx) => {
    if (!masterCardId) return [];

    const [trials] = await trx.query(
        `SELECT trial_id 
         FROM trial_cards 
         WHERE master_card_id = @masterCardId AND status = 'CLOSED' AND deleted_at IS NULL 
         ORDER BY date_of_sampling ASC`,
        { masterCardId }
    );

    if (!trials || trials.length === 0) return [];

    const allTrialsData = [];
    for (const trial of trials) {
        const data = await fetchTrialData(trial.trial_id, trx);
        allTrialsData.push(data);
    }

    return allTrialsData;
};

export const generateAndStoreConsolidatedReport = async (masterCardId, trx) => {
    const allTrialsData = await fetchAllTrialsDataForMasterCard(masterCardId, trx);

    // Get pattern_code for filename and display
    const [masterRows] = await trx.query(`SELECT pattern_code FROM master_card WHERE id = @masterCardId`, { masterCardId });
    const pattern_code = masterRows[0]?.pattern_code || "Unknown";

    if (allTrialsData.length === 0) {
        await trx.query(
            `DELETE FROM consolidated_reports WHERE master_card_id = @masterCardId`,
            { masterCardId }
        );
        return;
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    for (let i = 0; i < allTrialsData.length; i++) {
        const data = allTrialsData[i];
        const trialCard = data.trial_cards?.[0] || {};
        const pouring = data.pouring_details?.[0] || {};
        const sand = data.sand_properties?.[0] || {};
        const moulding = data.mould_correction?.[0] || {};
        const meta = data.metallurgical_inspection?.[0] || {};
        const visual = data.visual_inspection?.[0] || {};
        const dimensional = data.dimensional_inspection?.[0] || {};
        const mcShop = data.machine_shop?.[0] || {};
        const matCorr = data.material_correction?.[0] || {};
        const currentTrialId = data.trial_cards?.[0]?.trial_id;

        if (i > 0) doc.addPage();

        // --- PAGE 1: PROCESS DATA ---

        // Header
        doc.rect(0, 0, 595, 60).fillColor('#2c3e50').fill();
        doc.font('Helvetica-Bold').fontSize(16).fillColor('white')
            .text('SAMPLE CARD', 30, 20, { align: 'left' });
        doc.fontSize(8.5)
            .text(`Part Name: ${trialCard?.part_name || "-"}   |   Pattern Code: ${trialCard?.pattern_code || "-"}`, 30, 42, { align: 'left' });

        let y = 80;
        const col1X = 30;
        const col2X = 315;
        const colWidth = 250;

        // Trial Card Details
        let yNext = y;
        const trialHeaders = ["Part Name", "Pattern", "Trial No", "Date", "Moulds (P/A)", "Machine", "Reason", "Remarks"];
        const trialDataRow = [
            trialCard?.part_name,
            trialCard?.pattern_code,
            trialCard?.trial_no,
            trialCard?.date_of_sampling ? new Date(trialCard.date_of_sampling).toISOString().slice(0, 10) : '-',
            `${trialCard?.plan_moulds || trialCard?.no_of_moulds || '-'} / ${trialCard?.actual_moulds || '-'}`,
            trialCard?.disa,
            trialCard?.reason_for_sampling,
            trialCard?.remarks
        ];
        // Full width 535
        const trialWidths = [100, 60, 40, 55, 60, 50, 80, 90];
        yNext = drawTable(doc, { headers: trialHeaders, rows: [trialDataRow] }, col1X, yNext, trialWidths) + 12;

        // Melting (Below)
        yNext = drawSectionTitle(doc, "MELTING", col1X, yNext);
        const pInoc = safeParse(pouring?.inoculation, {});
        const actualChem = safeParse(pouring?.composition, {});
        const chemItems = [];
        if (actualChem?.C) chemItems.push(`C: ${actualChem.C}`);
        if (actualChem?.Si) chemItems.push(`Si: ${actualChem.Si}`);
        if (actualChem?.Mn) chemItems.push(`Mn: ${actualChem.Mn}`);
        if (actualChem?.P) chemItems.push(`P: ${actualChem.P}`);
        if (actualChem?.S) chemItems.push(`S: ${actualChem.S}`);
        if (actualChem?.Mg) chemItems.push(`Mg: ${actualChem.Mg}`);
        if (actualChem?.Cu) chemItems.push(`Cu: ${actualChem.Cu}`);
        if (actualChem?.Cr) chemItems.push(`Cr: ${actualChem.Cr}`);
        const chemString = chemItems.join(", ") || "-";

        const pouringHeaders = ["Pour Date", "Heat Code", "Temp", "Time", "Moulds", "Inoc Type", "Stream/Inm", "Composition", "Remarks"];
        const pouringDataRow = [
            pouring?.pour_date ? new Date(pouring.pour_date).toISOString().slice(0, 10) : '-',
            pouring?.heat_code,
            pouring?.pouring_temp_c,
            pouring?.pouring_time_sec,
            pouring?.no_of_mould_poured,
            pInoc?.text,
            `${pInoc?.stream || '-'} / ${pInoc?.inmould || '-'}`,
            chemString,
            pouring?.remarks
        ];
        const pouringWidths = [55, 50, 40, 35, 40, 60, 60, 115, 80];
        yNext = drawTable(doc, { headers: pouringHeaders, rows: [pouringDataRow] }, col1X, yNext, pouringWidths) + 12;

        // Sand Properties
        yNext = drawSectionTitle(doc, "SAND PROPERTIES", col1X, yNext);
        const sandRows = [
            { label: "Date", value: sand?.date ? new Date(sand.date).toISOString().slice(0, 10) : '-' },
            { label: "T. Clay / A. Clay %", value: `${sand?.t_clay || '-'} / ${sand?.a_clay || '-'}` },
            { label: "V.C.M. / L.O.I. %", value: `${sand?.vcm || '-'} / ${sand?.loi || '-'}` },
            { label: "A.F.S. / G.C.S.", value: `${sand?.afs || '-'} / ${sand?.gcs || '-'}` },
            { label: "M.O.I. / Comp.", value: `${sand?.moi || '-'} / ${sand?.compactability || '-'}` },
            { label: "Permeability", value: sand?.permeability },
            { label: "Remarks", value: sand?.remarks },
        ];
        yNext = drawVerticalTable(doc, sandRows, col1X, yNext, 535) + 15;

        // Moulding
        yNext = drawSectionTitle(doc, "MOULDING", col1X, yNext);
        const mouldRows = [
            { label: "Date", value: moulding?.date ? new Date(moulding.date).toISOString().slice(0, 10) : '-' },
            { label: "Thickness", value: moulding?.mould_thickness },
            { label: "Compressibility", value: moulding?.compressability },
            { label: "Squeeze Pressure", value: moulding?.squeeze_pressure },
            { label: "Mould Hardness", value: moulding?.mould_hardness },
            { label: "Remarks", value: moulding?.remarks },
        ];
        yNext = drawVerticalTable(doc, mouldRows, col1X, yNext, 535) + 15;

        // --- METALLURGICAL INSPECTION ---
        let p2y = yNext + 15;

        // Metallurgical Inspection
        p2y = drawSectionTitle(doc, "METALLURGICAL INSPECTION", col1X, p2y);
        const metaDate = meta?.inspection_date ? new Date(meta.inspection_date).toISOString().slice(0, 10) : '-';
        doc.font('Helvetica-Bold').fontSize(7).fillColor('black').text(`Inspection Date: ${metaDate}`, col1X, p2y);
        p2y += 12;



        const mechRows = safeParse(meta.mech_properties, []);
        const impactRows = safeParse(meta.impact_strength, []);
        const microRows = safeParse(meta.micro_structure, []);
        const metaHardRows = safeParse(meta.hardness, []);

        if (mechRows.length > 0) {
            const mechHeaders = Object.keys(mechRows[0]);
            const mechColWidths = mechHeaders.map(() => 535 / mechHeaders.length);
            const mechTableH = getTableHeight(doc, { headers: mechHeaders, rows: mechRows.map(r => mechHeaders.map(h => r[h])) }, mechColWidths);
            const mechTotalH = 10 + (meta?.mech_properties_remarks ? 10 : 0) + mechTableH + 15;

            if (p2y + mechTotalH > 780) { doc.addPage(); p2y = 40; }

            const mechOk = meta?.mech_properties_ok;
            const mechRes = mechOk === null || mechOk === undefined ? "-" : (mechOk ? "OK" : "NOT OK");
            const specTensile = trialCard?.spec_tensile || "-";
            const specYield = trialCard?.spec_yield || "-";
            const specElongation = trialCard?.spec_elongation || "-";

            doc.font('Helvetica-Bold').fontSize(7).text(`Mechanical Properties (Result: ${mechRes}) | Spec: Tensile = ${specTensile}, Yield = ${specYield}, Elongation = ${specElongation}`, col1X, p2y);
            p2y += 10;
            if (meta?.mech_properties_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${meta.mech_properties_remarks}`, col1X, p2y);
                p2y += 10;
            }
            p2y = drawTable(doc, { headers: mechHeaders, rows: mechRows.map(r => mechHeaders.map(h => r[h])) }, col1X, p2y, mechColWidths) + 15;
        }

        if (impactRows.length > 0) {
            const impactHeaders = Object.keys(impactRows[0]);
            const impactColWidths = impactHeaders.map(() => 535 / impactHeaders.length);
            const impactTableH = getTableHeight(doc, { headers: impactHeaders, rows: impactRows.map(r => impactHeaders.map(h => r[h])) }, impactColWidths);
            const impactTotalH = 10 + (meta?.impact_strength_remarks ? 10 : 0) + impactTableH + 15;

            if (p2y + impactTotalH > 780) { doc.addPage(); p2y = 40; }

            const impactOk = meta?.impact_strength_ok;
            const impactRes = impactOk === null || impactOk === undefined ? "-" : (impactOk ? "OK" : "NOT OK");

            doc.font('Helvetica-Bold').fontSize(7).text(`Impact Strength (Result: ${impactRes})`, col1X, p2y);
            p2y += 10;
            if (meta?.impact_strength_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${meta.impact_strength_remarks}`, col1X, p2y);
                p2y += 10;
            }
            p2y = drawTable(doc, { headers: impactHeaders, rows: impactRows.map(r => impactHeaders.map(h => r[h])) }, col1X, p2y, impactColWidths) + 15;
        }

        if (microRows.length > 0) {
            const microHeaders = Object.keys(microRows[0]);
            const microColWidths = microHeaders.map(() => 535 / microHeaders.length);
            const microTableH = getTableHeight(doc, { headers: microHeaders, rows: microRows.map(r => microHeaders.map(h => r[h])) }, microColWidths);
            const microTotalH = 10 + (meta?.micro_structure_remarks ? doc.heightOfString(`Remarks: ${meta.micro_structure_remarks}`, { width: 535 }) : 0) + microTableH + 15;

            if (p2y + microTotalH > 780) { doc.addPage(); p2y = 40; }

            const microOk = meta?.micro_structure_ok;
            const microRes = microOk === null || microOk === undefined ? "-" : (microOk ? "OK" : "NOT OK");

            doc.font('Helvetica-Bold').fontSize(7).text(`Microstructure (Result: ${microRes})`, col1X, p2y);
            p2y += 10;
            if (meta?.micro_structure_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${meta.micro_structure_remarks}`, col1X, p2y, { width: 535 });
                p2y += doc.heightOfString(`Remarks: ${meta.micro_structure_remarks}`, { width: 535 }) + 2;
            }
            p2y = drawTable(doc, { headers: microHeaders, rows: microRows.map(r => microHeaders.map(h => r[h])) }, col1X, p2y, microColWidths) + 15;
        }

        if (metaHardRows.length > 0) {
            const hardHeaders = Object.keys(metaHardRows[0]);
            const hardColWidths = hardHeaders.map(() => 535 / hardHeaders.length);
            const hardTableH = getTableHeight(doc, { headers: hardHeaders, rows: metaHardRows.map(r => hardHeaders.map(h => r[h])) }, hardColWidths);
            const hardTotalH = 10 + (meta?.hardness_remarks ? 10 : 0) + hardTableH + 15;

            if (p2y + hardTotalH > 780) { doc.addPage(); p2y = 40; }

            const hardOk = meta?.hardness_ok;
            const hardRes = hardOk === null || hardOk === undefined ? "-" : (hardOk ? "OK" : "NOT OK");
            const specSurface = trialCard?.spec_hardness_surface || "-";
            const specCore = trialCard?.spec_hardness_core || "-";

            doc.font('Helvetica-Bold').fontSize(7).text(`Hardness Inspection (Result: ${hardRes}) | Spec: Surface Hardness = ${specSurface}, Core Hardness = ${specCore}`, col1X, p2y);
            p2y += 10;
            if (meta?.hardness_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${meta.hardness_remarks}`, col1X, p2y);
                p2y += 10;
            }
            p2y = drawTable(doc, { headers: hardHeaders, rows: metaHardRows.map(r => hardHeaders.map(h => r[h])) }, col1X, p2y, hardColWidths) + 15;
        }

        // --- PAGE 2: INSPECTION DATA ---
        let isNewPageAdded = false;
        if (p2y > 550) {
            doc.addPage();
            p2y = 40;
            isNewPageAdded = true;
        } else {
            p2y += 15;
        }

        let p2NextY = p2y;

        if (isNewPageAdded || p2y === 40) {
            // Header P2
            doc.font('Helvetica-Bold').fontSize(8.5).text(`Part Name: ${trialCard?.part_name || "-"} | Pattern Code: ${trialCard?.pattern_code || "-"} | Trial No: ${trialCard?.trial_no || "-"}`, 30, p2y - 20);
            doc.moveTo(30, p2y - 5).lineTo(565, p2y - 5).stroke();
        }

        // Visual
        p2NextY = drawSectionTitle(doc, "VISUAL INSPECTION", col1X, p2NextY);
        const visDate = visual?.inspection_date ? new Date(visual.inspection_date).toISOString().slice(0, 10) : '-';
        const visualRes = visual?.visual_ok === null || visual?.visual_ok === undefined ? "-" : (visual?.visual_ok ? "OK" : "NOT OK");
        doc.font('Helvetica-Bold').fontSize(7).text(`Inspection Date: ${visDate} | Result: ${visualRes}`, col1X, p2NextY);
        p2NextY += 10;

        const visInspections = safeParse(visual?.inspections, []);
        if (visInspections.length > 0) {
            const labelMap = { 'Cavity Number': 'Cavity No', 'Inspected Quantity': 'Inspected Qty', 'Accepted Quantity': 'Accepted Qty', 'Rejected Quantity': 'Rejected Qty', 'Rejection Percentage': 'Rej %', 'Reason for rejection': 'Reason' };
            const headers = ['Cavity No', 'Inspected Qty', 'Accepted Qty', 'Rejected Qty', 'Rej %', 'Reason'];
            const rows = visInspections.map(r => [r['Cavity Number'] || '-', r['Inspected Quantity'] || '0', r['Accepted Quantity'] || '0', r['Rejected Quantity'] || '0', r['Rejection Percentage'] || '0.00%', r['Reason for rejection'] || '-']);
            const colWidths = [70, 90, 90, 90, 85, 110];
            p2NextY = drawTable(doc, { headers, rows }, col1X, p2NextY, colWidths) + 8;
        }
        if (visual?.remarks) {
            doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${visual.remarks}`, col1X, p2NextY, { width: 535 });
            p2NextY += doc.heightOfString(visual.remarks, { width: 535 }) + 15;
        }

        // Dimensional
        p2NextY = drawSectionTitle(doc, "DIMENSIONAL INSPECTION", col1X, p2NextY);
        const dimSubRows = [
            { label: "Date", value: dimensional?.inspection_date ? new Date(dimensional.inspection_date).toISOString().slice(0, 10) : '-' },
            { label: "Weight", value: `${dimensional?.casting_weight || '-'} kg` },
            { label: "Yield", value: `${dimensional?.yields || '-'} %` },
            { label: "Remarks", value: dimensional?.remarks }
        ];
        p2NextY = drawVerticalTable(doc, dimSubRows, col1X, p2NextY, 535) + 8;

        const dimInspections = safeParse(dimensional?.inspections, []);
        if (dimInspections.length > 0) {
            p2NextY = drawTable(doc, { headers: ['Cavity', 'Weight (kg)'], rows: dimInspections.map(r => [r['Cavity Number'], r['Casting Weight']]) }, col1X, p2NextY, [267, 268]) + 15;
        } else { p2NextY += 15; }

        // Hardness
        const hardRowsForSection = safeParse(visual?.hardness, []);
        if (hardRowsForSection.length > 0) {
            const sectionRes = visual?.hardness_ok === null || visual?.hardness_ok === undefined ? "-" : (visual?.hardness_ok ? "OK" : "NOT OK");
            doc.font('Helvetica-Bold').fontSize(7).text(`Hardness Inspection (Result: ${sectionRes})`, col1X, p2NextY, { width: 535 });
            p2NextY += 10;
            if (visual?.hardness_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${visual?.hardness_remarks}`, col1X, p2NextY, { width: 535 });
                p2NextY += doc.heightOfString(visual.hardness_remarks, { width: 535 }) + 2;
            }
            const headers = ['Cavity No', 'Inspected Qty', 'Accepted Qty', 'Rejected Qty', 'Rej %', 'Reason'];
            const rows = hardRowsForSection.map(r => Object.keys(hardRowsForSection[0]).map(h => r[h]));
            const colWidths = headers.map(() => 535 / headers.length);
            p2NextY = drawTable(doc, { headers, rows }, col1X, p2NextY, colWidths) + 15;
        }

        // NDT
        const ndtRowsForSection = safeParse(visual?.ndt_inspection, []);
        if (ndtRowsForSection.length > 0) {
            const sectionRes = visual?.ndt_inspection_ok === null || visual?.ndt_inspection_ok === undefined ? "-" : (visual?.ndt_inspection_ok ? "OK" : "NOT OK");
            doc.font('Helvetica-Bold').fontSize(7).text(`NDT Inspection Analysis (Result: ${sectionRes})`, col1X, p2NextY, { width: 535 });
            p2NextY += 10;
            if (visual?.ndt_inspection_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${visual?.ndt_inspection_remarks}`, col1X, p2NextY, { width: 535 });
                p2NextY += doc.heightOfString(visual.ndt_inspection_remarks, { width: 535 }) + 2;
            }
            const headers = ['Cavity No', 'Inspected Qty', 'Accepted Qty', 'Rejected Qty', 'Rej %', 'Reason'];
            const rows = ndtRowsForSection.map(r => Object.keys(ndtRowsForSection[0]).map(h => r[h]));
            const colWidths = headers.map(() => 535 / headers.length);
            p2NextY = drawTable(doc, { headers, rows }, col1X, p2NextY, colWidths) + 15;
        }

        // 8. Machine Shop
        const mcInspections = safeParse(mcShop?.inspections, []);
        if (Object.keys(mcShop).length > 0) {
            p2y = drawVerticalTable(doc, [
                { label: "Date", value: mcShop?.inspection_date ? new Date(mcShop.inspection_date).toISOString().slice(0, 10) : '-' },
                { label: "Remarks", value: mcShop?.remarks }
            ], col1X, p2y, colWidth * 2 + 15) + 8;

            if (mcInspections.length > 0) {
                const labelMap = {
                    'Cavity Number': 'Cavity No',
                    'FDY OK Quantity': 'FDY OK Qty',
                    'Received Quantity': 'Received Qty',
                    'Inspected Quantity': 'Inspected Qty',
                    'Rejected Quantity': 'Rejected Qty',
                    'Accepted Quantity': 'Accepted Qty',
                    'Rejection Percentage': 'Rej %',
                    'Reason for rejection': 'Reason'
                };
                const headers = Object.keys(mcInspections[0]).map(h => labelMap[h] || h);
                const rows = mcInspections.map(r => Object.keys(mcInspections[0]).map(h => r[h]));
                const colW = 535 / headers.length;
                p2y = drawTable(doc, { headers, rows }, col1X, p2y, headers.map(() => colW)) + 15;
            }
        }

        // 9. PRODUCTION & REJECTION DETAILS
        const allCavitiesForSummary = visInspections.map(r => r['Cavity Number']).filter(Boolean);
        if (allCavitiesForSummary.length > 0) {
            if (p2y > 650) {
                doc.addPage();
                p2y = 40;
                doc.font('Helvetica-Bold').fontSize(8.5).text(`Part Name: ${trialCard?.part_name || "-"} | Pattern Code: ${trialCard?.pattern_code || "-"}`, 30, 20);
                doc.moveTo(30, 35).lineTo(565, 35).stroke();
            }

            p2y = drawSectionTitle(doc, "PRODUCTION & REJECTION DETAILS", col1X, p2y);

            const productionCount = trialCard?.actual_moulds || 0;
            const totalProduction = productionCount * allCavitiesForSummary.length;

            const getSummVal = (array, cav, key) => {
                const row = Object.values(array).find(r => r['Cavity Number'] === cav);
                const val = parseFloat(row?.[key] || 0);
                return isNaN(val) ? 0 : val;
            };

            const getRejPct = (rejArr) => {
                if (totalProduction === 0) return "0.00%";
                const totalRej = rejArr.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
                return ((totalRej / totalProduction) * 100).toFixed(2) + "%";
            };

            const visRejVals = allCavitiesForSummary.map(c => getSummVal(visInspections, c, 'Rejected Quantity'));
            const hardRejVals = allCavitiesForSummary.map(c => getSummVal(hardRowsForSection, c, 'Rejected Quantity'));
            const ndtRejVals = allCavitiesForSummary.map(c => getSummVal(ndtRowsForSection, c, 'Rejected Quantity'));
            const mcRejVals = allCavitiesForSummary.map(c => getSummVal(mcInspections, c, 'Rejected Quantity'));

            const visRejTotal = visRejVals.reduce((a, b) => a + b, 0);
            const hardRejTotal = hardRejVals.reduce((a, b) => a + b, 0);
            const ndtRejTotal = ndtRejVals.reduce((a, b) => a + b, 0);
            const mcRejTotal = mcRejVals.reduce((a, b) => a + b, 0);

            const prodTotal = productionCount * allCavitiesForSummary.length;
            const prodRowsArr = ["Production", ...allCavitiesForSummary.map(() => productionCount), prodTotal];

            const visRejRowsArr = ["Visual Inspection Rejection", ...visRejVals, visRejTotal];
            const hardRejRowsArr = ["Hardness Inspection Rejection", ...hardRejVals, hardRejTotal];
            const ndtRejRowsArr = ["NDT X-Ray Rejection", ...ndtRejVals, ndtRejTotal];
            const mcRejRowsArr = ["M/C Rejection", ...mcRejVals, mcRejTotal];

            const calcOkRowsArr = ["Calculated OK Quantity"];
            const actualOkRowsArr = ["Actual OK Quantity"];
            const balanceRowsArr = ["Balance (Missed)"];

            allCavitiesForSummary.forEach((c, i) => {
                const v = visRejVals[i];
                const h = hardRejVals[i];
                const n = ndtRejVals[i];
                const m = mcRejVals[i];
                const calcRaw = productionCount - (v + h + n + m);
                calcOkRowsArr.push(calcRaw);

                const actRaw = getSummVal(mcInspections, c, 'Accepted Quantity');
                actualOkRowsArr.push(actRaw);
                balanceRowsArr.push(calcRaw - actRaw);
            });

            const calcOkTotal = calcOkRowsArr.slice(1).reduce((a, b) => a + b, 0);
            const actualOkTotal = actualOkRowsArr.slice(1).reduce((a, b) => a + b, 0);
            const balanceTotal = balanceRowsArr.slice(1).reduce((a, b) => a + b, 0);

            calcOkRowsArr.push(calcOkTotal);
            actualOkRowsArr.push(actualOkTotal);
            balanceRowsArr.push(balanceTotal);

            const summaryHeaders = ["Parameter", ...allCavitiesForSummary, "Total", "Rejection %", "Remarks"];

            const finalSummaryRows = [
                [...prodRowsArr, "-", ""],
                [...visRejRowsArr, getRejPct(visRejVals), visual?.remarks || "-"],
                [...hardRejRowsArr, getRejPct(hardRejVals), visual?.hardness_remarks || "-"],
                [...ndtRejRowsArr, getRejPct(ndtRejVals), visual?.ndt_inspection_remarks || "-"],
                [...mcRejRowsArr, getRejPct(mcRejVals), mcShop?.remarks || "-"],
                [...calcOkRowsArr, "-", ""],
                [...actualOkRowsArr, "-", ""],
                [...balanceRowsArr, "-", ""]
            ];

            const firstColW = 85;
            const totalColW = 40;
            const rejPctW = 50;
            const remarksW = 100;
            const remainingW = 535 - firstColW - totalColW - rejPctW - remarksW;
            const cavColW = remainingW / allCavitiesForSummary.length;
            const summaryColWidths = [firstColW, ...allCavitiesForSummary.map(() => cavColW), totalColW, rejPctW, remarksW];

            p2y = drawTable(doc, { headers: summaryHeaders, rows: finalSummaryRows }, col1X, p2y, summaryColWidths) + 15;
        }

        // ---- ATTACHMENTS (Per Trial) ----
        const attachments = data.documents || [];
        if (attachments.length > 0) {
            const groupedDocs = attachments.reduce((acc, d) => {
                const cat = d.document_type || 'GENERAL';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(d);
                return acc;
            }, {});

            doc.addPage();
            doc.font('Helvetica-Bold').fontSize(12).fillColor('#2c3e50')
                .text(`ATTACHMENTS (Trial No: ${trialCard?.trial_no})`, 30, 25, { align: 'center', width: 535 });
            doc.moveTo(30, 40).lineTo(565, 40).strokeColor('#2c3e50').stroke();

            let currentAttY = 55;
            let imageInPageCount = 0;
            const colWidth = 260;
            const xPos = [45, 305];

            for (const [category, docs] of Object.entries(groupedDocs)) {
                if (imageInPageCount % 2 !== 0) {
                    currentAttY += 225;
                    imageInPageCount = 0;
                }

                if (currentAttY > 730 || imageInPageCount >= 6) {
                    doc.addPage();
                    doc.font('Helvetica-Bold').fontSize(12).fillColor('#2c3e50')
                        .text(`ATTACHMENTS (Trial No: ${trialCard?.trial_no}) (Cont.)`, 30, 25, { align: 'center', width: 535 });
                    doc.moveTo(30, 40).lineTo(565, 40).strokeColor('#2c3e50').stroke();
                    currentAttY = 55;
                    imageInPageCount = 0;
                }

                // Print the department title inline
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#34495e')
                    .text(`Department: ${category.replace(/_/g, ' ')}`, 40, currentAttY);
                currentAttY += 18;
                doc.fillColor('black');

                for (const item of docs) {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.file_name);
                    const isPdf = /\.pdf$/i.test(item.file_name);

                    if (currentAttY > 730 || (isImage && imageInPageCount >= 6)) {
                        doc.addPage();
                        doc.font('Helvetica-Bold').fontSize(12).fillColor('#2c3e50')
                            .text(`ATTACHMENTS (Trial No: ${trialCard?.trial_no}) (Cont.)`, 30, 25, { align: 'center', width: 535 });
                        doc.moveTo(30, 40).lineTo(565, 40).strokeColor('#2c3e50').stroke();
                        currentAttY = 55;
                        imageInPageCount = 0;

                        doc.font('Helvetica-Bold').fontSize(10).fillColor('#34495e')
                            .text(`Department: ${category.replace(/_/g, ' ')} (Cont.)`, 40, currentAttY);
                        currentAttY += 18;
                        doc.fillColor('black');
                    }

                    if (isImage && !item.is_confidential) {
                        try {
                            const col = imageInPageCount % 2;
                            const drawX = xPos[col];
                            const base64Data = item.file_base64.replace(/^data:image\/\w+;base64,/, "");
                            const img = Buffer.from(base64Data, 'base64');
                            const maxWidth = 250;
                            const maxHeight = 180;

                            doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text(`- ${item.file_name}`, drawX, currentAttY, { width: 250 });

                            doc.image(img, drawX, currentAttY + 15, { fit: [maxWidth, maxHeight], align: 'center' });

                            const viewUrl = `${process.env.APP_URL || 'http://localhost:9011'}/view-document/${item.document_id}`;
                            doc.font('Helvetica').fontSize(7).fillColor('#2980b9')
                                .text("Click here to view full size", drawX, currentAttY + 15 + maxHeight + 5, {
                                    link: viewUrl,
                                    underline: true
                                });

                            imageInPageCount++;

                            if (imageInPageCount % 2 === 0) {
                                currentAttY += maxHeight + 45;
                            }
                        } catch (err) {
                            doc.font('Helvetica-Oblique').fontSize(8).fillColor('red').text(`[Error rendering image: ${item.file_name}]`, 45, currentAttY);
                            currentAttY += 20;
                        }
                    } else if (isPdf || item.is_confidential) {
                        if (imageInPageCount % 2 !== 0) {
                            currentAttY += 225;
                            imageInPageCount = 0;
                        }

                        if (currentAttY > 730) {
                            doc.addPage();
                            doc.font('Helvetica-Bold').fontSize(12).fillColor('#2c3e50')
                                .text(`ATTACHMENTS (Trial No: ${trialCard?.trial_no}) (Cont.)`, 30, 25, { align: 'center', width: 535 });
                            doc.moveTo(30, 40).lineTo(565, 40).strokeColor('#2c3e50').stroke();
                            currentAttY = 55;
                            imageInPageCount = 0;

                            doc.font('Helvetica-Bold').fontSize(10).fillColor('#34495e')
                                .text(`Category: ${category.replace(/_/g, ' ')} (Cont.)`, 40, currentAttY);
                            currentAttY += 18;
                            doc.fillColor('black');
                        }

                        const displayLabel = item.is_confidential ? `- ${item.file_name} (CONFIDENTIAL)` : `- ${item.file_name}`;
                        doc.font('Helvetica-Bold').fontSize(9).fillColor(item.is_confidential ? 'red' : 'black').text(displayLabel, 40, currentAttY);
                        currentAttY += 15;

                        const infoText = item.is_confidential
                            ? "Confidential Document (Access restricted to Admins alone; Contents not embedded in report)."
                            : "PDF Document (Contents not embedded in main report).";

                        doc.font('Helvetica').fontSize(8).fillColor('#666')
                            .text(infoText, 45, currentAttY);
                        currentAttY += 12;

                        const viewUrl = `${process.env.APP_URL || 'http://localhost:9011'}/view-document/${item.document_id}`;
                        doc.fillColor('#2980b9')
                            .text(item.is_confidential ? "Click here to view (Admin only)" : "Click here to view/download document", 45, currentAttY, {
                                link: viewUrl,
                                underline: true
                            });

                        doc.fillColor('black');
                        currentAttY += 30;
                    } else {
                        if (imageInPageCount % 2 !== 0) {
                            currentAttY += 225;
                            imageInPageCount = 0;
                        }
                        doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text(`- ${item.file_name}`, 40, currentAttY);
                        currentAttY += 15;
                        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#666').text("Format not supported for embedding.", 45, currentAttY);
                        currentAttY += 25;
                    }
                }
            }
        }
    }

    // Global footer addition (before doc.end())
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica').fontSize(8).fillColor('#666666')
           .text("QF/07/FYQ-04, Rev.No: 01 dt 01.11.2023", 30, 815, {
               align: 'left',
               width: 500
           });
    }

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);
            const base64PDF = pdfBuffer.toString('base64');
            const fileName = `Consolidated_Trial_Report_${pattern_code.replace(/\s+/g, '_')}.pdf`;

            try {
                const [existing] = await trx.query(
                    `SELECT document_id FROM consolidated_reports WHERE master_card_id = @masterCardId`,
                    { masterCardId }
                );

                if (existing && existing.length > 0) {
                    await trx.query(
                        `UPDATE consolidated_reports SET file_base64 = @file_base64, file_name = @file_name, uploaded_at = GETDATE() 
                         WHERE master_card_id = @masterCardId`,
                        { masterCardId, file_base64: base64PDF, file_name: fileName }
                    );
                } else {
                    await trx.query(
                        `INSERT INTO consolidated_reports (master_card_id, document_type, file_name, file_base64) 
                         VALUES (@masterCardId, 'CONSOLIDATED_REPORT', @file_name, @file_base64)`,
                        { masterCardId, file_name: fileName, file_base64: base64PDF }
                    );
                }
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
        doc.on('error', reject);
    });
};

