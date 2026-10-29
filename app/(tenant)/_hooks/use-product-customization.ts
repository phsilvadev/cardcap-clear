"use client";

import { useState } from "react";
import type { ProductCustomization, ProductDivision } from "@/lib/menu/types";
import { parseProductPrice } from "@/lib/menu/product-validation";
import { validateProductCustomization } from "@/lib/menu/customization";

type OptionDraft = { id: string; name: string; price: string };
type GroupDraft = {
  id: string;
  name: string;
  min: string;
  max: string;
  repeat: boolean;
  options: OptionDraft[];
};
const newOption = (): OptionDraft => ({
  id: crypto.randomUUID(),
  name: "",
  price: "0",
});

export const useProductCustomization = () => {
  const [groups, setGroups] = useState<GroupDraft[]>([]);
  const [groupEditor, setGroupEditor] = useState<{
    id: string;
    original: GroupDraft | null;
  } | null>(null);
  const [groupError, setGroupError] = useState("");
  const editingGroup = groups.find((group) => group.id === groupEditor?.id);
  const editGroup = (id: string) => {
    const original = groups.find((group) => group.id === id);
    if (original) {
      setGroupEditor({ id, original });
      setGroupError("");
    }
  };
  const cancelGroup = () => {
    if (groupEditor)
      setGroups((current) =>
        groupEditor.original
          ? current.map((group) =>
              group.id === groupEditor.id ? groupEditor.original! : group,
            )
          : current.filter((group) => group.id !== groupEditor.id),
      );
    setGroupEditor(null);
    setGroupError("");
  };
  const [divisible, setDivisible] = useState(false);
  const [maxParts, setMaxParts] = useState("2");
  const [pricing, setPricing] = useState<ProductDivision["pricing"]>("highest");
  const [parts, setParts] = useState<OptionDraft[]>([]);
  const totalOptions =
    groups.reduce((total, group) => total + group.options.length, 0) +
    (divisible ? parts.length : 0);
  const updateGroup = (id: string, fields: Partial<Omit<GroupDraft, "id">>) =>
    setGroups((current) =>
      current.map((group) =>
        group.id === id ? { ...group, ...fields } : group,
      ),
    );
  const addGroup = () => {
    if (groups.length < 5 && totalOptions < 20) {
      const id = crypto.randomUUID();
      setGroups((current) => [
        ...current,
        {
          id,
          name: "",
          min: "0",
          max: "1",
          repeat: false,
          options: [newOption()],
        },
      ]);
      setGroupEditor({ id, original: null });
      setGroupError("");
    }
  };
  const removeGroup = (id: string) =>
    setGroups((current) => current.filter((group) => group.id !== id));
  const addOption = (groupId: string) => {
    const group = groups.find((item) => item.id === groupId);
    if (group && group.options.length < 10 && totalOptions < 20)
      updateGroup(groupId, { options: [...group.options, newOption()] });
  };
  const updateOption = (
    groupId: string,
    optionId: string,
    fields: Partial<OptionDraft>,
  ) => {
    const group = groups.find((item) => item.id === groupId);
    if (group)
      updateGroup(groupId, {
        options: group.options.map((option) =>
          option.id === optionId ? { ...option, ...fields } : option,
        ),
      });
  };
  const removeOption = (groupId: string, optionId: string) => {
    const group = groups.find((item) => item.id === groupId);
    if (group)
      updateGroup(groupId, {
        options: group.options.filter((option) => option.id !== optionId),
      });
  };
  const toggleDivision = (enabled: boolean) => {
    setDivisible(enabled);
    if (enabled && !parts.length) setParts([newOption(), newOption()]);
  };
  const addPart = () => {
    if (parts.length < 10 && totalOptions < 20)
      setParts((current) => [...current, newOption()]);
  };
  const updatePart = (id: string, fields: Partial<OptionDraft>) =>
    setParts((current) =>
      current.map((part) => (part.id === id ? { ...part, ...fields } : part)),
    );
  const removePart = (id: string) =>
    setParts((current) => current.filter((part) => part.id !== id));
  const reset = () => {
    setGroups([]);
    setGroupEditor(null);
    setGroupError("");
    setDivisible(false);
    setMaxParts("2");
    setPricing("highest");
    setParts([]);
  };
  const load = (value?: ProductCustomization) => {
    const options = (items: { name: string; priceCents: number }[]) =>
      items.map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        price: String(item.priceCents / 100),
      }));
    setGroups(
      (value?.groups ?? []).map((group) => ({
        id: crypto.randomUUID(),
        name: group.name,
        min: String(group.min),
        max: String(group.max),
        repeat: group.repeat,
        options: options(group.options),
      })),
    );
    setGroupEditor(null);
    setGroupError("");
    setDivisible(Boolean(value?.division));
    setMaxParts(String(value?.division?.maxParts ?? 2));
    setPricing(value?.division?.pricing ?? "highest");
    setParts(options(value?.division?.options ?? []));
  };
  const configuration: ProductCustomization = {
    groups: groups.map((group) => ({
      name: group.name,
      min: group.min === "" ? NaN : Number(group.min),
      max: Number(group.max),
      repeat: group.repeat,
      options: group.options.map((option) => ({
        name: option.name,
        priceCents: parseProductPrice(option.price),
      })),
    })),
    division: divisible
      ? {
          maxParts: Number(maxParts),
          pricing,
          options: parts.map((part) => ({
            name: part.name,
            priceCents: pricing === "fixed" ? 0 : parseProductPrice(part.price),
          })),
        }
      : null,
  };
  const saveGroup = () => {
    const error = validateProductCustomization({
      groups: configuration.groups,
      division: null,
    });
    setGroupError(error);
    if (!error) setGroupEditor(null);
  };
  return {
    load,
    groups,
    editingGroup,
    groupError,
    editGroup,
    cancelGroup,
    saveGroup,
    divisible,
    maxParts,
    pricing,
    parts,
    totalOptions,
    configuration,
    updateGroup,
    addGroup,
    removeGroup,
    addOption,
    updateOption,
    removeOption,
    toggleDivision,
    setMaxParts,
    setPricing,
    addPart,
    updatePart,
    removePart,
    reset,
  };
};
