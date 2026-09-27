# Architecture rules

- Keep hosted-preview session brokering in the Supabase auth storage adapter, with its external host and message protocol unchanged, because preview login sharing depends on those exact runtime values while local installs use localStorage.
- Use Supabase OAuth directly in app flows and keep editor-only development plugins out of the Vite pipeline, because the deployed and local app must not require platform-specific packages.