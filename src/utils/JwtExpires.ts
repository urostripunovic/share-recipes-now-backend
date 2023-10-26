type TokenInfo = {
    iat: number;
    exp: number;
}

/**
 * Calculates the expiration time for a token based on the provided time duration or string representation.
 * @param {number | string} [time] - The time duration in seconds or a string representation of time (e.g., "2d", "4h", "30m").
 * @param {number} [defaultDuration] - The default duration in seconds if no input is provided. Default is 30 days.
 * @returns {TokenInfo} An object containing the issued at (iat) and expiration (exp) timestamps.
 * @throws {Error} If the input time is not a valid number or string format.
 *
 * @type {Object} TokenInfo
 * @property {number} iat - The timestamp representing when the token was issued.
 * @property {number} exp - The timestamp representing when the token will expire.
 *
 * @example
 * // Calculate expiration for 30 days
 * const tokenInfo = expiresIn();
 *
 * // Calculate expiration for 2 hours
 * const tokenInfo = expiresIn("2h");
 */
export function expiresIn(): TokenInfo;
export function expiresIn(time: number | string): TokenInfo;
export function expiresIn(time?: number | string): TokenInfo {
    const iat: number = Math.floor(new Date().getTime() / 1000);
    let exp: number = iat + 30 * 24 * 60 * 60; //Switch statement här

    if (typeof time === "number") {
        exp = iat + time;
    } else if (typeof time === "string") {
        const match = time.match(
            /^(\d+)\s*(d(ays?)?|h(ours?)?|m(in(utes?)?)?)?$/
        );

        if (!match) throw new Error("Invalid time format in the input string.");

        const value: number = parseInt(match[1]);
        const unit: string = match[2];

        const unitToSeconds = new Map([
            ["days", 24 * 60 * 60],
            ["d", 24 * 60 * 60],
            ["hours", 60 * 60],
            ["h", 60 * 60],
            ["minutes", 60],
            ["min", 60],
            ["m", 60],
        ]);

        if (unitToSeconds?.has(unit))
            exp = iat + value * unitToSeconds.get(unit)!;
    }

    return { iat, exp };
}
