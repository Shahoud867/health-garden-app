/**
 * Loads .env for local `npm run test:db` runs (Vitest's `test.setupFiles`).
 *
 * In CI, the `database` job's "Export local stack credentials" step already
 * populates process.env directly via $GITHUB_ENV -- no .env file exists in a
 * fresh checkout. `dotenv.config()` never throws when the file is missing
 * (it returns an error in its result instead) and never overrides a
 * variable that is already set, so this is a no-op there, not a conflict.
 */
import { config } from 'dotenv';

config();
