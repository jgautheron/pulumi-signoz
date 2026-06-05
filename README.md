# Pulumi SigNoz Provider

A Pulumi provider for [SigNoz](https://signoz.io), bridged from
[jgautheron/terraform-provider-signoz](https://github.com/jgautheron/terraform-provider-signoz)
via [pulumi-terraform-bridge](https://github.com/pulumi/pulumi-terraform-bridge).

Manage SigNoz dashboards, alerts, notification channels, saved views, and log
pipelines as code — versioned in Git, reviewed in PRs, deployed alongside your
services.

> **Status: early (v0.x).** Targets SigNoz Community >= 0.125. Complex nested
> bodies (alert conditions, dashboard definitions) are modeled as JSON strings.

## Resources

| Pulumi token                       | Terraform resource             | Purpose                                  |
| ---------------------------------- | ------------------------------ | ---------------------------------------- |
| `signoz:index:Dashboard`           | `signoz_dashboard`             | Dashboards (full definition as JSON)     |
| `signoz:index:Alert`               | `signoz_alert`                 | Alert rules (v5/v2alpha1)                |
| `signoz:index:NotificationChannel` | `signoz_notification_channel`  | Notification channels (**admin token**)  |
| `signoz:index:SavedView`           | `signoz_saved_view`            | Logs/traces explorer saved views         |
| `signoz:index:LogPipeline`         | `signoz_log_pipeline`          | Log-processing pipeline set (singleton)  |

## Installing

### Node.js (TypeScript / JavaScript)

```bash
npm install @jooon/pulumi-signoz
# or
yarn add @jooon/pulumi-signoz
```

### Python

```bash
pip install pulumi-signoz-jooon
```

### Go

```bash
go get github.com/jgautheron/pulumi-signoz/sdk/go/signoz
```

### .NET

```bash
dotnet add package Jooon.Pulumi.Signoz
```

## Configuration

The provider reads the same env vars as the upstream Terraform provider:

| Env var                  | Pulumi config key     | Purpose                                          |
| ------------------------ | --------------------- | ------------------------------------------------ |
| `SIGNOZ_ACCESS_TOKEN`    | `signoz:accessToken`  | API key (sensitive, **required**)                |
| `SIGNOZ_ENDPOINT`        | `signoz:endpoint`     | SigNoz URL (default `http://localhost:3301`)     |
| `SIGNOZ_HTTP_MAX_RETRY`  | `signoz:httpMaxRetry` | Default `10`                                     |
| `SIGNOZ_HTTP_TIMEOUT`    | `signoz:httpTimeout`  | Default `35` seconds                             |

Generate an access token in the SigNoz UI: **Settings → Service Accounts → Add →
Keys → Add Key**.

## Quick start (TypeScript)

```typescript
import * as signoz from "@jooon/pulumi-signoz";

const provider = new signoz.Provider("signoz", {
  endpoint: "https://signoz.example.com",
  accessToken: process.env.SIGNOZ_ACCESS_TOKEN!,
});

new signoz.Dashboard("app-overview", {
  data: JSON.stringify({
    title: "App Overview",
    // ...full dashboard JSON; export from the SigNoz UI to bootstrap
  }),
}, { provider });

new signoz.Alert("app-error-rate", {
  alertType: "METRIC_BASED_ALERT",
  // ...rule definition
}, { provider });
```

See the [`examples/`](./examples/) directory for runnable samples.

## Versioning

This provider mirrors upstream `SigNoz/terraform-provider-signoz` version
numbers (e.g. when upstream releases `v0.0.12`, this provider tags `v0.0.12`).
Patch-suffix `+N` is reserved for bridge-only fixes between upstream releases.
Both upstream and this wrapper are pre-1.0 — pin exact versions in consumers.

## Contributing / building from source

```bash
git clone https://github.com/jgautheron/pulumi-signoz
cd pulumi-signoz
make tfgen          # generate schema.json from upstream provider
make provider       # build pulumi-resource-signoz binary
make build_sdks     # generate SDKs for all supported languages
```

## License

Apache-2.0. The upstream SigNoz Terraform provider is MPL-2.0.

## Related

- [SigNoz Terraform Provider](https://github.com/SigNoz/terraform-provider-signoz) (upstream)
- [SigNoz Terraform docs](https://registry.terraform.io/providers/SigNoz/signoz/latest/docs)
- [Pulumi Terraform Bridge](https://github.com/pulumi/pulumi-terraform-bridge)
