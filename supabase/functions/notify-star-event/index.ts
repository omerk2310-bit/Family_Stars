import { createClient } from "npm:@supabase/supabase-js@2.110.0";
import { computeGrants } from "../_shared/economy/engine.ts";
import type { EconomyConfig, EngineStarEvent } from "../_shared/economy/types.ts";
import { sendToSubscriptions, type PushSubscriptionRow } from "../_shared/webpush.ts";

interface StarEventRow {
  id: string;
  user_id: string;
  child_id: string;
  behavior_id: string;
  points_awarded: number;
  created_at: string;
  status: "pending" | "approved" | "rejected";
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: "star_events";
  record: StarEventRow;
  old_record?: StarEventRow;
}

const WINDOW_LABELS: Record<string, string> = { daily: "היומי", weekly: "השבועי", monthly: "החודשי" };

Deno.serve(async (req) => {
  const { record, old_record } = (await req.json()) as WebhookPayload;

  // Children now submit stars as pending requests (INSERT with
  // status:"pending"); only an approval (status becomes "approved", whether
  // via INSERT — admin corrections / red-event repairs, which are inserted
  // pre-approved — or via UPDATE when a parent approves a request) should
  // notify. Skip everything else, including re-fires on an already-approved
  // row being touched again for an unrelated reason.
  if (record.status !== "approved" || old_record?.status === "approved") {
    return new Response("not a new approval, skipped", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [{ data: child }, { data: settings }, { data: subscriptions }] = await Promise.all([
    supabase.from("children").select("display_name").eq("id", record.child_id).single(),
    supabase
      .from("app_settings")
      .select("economy_config, economy_starts_at")
      .eq("user_id", record.user_id)
      .single(),
    supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("device_role", "child")
      .eq("child_id", record.child_id)
      .returns<PushSubscriptionRow[]>(),
  ]);

  if (!subscriptions || subscriptions.length === 0) {
    return new Response("no subscriptions", { status: 200 });
  }

  const childName = child?.display_name ?? "הילד/ה";
  const { deadSubscriptionIds: deadFromTick } = await sendToSubscriptions(subscriptions, {
    title: "⭐ קיבלת כוכב!",
    body: `${childName} קיבלה כוכב חדש.`,
    tag: "star-tick",
    url: "/",
  });

  // Re-derive tier state the same way the client does (same pure engine, same
  // events-since-cutover filter) to see whether this exact insert is what
  // just crossed a tier's target — if so, fire a second, tier-labeled push.
  let deadFromGoal: string[] = [];
  if (settings) {
    const economyConfig = settings.economy_config as EconomyConfig;
    const economyStartsAt = settings.economy_starts_at as string;

    const { data: recentEvents } = await supabase
      .from("star_events")
      .select("id, child_id, behavior_id, points_awarded, created_at, status")
      .eq("child_id", record.child_id)
      .eq("status", "approved")
      .gte("created_at", economyStartsAt)
      .returns<StarEventRow[]>();

    const engineEvents: EngineStarEvent[] = (recentEvents ?? []).map((e) => ({
      id: e.id,
      childId: e.child_id,
      behaviorId: e.behavior_id,
      tierId: "bronze",
      amount: e.points_awarded,
      timestamp: e.created_at,
      source: "parent",
    }));

    const grants = computeGrants(engineEvents, economyConfig, new Date());
    const crossedByThisEvent = grants.find((g) => g.grantedAt === record.created_at);

    if (crossedByThisEvent) {
      const tier = economyConfig.tiers.find((t) => t.id === crossedByThisEvent.tierId);
      const periodLabel = tier ? WINDOW_LABELS[tier.window] ?? "" : "";
      const result = await sendToSubscriptions(subscriptions, {
        title: "🎯 הגעת ליעד!",
        body: `${childName} השלימה את היעד ${periodLabel} (${tier?.label ?? crossedByThisEvent.tierId})!`,
        tag: `tier-goal-${crossedByThisEvent.tierId}`,
        url: "/",
      });
      deadFromGoal = result.deadSubscriptionIds;
    }
  }

  const deadIds = [...new Set([...deadFromTick, ...deadFromGoal])];
  if (deadIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", deadIds);
  }

  return new Response("ok", { status: 200 });
});
