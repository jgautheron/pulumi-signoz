// Minimal SigNoz Pulumi program: explicit Provider, one alert, one dashboard.
// Set SIGNOZ_ENDPOINT + SIGNOZ_ACCESS_TOKEN before `pulumi up`, or override via
// `pulumi config set --secret signoz:accessToken ...`.
import * as signoz from "@jgautheron/pulumi-signoz";

const provider = new signoz.Provider("signoz", {
  endpoint: process.env.SIGNOZ_ENDPOINT ?? "http://localhost:3301",
  accessToken: process.env.SIGNOZ_ACCESS_TOKEN!,
});

// Simple metric-based alert. Real alert bodies are large JSON blobs;
// export from the SigNoz UI ("Edit" → "Show JSON") as a starting point.
const alert = new signoz.Alert(
  "pulumi-test-alert",
  {
    alert: "Pulumi smoke-test alert",
    alertType: "METRIC_BASED_ALERT",
    description: "Created from pulumi-signoz examples/basic-ts.",
    disabled: true, // disabled so the smoke test doesn't actually fire
    evalWindow: "5m0s",
    frequency: "1m0s",
    labels: {
      severity: "info",
      managedBy: "pulumi",
    },
    severity: "info",
    source: "https://github.com/jgautheron/pulumi-signoz",
    // Minimal valid condition body — replace with the real one when adapting.
    condition: JSON.stringify({
      compositeQuery: {
        queryType: "builder",
        panelType: "graph",
        builderQueries: {},
      },
      op: ">",
      target: 0,
      matchType: "1",
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
