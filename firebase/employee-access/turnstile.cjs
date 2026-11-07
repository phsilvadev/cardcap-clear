function createTurnstileVerifier({ secret, hostnames, fetchImpl = fetch }) {
  return async (token) => {
    if (typeof token !== "string" || !token || token.length > 2048)
      return false;
    const key = secret();
    const allowed = hostnames()
      .split(",")
      .map((host) => host.trim())
      .filter(Boolean);
    if (!key || !allowed.length) return false;
    try {
      const response = await fetchImpl(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: key, response: token }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) return false;
      const result = await response.json();
      return (
        result.success === true &&
        result.action === "launch_signup" &&
        allowed.includes(result.hostname)
      );
    } catch {
      return false;
    }
  };
}
module.exports = { createTurnstileVerifier };
