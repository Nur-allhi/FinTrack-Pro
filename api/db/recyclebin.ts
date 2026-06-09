import { db } from "../db.js";
import { restoreOne, permanentDeleteOne } from "./queries.js";

export type RecycleBinEntityType = "transactions" | "accounts" | "loans" | "members";

const LABEL_MAP: Record<RecycleBinEntityType, string> = {
  transactions: "Transaction",
  accounts: "Account",
  loans: "Loan",
  members: "Member",
};

interface DeletedRow {
  id: number;
  deleted_at: string;
  user_id?: string;
  [key: string]: unknown;
}

export async function getDeletedItems(userId: string, type?: RecycleBinEntityType) {
  const tables: RecycleBinEntityType[] = type ? [type] : ["transactions", "accounts", "loans", "members"];
  const results: Array<{ entity_type: RecycleBinEntityType; entity_label: string; id: number; deleted_at: string; summary: string }> = [];

  for (const table of tables) {
    const { data, error } = await db()
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) throw error;

    for (const row of (data || []) as DeletedRow[]) {
      results.push({
        entity_type: table,
        entity_label: LABEL_MAP[table],
        id: row.id,
        deleted_at: row.deleted_at,
        summary: summarizeRow(table, row),
      });
    }
  }

  results.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
  return results;
}

function summarizeRow(table: RecycleBinEntityType, row: DeletedRow): string {
  switch (table) {
    case "transactions":
      return `${row.particulars || ""} (${row.amount})`;
    case "accounts":
      return `${row.name || "Unnamed"}`;
    case "loans":
      return `${row.borrower_name || "Loan"} — ${row.amount}`;
    case "members":
      return `${row.name || "Unnamed Member"}`;
    default:
      return "";
  }
}

export async function restoreItem(userId: string, type: RecycleBinEntityType, id: number) {
  await restoreOne(type, userId, id);
}

export async function permanentDeleteItem(userId: string, type: RecycleBinEntityType, id: number) {
  await permanentDeleteOne(type, userId, id);
}

export async function emptyRecycleBin(userId: string, type?: RecycleBinEntityType) {
  const tables: RecycleBinEntityType[] = type ? [type] : ["transactions", "accounts", "loans", "members"];
  for (const table of tables) {
    const { data, error } = await db()
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .not("deleted_at", "is", null);
    if (error) throw error;
    for (const row of (data || []) as { id: number }[]) {
      await permanentDeleteOne(table, userId, row.id);
    }
  }
}
