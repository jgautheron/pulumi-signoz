// Copyright 2016-2024, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package signoz

import (
	"path"

	// Allow embedding bridge-metadata.json in the provider.
	_ "embed"

	pftfbridge "github.com/pulumi/pulumi-terraform-bridge/v3/pkg/pf/tfbridge"
	"github.com/pulumi/pulumi-terraform-bridge/v3/pkg/tfbridge"
	"github.com/pulumi/pulumi-terraform-bridge/v3/pkg/tfbridge/tokens"

	signoz "github.com/SigNoz/terraform-provider-signoz/signoz" // Upstream TF provider (Plugin Framework).

	"github.com/jgautheron/pulumi-signoz/provider/pkg/version"
)

const (
	mainPkg = "signoz"
	mainMod = "index"
)

//go:embed cmd/pulumi-resource-signoz/bridge-metadata.json
var metadata []byte

// Provider returns the bridged Pulumi provider info.
func Provider() tfbridge.ProviderInfo {
	prov := tfbridge.ProviderInfo{
		// SigNoz's upstream provider is built with terraform-plugin-framework. The PF bridge's
		// ShimProvider wraps it so the rest of tfbridge.ProviderInfo behaves as it does for SDK
		// v2 providers.
		//
		// The upstream exports `New(terraformAgent, version string) func() provider.Provider`;
		// terraformAgent is forwarded into the User-Agent header on outbound HTTP calls.
		P: pftfbridge.ShimProvider(signoz.New("pulumi", version.Version)()),

		Name:        "signoz",
		Version:     version.Version,
		DisplayName: "SigNoz",
		Publisher:   "jgautheron",
		LogoURL:     "",
		Description: "A Pulumi provider for SigNoz, bridged from the official SigNoz Terraform provider. " +
			"Manage SigNoz dashboards and alerts as code.",
		Keywords:   []string{"signoz", "observability", "monitoring", "tracing", "category/cloud"},
		License:    "Apache-2.0",
		Homepage:   "https://signoz.io",
		Repository: "https://github.com/jgautheron/pulumi-signoz",
		// Tells the bridge where to fetch upstream docs from for Pulumi SDK doc generation.
		GitHubOrg: "SigNoz",
		// Upstream Go module name differs from the GitHub repo slug ("terraform-provider-signoz" vs the
		// bridge's default of just "signoz"); make it explicit so doc lookups work.
		UpstreamRepoPath: "./upstream",

		MetadataInfo: tfbridge.NewProviderMetadata(metadata),

		// The PF bridge auto-derives Pulumi config keys from the upstream provider schema (access_token,
		// endpoint, http_max_retry, http_timeout). Only override here if a Pulumi-specific tweak is
		// required — e.g. marking access_token as secret.
		Config: map[string]*tfbridge.SchemaInfo{
			"access_token": {
				Secret: tfbridge.True(),
			},
		},

		// Field-level overrides. The bridge's auto-tokenisation handles the resource-level
		// mapping; entries here just adjust per-field codegen.
		Resources: map[string]*tfbridge.ResourceInfo{
			// C# does not allow a property with the same name as its enclosing class. Upstream
			// schema has an `alert` field (the alert payload/body) inside the `Alert` resource —
			// rename it for the C# SDK only. Other languages keep `alert`.
			"signoz_alert": {
				Fields: map[string]*tfbridge.SchemaInfo{
					"alert": {CSharpName: "AlertConfig"},
				},
			},
		},
		DataSources: map[string]*tfbridge.DataSourceInfo{
			"signoz_alert": {
				Fields: map[string]*tfbridge.SchemaInfo{
					"alert": {CSharpName: "AlertConfig"},
				},
			},
		},

		JavaScript: &tfbridge.JavaScriptInfo{
			PackageName:          "@jooon/pulumi-signoz",
			RespectSchemaVersion: true,
			Dependencies: map[string]string{
				"@pulumi/pulumi": "^3.0.0",
			},
		},
		Python: &tfbridge.PythonInfo{
			PackageName:          "pulumi_signoz_jooon",
			RespectSchemaVersion: true,
			PyProject:            struct{ Enabled bool }{true},
		},
		Golang: &tfbridge.GolangInfo{
			ImportBasePath: path.Join(
				"github.com/jgautheron/pulumi-signoz/sdk/",
				tfbridge.GetModuleMajorVersion(version.Version),
				"go",
				mainPkg,
			),
			GenerateResourceContainerTypes: true,
			GenerateExtraInputTypes:        true,
			RespectSchemaVersion:           true,
		},
		CSharp: &tfbridge.CSharpInfo{
			RootNamespace:        "Jooon.Pulumi",
			RespectSchemaVersion: true,
			PackageReferences: map[string]string{
				"Pulumi": "3.*",
			},
		},
		Java: &tfbridge.JavaInfo{
			BasePackage: "dev.jooon",
		},
	}

	// Auto-map upstream symbols. signoz_alert -> Alert, signoz_dashboard -> Dashboard;
	// data sources get the conventional "get" prefix (signoz_alert -> getAlert).
	prov.MustComputeTokens(tokens.SingleModule("signoz_", mainMod, tokens.MakeStandard(mainPkg)))
	prov.MustApplyAutoAliases()
	prov.SetAutonaming(255, "-")

	return prov
}
