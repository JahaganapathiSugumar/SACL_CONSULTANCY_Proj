import PDFDocument from 'pdfkit';

// Helper to fetch data (extracted from the controller logic)
export const fetchTrialData = async (trial_id, trx) => {
    if (!trial_id) return null;

    const [trial_cards] = await trx.query(
        `SELECT tc.*, mc.chemical_composition AS spec_chem, mc.micro_structure AS spec_micro 
         FROM trial_cards tc 
         LEFT JOIN master_card mc ON tc.pattern_code = mc.pattern_code 
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
    doc.moveTo(x, y + 11).lineTo(x + width, y + 11).strokeColor('#2c3e50').stroke(); // Underline
    return y + 18;
};

// Helper to fetch all trials for a part name
export const fetchAllTrialsDataForPatternCode = async (pattern_code, trx) => {
    if (!pattern_code) return [];

    const [trials] = await trx.query(
        `SELECT trial_id FROM trial_cards WHERE pattern_code = @pattern_code AND status = 'CLOSED' AND deleted_at IS NULL ORDER BY date_of_sampling ASC`,
        { pattern_code }
    );

    if (!trials || trials.length === 0) return [];

    const allTrialsData = [];
    for (const trial of trials) {
        const data = await fetchTrialData(trial.trial_id, trx);
        allTrialsData.push(data);
    }

    return allTrialsData;
};

export const generateAndStoreConsolidatedReport = async (pattern_code, trx) => {
    const allTrialsData = await fetchAllTrialsDataForPatternCode(pattern_code, trx);
    if (allTrialsData.length === 0) {
        await trx.query(
            `DELETE FROM consolidated_reports WHERE pattern_code = @pattern_code`,
            { pattern_code }
        );
        return;
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
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
        const col2X = 325;
        const colWidth = 240;

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

        // Sand Properties & Moulding Side-by-Side
        let ySand = yNext;
        let yMould = yNext;

        // Sand Properties (Left)
        ySand = drawSectionTitle(doc, "SAND PROPERTIES", col1X, ySand);
        const sandRows = [
            { label: "Date", value: sand?.date ? new Date(sand.date).toISOString().slice(0, 10) : '-' },
            { label: "T. Clay / A. Clay %", value: `${sand?.t_clay || '-'} / ${sand?.a_clay || '-'}` },
            { label: "V.C.M. / L.O.I. %", value: `${sand?.vcm || '-'} / ${sand?.loi || '-'}` },
            { label: "A.F.S. / G.C.S.", value: `${sand?.afs || '-'} / ${sand?.gcs || '-'}` },
            { label: "M.O.I. / Comp.", value: `${sand?.moi || '-'} / ${sand?.compactability || '-'}` },
            { label: "Permeability", value: sand?.permeability },
            { label: "Remarks", value: sand?.remarks },
        ];
        ySand = drawVerticalTable(doc, sandRows, col1X, ySand, colWidth) + 10;

        // Moulding (Right)
        yMould = drawSectionTitle(doc, "MOULDING", col2X, yMould);
        const mouldRows = [
            { label: "Date", value: moulding?.date ? new Date(moulding.date).toISOString().slice(0, 10) : '-' },
            { label: "Thickness", value: moulding?.mould_thickness },
            { label: "Compressibility", value: moulding?.compressability },
            { label: "Squeeze Pressure", value: moulding?.squeeze_pressure },
            { label: "Mould Hardness", value: moulding?.mould_hardness },
            { label: "Remarks", value: moulding?.remarks },
        ];
        yMould = drawVerticalTable(doc, mouldRows, col2X, yMould, colWidth) + 10;

        yNext = Math.max(ySand, yMould);

        // --- METALLURGICAL INSPECTION ---
        let p2y = yNext + 15;

        // Metallurgical Inspection
        p2y = drawSectionTitle(doc, "METALLURGICAL INSPECTION", col1X, p2y);
        const mechRows = safeParse(meta.mech_properties, []);
        const impactRows = safeParse(meta.impact_strength, []);
        const microRows = safeParse(meta.micro_structure, []);
        const metaHardRows = safeParse(meta.hardness, []);

        // --- Keep-Together Logic for Mech & Impact ---
        const mechHeaders = mechRows.length > 0 ? Object.keys(mechRows[0]) : [];
        const mechColWidths = mechHeaders.map(() => 250 / mechHeaders.length);
        const mechTableH = mechRows.length > 0 ? getTableHeight(doc, { headers: mechHeaders, rows: mechRows.map(r => mechHeaders.map(h => r[h])) }, mechColWidths) : 0;
        const mechTotalH = mechRows.length > 0 ? 10 + (meta?.mech_properties_remarks ? 10 : 0) + mechTableH + 10 : 0;

        const impactHeaders = impactRows.length > 0 ? Object.keys(impactRows[0]) : [];
        const impactColWidths = impactHeaders.map(() => 250 / impactHeaders.length);
        const impactTableH = impactRows.length > 0 ? getTableHeight(doc, { headers: impactHeaders, rows: impactRows.map(r => impactHeaders.map(h => r[h])) }, impactColWidths) : 0;
        const impactTotalH = impactRows.length > 0 ? 10 + (meta?.impact_strength_remarks ? 10 : 0) + impactTableH + 10 : 0;

        if (p2y + Math.max(mechTotalH, impactTotalH) > 780) {
            doc.addPage();
            p2y = 40;
        }

        let metLeftY = p2y;
        let metRightY = p2y;

        if (mechRows.length > 0) {
            const mechOk = meta?.mech_properties_ok;
            const mechRes = mechOk === null || mechOk === undefined ? "-" : (mechOk ? "OK" : "NOT OK");

            doc.font('Helvetica-Bold').fontSize(7).text(`Mechanical Properties (Result: ${mechRes})`, col1X, metLeftY);
            metLeftY += 10;
            if (meta?.mech_properties_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${meta.mech_properties_remarks}`, col1X, metLeftY);
                metLeftY += 10;
            }
            metLeftY = drawTable(doc, { headers: mechHeaders, rows: mechRows.map(r => mechHeaders.map(h => r[h])) }, col1X, metLeftY, mechColWidths) + 10;
        }

        if (impactRows.length > 0) {
            const impactOk = meta?.impact_strength_ok;
            const impactRes = impactOk === null || impactOk === undefined ? "-" : (impactOk ? "OK" : "NOT OK");

            doc.font('Helvetica-Bold').fontSize(7).text(`Impact Strength (Result: ${impactRes})`, col2X, metRightY);
            metRightY += 10;
            if (meta?.impact_strength_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${meta.impact_strength_remarks}`, col2X, metRightY);
                metRightY += 10;
            }
            metRightY = drawTable(doc, { headers: impactHeaders, rows: impactRows.map(r => impactHeaders.map(h => r[h])) }, col2X, metRightY, impactColWidths) + 10;
        }

        p2y = Math.max(metLeftY, metRightY);

        // --- Keep-Together Logic for Micro & Hardness ---
        const microHeaders = microRows.length > 0 ? Object.keys(microRows[0]) : [];
        const microColWidths = microHeaders.map(() => colWidth / microHeaders.length);
        const microTableH = microRows.length > 0 ? getTableHeight(doc, { headers: microHeaders, rows: microRows.map(r => microHeaders.map(h => r[h])) }, microColWidths) : 0;
        const microTotalH = microRows.length > 0 ? 10 + (meta?.micro_structure_remarks ? 10 : 0) + microTableH + 10 : 0;

        const hardHeaders = metaHardRows.length > 0 ? Object.keys(metaHardRows[0]) : [];
        const hardColWidths = hardHeaders.map(() => colWidth / hardHeaders.length);
        const hardTableH = metaHardRows.length > 0 ? getTableHeight(doc, { headers: hardHeaders, rows: metaHardRows.map(r => hardHeaders.map(h => r[h])) }, hardColWidths) : 0;
        const hardTotalH = metaHardRows.length > 0 ? 10 + (meta?.hardness_remarks ? 10 : 0) + hardTableH + 10 : 0;

        if (p2y + Math.max(microTotalH, hardTotalH) > 780) {
            doc.addPage();
            p2y = 40;
        }

        let metSubLeftY = p2y;
        let metSubRightY = p2y;

        if (microRows.length > 0) {
            const microOk = meta?.micro_structure_ok;
            const microRes = microOk === null || microOk === undefined ? "-" : (microOk ? "OK" : "NOT OK");

            doc.font('Helvetica-Bold').fontSize(7).text(`Microstructure (Result: ${microRes})`, col1X, metSubLeftY, { width: 260 });
            metSubLeftY += 10;
            if (meta?.micro_structure_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${meta.micro_structure_remarks}`, col1X, metSubLeftY, { width: 260 });
                metSubLeftY += 10;
            }
            metSubLeftY = drawTable(doc, { headers: microHeaders, rows: microRows.map(r => microHeaders.map(h => r[h])) }, col1X, metSubLeftY, microColWidths) + 10;
        }

        if (metaHardRows.length > 0) {
            const hardOk = meta?.hardness_ok;
            const hardRes = hardOk === null || hardOk === undefined ? "-" : (hardOk ? "OK" : "NOT OK");

            doc.font('Helvetica-Bold').fontSize(7).text(`Hardness Inspection (Result: ${hardRes})`, col2X, metSubRightY);
            metSubRightY += 10;
            if (meta?.hardness_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${meta.hardness_remarks}`, col2X, metSubRightY);
                metSubRightY += 10;
            }
            metSubRightY = drawTable(doc, { headers: hardHeaders, rows: metaHardRows.map(r => hardHeaders.map(h => r[h])) }, col2X, metSubRightY, hardColWidths) + 10;
        }

        p2y = Math.max(metSubLeftY, metSubRightY) + 5;

        // --- PAGE 2: INSPECTION DATA ---
        if (p2y > 100) {
            doc.addPage();
            p2y = 40;
        } else {
            p2y += 15;
        }

        // Header P2 (Simplified)
        doc.font('Helvetica-Bold').fontSize(8.5).text(`Part Name: ${trialCard?.part_name || "-"} | Pattern Code: ${trialCard?.pattern_code || "-"} | Trial No: ${trialCard?.trial_no || "-"}`, 30, p2y - 20);
        doc.moveTo(30, p2y - 5).lineTo(565, p2y - 5).stroke();

        let visitY = p2y;
        let dimY = p2y;

        // Visual (Left)
        visitY = drawSectionTitle(doc, "VISUAL INSPECTION", col1X, visitY);

        const visualRes = visual?.visual_ok === null || visual?.visual_ok === undefined ? "-" : (visual?.visual_ok ? "OK" : "NOT OK");
        doc.font('Helvetica-Bold').fontSize(7).text(`Result: ${visualRes}`, col1X, visitY);
        visitY += 10;

        const visInspections = safeParse(visual?.inspections, []);
        if (visInspections.length > 0) {
            visitY = drawTable(doc, { headers: ['Cav', 'Insp', 'Rej', 'Rej %', 'Reason'], rows: visInspections.map(r => [r['Cavity Number'], r['Inspected Quantity'], r['Rejected Quantity'], (r['Rejection Percentage'] || "0.00"), (r['Reason for rejection'] || "").substring(0, 15)]) }, col1X, visitY, [25, 25, 25, 25, 185]) + 8;
        }

        if (visual?.remarks) {
            doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${visual.remarks}`, col1X, visitY, { width: colWidth });
            visitY += doc.heightOfString(`Remarks: ${visual.remarks}`, { width: colWidth }) + 8;
        }

        // Dimensional (Right)
        dimY = drawSectionTitle(doc, "DIMENSIONAL INSPECTION", col2X, dimY);
        const dimSubRows = [
            { label: "Date", value: dimensional?.inspection_date ? new Date(dimensional.inspection_date).toISOString().slice(0, 10) : '-' },
            { label: "Weight", value: `${dimensional?.casting_weight || '-'} kg` },
            { label: "Yield", value: `${dimensional?.yields || '-'} %` },
            { label: "Remarks", value: dimensional?.remarks }
        ];
        dimY = drawVerticalTable(doc, dimSubRows, col2X, dimY, colWidth) + 8;

        const dimInspections = safeParse(dimensional?.inspections, []);
        if (dimInspections.length > 0) {
            dimY = drawTable(doc, { headers: ['Cavity', 'Weight (kg)'], rows: Array.isArray(dimInspections) ? dimInspections.map(r => [r['Cavity Number'], r['Casting Weight']]) : [] }, col2X, dimY, [100, 100]) + 8;
        }

        let p2NextY = Math.max(visitY, dimY) + 15;

        // NDT and Hardness Side-by-Side
        let ndtY = p2NextY;
        let hardY = p2NextY;

        // NDT (Left)
        const ndtRowsForSection = safeParse(visual?.ndt_inspection, []);
        if (ndtRowsForSection.length > 0) {
            const sectionOk = visual?.ndt_inspection_ok;
            const sectionRes = sectionOk === null || sectionOk === undefined ? "-" : (sectionOk ? "OK" : "NOT OK");

            doc.font('Helvetica-Bold').fontSize(7).text(`NDT Inspection Analysis (Result: ${sectionRes})`, col1X, ndtY, { width: colWidth });
            if (visual?.ndt_inspection_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${visual?.ndt_inspection_remarks}`, col1X, doc.y + 2, { width: colWidth });
            }
            ndtY = doc.y + 10;

            const headers = Object.keys(ndtRowsForSection[0]);
            const rows = ndtRowsForSection.map(r => headers.map(h => r[h]));
            const colWidths = headers.map(() => colWidth / headers.length);

            ndtY = drawTable(doc, { headers, rows }, col1X, ndtY, colWidths) + 15;
        }

        // Hardness (Right)
        const hardRowsForSection = safeParse(visual?.hardness, []);
        if (hardRowsForSection.length > 0) {
            const sectionOk = visual?.hardness_ok;
            const sectionRes = sectionOk === null || sectionOk === undefined ? "-" : (sectionOk ? "OK" : "NOT OK");

            doc.font('Helvetica-Bold').fontSize(7).text(`Hardness Inspection (Result: ${sectionRes})`, col2X, hardY, { width: colWidth });
            if (visual?.hardness_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${visual?.hardness_remarks}`, col2X, doc.y + 2, { width: colWidth });
            }
            hardY = doc.y + 10;

            const headers = Object.keys(hardRowsForSection[0]);
            const rows = hardRowsForSection.map(r => headers.map(h => r[h]));
            const colWidths = headers.map(() => colWidth / headers.length);

            hardY = drawTable(doc, { headers, rows }, col2X, hardY, colWidths) + 15;
        }

        p2NextY = Math.max(ndtY, hardY);

        p2y = p2NextY + 10;

        // 8. Machine Shop
        const mcInspections = safeParse(mcShop?.inspections, []);
        if (Object.keys(mcShop).length > 0) {
            p2y = drawSectionTitle(doc, "MACHINE SHOP INSPECTION", col1X, p2y);
            p2y = drawVerticalTable(doc, [
                { label: "Date", value: mcShop?.inspection_date ? new Date(mcShop.inspection_date).toISOString().slice(0, 10) : '-' },
                { label: "Remarks", value: mcShop?.remarks }
            ], col1X, p2y, colWidth * 2 + 15) + 8;

            if (mcInspections.length > 0) {
                const headers = Object.keys(mcInspections[0]);
                const rows = mcInspections.map(r => Object.values(r));
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

            for (const [category, docs] of Object.entries(groupedDocs)) {
                doc.addPage();
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#2c3e50')
                    .text(`ATTACHMENTS: ${category.replace(/_/g, ' ')} (Trial No: ${trialCard?.trial_no})`, 30, 25, { align: 'center', width: 535 });
                doc.moveTo(30, 40).lineTo(565, 40).strokeColor('#2c3e50').stroke();

                let currentAttY = 55;
                let imageInPageCount = 0;
                const colWidth = 260;
                const xPos = [45, 305];

                for (const item of docs) {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.file_name);
                    const isPdf = /\.pdf$/i.test(item.file_name);

                    if (currentAttY > 750 || (isImage && imageInPageCount >= 4)) {
                        doc.addPage();
                        currentAttY = 40;
                        imageInPageCount = 0;
                        doc.font('Helvetica-Bold').fontSize(12).fillColor('#2c3e50')
                            .text(`ATTACHMENTS: ${category.replace(/_/g, ' ')} (Cont.)`, 30, 25, { align: 'center', width: 535 });
                        doc.moveTo(30, 40).lineTo(565, 40).strokeColor('#2c3e50').stroke();
                        currentAttY = 55;
                    }

                    if (isImage && !item.is_confidential) {
                        try {
                            const col = imageInPageCount % 2;
                            const drawX = xPos[col];
                            const base64Data = item.file_base64.replace(/^data:image\/\w+;base64,/, "");
                            const img = Buffer.from(base64Data, 'base64');
                            const maxWidth = 250;
                            const maxHeight = 280;

                            doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text(`- ${item.file_name}`, drawX, currentAttY, { width: 250 });

                            doc.image(img, drawX, currentAttY + 15, { fit: [maxWidth, maxHeight], align: 'center' });

                            const viewUrl = `${process.env.API_BASE_URL || 'http://localhost:9012'}/api/documents/view/${item.document_id}`;
                            doc.font('Helvetica').fontSize(7).fillColor('#2980b9')
                                .text("Click here to view full size", drawX, currentAttY + 15 + maxHeight + 5, {
                                    link: viewUrl,
                                    underline: true
                                });

                            imageInPageCount++;

                            if (imageInPageCount % 2 === 0) {
                                currentAttY += maxHeight + 60;
                            }
                        } catch (err) {
                            doc.font('Helvetica-Oblique').fontSize(8).fillColor('red').text(`[Error rendering image: ${item.file_name}]`, 45, currentAttY);
                            currentAttY += 20;
                        }
                    } else if (isPdf || item.is_confidential) {
                        if (imageInPageCount % 2 !== 0) {
                            currentAttY += 340;
                            imageInPageCount = 0;
                        }

                        if (currentAttY > 750) {
                            doc.addPage();
                            currentAttY = 55;
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

                        const viewUrl = `${process.env.API_BASE_URL || 'http://localhost:9012'}/api/documents/view/${item.document_id}`;
                        doc.fillColor('#2980b9')
                            .text(item.is_confidential ? "Click here to view (Admin only)" : "Click here to view/download document", 45, currentAttY, {
                                link: viewUrl,
                                underline: true
                            });

                        doc.fillColor('black');
                        currentAttY += 30;
                    } else {
                        if (imageInPageCount % 2 !== 0) {
                            currentAttY += 340;
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

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);
            const base64PDF = pdfBuffer.toString('base64');
            const fileName = `Consolidated_Trial_Report_${pattern_code.replace(/\s+/g, '_')}.pdf`;

            try {
                const [existing] = await trx.query(
                    `SELECT document_id FROM consolidated_reports WHERE pattern_code = @pattern_code`,
                    { pattern_code }
                );

                if (existing && existing.length > 0) {
                    await trx.query(
                        `UPDATE consolidated_reports SET file_base64 = @file_base64, file_name = @file_name, uploaded_at = GETDATE() 
                         WHERE pattern_code = @pattern_code`,
                        { pattern_code, file_base64: base64PDF, file_name: fileName }
                    );
                } else {
                    await trx.query(
                        `INSERT INTO consolidated_reports (pattern_code, document_type, file_name, file_base64) 
                         VALUES (@pattern_code, 'CONSOLIDATED_REPORT', @file_name, @file_base64)`,
                        { pattern_code, file_name: fileName, file_base64: base64PDF }
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

