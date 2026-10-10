
import bcrypt from "bcrypt";
import { env } from "../../config/env.js";

export const hashPassword = (plain: string) => bcrypt.hash(plain, env.BCRYPT_ROUNDS);

export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** True when the stored hash was made with a weaker cost than we use today. */
export const needsRehash = (hash: string) => {
    try {
        return bcrypt.getRounds(hash) < env.BCRYPT_ROUNDS;
    } catch {
        return true;
    }
};

// Used to burn the same CPU time when the email does not exist, so response
// timing does not reveal which emails are registered.
let dummyHash: Promise<string> | undefined;
export const compareAgainstDummy = async (plain: string) => {
    dummyHash ??= bcrypt.hash("dummy-password-for-timing-equalisation", env.BCRYPT_ROUNDS);
    await bcrypt.compare(plain, await dummyHash);
};
