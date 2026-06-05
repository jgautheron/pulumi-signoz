// Minimal SigNoz Pulumi program: explicit Provider, one alert, one dashboard.
// Set SIGNOZ_ENDPOINT + SIGNOZ_ACCESS_TOKEN before `pulumi up`, or override via
// `pulumi config set --secret signoz:accessToken ...`.
import * as signoz from "@jooon/pulumi-signoz";

const provider = new signoz.Provider("signoz", {
  endpoint: process.env.SIGNOZ_ENDPOINT ?? "http://localhost:3301",
  accessToken: process.env.SIGNOZ_ACCESS_TOKEN!,
});

// Logs-based alert using the v5 / v2alpha1 schema. SigNoz >= 0.125 only
// accepts version "v5" rules; the condition + evaluation bodies are JSON
// blobs — export from the SigNoz UI ("Edit" → "Show JSON") to adapt.
//
// NOTE: SigNoz requires at least one notification channel in the threshold
// spec's `channels` array. Notification channels are admin-only and the
// upstream Terraform provider has no channel resource (as of v0.0.11), so
// create one in the SigNoz UI first and set `channels: ["<your-channel>"]`
// below — otherwise the create returns 400 "at least one channel is required".
const alert = new signoz.Alert(
  "pulumi-test-alert",
  {
    alert: "Pulumi smoke-test alert",
    alertType: "LOGS_BASED_ALERT",
    description: "Created from pulumi-signoz examples/basic-ts.",
    disabled: true, // disabled so the smoke test doesn't actually fire
    evalWindow: "5m0s",
    frequency: "1m0s",
    broadcastToAll: false,
    ruleType: "threshold_rule",
    version: "v5",
    schemaVersion: "v2alpha1",
    severity: "info",
    source: "https://github.com/jgautheron/pulumi-signoz",
    labels: {
      severity: "info",
      managedBy: "pulumi",
    },
    condition: JSON.stringify({
      compositeQuery: {
        queries: [
          {
            type: "builder_query",
            spec: {
              name: "A",
              stepInterval: 0,
              signal: "logs",
              source: "",
              aggregations: [{ expression: "count()" }],
              filter: { expression: "" },
              having: { expression: "" },
            },
          },
        ],
        panelType: "graph",
        queryType: "builder",
      },
      selectedQueryName: "A",
      thresholds: {
        kind: "basic",
        spec: [
          {
            name: "info",
            target: 1000,
            targetUnit: "",
            recoveryTarget: null,
            matchType: "1",
            op: "1",
            channels: [],
          },
        ],
      },
    }),
    evaluation: JSON.stringify({
      kind: "rolling",
      spec: { evalWindow: "5m0s", frequency: "1m0s" },
    }),
  },
  { provider },
);

const dashboard = new signoz.Dashboard(
  "pulumi-test-dashboard",
  {
    // The upstream provider's schema treats most of these as required even
    // when "empty" is meaningful. Real-world usage: export a working dashboard
    // from the SigNoz UI and paste the JSON sections here.
    name: "Pulumi smoke-test dashboard",
    title: "Pulumi smoke-test dashboard",
    description: "Created from pulumi-signoz examples/basic-ts.",
    layout: JSON.stringify([]),
    panelMap: JSON.stringify({}),
    widgets: JSON.stringify([]),
    variables: JSON.stringify({}),
    version: "1",
    uploadedGrafana: false,
    collapsableRowsMigrated: true,
  },
  { provider },
);

export const alertId = alert.id;
export const dashboardId = dashboard.id;
