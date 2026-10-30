function allowedSupportLink(value) {
  try {
    if (typeof value !== "string" || value.length > 20000) return false;
    const url = new URL(value);
    return (
      url.origin === "https://wa.me" &&
      !url.username &&
      !url.password &&
      !url.hash &&
      /^\/\d{10,15}$/.test(url.pathname) &&
      [...url.searchParams.keys()].every((key) => key === "text") &&
      url.searchParams.getAll("text").length <= 1 &&
      (url.searchParams.get("text") || "").length <= 3000
    );
  } catch {
    return false;
  }
}
module.exports = { allowedSupportLink };
