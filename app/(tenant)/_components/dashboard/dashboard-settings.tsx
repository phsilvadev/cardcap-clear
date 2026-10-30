"use client";
import IntegrationsSection from "../settings/integrations-section";
import OperationsSection from "../settings/operations-section";
import PlanSection from "@/app/(tenant)/_components/settings/plan-section";
import { useEffect, useState, type KeyboardEvent } from "react";
import {
  settingsSections,
  type SettingsSectionId,
} from "@/app/(tenant)/_components/settings/settings-sections";
import StoreDetailsSection from "@/app/(tenant)/_components/settings/store-details-section";
import StoreSettingsForm from "@/app/(tenant)/_components/settings/store-settings-form";
import TeamSection from "@/app/(tenant)/_components/settings/team-section";
import PermissionsSection from "@/app/(tenant)/_components/settings/permissions-section";

export default function DashboardSettings({
  tenantSlug,
  storeId,
}: {
  tenantSlug: string;
  storeId?: string;
}) {
  const [active, setActive] = useState<SettingsSectionId>("details");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "section",
    );
    const section = settingsSections.find((item) => item.id === requested);
    if (section) setActive(section.id);
  }, []);
  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowDown" || event.key === "ArrowRight")
      next = (index + 1) % settingsSections.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
      next = (index - 1 + settingsSections.length) % settingsSections.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = settingsSections.length - 1;
    else return;
    event.preventDefault();
    const section = settingsSections[next];
    setActive(section.id);
    document.getElementById(`settings-tab-${section.id}`)?.focus();
  }
  return (
    <section
      id="view-settings"
      className="dashboard-view"
      aria-label="Configurações"
      hidden
    >
      <div className="settings-layout">
        <div
          className="settings-tabs"
          role="tablist"
          aria-label="Seções das configurações"
          aria-orientation="vertical"
        >
          {settingsSections.map((section, index) => (
            <button
              key={section.id}
              id={`settings-tab-${section.id}`}
              type="button"
              role="tab"
              aria-selected={active === section.id}
              aria-controls={`settings-panel-${section.id}`}
              tabIndex={active === section.id ? 0 : -1}
              onClick={() => setActive(section.id)}
              onKeyDown={(event) => moveFocus(event, index)}
            >
              {section.label}
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </div>
        <div className="settings-panels">
          {settingsSections.map((section) => (
            <div
              key={section.id}
              id={`settings-panel-${section.id}`}
              role="tabpanel"
              aria-labelledby={`settings-tab-${section.id}`}
              hidden={active !== section.id}
              tabIndex={0}
            >
              <div className="settings-section-heading">
                <h2>{section.label}</h2>
                <p>{section.description}</p>
              </div>
              {section.id === "operations" ? (
                <OperationsSection storeId={storeId} />
              ) : section.id === "integrations" ? (
                <IntegrationsSection />
              ) : section.id === "details" ? (
                <StoreDetailsSection storeId={storeId} />
              ) : section.id === "employees" ? (
                <TeamSection
                  storeId={storeId}
                  enabled={active === "employees"}
                />
              ) : section.id === "plan" ? (
                <PlanSection
                  tenantSlug={tenantSlug}
                  enabled={active === "plan"}
                />
              ) : section.id === "permissions" ? (
                <PermissionsSection />
              ) : (
                <StoreSettingsForm section={section.id} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
