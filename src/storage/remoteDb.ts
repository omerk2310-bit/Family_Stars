import type { Entity } from "../types/entities";
import { supabase } from "./supabaseClient";
import type { TableConfig } from "./tableMap";

export async function getCollection<T extends Entity>(config: TableConfig<T>): Promise<T[]> {
  const { data, error } = await supabase.from(config.table).select("*");
  if (error) throw error;
  return (data ?? []).map((row) => config.fromRow(row));
}

export async function upsertRow<T extends Entity>(config: TableConfig<T>, item: T): Promise<T> {
  const row = config.toRow(item);
  const { data, error } = await supabase.from(config.table).upsert(row, { onConflict: "id" }).select().single();
  if (error) throw error;
  return config.fromRow(data);
}

export async function removeRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function archiveRow<T extends Entity & { archived?: boolean }>(
  config: TableConfig<T>,
  id: string,
  archived: boolean
): Promise<T> {
  const { data, error } = await supabase.from(config.table).update({ archived }).eq("id", id).select().single();
  if (error) throw error;
  return config.fromRow(data);
}

export async function bulkUpsert<T extends Entity>(config: TableConfig<T>, items: T[]): Promise<void> {
  if (items.length === 0) return;
  const rows = items.map((item) => config.toRow(item));
  const { error } = await supabase.from(config.table).upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
