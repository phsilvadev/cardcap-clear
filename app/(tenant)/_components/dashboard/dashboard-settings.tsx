"use client";
import { useState, type KeyboardEvent } from "react";
import {
  settingsSections,
  type SettingsSectionId,
} from "@/app/(tenant)/_components/settings/settings-sections";
import StoreDetailsSection from "@/app/(tenant)/_components/settings/store-details-section";
import SettingsPreviewForm from "@/app/(tenant)/_components/settings/settings-preview-form";
import TeamSection from "@/app/(tenant)/_components/settings/team-section";
import PermissionsSection from "@/app/(tenant)/_components/settings/permissions-section";

export default function DashboardSettings({
  tenantSlug,
}: {
  tenantSlug: string;
}) {
  const [active, setActive] = useState<SettingsSectionId>("details");
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
              {section.id === "details" ? (
                <StoreDetailsSection />
              ) : section.id === "employees" ? (
                <TeamSection />
              ) : section.id === "permissions" ? (
                <PermissionsSection />
              ) : (
                <SettingsPreviewForm
                  section={section.id}
                  tenantSlug={tenantSlug}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
