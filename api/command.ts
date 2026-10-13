// Preserve the legacy URL with the same authentication and allowlist as the
// current gateway. Every command route must verify the caller before forwarding.
export { default } from './relay/command';
