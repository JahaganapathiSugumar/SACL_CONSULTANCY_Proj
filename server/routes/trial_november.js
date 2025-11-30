import express from 'express';
import { query } from '../index.js';

const router = express.Router();

// POST /api/trial-november - Insert trial data into trial_november table
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
      /* metallurgical spec fields may be provided by client */
      spec_c_percent,
      spec_si_percent,
      spec_mn_percent,
      spec_p_percent,
      spec_s_percent,
      spec_mg_percent,
      spec_cr_percent,
      spec_cu_percent,
      spec_nodularity_percent,
      spec_pearlite_percent,
      spec_carbide_percent,
      spec_tensile_strength,
      spec_yield_strength,
      spec_elongation_percent,
      spec_impact_cold,
      spec_impact_room,
      spec_hardness_surface,
      spec_hardness_core,
      spec_xray_inspection,
      spec_mpi,
      tooling_type,
      tooling_modification_files,
      pattern_data_sheet_files,
      std_doc_files,
      mould_correction_details,
      current_department = 'methods',
      created_by = 'system',
      status = 'draft',
      submitted_to_sand = false,
      sand_analysis_completed = false
    } = req.body;

    console.log('🔧 DEBUG - Received trial data:', req.body);

    // Prepare the SQL insert query to match current params
    const sql = `
      INSERT INTO trial_november (
        pattern_code, part_name, material_grade,
        trial_no, sampling_date, no_of_moulds, machine_used,
        reason_for_sampling, sample_traceability,
        spec_c_percent, spec_si_percent, spec_mn_percent, spec_p_percent, spec_s_percent,
        spec_mg_percent, spec_cr_percent, spec_cu_percent,
        spec_nodularity_percent, spec_pearlite_percent, spec_carbide_percent,
        spec_tensile_strength, spec_yield_strength, spec_elongation_percent, spec_impact_cold, spec_impact_room,
        spec_hardness_surface, spec_hardness_core, spec_xray_inspection, spec_mpi,
        tooling_type, pattern_data_sheet_files, std_doc_files, tooling_modification_files,
        mould_correction_details,
        current_department, status, submitted_to_sand, sand_analysis_completed, created_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`;

    const params = [
      pattern_code,
      part_name,
      material_grade || null,
      trial_no,
      sampling_date,
      parseInt(no_of_moulds) || 0,
      machine_used,
      reason_for_sampling,
      sample_traceability,
      spec_c_percent || null,
      spec_si_percent || null,
      spec_mn_percent || null,
      spec_p_percent || null,
      spec_s_percent || null,
      spec_mg_percent || null,
      spec_cr_percent || null,
      spec_cu_percent || null,
      spec_nodularity_percent || null,
      spec_pearlite_percent || null,
      spec_carbide_percent || null,
      spec_tensile_strength || null,
      spec_yield_strength || null,
      spec_elongation_percent || null,
      spec_impact_cold || null,
      spec_impact_room || null,
      spec_hardness_surface || null,
      spec_hardness_core || null,
      spec_xray_inspection || null,
      spec_mpi || null,
      tooling_type || null,
      pattern_data_sheet_files ? JSON.stringify(pattern_data_sheet_files) : null,
      std_doc_files ? JSON.stringify(std_doc_files) : null,
      tooling_modification_files ? JSON.stringify(tooling_modification_files) : null,
      mould_correction_details ? JSON.stringify(mould_correction_details) : null,
      current_department,
      status,
      submitted_to_sand ? 1 : 0,
      sand_analysis_completed ? 1 : 0,
      created_by || null
    ];

    console.log('🔧 DEBUG - Executing SQL:', sql);
    console.log('🔧 DEBUG - With params:', params);

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

// GET /api/trial-november - Get all trials
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM trial_november ORDER BY created_at DESC');
    
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