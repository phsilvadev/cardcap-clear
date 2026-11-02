"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase/client";
import { useTenantOrders } from "../orders/tenant-orders-provider";

type Reply = { id: string; title: string; text: string };
type Settings = {
  revision: number;
  orderEnabled: boolean;
  welcomeEnabled: boolean;
  welcomeText: string;
  orderTexts: Record<string, string>;
  quickReplies: Reply[];
};
type History = {
  id: string;
  kind: string;
  customer: string;
  text: string;
  status: string;
  createdAt: number;
};
type Result = { settings?: Settings; history?: History[]; queued?: boolean };
const statuses: Record<string, string> = {
  new: "Pedido recebido",
  preparing: "Em preparo",
  delivery: "Entrega ou retirada",
  done: "Concluído",
  cancelled: "Cancelado",
};
const historyLabels: Record<string, string> = {
  queued: "Na fila",
  sending: "Enviando",
  sent: "Aceita pelo WhatsApp",
  skipped: "Não enviada",
  failed: "Recusada pelo provedor",
  unconfirmed: "Envio não confirmado",
};
export default function WhatsAppMessagingSettings({
  storeId,
  enabled,
}: {
  storeId?: string;
  enabled: boolean;
}) {
  const [settings, setSettings] = useState<Settings | null>(null),
    [history, setHistory] = useState<History[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [feedback, setFeedback] = useState(""),
    [dirty, setDirty] = useState(false),
    [orderId, setOrderId] = useState(""),
    [replyId, setReplyId] = useState("");
  const {
    orders,
    loading: ordersLoading,
    hasMore,
    loadMore,
  } = useTenantOrders();
  const webOrders = orders.filter((o) => o.source === "web" && o.phone);
  const pending = useRef(false),
    scope = useRef(0);
  const call = async (action: string, values: Record<string, unknown> = {}) => {
    const fn = httpsCallable<Record<string, unknown>, Result>(
      getFirebaseFunctions(),
      "tenantWhatsAppMessaging",
    );
    return (await fn({ storeId, action, ...values })).data;
  };
  useEffect(() => {
    let cancelled = false;
    scope.current++;
    pending.current = false;
    setBusy(false);
    setFeedback("");
    setSettings(null);
    setDirty(false);
    setOrderId("");
    setReplyId("");
    setHistory([]);
    if (!enabled || !storeId) return;
    setBusy(true);
    setError("");
    call("get")
      .then((r) => {
        if (!cancelled) {
          setSettings(r.settings || null);
          setHistory(r.history || []);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Não foi possível carregar as mensagens. Feche e reabra o painel para tentar novamente.",
          );
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
      scope.current++;
    };
  }, [storeId, enabled]);
  function change(values: Partial<Settings>) {
    setSettings((current) => (current ? { ...current, ...values } : current));
    setDirty(true);
    setFeedback("");
    setError("");
  }
  async function run(action: string, values: Record<string, unknown> = {}) {
    if (pending.current || !storeId) return null;
    pending.current = true;
    setBusy(true);
    setError("");
    setFeedback("");
    const version = scope.current;
    try {
      const result = await call(action, values);
      if (version !== scope.current) return null;
      if (result.settings) {
        setSettings(result.settings);
        setDirty(false);
      }
      if (result.history) setHistory(result.history);
      return result;
    } catch (cause) {
      if (version !== scope.current) return null;
      const e = cause as { code?: string; message?: string };
      setError(
        [
          "functions/invalid-argument",
          "functions/failed-precondition",
          "functions/aborted",
        ].includes(e.code || "") &&
          e.message &&
          e.message.length < 350
          ? e.message
          : "Não foi possível concluir. Tente novamente em instantes.",
      );
      return null;
    } finally {
      if (version === scope.current) {
        pending.current = false;
        setBusy(false);
      }
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    const result = await run("save", { settings, revision: settings.revision });
    if (result) setFeedback("Configurações salvas.");
  }
  async function send() {
    if (!settings || dirty || !orderId || !replyId || pending.current) return;
    const key = `cardap:whatsapp-reply:${storeId}:${orderId}:${replyId}`;
    let requestId;
    try {
      requestId = localStorage.getItem(key) || crypto.randomUUID();
      localStorage.setItem(key, requestId);
    } catch {
      setError(
        "Permita o armazenamento do navegador para enviar sem duplicar solicitações.",
      );
      return;
    }
    const result = await run("sendReply", {
      orderId,
      replyId,
      requestId,
      revision: settings.revision,
    });
    if (result?.queued) {
      try {
        localStorage.removeItem(key);
      } catch {}
      setFeedback(
        "Resposta adicionada à fila. Atualize os envios para acompanhar.",
      );
    }
  }
  return (
    <section
      className="whatsapp-messaging"
      aria-labelledby="whatsapp-messaging-title"
    >
      <h3 id="whatsapp-messaging-title">Mensagens do restaurante</h3>
      <p className="whatsapp-messaging-hint">
        Revise os textos e escolha quais automações deseja ativar.
      </p>
      {busy && !settings && <p role="status">Carregando mensagens…</p>}
      {settings && (
        <>
          <form onSubmit={save}>
            <fieldset disabled={busy}>
              <label className="whatsapp-automation-toggle">
                <input
                  type="checkbox"
                  checked={settings.orderEnabled}
                  onChange={(e) => change({ orderEnabled: e.target.checked })}
                />
                <span>
                  <strong>Avisos sobre pedidos</strong>
                  <small>
                    Envie ao cliente as mudanças de status dos pedidos online.
                  </small>
                </span>
              </label>
              <details className="whatsapp-template-details">
                <summary>Personalizar avisos dos pedidos</summary>
                {Object.entries(statuses).map(([key, label]) => (
                  <label className="whatsapp-message-field" key={key}>
                    {label}
                    <textarea
                      maxLength={1000}
                      required
                      value={settings.orderTexts[key]}
                      onChange={(e) =>
                        change({
                          orderTexts: {
                            ...settings.orderTexts,
                            [key]: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </details>
              <label className="whatsapp-automation-toggle">
                <input
                  type="checkbox"
                  checked={settings.welcomeEnabled}
                  onChange={(e) => change({ welcomeEnabled: e.target.checked })}
                />
                <span>
                  <strong>Mensagem de boas-vindas</strong>
                  <small>
                    Responda ao primeiro contato de texto. No máximo uma
                    saudação por cliente a cada 24 horas.
                  </small>
                </span>
              </label>
              <label className="whatsapp-message-field">
                Texto de boas-vindas
                <textarea
                  required
                  maxLength={1000}
                  value={settings.welcomeText}
                  onChange={(e) => change({ welcomeText: e.target.value })}
                />
              </label>
              <p className="whatsapp-messaging-hint">
                Nos textos, use {"{cliente}"}, {"{loja}"}, {"{pedido}"} e{" "}
                {"{status}"}. O cliente pode enviar SAIR para parar os envios e
                VOLTAR para retomá-los.
              </p>
              <h4>Respostas rápidas</h4>
              <p className="whatsapp-messaging-hint">
                Salve até dez textos para enviar aos clientes dos pedidos.
              </p>
              <div className="whatsapp-quick-list">
                {settings.quickReplies.map((reply, index) => (
                  <div className="whatsapp-quick-editor" key={reply.id}>
                    <label className="whatsapp-message-field">
                      Nome da resposta {index + 1}
                      <input
                        required
                        maxLength={60}
                        value={reply.title}
                        onChange={(e) =>
                          change({
                            quickReplies: settings.quickReplies.map((r) =>
                              r.id === reply.id
                                ? { ...r, title: e.target.value }
                                : r,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="whatsapp-message-field">
                      Texto da resposta {index + 1}
                      <textarea
                        required
                        maxLength={1000}
                        value={reply.text}
                        onChange={(e) =>
                          change({
                            quickReplies: settings.quickReplies.map((r) =>
                              r.id === reply.id
                                ? { ...r, text: e.target.value }
                                : r,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      className="whatsapp-message-text-button"
                      type="button"
                      onClick={() =>
                        change({
                          quickReplies: settings.quickReplies.filter(
                            (r) => r.id !== reply.id,
                          ),
                        })
                      }
                    >
                      Remover resposta {index + 1}
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="whatsapp-message-secondary"
                type="button"
                disabled={settings.quickReplies.length >= 10}
                onClick={() =>
                  change({
                    quickReplies: [
                      ...settings.quickReplies,
                      { id: crypto.randomUUID(), title: "", text: "" },
                    ],
                  })
                }
              >
                Adicionar resposta rápida
              </button>
              <button
                className="whatsapp-message-primary"
                type="submit"
                disabled={!dirty}
              >
                {busy ? "Salvando…" : "Salvar configurações"}
              </button>
            </fieldset>
          </form>
          <section
            className="whatsapp-manual-reply"
            aria-labelledby="whatsapp-manual-reply-title"
          >
            <h4 id="whatsapp-manual-reply-title">Enviar uma resposta rápida</h4>
            <p className="whatsapp-messaging-hint">
              O destinatário é o WhatsApp informado no pedido selecionado.
            </p>
            <label className="whatsapp-message-field">
              Pedido
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={busy || ordersLoading}
              >
                <option value="">Selecione um pedido</option>
                {webOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.id} · {order.customer}
                  </option>
                ))}
              </select>
            </label>
            {!ordersLoading && !webOrders.length && (
              <p className="whatsapp-messaging-hint">
                Nenhum pedido online com telefone na lista carregada.
              </p>
            )}
            {hasMore && (
              <button
                type="button"
                className="whatsapp-message-secondary"
                disabled={ordersLoading || busy}
                onClick={loadMore}
              >
                Carregar mais pedidos
              </button>
            )}
            <label className="whatsapp-message-field">
              Resposta
              <select
                disabled={busy}
                value={replyId}
                onChange={(e) => setReplyId(e.target.value)}
              >
                <option value="">Selecione uma resposta</option>
                {settings.quickReplies.map((reply) => (
                  <option key={reply.id} value={reply.id}>
                    {reply.title}
                  </option>
                ))}
              </select>
            </label>
            {replyId && (
              <p className="whatsapp-reply-preview">
                {settings.quickReplies.find((r) => r.id === replyId)?.text}
              </p>
            )}
            {dirty && (
              <p className="whatsapp-messaging-hint">
                Salve as alterações antes de enviar.
              </p>
            )}
            <button
              type="button"
              className="whatsapp-message-primary"
              disabled={busy || dirty || !orderId || !replyId}
              onClick={() => void send()}
            >
              Enviar resposta
            </button>
          </section>
          <section
            className="whatsapp-history"
            aria-labelledby="whatsapp-history-title"
          >
            <div className="whatsapp-history-heading">
              <h4 id="whatsapp-history-title">Últimos envios</h4>
              <button
                type="button"
                className="whatsapp-message-text-button"
                disabled={busy}
                onClick={() => void run("history")}
              >
                Atualizar envios
              </button>
            </div>
            <p className="whatsapp-messaging-hint">
              Se um envio não estiver confirmado, confira no WhatsApp antes de
              enviar novamente. Aceita pelo WhatsApp não significa que o cliente
              leu.
            </p>
            {history.length ? (
              <ul>
                {history.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.customer}</strong>
                      <span>{historyLabels[item.status] || item.status}</span>
                    </div>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="whatsapp-messaging-hint">
                Nenhuma mensagem registrada.
              </p>
            )}
          </section>
        </>
      )}
      {error && (
        <p className="whatsapp-integration-error" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="whatsapp-message-feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
}
