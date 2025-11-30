import express from 'express';
import { query } from '../index.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';

const router = express.Router();

// POST /api/trial - Insert trial data into trial_november table
router.post('/', async (req, res) => {
  try {
    const {
      trial_no,
      pattern_code,
      part_name,
      material_grade,
      machine_used,
      sampling_date,
      no_of_moulds,
      reason_for_sampling,
      sample_traceability,
      tooling_type,
      tooling_modification_files,
      pattern_data_sheet_files,
      std_doc_files,
      mould_correction_details,
      current_department = 'methods',
      created_by = 'system',
      status = 'draft',
      submitted_to_sand = 0,
      sand_analysis_completed = 0
    } = req.body;

    console.log('🔧 DEBUG - Received trial data:', req.body);

    // Validate required fields
    const requiredFields = [
      'trial_no', 'pattern_code', 'part_name', 'machine_used', 
      'sampling_date', 'no_of_moulds', 'reason_for_sampling', 
      'sample_traceability', 'tooling_type'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Prepare the SQL insert query for trial_november table
    const sql = `
      INSERT INTO trial_november (
        trial_no, pattern_code, part_name, material_grade, machine_used,
        sampling_date, no_of_moulds, reason_for_sampling, sample_traceability,
        tooling_type, tooling_modification_files, pattern_data_sheet_files,
        std_doc_files, mould_correction_details, current_department,
        created_by, status, submitted_to_sand, sand_analysis_completed
      ) VALUES (
        @trial_no, @pattern_code, @part_name, @material_grade, @machine_used,
        @sampling_date, @no_of_moulds, @reason_for_sampling, @sample_traceability,
        @tooling_type, @tooling_modification_files, @pattern_data_sheet_files,
        @std_doc_files, @mould_correction_details, @current_department,
        @created_by, @status, @submitted_to_sand, @sand_analysis_completed
      )
    `;

    const params = [
      { trial_no },
      { pattern_code },
      { part_name },
      { material_grade: material_grade || null },
      { machine_used },
      { sampling_date },
      { no_of_moulds: parseInt(no_of_moulds) || 0 },
      { reason_for_sampling },
      { sample_traceability },
      { tooling_type },
      { tooling_modification_files: tooling_modification_files ? JSON.stringify(tooling_modification_files) : null },
      { pattern_data_sheet_files: pattern_data_sheet_files ? JSON.stringify(pattern_data_sheet_files) : null },
      { std_doc_files: std_doc_files ? JSON.stringify(std_doc_files) : null },
      { mould_correction_details: mould_correction_details ? JSON.stringify(mould_correction_details) : null },
      { current_department },
      { created_by },
      { status },
      { submitted_to_sand: submitted_to_sand ? 1 : 0 },
      { sand_analysis_completed: sand_analysis_completed ? 1 : 0 }
    ];

    console.log('🔧 DEBUG - Executing SQL with params:', params);

    const result = await query(sql, params);

    res.status(201).json({
      success: true,
      message: 'Trial data inserted successfully',
      data: {
        id: result.insertId,
        trial_no,
        pattern_code,
        part_name
      }
    });

  } catch (error) {
    console.error('❌ Error inserting trial data:', error);
    
    // Handle duplicate trial_no error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Trial number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to insert trial data',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
});

// GET /api/trial/id - Generate trial ID
router.get('/id', asyncErrorHandler(async (req, res, next) => {
  let part_name = req.query.part_name;
  if (!part_name) {
    return res.status(400).json({ message: 'part_name query parameter is required' });
  }

  part_name = String(part_name).replace(/['"]+/g, '');

  // Use query helper to count existing trials for this part
  const rows = await query('SELECT COUNT(*) AS count FROM trial_cards WHERE part_name = ?', [part_name]);
  const existingCount = (rows && rows[0] && typeof rows[0].count !== 'undefined') ? Number(rows[0].count) : 0;

  const count = existingCount + 1;
  const formattedId = `${part_name}-${count}`;
  res.status(200).json({ trialId: formattedId });
}));

// GET /api/trial - Get all trials
router.get('/', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM trial_november ORDER BY created_at DESC');
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching trials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trials'
    });
  }
});

export default router;