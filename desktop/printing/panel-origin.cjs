const { trustedUrl } = require("./receipt.cjs");
function allowedPanelUrl(
  value,
  configured,
  domain = process.env.CARDAP_TENANT_DOMAIN,
) {
  try {
    const from = trustedUrl(configured);
    const to = trustedUrl(value);
    if (from.origin === to.origin) return true;
    if (from.protocol !== to.protocol || from.port !== to.port) return false;
    const local = (host) =>
      ["localhost", "127.0.0.1"].includes(host) ||
      /^[a-z0-9]+(?:-[a-z0-9]+)*\.localhost$/.test(host);
    if (local(from.hostname)) return local(to.hostname);
    const base = domain || from.hostname.replace(/^www\./, "");
    const member = (host) =>
      host === base ||
      host === `www.${base}` ||
      (host.endsWith(`.${base}`) &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(host.slice(0, -base.length - 1)));
    return member(from.hostname) && member(to.hostname);
  } catch {
    return false;
  }
}
module.exports = { allowedPanelUrl };
