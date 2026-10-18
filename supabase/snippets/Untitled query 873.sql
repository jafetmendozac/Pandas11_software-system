supabase db lint --local
supabase test db
node scripts/test-identity-api.mjs
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
