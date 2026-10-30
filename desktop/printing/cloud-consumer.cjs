function createCloudConsumer({
  call,
  deviceId,
  deviceName,
  configured,
  print,
  submitted,
  loadInflight,
  saveInflight,
}) {
  let binding = null;
  let epoch = 0;
  let revision = 0;
  let busy = false;
  let error = "";
  const inflight = loadInflight();
  async function connect(session) {
    if (
      !session ||
      typeof session.storeId !== "string" ||
      typeof session.idToken !== "string" ||
      session.idToken.length > 4096
    )
      throw new Error("Sessão inválida.");
    const version = ++revision;
    if (binding && binding.storeId !== session.storeId) {
      binding = null;
      epoch++;
    }
    const result = await call(session, "inspect", {});
    if (version !== revision) return;
    if (result.storeId !== session.storeId)
      throw new Error("Vínculo de restaurante inválido.");
    binding = { ...session, storeName: result.storeName };
    error = "";
  }
  function disconnect() {
    binding = null;
    epoch++;
    revision++;
    error = "";
  }
  async function report(session, job, result) {
    await call(session, "finish", {
      jobId: job.jobId,
      claimToken: job.claimToken,
      deviceId,
      result,
    });
    delete inflight[`${session.storeId}:${job.jobId}`];
    saveInflight(inflight);
  }
  async function tick() {
    if (busy || !binding) return;
    busy = true;
    const session = binding;
    const version = epoch;
    const current = () =>
      binding?.storeId === session.storeId && epoch === version;
    try {
      const recovery = Object.values(inflight).find(
        (job) => job.storeId === session.storeId,
      );
      if (recovery) {
        try {
          await report(
            session,
            recovery,
            submitted(`${session.storeId}:${recovery.payloadId}`)
              ? "submitted"
              : "uncertain",
          );
        } catch (cause) {
          if (
            ["failed-precondition", "permission-denied", "not-found"].includes(
              cause.code,
            )
          ) {
            delete inflight[`${session.storeId}:${recovery.jobId}`];
            saveInflight(inflight);
          } else throw cause;
        }
        return;
      }
      if (!configured() || !current()) return;
      const { job, designated } = await call(session, "claim", { deviceId });
      if (!current()) return;
      if (!designated) {
        error =
          "Este computador não é o responsável pela impressão desta loja.";
        return;
      }
      error = "";
      if (!job) return;
      if (
        job.payload?.storeId !== session.storeId ||
        job.payload.id !== `${job.jobId}:${job.attempt}`
      )
        throw new Error("Comanda incompatível com a sessão.");
      const entry = {
        storeId: session.storeId,
        jobId: job.jobId,
        claimToken: job.claimToken,
        payloadId: job.payload.id,
      };
      inflight[`${session.storeId}:${job.jobId}`] = entry;
      saveInflight(inflight);
      let result = "uncertain";
      try {
        await call(session, "start", {
          jobId: job.jobId,
          claimToken: job.claimToken,
          deviceId,
        });
        if (!current()) throw new Error("Sessão alterada antes da impressão.");
        await print(job.payload);
        result = "submitted";
      } catch {
        error =
          "Comanda não confirmada. Confira a impressora e revise o envio no painel.";
      }
      await report(session, entry, result);
    } catch {
      error =
        "Não foi possível atualizar a fila. Confira a conexão e a sessão do restaurante.";
    } finally {
      busy = false;
    }
  }
  return {
    connect,
    disconnect,
    tick,
    status: () => ({
      deviceId,
      deviceName,
      storeId: binding?.storeId ?? null,
      error,
    }),
  };
}
module.exports = { createCloudConsumer };
