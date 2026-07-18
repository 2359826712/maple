# Content revision snapshots

When an existing content record changes, the crawler stores the previous JSON record at `snapshots/{content-id}/{timestamp}.json`. Snapshots contain hashes, detection time, changed field names, and the previous structured record. They do not grant permission to retain source text.
