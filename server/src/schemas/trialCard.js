import { z } from 'zod';

const jsonValueSchema = z.lazy(() =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.record(z.string(), z.lazy(() => jsonValueSchema).optional()),
        z.array(z.lazy(() => jsonValueSchema)),
    ])
);

export const trialCardSchema = z.object({
    trial_id: z.union([z.number(), z.string()]).optional().nullable(),
    trial_no: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive("Trial Number is required")),
    part_name: z.string().min(1, "Part Name is required").max(100),
    pattern_code: z.string().min(1, "Pattern Code is required").max(150),
    material_grade: z.string().min(1, "Material Grade is required").max(50),
    trial_type: z.enum(['INHOUSE MACHINING(NPD)', 'INHOUSE MACHINING(REGULAR)', 'MACHINING - CUSTOMER END'], {
        message: "Please select a valid Trial Type"
    }).default('INHOUSE MACHINING(NPD)'),
    initiated_by: z.string().min(1, "Initiated by is required").max(50),
    date_of_sampling: z.string().or(z.date()),
    plan_moulds: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    reason_for_sampling: z.string().optional().nullable(),
    status: z.enum(['CREATED', 'IN_PROGRESS', 'CLOSED'], {
        message: "Invalid status selected"
    }).default('CREATED'),
    tooling_modification: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    current_department_id: z.number().int().optional().nullable(),
    disa: z.string().max(50, "Disa must be 50 characters or less").optional().nullable(),
    sample_traceability: z.string().max(50, "Sample Traceability must be 50 characters or less").optional().nullable(),
    mould_correction: jsonValueSchema.optional().nullable(),
    is_edit: z.boolean().default(true)
});

export const updateTrialCardSchema = trialCardSchema.partial();
