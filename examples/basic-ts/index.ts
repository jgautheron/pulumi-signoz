// End-to-end SigNoz Pulumi program exercising all 5 resources.
// Set SIGNOZ_ENDPOINT + SIGNOZ_ACCESS_TOKEN (admin) before `pulumi up`.
import * as pulumi from "@pulumi/pulumi";
import * as signoz from "@jooon/pulumi-signoz";

const provider = new signoz.Provider("signoz", {
  endpoint: process.env.SIGNOZ_ENDPOINT ?? "http://localhost:3301",
  accessToken: process.env.SIGNOZ_ACCESS_TOKEN!,
});

// Notification channel (admin-only). Receiver config goes in `data`.
const channel = new signoz.NotificationChannel(
  "alerts",
  {
    name: "pulumi-e2e-channel",
    data: JSON.stringify({
      webhook_configs: [{ send_resolved: false, url: "https://example.com/pulumi-e2e" }],
    }),
  },
  { provider },
);

// Dashboard — the whole definition as a single JSON blob.
const dashboard = new signoz.Dashboard(
  "overview",
  {
    data: JSON.stringify({
      title: "Pulumi e2e dashboard",
      description: "Created from pulumi-signoz examples/basic-ts.",
      tags: ["pulumi", "e2e"],
      layout: [],
      widgets: [],
    }),
  },
  { provider },
);

// Saved logs view.
const view = new signoz.SavedView(
  "errors",
  {
    name: "Pulumi e2e view",
    sourcePage: "logs",
    data: JSON.stringify({
      compositeQuery: {
        queryType: "builder",
        panelType: "list",
        builderQueries: {
          A: { dataSource: "logs", queryName: "A", aggregateOperator: "noop", expression: "A", disabled: false },
        },
      },
    }),
  },
  { provider },
);

// Logs-based alert (v5/v2alpha1) routing to the channel above.
const alert = new signoz.Alert(
  "errors",
  {
    alert: "Pulumi e2e alert",
    alertType: "LOGS_BASED_ALERT",
    severity: "info",
    // Use pulumi.jsonStringify (NOT JSON.stringify) because channel.name is an
    // Output<string> — JSON.stringify can't serialize Outputs.
    condition: pulumi.jsonStringify({
      compositeQuery: {
        queryType: "builder",
        panelType: "graph",
        queries: [
          {
            type: "builder_query",
            spec: {
              name: "A",
              signal: "logs",
              stepInterval: 60,
              aggregations: [{ expression: "count()" }],
              filter: { expression: "" },
            },
          },
        ],
      },
      selectedQueryName: "A",
      thresholds: {
        kind: "basic",
        spec: [{ name: "info", op: "above", matchType: "at_least_once", target: 1000, channels: [channel.name] }],
      },
    }),
    evaluation: JSON.stringify({ kind: "rolling", spec: { evalWindow: "5m", frequency: "1m" } }),
    preferredChannels: [channel.name],
  },
  { provider },
);

// Log pipeline set (singleton).
const pipeline = new signoz.LogPipeline(
  "main",
  {
    pipelines: JSON.stringify([
      {
        orderId: 1,
        name: "pulumi-e2e-drop",
        alias: "pulumi-e2e-drop",
        enabled: true,
        filter: {
          op: "AND",
          items: [{ key: { key: "http.target", dataType: "string", type: "tag" }, op: "=", value: "/healthz" }],
        },
        config: [],
      },
    ]),
  },
  { provider },
);

export const channelId = channel.id;
export const dashboardId = dashboard.id;
export const viewId = view.id;
export const alertId = alert.id;
export const pipelineId = pipeline.id;
