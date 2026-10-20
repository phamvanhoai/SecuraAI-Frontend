# Asset type selection

Create, Edit and the directory filter share six fixed choices: Application,
Server, Database, Endpoint, Network device and Other. Requests use their uppercase
codes from `schemas/asset-type-schema.ts`; arbitrary text is rejected by the BFF
schemas and backend. No choice is selected by default in Create.

Deploy with the backend asset type migration and validation. Read schemas retain
string compatibility so legacy records and historical responses remain readable;
Edit shows an unsupported legacy value as disabled and requires a supported
selection before saving. Unknown values are not silently changed to Other.

This does not change asset ownership, classification or context-link workflows.
