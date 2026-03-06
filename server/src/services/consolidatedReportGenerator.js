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

// Helper to draw a table - HIGHLY OPTIMIZED
const drawTable = (doc, tableData, startX, startY, colWidths = []) => {
    let currentY = startY;
    const padding = 5;
    const fontSize = 7;
    const headerColor = '#f5f5f5';
    const pageBottom = 780;

    // 1. Calculate Heights
    doc.font('Helvetica-Bold').fontSize(fontSize);
    let headerHeight = 18;
    tableData.headers.forEach((header, i) => {
        const h = doc.heightOfString(header, { width: colWidths[i] - 2 * padding });
        if (h + padding * 2 > headerHeight) headerHeight = h + padding * 2;
    });

    let totalTableHeight = headerHeight;
    const rowHeights = [];
    doc.font('Helvetica').fontSize(fontSize);
    tableData.rows.forEach(row => {
        let dataRowHeight = 18;
        row.forEach((cell, i) => {
            const text = cell !== null && cell !== undefined ? String(cell) : '-';
            const h = doc.heightOfString(text, { width: colWidths[i] - 2 * padding });
            if (h + padding * 2 > dataRowHeight) dataRowHeight = h + padding * 2;
        });
        rowHeights.push(dataRowHeight);
        totalTableHeight += dataRowHeight;
    });

    // 2. Pagination Check
    if (currentY + totalTableHeight > pageBottom) {
        doc.addPage();
        currentY = 40;
    }

    // 3. Draw Headers
    doc.font('Helvetica-Bold').fontSize(fontSize);
    let currentX = startX;
    doc.save();
    doc.fillColor(headerColor)
        .rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), headerHeight)
        .fill();
    doc.restore();

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
        const dataRowHeight = rowHeights[ri];

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
            .text('CONSOLIDATED INSPECTION REPORT', 30, 20, { align: 'left' });
        doc.fontSize(10)
            .text(`Pattern: ${pattern_code}   |   Page: ${i * 2 + 1}`, 30, 42, { align: 'left' });
        doc.fillColor('black');

        let y = 80;
        const col1X = 30;
        const col2X = 305;
        const colWidth = 260;

        // 1. Trial Card Details (Top Left)
        let yLeft = drawSectionTitle(doc, "1. TRIAL CARD DETAILS", col1X, y);
        const trialRows = [
            { label: "Part Name", value: trialCard?.part_name },
            { label: "Pattern Code", value: trialCard?.pattern_code },
            { label: "Trial No", value: trialCard?.trial_no },
            { label: "Date of Sampling", value: trialCard?.date_of_sampling ? new Date(trialCard.date_of_sampling).toISOString().slice(0, 10) : '-' },
            { label: "Mould Count (P/A)", value: `${trialCard?.plan_moulds || trialCard?.no_of_moulds || '-'} / ${trialCard?.actual_moulds || '-'}` },
            { label: "Machine", value: trialCard?.disa },
            { label: "Reason", value: trialCard?.reason_for_sampling },
            { label: "Remarks", value: trialCard?.remarks },
        ];
        yLeft = drawVerticalTable(doc, trialRows, col1X, yLeft, colWidth) + 12;

        // 1.1 Met Spec (Top Right)
        let yRight = drawSectionTitle(doc, "1.1 METALLURGICAL SPECIFICATION", col2X, y);
        const specChem = safeParse(matCorr?.chemical_composition, {});
        const actualChem = safeParse(pouring?.composition, {});

        // Chem Actual Table
        const chemRows = [
            ["C", actualChem?.C],
            ["Si", actualChem?.Si],
            ["Mn", actualChem?.Mn],
            ["P", actualChem?.P],
            ["S", actualChem?.S],
            ["Mg", actualChem?.Mg],
            ["Cu", actualChem?.Cu],
            ["Cr", actualChem?.Cr]
        ];
        doc.font('Helvetica-Bold').fontSize(7).text("Chemical Elements (%)", col2X, yRight);
        yRight += 10;
        yRight = drawTable(doc, { headers: ["Ele", "Act"], rows: chemRows }, col2X, yRight, [130, 130]) + 12;

        let yNext = Math.max(yLeft, yRight);

        // 3. Pouring Details (Below)
        yNext = drawSectionTitle(doc, "2. POURING DETAILS", col1X, yNext);
        const pInoc = safeParse(pouring?.inoculation, {});
        const pouringRows = [
            { label: "Pour Date", value: pouring?.pour_date ? new Date(pouring.pour_date).toISOString().slice(0, 10) : '-' },
            { label: "Heat Code", value: pouring?.heat_code },
            { label: "Pouring Temp (°C)", value: pouring?.pouring_temp_c },
            { label: "Pouring Time (sec)", value: pouring?.pouring_time_sec },
            { label: "No. Mould Poured", value: pouring?.no_of_mould_poured },
            { label: "Inoculation Type", value: pInoc?.text },
            { label: "Stream/Inmould", value: `${pInoc?.stream || '-'} / ${pInoc?.inmould || '-'}` },
            { label: "Remarks", value: pouring?.remarks },
        ];
        yNext = drawVerticalTable(doc, pouringRows, col1X, yNext, 535) + 12;

        // 4. Sand Properties (Below Pouring)
        yNext = drawSectionTitle(doc, "3. SAND PROPERTIES", col1X, yNext);
        const sandRows = [
            { label: "Date", value: sand?.date ? new Date(sand.date).toISOString().slice(0, 10) : '-' },
            { label: "T. Clay / A. Clay %", value: `${sand?.t_clay || '-'} / ${sand?.a_clay || '-'}` },
            { label: "V.C.M. / L.O.I. %", value: `${sand?.vcm || '-'} / ${sand?.loi || '-'}` },
            { label: "A.F.S. / G.C.S.", value: `${sand?.afs || '-'} / ${sand?.gcs || '-'}` },
            { label: "M.O.I. / Comp.", value: `${sand?.moi || '-'} / ${sand?.compactability || '-'}` },
            { label: "Permeability", value: sand?.permeability },
            { label: "Remarks", value: sand?.remarks },
        ];
        yNext = drawVerticalTable(doc, sandRows, col1X, yNext, 535) + 12;

        // 5. Moulding (Below Sand)
        yNext = drawSectionTitle(doc, "4. MOULDING", col1X, yNext);
        const mouldRows = [
            { label: "Date", value: moulding?.date ? new Date(moulding.date).toISOString().slice(0, 10) : '-' },
            { label: "Thickness", value: moulding?.mould_thickness },
            { label: "Compressibility", value: moulding?.compressability },
            { label: "Squeeze Pressure", value: moulding?.squeeze_pressure },
            { label: "Mould Hardness", value: moulding?.mould_hardness },
            { label: "Remarks", value: moulding?.remarks },
        ];
        yNext = drawVerticalTable(doc, mouldRows, col1X, yNext, 535);

        // --- PAGE 2: INSPECTION DATA ---
        doc.addPage();
        let p2y = 40;

        // Header P2
        doc.font('Helvetica-Bold').fontSize(12).text(`Trial: ${trialCard?.trial_no} - Inspection Results   |   Page: ${i * 2 + 2}`, 30, 20);
        doc.moveTo(30, 35).lineTo(565, 35).stroke();

        // 5. Metallurgical Inspection
        p2y = drawSectionTitle(doc, "5. METALLURGICAL INSPECTION", col1X, p2y);
        const mechRows = safeParse(meta.mech_properties, []);
        const impactRows = safeParse(meta.impact_strength, []);
        const microRows = safeParse(meta.micro_structure, []);
        const metaHardRows = safeParse(meta.hardness, []);

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

            const headers = Object.keys(mechRows[0]);
            const rows = mechRows.map(r => headers.map(h => r[h]));
            const colWidths = headers.map(() => 250 / headers.length);
            metLeftY = drawTable(doc, { headers, rows }, col1X, metLeftY, colWidths) + 10;
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

            const headers = Object.keys(impactRows[0]);
            const rows = impactRows.map(r => headers.map(h => r[h]));
            const colWidths = headers.map(() => 250 / headers.length);
            metRightY = drawTable(doc, { headers, rows }, col2X, metRightY, colWidths) + 10;
        }

        p2y = Math.max(metLeftY, metRightY);

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

            const headers = Object.keys(microRows[0]);
            const rows = microRows.map(r => headers.map(h => r[h]));
            const colWidths = headers.map(() => colWidth / headers.length);
            metSubLeftY = drawTable(doc, { headers, rows }, col1X, metSubLeftY, colWidths) + 10;
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

            const headers = Object.keys(metaHardRows[0]);
            const rows = metaHardRows.map(r => headers.map(h => r[h]));
            const colWidths = headers.map(() => colWidth / headers.length);
            metSubRightY = drawTable(doc, { headers, rows }, col2X, metSubRightY, colWidths) + 10;
        }

        p2y = Math.max(metSubLeftY, metSubRightY) + 5;

        // 6. Visual & 7. Dimensional
        let visitY = p2y;
        let dimY = p2y;

        // Visual (Left)
        visitY = drawSectionTitle(doc, "6. VISUAL INSPECTION", col1X, visitY);

        const visualRes = visual?.visual_ok === null || visual?.visual_ok === undefined ? "-" : (visual?.visual_ok ? "OK" : "NOT OK");
        doc.font('Helvetica-Bold').fontSize(7).text(`Result: ${visualRes}`, col1X, visitY);
        visitY += 10;

        if (visual?.remarks) {
            doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${visual.remarks}`, col1X, visitY);
            visitY += 10;
        }
        visitY += 5;

        const visInspections = safeParse(visual?.inspections, []);
        if (visInspections.length > 0) {
            doc.font('Helvetica-Bold').fontSize(7).text("Visual Inspection Results", col1X, visitY);
            visitY += 10;
            visitY = drawTable(doc, { headers: ['Cav', 'Insp', 'Rej', 'Reason'], rows: visInspections.map(r => [r['Cavity Number'], r['Inspected Quantity'], r['Rejected Quantity'], r['Reason for rejection']]) }, col1X, visitY, [30, 30, 30, 170]) + 8;
        }

        // Dimensional (Right)
        dimY = drawSectionTitle(doc, "7. DIMENSIONAL INSPECTION", col2X, dimY);
        const dimSubRows = [
            { label: "Date", value: dimensional?.inspection_date ? new Date(dimensional.inspection_date).toISOString().slice(0, 10) : '-' },
            { label: "Weight", value: `${dimensional?.casting_weight || '-'} kg` },
            { label: "Yield", value: `${dimensional?.yields || '-'} %` },
            { label: "Remarks", value: dimensional?.remarks }
        ];
        dimY = drawVerticalTable(doc, dimSubRows, col2X, dimY, colWidth) + 8;
        const dimInspections = safeParse(dimensional?.inspections, []);
        if (dimInspections.length > 0) {
            dimY = drawTable(doc, { headers: ['Cavity', 'Weight (kg)'], rows: Array.isArray(dimInspections) ? dimInspections.map(r => [r['Cavity Number'], r['Casting Weight']]) : [] }, col2X, dimY, [130, 130]) + 8;
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
            p2y = drawSectionTitle(doc, "8. MACHINE SHOP INSPECTION", col1X, p2y);
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

        // 9. YIELD SUMMARY
        const allCavitiesForSummary = visInspections.map(r => r['Cavity Number']).filter(Boolean);
        if (allCavitiesForSummary.length > 0) {
            if (p2y > 650) {
                doc.addPage();
                p2y = 40;
                doc.font('Helvetica-Bold').fontSize(12).text(`Trial: ${trialCard?.trial_no || ""} - Yield Summary`, 30, 20);
                doc.moveTo(30, 35).lineTo(565, 35).stroke();
            }

            p2y = drawSectionTitle(doc, "9. YIELD SUMMARY", col1X, p2y);

            const productionCount = trialCard?.actual_moulds || 0;
            const summaryHeaders = ["Parameter", ...allCavitiesForSummary, "Remarks"];

            const getSummVal = (array, cav, key) => {
                const row = array.find(r => r['Cavity Number'] === cav);
                const val = parseFloat(row?.[key] || 0);
                return isNaN(val) ? 0 : val;
            };

            const prodRowsArr = ["Production", ...allCavitiesForSummary.map(() => productionCount)];
            const visRejRowsArr = ["Visual Inspection Rejection", ...allCavitiesForSummary.map(c => getSummVal(visInspections, c, 'Rejected Quantity'))];
            const hardRejRowsArr = ["Hardness Inspection Rejection", ...allCavitiesForSummary.map(c => getSummVal(hardRowsForSection, c, 'Rejected Quantity'))];
            const ndtRejRowsArr = ["NDT X-Ray Rejection", ...allCavitiesForSummary.map(c => getSummVal(ndtRowsForSection, c, 'Rejected Quantity'))];
            const mcRejRowsArr = ["M/C Rejection", ...allCavitiesForSummary.map(c => getSummVal(mcInspections, c, 'Rejected Quantity'))];

            const calcOkRowsArr = ["Calculated OK Quantity"];
            const actualOkRowsArr = ["Actual OK Quantity"];
            const balanceRowsArr = ["Balance (Missed)"];

            allCavitiesForSummary.forEach((c, i) => {
                const v = visRejRowsArr[i + 1];
                const h = hardRejRowsArr[i + 1];
                const n = ndtRejRowsArr[i + 1];
                const m = mcRejRowsArr[i + 1];
                const calcRaw = productionCount - (v + h + n + m);
                calcOkRowsArr.push(calcRaw);

                const actRaw = getSummVal(mcInspections, c, 'Accepted Quantity');
                actualOkRowsArr.push(actRaw);
                balanceRowsArr.push(calcRaw - actRaw);
            });

            const remarks = mcShop?.remarks || "-";
            const finalSummaryRows = [
                [...prodRowsArr, remarks],
                [...visRejRowsArr, ""],
                [...hardRejRowsArr, ""],
                [...ndtRejRowsArr, ""],
                [...mcRejRowsArr, ""],
                [...calcOkRowsArr, ""],
                [...actualOkRowsArr, ""],
                [...balanceRowsArr, ""]
            ];

            const firstColW = 85;
            const remarksW = 110;
            const remainingW = 535 - firstColW - remarksW;
            const cavColW = remainingW / allCavitiesForSummary.length;
            const summaryColWidths = [firstColW, ...allCavitiesForSummary.map(() => cavColW), remarksW];

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
                    .text(`ATTACHMENTS: ${category.replace(/_/g, ' ')} (Trial: ${trialCard?.trial_no})`, 30, 25, { align: 'center', width: 535 });
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

                    if (isImage) {
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
                    } else if (isPdf) {
                        if (imageInPageCount % 2 !== 0) {
                            currentAttY += 340;
                            imageInPageCount = 0;
                        }

                        if (currentAttY > 750) {
                            doc.addPage();
                            currentAttY = 55;
                        }

                        doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text(`- ${item.file_name}`, 40, currentAttY);
                        currentAttY += 15;
                        doc.font('Helvetica').fontSize(8).fillColor('#666')
                            .text("PDF Document (Contents not embedded in main report).", 45, currentAttY);
                        currentAttY += 12;

                        const viewUrl = `${process.env.API_BASE_URL || 'http://localhost:9012'}/api/documents/view/${item.document_id}`;
                        doc.fillColor('#2980b9')
                            .text("Click here to view/download document", 45, currentAttY, {
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

