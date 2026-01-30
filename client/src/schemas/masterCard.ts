import { z } from 'zod';

const jsonValueSchema: z.ZodType<any> = z.lazy(() =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.record(z.string(), jsonValueSchema.optional()),
        z.array(jsonValueSchema),
    ])
);

export const masterCardSchema = z.object({
    pattern_code: z.string().min(1, "Pattern Code is required").max(150, "Pattern Code too long"),
    part_name: z.string().min(1, "Part Name is required").max(200, "Part Name too long"),
    material_grade: z.string().max(100, "Material Grade too long").optional().nullable(),
    chemical_composition: z.record(z.string(), jsonValueSchema).optional().nullable(),
    micro_structure: z.string().optional().nullable(),
    tensile: z.string().optional().nullable(),
    impact: z.string().optional().nullable(),
    hardness: z.string().optional().nullable(),
    xray: z.string().optional().nullable(),
    number_of_cavity: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    cavity_identification: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    pattern_material: z.string().max(100, "Pattern Material must be 100 characters or less").optional().nullable(),
    core_weight: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    core_mask_thickness: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    estimated_casting_weight: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    estimated_bunch_weight: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    pattern_plate_thickness_sp: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    pattern_plate_weight_sp: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    core_mask_weight_sp: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    crush_pin_height_sp: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    pattern_plate_thickness_pp: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    pattern_plate_weight_pp: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    crush_pin_height_pp: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    yield_label: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    remarks: z.string().optional().nullable()
});

export type MasterCardInput = z.infer<typeof masterCardSchema>;
