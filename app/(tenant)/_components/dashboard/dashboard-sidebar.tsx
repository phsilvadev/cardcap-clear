"use client";
import { useStoreOperations } from "./operations-provider";
import { usePathname } from "next/navigation";
import TenantSessionControls from "@/app/(tenant)/_components/tenant-session-controls";
import type { Tenant } from "@/lib/tenant";
export default function DashboardSidebar({ tenant }: { tenant: Tenant }) {
  const pathname = usePathname();
  const { operations } = useStoreOperations();
  const isWaiters = pathname.includes("/garcons");
  const isMenu = pathname.includes("/cardapio");
  const isCouriers = pathname.includes("/entregadores");
  return (
    <aside className={"sidebar"}>
      <a
        href={"/"}
        className={"sidebar-brand wordmark text-3xl"}
        aria-label={"Cardap — início"}
      >
        {"cardap"}
        <span className={"text-brand"}>{"."}</span>
      </a>
      <div className={"workspace"}>
        <svg
          xmlns={"http://www.w3.org/2000/svg"}
          width={"20"}
          height={"20"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          strokeWidth={"2"}
          strokeLinecap={"round"}
          strokeLinejoin={"round"}
          className={"lucide lucide-store"}
          aria-hidden={"true"}
          focusable={"false"}
        >
          <path d={"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"}></path>
          <path
            d={
              "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"
            }
          ></path>
          <path d={"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"}></path>
        </svg>
        <div>
          <strong className={"store-name"}>{tenant.name}</strong>
          <p>{"Área do restaurante"}</p>
        </div>
      </div>
      <nav aria-label={"Administração do restaurante"}>
        <a
          href="/dashboard?view=overview"
          data-view="overview"
          aria-current={
            !isMenu && !isCouriers && !isWaiters ? "page" : undefined
          }
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            width={"20"}
            height={"20"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            strokeWidth={"2"}
            strokeLinecap={"round"}
            strokeLinejoin={"round"}
            className={"lucide lucide-layout-dashboard"}
            aria-hidden={"true"}
            focusable={"false"}
          >
            <rect width={"7"} height={"9"} x={"3"} y={"3"} rx={"1"}></rect>
            <rect width={"7"} height={"5"} x={"14"} y={"3"} rx={"1"}></rect>
            <rect width={"7"} height={"9"} x={"14"} y={"12"} rx={"1"}></rect>
            <rect width={"7"} height={"5"} x={"3"} y={"16"} rx={"1"}></rect>
          </svg>
          {"Visão geral"}
        </a>
        <a
          href="/dashboard?view=orders"
          data-view="orders"
          aria-current={undefined}
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            width={"20"}
            height={"20"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            strokeWidth={"2"}
            strokeLinecap={"round"}
            strokeLinejoin={"round"}
            className={"lucide lucide-receipt-text"}
            aria-hidden={"true"}
            focusable={"false"}
          >
            <path d={"M13 16H8"}></path>
            <path d={"M14 8H8"}></path>
            <path d={"M16 12H8"}></path>
            <path
              d={
                "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
              }
            ></path>
          </svg>
          {"Pedidos"}
        </a>
        <a
          href="/dashboard/cardapio"
          data-view="menu"
          aria-current={isMenu ? "page" : undefined}
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            width={"20"}
            height={"20"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            strokeWidth={"2"}
            strokeLinecap={"round"}
            strokeLinejoin={"round"}
            className={"lucide lucide-utensils"}
            aria-hidden={"true"}
            focusable={"false"}
          >
            <path d={"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"}></path>
            <path d={"M7 2v20"}></path>
            <path d={"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"}></path>
          </svg>
          {"Cardápio"}
        </a>
        {operations.salon && (
          <a
            href="/dashboard/garcons"
            aria-current={isWaiters ? "page" : undefined}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 8V6M10 6h4M5 21h14" />
            </svg>
            Garçons
          </a>
        )}
        {operations.ownDelivery && (
          <a
            href="/dashboard/entregadores"
            aria-current={isCouriers ? "page" : undefined}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 3h14v13H1zM15 8h4l3 4v4h-7" />
              <circle cx="5" cy="18" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
            Entregadores
          </a>
        )}
        <a
          href="/dashboard?view=settings"
          data-view="settings"
          aria-current={undefined}
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            width={"20"}
            height={"20"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            strokeWidth={"2"}
            strokeLinecap={"round"}
            strokeLinejoin={"round"}
            className={"lucide lucide-settings"}
            aria-hidden={"true"}
            focusable={"false"}
          >
            <path
              d={
                "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
              }
            ></path>
            <circle cx={"12"} cy={"12"} r={"3"}></circle>
          </svg>
          {"Configurações"}
        </a>
      </nav>
      <div className="sidebar-footer">
        <a className={"public-store"} id={"public-store"} href={"/loja"}>
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            width={"20"}
            height={"20"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            strokeWidth={"2"}
            strokeLinecap={"round"}
            strokeLinejoin={"round"}
            className={"lucide lucide-arrow-up-right"}
            aria-hidden={"true"}
            focusable={"false"}
          >
            <path d={"M7 7h10v10"}></path>
            <path d={"M7 17 17 7"}></path>
          </svg>
          {" Ver minha loja"}
        </a>
        <TenantSessionControls />
        <p className={"sidebar-note"}>{"Painel de demonstração"}</p>
      </div>
    </aside>
  );
}
