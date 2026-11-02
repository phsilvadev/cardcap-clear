const { createHash } = require("node:crypto");
const id = (value) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
const cents = (value) =>
  Number.isSafeInteger(value) && value >= 0 && value <= 100000000;
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const { priceLine } = require("./product-price.cjs");
function validCpf(value) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1+$/.test(value)) return false;
  for (let size = 9; size <= 10; size++) {
    const sum = [...value.slice(0, size)].reduce(
      (total, digit, index) => total + Number(digit) * (size + 1 - index),
      0,
    );
    const check = (sum * 10) % 11;
    if ((check === 10 ? 0 : check) !== Number(value[size])) return false;
  }
  return true;
}
module.exports = { id, cents, digest, priceLine, validCpf };
