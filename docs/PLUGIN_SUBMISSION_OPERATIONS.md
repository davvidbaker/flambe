# Public Plugin Submission Operations

This runbook covers the two production-only setup steps that cannot be baked into the public plugin ZIP: OpenAI domain verification and reviewer credentials.

## 1. Domain verification

The Flambé backend exposes:

```
https://flambe.fly.dev/.well-known/openai-apps-challenge
```

The endpoint returns the exact value of `OPENAI_APPS_CHALLENGE_TOKEN`.

When the OpenAI plugin submission portal generates the challenge token:

```sh
fly secrets set -a flambe OPENAI_APPS_CHALLENGE_TOKEN='<TOKEN_FROM_OPENAI>'
```

Verify the URL returns that exact token, then select **Verify Domain** in the OpenAI portal.

The challenge token is not an authentication secret, but keeping it in Fly configuration avoids committing one-off review state to the repository.

## 2. Reviewer account

The dedicated reviewer identity is:

- Email: `openai-reviewer@flambe.local`
- Username: `openai_plugin_reviewer`
- Display name: `OpenAI Plugin Reviewer`
- Trace: `OpenAI plugin review`

Generate a strong password locally and keep it out of Git and logs.

Provision the account and deterministic sample trace on production:

```sh
REVIEWER_PASSWORD='<STRONG_RANDOM_PASSWORD>'
fly ssh console -a flambe -C \
  "env FLAMBE_ALLOW_PLUGIN_REVIEWER_SEED=true FLAMBE_PLUGIN_REVIEWER_PASSWORD='$REVIEWER_PASSWORD' /app/bin/flambe_next eval 'Mix.Task.run(\"flambe_next.provision_plugin_reviewer\")'"
```

The task intentionally does not print the password.

Reviewer login URL:

```
https://flambe.fly.dev/oauth/authorize
```

In the OpenAI submission portal's secure reviewer-credentials fields, provide the email and password plus these instructions:

> Connect the Flambé MCP server from the submitted plugin. When redirected to Flambé, sign in with the provided reviewer email and password and approve the ChatGPT connection. The account contains the `OpenAI plugin review` trace and deterministic sample work. No MFA, email code, SMS code, magic link, private network, or additional workspace selection is required.

Keep the reviewer account and sample data available for the lifetime of the review.

## 3. Review cases

The plugin ZIP owns the five positive and three negative test cases under `extensions.com.openai.review.test_cases`. Run the positive cases against the dedicated reviewer account before submission.

## 4. Demo video

Record the installed v0.2.2 plugin in a fresh normal ChatGPT conversation using the reviewer account. Keep credentials off-screen.

Recommended visible flow:

1. `Show me my currently active Flambé work.`
2. `Start a new root Flambé activity called "Plugin smoke test".`
3. `Under that activity, start a child called "Verify nested work", then end it with "Nested activity verified".`
4. `Tell the Flambé reducer that this task now needs a database migration and ask whether I should widen scope.`
5. End the root with `ChatGPT plugin path verified`.
6. Show the resulting Flambé flame chart or activity state.
7. Demonstrate one out-of-scope request where Flambé is not invoked.

Upload the video to a reviewer-accessible HTTPS URL without requiring a separate login. Add that URL to `extensions.com.openai.review.demo_recording_url`, bump the plugin version, rebuild the ZIP, and upload that final package.

## 5. Submission portal

Use the verified individual developer identity **David Baker**.

The ZIP declares:

- all supported countries;
- no plugin commerce or payments;
- public website, support, privacy, and terms URLs;
- five positive and three negative review cases;
- release notes.

In the portal:

1. Upload the final ZIP.
2. Wait for the skill safety scans.
3. Connect the Flambé MCP server.
4. Complete domain verification.
5. Authenticate using the reviewer account and run **Scan Tools**.
6. Resolve any current scan findings.
7. Enter the reviewer credentials in the secure Review details fields.
8. Verify the demo recording URL and imported test cases.
9. Complete the required policy attestations.
10. Select **Submit for review**.
