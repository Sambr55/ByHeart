-- SIGN IN WITH A CODE (2026-11-05). Sam: "I have never been convinced by the soft sign in."
-- On an iPhone the emailed link opens in Safari, not in the installed app, so the person is
-- signed in somewhere they are not. The same email now carries a six-digit code they type
-- into the app itself. Additive: two columns on login_tokens.
alter table login_tokens add column if not exists code_hash text;
alter table login_tokens add column if not exists attempts int not null default 0;
create index if not exists login_tokens_code_idx on login_tokens (email, created_at desc);
