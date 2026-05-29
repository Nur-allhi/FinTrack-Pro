import { z } from "zod";

export const memberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  relationship: z.string().max(100).trim().optional(),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  type: z.string().min(1, "Type is required").max(50).trim(),
  member_id: z.number().int().positive().optional(),
  parent_id: z.number().int().positive().optional(),
  color: z.string().max(9).optional(),
  initial_balance: z.number().optional(),
});

export const accountUpdateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  color: z.string().max(9).optional(),
  archived: z.number().int().min(0).max(1).optional(),
  type: z.string().max(50).trim().optional(),
  member_id: z.number().int().positive().optional().nullable(),
  parent_id: z.number().int().positive().optional().nullable(),
  initial_balance: z.number().optional(),
});

export const transactionSchema = z.object({
  account_id: z.number().int().positive(),
  date: z.string().min(1).max(20),
  particulars: z.string().min(1).max(500).trim(),
  category: z.string().max(100).trim().optional(),
  amount: z.number(),
  type: z.enum(["normal", "transfer", "loan", "loan_settle"]).optional(),
  linked_transaction_id: z.number().int().positive().optional(),
  summary: z.string().max(1000).optional().nullable(),
});

export const transactionUpdateSchema = z.object({
  date: z.string().min(1).max(20).optional(),
  particulars: z.string().min(1).max(500).trim().optional(),
  category: z.string().max(100).trim().optional().nullable(),
  amount: z.number().optional(),
  summary: z.string().max(1000).optional().nullable(),
});

export const loanSchema = z.object({
  lender_account_id: z.number().int().positive(),
  borrower_account_id: z.number().int().positive().optional(),
  borrower_name: z.string().max(100).trim().optional(),
  amount: z.number().positive(),
  date_given: z.string().min(1).max(20),
  due_date: z.string().max(20).optional().nullable(),
  interest_rate: z.number().min(0).optional().nullable(),
  particulars: z.string().max(500).trim().optional(),
});

export const loanUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  due_date: z.string().max(20).optional().nullable(),
  interest_rate: z.number().min(0).optional().nullable(),
  particulars: z.string().max(500).trim().optional(),
  status: z.enum(["active", "settled"]).optional(),
  borrower_name: z.string().max(100).trim().optional().nullable(),
});

export const loanSettleSchema = z.object({
  amount: z.number().positive().optional(),
});

export const groupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  member_id: z.number().int().positive().optional(),
  color: z.string().max(9).optional(),
});

export const groupUpdateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  color: z.string().max(9).optional(),
  member_id: z.number().int().positive().optional().nullable(),
});

export const investmentSchema = z.object({
  account_id: z.number().int().positive(),
  principal: z.number(),
  date: z.string().min(1).max(20),
});

export const investmentReturnSchema = z.object({
  date: z.string().min(1).max(20),
  amount: z.number(),
  percentage: z.number().optional(),
});

export const transferSchema = z.object({
  from_account_id: z.number().int().positive(),
  to_account_id: z.number().int().positive(),
  date: z.string().min(1).max(20),
  amount: z.number(),
  particulars: z.string().max(500).trim().optional(),
});

export const categoryRenameSchema = z.object({
  oldName: z.string().min(1).max(100).trim(),
  newName: z.string().min(1).max(100).trim(),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { success: false, error: message };
  }
  return { success: true, data: result.data };
}
