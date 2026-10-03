# Flambé Plugin Privacy Policy

Effective: October 3, 2026

This policy describes how the Flambé ChatGPT plugin handles data when you connect ChatGPT to a Flambé account.

## Data the plugin handles

The plugin can receive and store information that you or an authorized agent send to Flambé, including:

- activity names, descriptions, lifecycle notes, and reducer messages;
- trace, thread, category, scheduling, and timestamp information;
- agent identifiers, display names, and host-platform labels; and
- account and authentication metadata needed to connect the plugin.

OAuth access tokens issued to ChatGPT are Flambé API tokens. Flambé stores a SHA-256 hash of each API token rather than the raw token and records token usage metadata such as last-used time.

## How the data is used

Flambé uses this data to provide its work-tracking features, including the live activity stack, flame-chart history, activity lifecycle transitions, scheduling, and reducer guidance.

When reducer or placement features are configured, Flambé may send relevant activity and trace context to model services used to make those judgments. The current server implementation can use OpenAI's API and, when configured, TypeSafe AI's Jev/System One service. Those services receive only the context required by the reducer or placement request as implemented by Flambé.

## Sharing

Flambé does not expose user data to advertisers through this plugin. Data may be processed by infrastructure providers and by the model services described above when those features are enabled.

## Retention and deletion

Flambé stores work history and account data so that traces and activity history remain available to the user. The service does not promise a fixed automatic deletion schedule.

Users can remove supported Flambé objects and revoke API tokens through Flambé's available product controls. For other privacy or deletion questions, use the support page linked in the plugin listing. Do not post passwords, API tokens, or other secrets in a public support issue.

## Security

The plugin uses HTTPS for the hosted MCP connection. ChatGPT authorization uses OAuth authorization-code flow with PKCE. Flambé API tokens are revocable and are stored server-side as hashes.

## Changes

This policy may be updated when the plugin's data practices change. Material changes should be reflected in this page before a corresponding plugin release is submitted.

## Contact

For support or privacy questions, use the Flambé support page:

https://github.com/davvidbaker/flambe/issues
