export type SettingsTab =
  | "children"
  | "behaviors"
  | "heartTypes"
  | "redTypes"
  | "rewards"
  | "global"
  | "data"
  | "admin";

export type Route =
  | { screen: "home" }
  | { screen: "child"; childId: string }
  | { screen: "familyHearts" }
  | { screen: "redEvents" }
  | { screen: "rewards" }
  | { screen: "weeklySummary" }
  | { screen: "settings"; tab?: SettingsTab }
  | { screen: "pendingApprovals" };
