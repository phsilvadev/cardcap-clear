const { randomUUID } = require("node:crypto");
const states = ["new", "preparing", "delivery", "done", "cancelled"];
const next = { new: "preparing", preparing: "delivery", delivery: "done" };
const validId = (value) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
function createTenantOrders({
  db,
  HttpsError,
  timestamp,
  now = Date.now,
  uuid = randomUUID,
}) {
  const fail = (code, message) => {
    throw new HttpsError(code, message);
  };
  const tenantRef = (storeId) => db.doc(`tenants/${storeId}`);
  const settingsRef = (storeId) =>
    db.doc(`tenants/${storeId}/printing/settings`);
  const orders = (storeId) => db.collection(`tenants/${storeId}/orders`);
  const jobs = (storeId) => db.collection(`tenants/${storeId}/printJobs`);
  function checkTenant(tenant, storeId) {
    if (
      !tenant ||
      tenant.ownerUid !== storeId ||
      !["configured", "active"].includes(tenant.status)
    )
      fail(
        "permission-denied",
        "Acesso restrito ao proprietário de uma loja configurada.",
      );
  }
  function orderView(id, order) {
    if (
      !validId(id) ||
      id.length > 100 ||
      !order ||
      !states.includes(order.status) ||
      typeof order.customer !== "string" ||
      !order.customer.trim() ||
      order.customer.length > 120 ||
      typeof order.items !== "string" ||
      !order.items.trim() ||
      order.items.length > 12000 ||
      !Number.isSafeInteger(order.total) ||
      order.total < 0 ||
      order.total > 100000000
    )
      fail("failed-precondition", "O pedido possui dados incompletos.");
    const created = order.createdAt?.toMillis?.();
    return {
      id,
      customer: order.customer,
      items: order.items,
      total: order.total,
      status: order.status,
      time: created
        ? new Date(created).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })
        : "Horário não informado",
      ...(order.courierId
        ? { courierId: order.courierId, courierName: order.courierName || "" }
        : {}),
      ...(order.cancellationReason
        ? { cancellationReason: order.cancellationReason }
        : {}),
    };
  }
  const configuration = (data) => ({
    autoAccept: data?.autoAccept === true,
    deviceId: typeof data?.deviceId === "string" ? data.deviceId : "",
    deviceName: typeof data?.deviceName === "string" ? data.deviceName : "",
  });
  async function accept(storeId, orderId, automatic = false) {
    const ref = orders(storeId).doc(orderId);
    const jobRef = jobs(storeId).doc(`kitchen-${orderId}`);
    return db.runTransaction(async (tx) => {
      const [tenantDoc, settingsDoc, orderDoc, jobDoc] = await Promise.all([
        tx.get(tenantRef(storeId)),
        tx.get(settingsRef(storeId)),
        tx.get(ref),
        tx.get(jobRef),
      ]);
      const tenant = tenantDoc.data();
      checkTenant(tenant, storeId);
      if (automatic && settingsDoc.data()?.autoAccept !== true) return false;
      const order = orderDoc.data();
      if (!order) fail("not-found", "Pedido não encontrado.");
      if (order.storeId !== storeId)
        fail("permission-denied", "Pedido de outro restaurante.");
      if (order.status !== "new") return false;
      const receipt = orderView(orderId, { ...order, status: "preparing" });
      tx.update(ref, {
        status: "preparing",
        acceptedAt: timestamp(),
        updatedAt: timestamp(),
      });
      if (!jobDoc.exists)
        tx.create(jobRef, {
          storeId,
          orderId,
          receipt,
          storeName: tenant.name,
          state: "queued",
          attempt: 1,
          createdAt: timestamp(),
          updatedAt: timestamp(),
        });
      return true;
    });
  }
  async function autoAccept(storeId, orderId) {
    if (!validId(storeId) || !validId(orderId)) return;
    try {
      await accept(storeId, orderId, true);
    } catch (error) {
      if (
        ![
          "permission-denied",
          "not-found",
          "failed-precondition",
          "invalid-argument",
        ].includes(error.code)
      )
        throw error;
    }
  }
  async function handler(request) {
    if (!request.auth)
      fail("unauthenticated", "Entre com a conta do proprietário.");
    const input = request.data ?? {};
    const { storeId, action } = input;
    if (!validId(storeId)) fail("invalid-argument", "Restaurante inválido.");
    if (request.auth.uid !== storeId)
      fail("permission-denied", "Você não tem acesso a este restaurante.");
    checkTenant((await tenantRef(storeId).get()).data(), storeId);
    if (action === "inspect") {
      const [tenant, config] = await Promise.all([
        tenantRef(storeId).get(),
        settingsRef(storeId).get(),
      ]);
      return {
        storeId,
        storeName: tenant.data().name,
        printing: configuration(config.data()),
      };
    }
    if (action === "list") {
      let query = orders(storeId).orderBy("createdAt", "desc").limit(50);
      if (input.cursor) {
        if (!validId(input.cursor))
          fail("invalid-argument", "Página inválida.");
        const cursor = await orders(storeId).doc(input.cursor).get();
        if (!cursor.exists)
          fail("not-found", "Página de pedidos não encontrada.");
        query = query.startAfter(cursor);
      }
      const [snapshot, config, attention] = await Promise.all([
        query.get(),
        settingsRef(storeId).get(),
        jobs(storeId)
          .where("state", "in", ["uncertain", "printing"])
          .limit(50)
          .get(),
      ]);
      return {
        orders: snapshot.docs
          .filter((doc) => doc.data().storeId === storeId)
          .map((doc) => orderView(doc.id, doc.data())),
        cursor: snapshot.size === 50 ? snapshot.docs.at(-1).id : null,
        printing: configuration(config.data()),
        attention: attention.docs.map((doc) => ({
          id: doc.id,
          orderId: doc.data().orderId,
          state: doc.data().state,
          updatedAt: doc.data().updatedAt?.toMillis?.() ?? 0,
        })),
      };
    }
    if (action === "setAutoAccept") {
      if (typeof input.enabled !== "boolean")
        fail("invalid-argument", "Opção inválida.");
      await db.runTransaction(async (tx) => {
        checkTenant((await tx.get(tenantRef(storeId))).data(), storeId);
        tx.set(
          settingsRef(storeId),
          { autoAccept: input.enabled, updatedAt: timestamp() },
          { merge: true },
        );
      });
      if (input.enabled) {
        const pending = await orders(storeId)
          .where("status", "==", "new")
          .get();
        for (let offset = 0; offset < pending.docs.length; offset += 10)
          await Promise.all(
            pending.docs
              .slice(offset, offset + 10)
              .map((doc) => accept(storeId, doc.id, true)),
          );
      }
      return { ok: true };
    }
    if (action === "setDevice") {
      if (input.deviceId !== "" && !validId(input.deviceId))
        fail("invalid-argument", "Computador inválido.");
      if (
        typeof input.deviceName !== "string" ||
        input.deviceName.length > 100 ||
        typeof input.expectedDeviceId !== "string"
      )
        fail("invalid-argument", "Confira o computador.");
      await db.runTransaction(async (tx) => {
        const [tenant, config] = await Promise.all([
          tx.get(tenantRef(storeId)),
          tx.get(settingsRef(storeId)),
        ]);
        checkTenant(tenant.data(), storeId);
        if ((config.data()?.deviceId || "") !== input.expectedDeviceId)
          fail(
            "aborted",
            "O computador responsável mudou. Atualize antes de tentar novamente.",
          );
        tx.set(
          settingsRef(storeId),
          {
            deviceId: input.deviceId,
            deviceName: input.deviceName.trim(),
            updatedAt: timestamp(),
          },
          { merge: true },
        );
      });
      return { ok: true };
    }
    if (action === "transition") {
      if (
        !validId(input.orderId) ||
        !states.includes(input.expected) ||
        !states.includes(input.target)
      )
        fail("invalid-argument", "Etapa inválida.");
      if (input.target === "preparing" && input.expected === "new")
        return { changed: await accept(storeId, input.orderId) };
      if (
        input.target === "cancelled" &&
        (typeof input.reason !== "string" ||
          input.reason.trim().length < 3 ||
          input.reason.length > 300)
      )
        fail("invalid-argument", "Informe o motivo do cancelamento.");
      const ref = orders(storeId).doc(input.orderId);
      await db.runTransaction(async (tx) => {
        const [tenant, orderDoc, jobDoc] = await Promise.all([
          tx.get(tenantRef(storeId)),
          tx.get(ref),
          tx.get(jobs(storeId).doc(`kitchen-${input.orderId}`)),
        ]);
        checkTenant(tenant.data(), storeId);
        const order = orderDoc.data();
        if (!order || order.storeId !== storeId)
          fail("not-found", "Pedido não encontrado.");
        if (order.status === input.target) return;
        if (
          order.status !== input.expected ||
          (input.target === "cancelled"
            ? ["done", "cancelled"].includes(order.status)
            : next[order.status] !== input.target)
        )
          fail(
            "failed-precondition",
            "O pedido mudou. Atualize antes de continuar.",
          );
        tx.update(ref, {
          status: input.target,
          updatedAt: timestamp(),
          ...(input.target === "cancelled"
            ? { cancellationReason: input.reason.trim() }
            : {}),
        });
        if (
          input.target === "cancelled" &&
          ["queued", "reserved"].includes(jobDoc.data()?.state)
        )
          tx.update(jobDoc.ref, { state: "cancelled", updatedAt: timestamp() });
      });
      return { ok: true };
    }
    if (action === "assignCourier") {
      if (
        !validId(input.orderId) ||
        (input.courierId !== "" && !validId(input.courierId))
      )
        fail("invalid-argument", "Entregador inválido.");
      await db.runTransaction(async (tx) => {
        const ref = orders(storeId).doc(input.orderId);
        const reads = [tx.get(tenantRef(storeId)), tx.get(ref)];
        if (input.courierId)
          reads.push(
            tx.get(db.doc(`tenants/${storeId}/employees/${input.courierId}`)),
          );
        const [tenant, orderDoc, employeeDoc] = await Promise.all(reads);
        checkTenant(tenant.data(), storeId);
        if (!tenant.data().operations?.ownDelivery)
          fail("failed-precondition", "Habilite a entrega própria.");
        const order = orderDoc.data();
        if (
          !order ||
          order.storeId !== storeId ||
          !["preparing", "delivery"].includes(order.status)
        )
          fail("failed-precondition", "Pedido não disponível para atribuição.");
        const employee = employeeDoc?.data();
        if (
          input.courierId &&
          (!employee ||
            employee.storeId !== storeId ||
            employee.role !== "courier" ||
            employee.active !== true)
        )
          fail(
            "permission-denied",
            "Entregador sem vínculo ativo com esta loja.",
          );
        tx.update(ref, {
          courierId: input.courierId,
          courierName: employee?.name ?? "",
          updatedAt: timestamp(),
        });
      });
      return { ok: true };
    }
    if (action === "claim") {
      if (!validId(input.deviceId))
        fail("invalid-argument", "Computador inválido.");
      return db.runTransaction(async (tx) => {
        const [tenant, config, candidates] = await Promise.all([
          tx.get(tenantRef(storeId)),
          tx.get(settingsRef(storeId)),
          tx.get(
            jobs(storeId)
              .where("state", "in", ["queued", "reserved"])
              .limit(30),
          ),
        ]);
        checkTenant(tenant.data(), storeId);
        if (config.data()?.deviceId !== input.deviceId)
          return { job: null, designated: false };
        const candidate = candidates.docs.find(
          (doc) =>
            doc.data().state === "queued" || doc.data().leaseUntil <= now(),
        );
        if (!candidate) return { job: null, designated: true };
        const job = candidate.data();
        if (job.storeId !== storeId)
          fail("permission-denied", "Comanda de outro restaurante.");
        const order = (await tx.get(orders(storeId).doc(job.orderId))).data();
        if (
          !order ||
          order.storeId !== storeId ||
          order.status === "cancelled"
        ) {
          tx.update(candidate.ref, {
            state: "cancelled",
            updatedAt: timestamp(),
          });
          return { job: null, designated: true };
        }
        const claimToken = uuid();
        tx.update(candidate.ref, {
          state: "reserved",
          deviceId: input.deviceId,
          claimToken,
          leaseUntil: now() + 30000,
          updatedAt: timestamp(),
        });
        return {
          designated: true,
          job: {
            jobId: candidate.id,
            claimToken,
            attempt: job.attempt,
            payload: {
              id: `${candidate.id}:${job.attempt}`,
              storeId,
              storeName: job.storeName,
              order: job.receipt,
            },
          },
        };
      });
    }
    if (action === "start" || action === "finish" || action === "retry") {
      if (!validId(input.jobId)) fail("invalid-argument", "Comanda inválida.");
      const ref = jobs(storeId).doc(input.jobId);
      return db.runTransaction(async (tx) => {
        const [tenant, config, jobDoc] = await Promise.all([
          tx.get(tenantRef(storeId)),
          tx.get(settingsRef(storeId)),
          tx.get(ref),
        ]);
        checkTenant(tenant.data(), storeId);
        const job = jobDoc.data();
        if (!job || job.storeId !== storeId)
          fail("not-found", "Comanda não encontrada.");
        if (action === "retry") {
          if (
            input.confirmed !== true ||
            !["uncertain", "printing"].includes(job.state)
          )
            fail(
              "failed-precondition",
              "Revise a impressão antes de reenviar.",
            );
          if (
            job.state === "printing" &&
            (job.startedAt?.toMillis?.() ?? now()) > now() - 120000
          )
            fail(
              "failed-precondition",
              "Aguarde dois minutos e confira a impressora antes de reenviar.",
            );
          const order = (await tx.get(orders(storeId).doc(job.orderId))).data();
          if (
            !order ||
            order.storeId !== storeId ||
            order.status === "cancelled"
          )
            fail("failed-precondition", "Pedido cancelado ou removido.");
          tx.update(ref, {
            state: "queued",
            attempt: job.attempt + 1,
            claimToken: "",
            deviceId: "",
            leaseUntil: 0,
            updatedAt: timestamp(),
          });
          return { ok: true };
        }
        if (
          !validId(input.deviceId) ||
          typeof input.claimToken !== "string" ||
          input.claimToken !== job.claimToken ||
          input.deviceId !== job.deviceId
        )
          fail("permission-denied", "Reserva de impressão inválida.");
        if (action === "start") {
          const order = (await tx.get(orders(storeId).doc(job.orderId))).data();
          if (
            config.data()?.deviceId !== input.deviceId ||
            job.state !== "reserved" ||
            job.leaseUntil <= now() ||
            !order ||
            order.storeId !== storeId ||
            order.status === "cancelled"
          )
            fail(
              "failed-precondition",
              "A reserva expirou ou o computador foi alterado.",
            );
          tx.update(ref, {
            state: "printing",
            startedAt: timestamp(),
            updatedAt: timestamp(),
          });
          return { ok: true };
        }
        if (!["submitted", "uncertain"].includes(input.result))
          fail("invalid-argument", "Resultado inválido.");
        if (job.state === "submitted") return { ok: true };
        if (input.result === "submitted" && job.state !== "printing")
          fail("failed-precondition", "O envio ainda não foi iniciado.");
        if (!["printing", "reserved", "uncertain"].includes(job.state))
          fail("failed-precondition", "A comanda já mudou de etapa.");
        tx.update(ref, {
          state: input.result,
          updatedAt: timestamp(),
          ...(input.result === "submitted" ? { submittedAt: timestamp() } : {}),
        });
        return { ok: true };
      });
    }
    fail("invalid-argument", "Operação desconhecida.");
  }
  return { handler, autoAccept };
}
module.exports = { createTenantOrders, validId };
