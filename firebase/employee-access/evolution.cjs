function createEvolution({ baseUrl, apiKey, fetchImpl = fetch }) {
  function config() {
    try {
      const url = new URL(baseUrl());
      const key = apiKey();
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        !key
      )
        return null;
      return { url: url.href.replace(/\/$/, ""), key };
    } catch {
      return null;
    }
  }
  async function request(method, path, body) {
    const settings = config();
    if (!settings) throw new Error("not-configured");
    const response = await fetchImpl(`${settings.url}${path}`, {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers: { apikey: settings.key, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      const error = new Error("provider-unavailable");
      error.status = response.status;
      throw error;
    }
    const text = await response.text();
    if (text.length > 300000) throw new Error("invalid-response");
    const data = JSON.parse(text);
    if (data?.error === true) throw new Error("provider-error");
    return data;
  }
  return {
    configured: () => Boolean(config()),
    async state(instance) {
      try {
        const data = await request(
          "GET",
          `/instance/connectionState/${encodeURIComponent(instance)}`,
        );
        const state = data?.instance?.state;
        if (state === undefined) return "missing";
        if (!["open", "close", "connecting"].includes(state))
          throw new Error("unknown-state");
        return state;
      } catch (error) {
        if (error.status === 404) return "missing";
        throw error;
      }
    },
    create: (instance) =>
      request("POST", "/instance/create", {
        instanceName: instance,
        integration: "WHATSAPP-BAILEYS",
        qrcode: false,
        groupsIgnore: true,
        alwaysOnline: false,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false,
      }),
    connect: (instance) =>
      request("GET", `/instance/connect/${encodeURIComponent(instance)}`),
    async disconnect(instance) {
      try {
        await request(
          "DELETE",
          `/instance/delete/${encodeURIComponent(instance)}`,
        );
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    },
  };
}
module.exports = { createEvolution };
