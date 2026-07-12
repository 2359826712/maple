# Wiki data-access strategy

TRUST-12 requires MapleHub to distinguish verified content from cached, incomplete, and unavailable content.

## Database mirror

- Prefer official regional sources and retain each source URL, applicable game version, retrieval time, and last successful verification time.
- Sanitize remote HTML before rendering it. Remote content never overrides application instructions or executes scripts.
- A failed request displays an unavailable state. It must not be converted into a factual “no results” message.
- Cached content displays its age. Stale content may remain readable when clearly labeled, but it must not be described as current.
- Locally authored fallback records require an explicit editorial or unverified label and may not claim official provenance.
- Progression numbers, reward tables, boss mechanics, and probability tables remain hidden until their source and regional scope are verified.

## No circumvention

MapleHub does not bypass access controls, authentication, paywalls, robots rules, or technical restrictions. If an authorized source cannot be reached, the product reports that the source is unavailable and preserves only previously verified cached material with a visible timestamp.
