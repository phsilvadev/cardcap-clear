"use client";
import { useState, type FormEvent } from "react";
const questions = [
  {
    title: "O que falta para minha loja aparecer na plataforma?",
    text: "Abra o checklist na Visão geral. Ele mostra as informações salvas que ainda precisam ser completadas, as categorias e os produtos. Depois de preparar o cadastro, acompanhe a etapa de ativação da plataforma.",
    href: "/dashboard",
    link: "Abrir visão geral",
  },
  {
    title: "Como cadastrar ou alterar um produto?",
    text: "Em Cardápio, escolha Cadastrar produto ou abra a edição de um item. Confira a categoria, o preço, a imagem e a disponibilidade antes de salvar.",
    href: "/dashboard/cardapio",
    link: "Ir para o cardápio",
  },
  {
    title: "Como liberar o aplicativo para um garçom ou entregador?",
    text: "Habilite Salão ou Entrega própria em Operação da loja. Depois cadastre o funcionário com o cargo correspondente e gere o link de acesso em Funcionários.",
    href: "/dashboard?view=settings&section=employees",
    link: "Gerenciar funcionários",
  },
  {
    title: "A comanda não imprimiu. O que devo conferir?",
    text: "Confira se o Cardap Impressão está aberto com a conta da loja, se a impressora foi configurada e se este é o computador escolhido para imprimir. Antes de reenviar uma comanda em revisão, confira se o papel já saiu.",
    href: "/dashboard/pedidos",
    link: "Abrir pedidos",
  },
  {
    title: "Onde informo os dados de recebimento?",
    text: "Acesse Recebimentos nas configurações para informar o Wallet ID da carteira Asaas. A seção também traz as orientações de cadastro. Se a loja já está ativa e precisar trocar a carteira, fale com o suporte.",
    href: "/dashboard?view=settings&section=wallet",
    link: "Abrir recebimentos",
  },
  {
    title: "Onde encontro os aplicativos Cardap?",
    text: "Em Aplicativos Cardap você encontra as informações dos apps de garçom, entregador e impressão e os links de instalação quando estiverem disponíveis.",
    href: "/dashboard/aplicativos",
    link: "Ver aplicativos",
  },
];
const topics = [
  "Acesso à conta",
  "Cadastro da loja",
  "Pedidos",
  "Cardápio",
  "Aplicativos e impressão",
  "Recebimentos",
  "Outro assunto",
];
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
function phoneLabel(phone: string) {
  return phone.replace(/^55(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
}
export default function HelpPage({
  storeName,
  phone,
}: {
  storeName: string;
  phone: string | null;
}) {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  const visible = questions.filter((item) =>
    normalize(`${item.title} ${item.text}`).includes(normalize(search.trim())),
  );
  async function contact(event: FormEvent) {
    event.preventDefault();
    if (!phone || opening) return;
    if (message.trim().length < 3) {
      setError("Descreva brevemente o que você precisa resolver.");
      return;
    }
    setOpening(true);
    setError("");
    const text = `Olá! Preciso de suporte no Cardap.\nRestaurante: ${storeName}\nAssunto: ${topic}\n\n${message.trim()}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    try {
      if (window.cardapPrinter) {
        if (!window.cardapPrinter.openSupport) throw new Error("desktop");
        await window.cardapPrinter.openSupport(url);
      } else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError(
        `Não foi possível abrir o WhatsApp. Você também pode entrar em contato pelo número ${phoneLabel(phone)}.`,
      );
    } finally {
      setOpening(false);
    }
  }
  return (
    <div className="help-page">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Conte com a gente</p>
          <h1>Ajuda e suporte</h1>
          <p>Encontre orientações ou fale com o suporte do Cardap.</p>
        </div>
      </header>
      <nav className="help-shortcuts" aria-label="Atalhos de ajuda">
        <a href="/dashboard?view=settings">
          Configurações <span aria-hidden="true">↗</span>
        </a>
        <a href="/dashboard/aplicativos">
          Aplicativos Cardap <span aria-hidden="true">↗</span>
        </a>
        <a href="/dashboard/pedidos">
          Central de pedidos <span aria-hidden="true">↗</span>
        </a>
      </nav>
      <div className="help-layout">
        <section className="help-faq" aria-labelledby="help-faq-title">
          <h2 id="help-faq-title">Como podemos ajudar?</h2>
          <label className="search-label" htmlFor="help-search">
            <span className="sr-only">Buscar nas dúvidas frequentes</span>
            <input
              id="help-search"
              type="search"
              maxLength={100}
              placeholder="Busque por pedidos, acesso, impressão…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="help-faq-list">
            {visible.map((item) => (
              <details key={item.title}>
                <summary>
                  {item.title}
                  <span aria-hidden="true">+</span>
                </summary>
                <div>
                  <p>{item.text}</p>
                  <a className="text-button" href={item.href}>
                    {item.link} →
                  </a>
                </div>
              </details>
            ))}
          </div>
          {!visible.length && (
            <div className="help-empty">
              <p>Nenhuma orientação encontrada para essa busca.</p>
              <button
                className="text-button"
                type="button"
                onClick={() => setSearch("")}
              >
                Limpar busca
              </button>
            </div>
          )}
        </section>
        <aside className="help-contact" aria-labelledby="help-contact-title">
          <span className="help-contact-icon" aria-hidden="true">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 14v-3a9 9 0 0 1 18 0v3M3 13h3v7H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 1-2ZM21 13h-3v7h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-1-2ZM18 20c0 2-3 2-6 2" />
            </svg>
          </span>
          <h2 id="help-contact-title">Fale com o suporte</h2>
          <p>
            Descreva o que aconteceu e em qual tela. Vamos preparar sua mensagem
            para o WhatsApp.
          </p>
          {phone ? (
            <>
              <p className="help-contact-number">
                WhatsApp <strong>{phoneLabel(phone)}</strong>
              </p>
              <form
                onSubmit={(event) => {
                  void contact(event);
                }}
              >
                <label className="search-label" htmlFor="help-topic">
                  Assunto
                  <select
                    id="help-topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                  >
                    {topics.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="search-label" htmlFor="help-message">
                  Como podemos ajudar?
                  <textarea
                    id="help-message"
                    required
                    minLength={3}
                    maxLength={2000}
                    rows={5}
                    placeholder="Conte o que você precisa resolver…"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </label>
                <button
                  className="button primary"
                  type="submit"
                  disabled={opening}
                >
                  {opening ? "Abrindo…" : "Conversar no WhatsApp"}{" "}
                  <span aria-hidden="true">↗</span>
                </button>
                <small>Você revisa e envia a mensagem no WhatsApp.</small>
                {error && (
                  <p className="help-contact-error" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </>
          ) : (
            <p>
              O canal de atendimento está sendo configurado. Consulte as
              orientações ao lado.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
