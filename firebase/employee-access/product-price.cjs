const cents = (value) =>
  Number.isSafeInteger(value) && value >= 0 && value <= 100000000;
function priceLine(product, input, fail) {
  if (
    !product ||
    !product.available ||
    !cents(product.priceCents) ||
    product.priceCents < 1
  )
    fail("failed-precondition", "Um produto não está mais disponível.");
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > 99
  )
    fail("invalid-argument", "Confira as quantidades dos produtos.");
  const config = product.customization ?? { groups: [], division: null };
  const selections = input.groups ?? [];
  const parts = input.parts ?? [];
  if (
    !Array.isArray(selections) ||
    selections.length > 5 ||
    !Array.isArray(parts) ||
    parts.length > 8 ||
    !Array.isArray(config.groups) ||
    config.groups.length > 5
  )
    fail("invalid-argument", "Confira as opções do produto.");
  let unitCents = product.priceCents;
  const details = [],
    normalized = [];
  const seenGroups = new Set();
  for (const selection of selections) {
    if (
      !selection ||
      typeof selection !== "object" ||
      !Number.isInteger(selection.groupIndex) ||
      seenGroups.has(selection.groupIndex) ||
      !config.groups[selection.groupIndex] ||
      !Array.isArray(selection.options) ||
      selection.options.length > 10
    )
      fail("invalid-argument", "Grupo de complementos inválido.");
    seenGroups.add(selection.groupIndex);
  }
  for (let index = 0; index < config.groups.length; index++) {
    const group = config.groups[index];
    const options =
      selections.find((item) => item.groupIndex === index)?.options ?? [];
    const seen = new Set();
    let count = 0;
    const choices = [];
    for (const item of options) {
      const option = item && group.options?.[item.optionIndex];
      if (
        !item ||
        !Number.isInteger(item.optionIndex) ||
        !option ||
        seen.has(item.optionIndex) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20 ||
        (!group.repeat && item.quantity !== 1) ||
        !cents(option.priceCents)
      )
        fail("invalid-argument", "Complemento inválido.");
      seen.add(item.optionIndex);
      count += item.quantity;
      unitCents += option.priceCents * item.quantity;
      choices.push({ optionIndex: item.optionIndex, quantity: item.quantity });
      details.push(`${item.quantity} × ${option.name}`);
    }
    if (count < group.min || count > group.max)
      fail(
        "invalid-argument",
        `Confira a quantidade de escolhas em ${group.name}.`,
      );
    if (choices.length)
      normalized.push({
        groupIndex: index,
        options: choices.sort((a, b) => a.optionIndex - b.optionIndex),
      });
  }
  if (config.division) {
    if (
      !parts.length ||
      parts.length > config.division.maxParts ||
      parts.some(
        (part) => !Number.isInteger(part) || !config.division.options?.[part],
      ) ||
      new Set(parts).size !== parts.length
    )
      fail("invalid-argument", "Selecione as partes do produto.");
    const prices = parts.map(
      (part) => config.division.options[part].priceCents,
    );
    if (prices.some((value) => !cents(value)))
      fail("failed-precondition", "Preços de divisão inválidos.");
    if (config.division.pricing === "highest")
      unitCents += Math.max(...prices) - product.priceCents;
    else if (config.division.pricing === "proportional")
      unitCents +=
        Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) -
        product.priceCents;
    else if (config.division.pricing !== "fixed")
      fail("failed-precondition", "Regra de divisão inválida.");
    details.unshift(
      parts.map((part) => config.division.options[part].name).join(" / "),
    );
  } else if (parts.length)
    fail("invalid-argument", "Este produto não possui divisão.");
  const totalCents = unitCents * input.quantity;
  if (!cents(unitCents) || unitCents < 1 || !cents(totalCents))
    fail("invalid-argument", "O valor do pedido ultrapassa o limite.");
  return {
    productId: input.productId,
    name: product.name,
    quantity: input.quantity,
    unitCents,
    totalCents,
    details,
    groups: normalized,
    parts: [...parts].sort((a, b) => a - b),
  };
}

module.exports = { priceLine };
