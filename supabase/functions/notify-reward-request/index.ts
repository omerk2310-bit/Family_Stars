import { createClient } from "npm:@supabase/supabase-js@2.110.0";
import { sendToSubscriptions, type PushSubscriptionRow } from "../_shared/webpush.ts";

interface RedemptionRow {
  id: string;
  user_id: string;
  reward_id: string;
  child_id: string | null;
  status: string;
}

interface WebhookPayload {
  type: "INSERT";
  table: "reward_redemptions";
  record: RedemptionRow;
}

Deno.serve(async (req) => {
  const { record } = (await req.json()) as WebhookPayload;
  if (record.status !== "pending") {
    return new Response("not pending, skipped", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [{ data: reward }, { data: child }, { data: subscriptions }] = await Promise.all([
    supabase.from("rewards").select("title").eq("id", record.reward_id).single(),
    record.child_id
      ? supabase.from("children").select("display_name").eq("id", record.child_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("device_role", "parent")
      .eq("user_id", record.user_id)
      .returns<PushSubscriptionRow[]>(),
  ]);

  if (!subscriptions || subscriptions.length === 0) {
    return new Response("no subscriptions", { status: 200 });
  }

  const childName = child?.display_name ?? "ילד/ה";
  const rewardTitle = reward?.title ?? "פרס";
  const { deadSubscriptionIds } = await sendToSubscriptions(subscriptions, {
    title: "🎁 בקשת פרס חדשה",
    body: `${childName} ביקשה: ${rewardTitle}`,
    tag: "reward-request",
    url: "/",
  });

  if (deadSubscriptionIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", deadSubscriptionIds);
  }

  return new Response("ok", { status: 200 });
});
