import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username tidak boleh kosong"),
  password: z.string().min(1, "Password tidak boleh kosong")
});

export const saveBiodataSchema = z.object({
  token_id: z.string().uuid("ID Token tidak valid"),
  client_id: z.string().uuid("ID Klien tidak valid").optional(),
  name: z.string().min(2, "Nama terlalu pendek").max(100, "Nama terlalu panjang"),
  birth_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Format tanggal tidak valid" }),
  gender: z.enum(["L", "P"], { message: "Jenis kelamin harus L atau P" }).optional().nullable(),
  school_or_institution: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  parent_name: z.string().optional().nullable(),
  parent_phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  registration_number: z.string().optional().nullable(),
  test_registration_number: z.string().optional().nullable(),
  target_institution: z.string().optional().nullable(),
  test_purpose: z.string().optional().nullable(),
  birth_place: z.string().optional().nullable(),
  birth_order: z.string().optional().nullable(),
  special_needs: z.string().optional().nullable(),
  parent_job: z.string().optional().nullable(),
  parent_education: z.string().optional().nullable()
});

export const saveResultSchema = z.object({
  test_result_id: z.string().uuid("ID Hasil Tes tidak valid"),
  resultsLog: z.array(z.any()).min(1, "Log hasil tidak boleh kosong"),
  clientData: z.any().optional()
});

export const useTokenSchema = z.object({
  code: z.string().min(5, "Format kode tidak valid").max(20, "Format kode tidak valid")
});
