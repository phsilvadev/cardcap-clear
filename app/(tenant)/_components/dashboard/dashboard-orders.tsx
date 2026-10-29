export default function DashboardOrders() {
  return (
    <section
      id={"view-orders"}
      className={"dashboard-view"}
      aria-label={"Pedidos"}
      hidden={true}
    >
      <div className={"order-toolbar"}>
        <label className={"search-label"} htmlFor={"order-query"}>
          {"Buscar pedido"}
          <input
            id={"order-query"}
            type={"search"}
            placeholder={"Nome do cliente ou número"}
            maxLength={100}
          />
        </label>
        <label className={"search-label"} htmlFor={"order-filter"}>
          {"Status"}
          <select id={"order-filter"}>
            <option value={"all"}>{"Todos"}</option>
            <option value={"new"}>{"Novos"}</option>
            <option value={"preparing"}>{"Em preparo"}</option>
            <option value={"delivery"}>{"Em entrega"}</option>
            <option value={"done"}>{"Concluídos"}</option>
          </select>
        </label>
      </div>
      <div id={"orders-list"} className={"order-list"}></div>
      <p id={"no-orders"} className={"flow-note"} hidden={true}>
        {"Nenhum pedido encontrado para esses filtros."}
      </p>
    </section>
  );
}
