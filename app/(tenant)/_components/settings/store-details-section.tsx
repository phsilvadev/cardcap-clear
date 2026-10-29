export default function StoreDetailsSection() {
  return (
    <section className={"panel settings-panel"}>
      <h2>{"Dados do restaurante"}</h2>
      <form id={"settings-form"}>
        <label className={"flow-field"} htmlFor={"setting-name"}>
          {"Nome da loja"}
          <input
            id={"setting-name"}
            required={true}
            minLength={2}
            maxLength={80}
          />
        </label>
        <label className={"flow-field"} htmlFor={"setting-phone"}>
          {"Telefone"}
          <input
            id={"setting-phone"}
            type={"tel"}
            maxLength={20}
            required={true}
          />
        </label>
        <label className={"flow-field"} htmlFor={"setting-description"}>
          {"Descrição"}
          <textarea
            id={"setting-description"}
            maxLength={300}
            required={true}
          ></textarea>
        </label>
        <button type={"submit"} className={"flow-button full"}>
          {"Salvar alterações de demonstração"}
        </button>
      </form>
    </section>
  );
}
