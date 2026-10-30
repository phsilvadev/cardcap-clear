const { randomUUID, createHash } = require("node:crypto");
const validId = (value) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
const clean = (value, max = 100) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const cents = (value) =>
  Number.isSafeInteger(value) && value >= 0 && value <= 100000000;
function createSalon({
  db,
  auth,
  HttpsError,
  timestamp,
  now = Date.now,
  uuid = randomUUID,
}) {
  const fail = (code, message) => {
    throw new HttpsError(code, message);
  };
  const permission = (actor, name) =>
    actor.role === "owner" || actor.permissions?.[name] === true;
  const root = (id) => db.doc(`tenants/${id}`);
  async function actorFor(request) {
    const uid = request.auth?.uid;
    if (!uid) fail("unauthenticated", "Entre com seu acesso ao restaurante.");
    let user;
    try {
      user = await auth.getUser(uid);
    } catch (error) {
      if (["auth/user-not-found", "auth/invalid-uid"].includes(error.code))
        fail("permission-denied", "Seu acesso não está ativo.");
      throw error;
    }
    const revoked = Date.parse(user.tokensValidAfterTime ?? "") / 1000;
    if (
      user.disabled ||
      (Number.isFinite(revoked) &&
        (!Number.isFinite(request.auth.token?.auth_time) ||
          request.auth.token.auth_time < revoked))
    )
      fail("permission-denied", "Seu acesso não está ativo.");
    const own = (await root(uid).get()).data();
    let actor;
    if (own?.ownerUid === uid)
      actor = {
        uid,
        storeId: uid,
        role: "owner",
        name: own.ownerName || own.name,
        permissions: { receivePayments: true, discounts: true },
      };
    else {
      const mappings = await Promise.all(
        ["waiterAccounts", "salonAccounts"].map((collection) =>
          db.doc(`${collection}/${uid}`).get(),
        ),
      );
      for (let index = 0; index < mappings.length; index++) {
        const mapping = mappings[index].data();
        if (
          !mapping ||
          !validId(mapping.storeId) ||
          !validId(mapping.employeeId)
        )
          continue;
        const ref = db.doc(
          `tenants/${mapping.storeId}/employees/${mapping.employeeId}`,
        );
        const employee = (await ref.get()).data();
        const waiter = index === 0;
        if (
          !employee ||
          employee.uid !== uid ||
          employee.storeId !== mapping.storeId ||
          !employee.active ||
          (waiter
            ? employee.role !== "waiter"
            : !["manager", "attendant"].includes(employee.role))
        )
          continue;
        actor = {
          uid,
          storeId: mapping.storeId,
          employeeId: mapping.employeeId,
          role: waiter ? "waiter" : employee.role,
          name: employee.name,
          permissions: waiter ? {} : (employee.salonPermissions ?? {}),
          employeeRef: ref,
          mappingRef: db.doc(
            `${waiter ? "waiterAccounts" : "salonAccounts"}/${uid}`,
          ),
        };
        break;
      }
    }
    if (
      !actor ||
      (request.data?.storeId !== undefined &&
        request.data.storeId !== actor.storeId)
    )
      fail("permission-denied", "Acesso negado a este restaurante.");
    const store = (await root(actor.storeId).get()).data();
    checkStore(store, actor.storeId);
    return actor;
  }
  function checkStore(store, id) {
    if (
      !store ||
      store.ownerUid !== id ||
      !["configured", "active"].includes(store.status) ||
      store.operations?.salon !== true
    )
      fail("permission-denied", "O atendimento no salão não está habilitado.");
  }
  async function guard(tx, actor) {
    const store = (await tx.get(root(actor.storeId))).data();
    checkStore(store, actor.storeId);
    if (actor.role !== "owner") {
      const [employeeDoc, mappingDoc] = await Promise.all([
        tx.get(actor.employeeRef),
        tx.get(actor.mappingRef),
      ]);
      const employee = employeeDoc.data(),
        mapping = mappingDoc.data();
      if (
        !employee ||
        employee.uid !== actor.uid ||
        employee.storeId !== actor.storeId ||
        !employee.active ||
        employee.role !== actor.role ||
        mapping?.storeId !== actor.storeId ||
        mapping?.employeeId !== actor.employeeId
      )
        fail("permission-denied", "Seu acesso mudou. Entre novamente.");
      actor = {
        ...actor,
        permissions:
          actor.role === "waiter" ? {} : (employee.salonPermissions ?? {}),
      };
    }
    return { actor, store };
  }
  function viewTab(tab, actor) {
    if (!tab) return null;
    return {
      id: tab.id,
      status: tab.status,
      guests: tab.guests,
      lines: tab.lines,
      subtotalCents: tab.subtotalCents,
      discountCents: tab.discountCents,
      totalCents: tab.subtotalCents - tab.discountCents,
      paidCents: tab.paidCents,
      remainingCents: tab.subtotalCents - tab.discountCents - tab.paidCents,
      payments: permission(actor, "receivePayments") ? tab.payments : [],
      discountReason: tab.discountReason || "",
      openedAt: tab.openedAt,
      closedAt: tab.closedAt ?? null,
    };
  }
  async function handler(request) {
    const actor = await actorFor(request),
      input = request.data ?? {},
      action = input.action;
    const base = `tenants/${actor.storeId}`;
    if (action === "list") {
      const [tableDocs, orderDocs] = await Promise.all([
        db
          .collection(`${base}/salonTables`)
          .where("enabled", "==", true)
          .orderBy("__name__")
          .limit(100)
          .get(),
        db
          .collection(`${base}/orders`)
          .where("salonActive", "==", true)
          .orderBy("__name__")
          .limit(500)
          .get(),
      ]);
      const tables = await Promise.all(
        tableDocs.docs.map(async (doc) => {
          const table = doc.data();
          const tab = table.tabId
            ? (await db.doc(`${base}/salonTabs/${table.tabId}`).get()).data()
            : null;
          return {
            id: doc.id,
            name: table.name,
            status: table.status,
            guests: table.guests,
            tabId: table.tabId || null,
            tab: viewTab(tab, actor),
          };
        }),
      );
      const orders = orderDocs.docs
        .filter(
          (doc) =>
            doc.data().source === "salon" &&
            doc.data().storeId === actor.storeId,
        )
        .map((doc) => {
          const order = doc.data();
          return {
            id: doc.id,
            tableId: order.tableId,
            tabId: order.tabId,
            status:
              order.status === "delivery"
                ? "ready"
                : order.status === "done"
                  ? "served"
                  : order.status,
            items: order.lines.map((line) => ({
              productId: line.productId,
              name: line.name,
              quantity: line.quantity,
              price: line.priceCents,
            })),
            notes: order.notes || "",
            time: new Date(order.createdAtMs).toLocaleTimeString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });
      return {
        actor: {
          uid: actor.uid,
          storeId: actor.storeId,
          name: actor.name,
          role: actor.role,
          canReceive: permission(actor, "receivePayments"),
          canDiscount: permission(actor, "discounts"),
          canManage: actor.role === "owner",
          canClean: ["owner", "waiter"].includes(actor.role),
        },
        tables,
        orders,
      };
    }
    if (action === "history") {
      if (!permission(actor, "receivePayments"))
        fail(
          "permission-denied",
          "Seu acesso não permite consultar contas encerradas.",
        );
      let query = db
        .collection(`${base}/salonTabs`)
        .orderBy("closedAt", "desc")
        .orderBy("__name__", "desc");
      if (input.cursor) {
        if (
          !Number.isSafeInteger(input.cursor.closedAt) ||
          !validId(input.cursor.id)
        )
          fail("invalid-argument", "Página inválida.");
        query = query.startAfter(input.cursor.closedAt, input.cursor.id);
      }
      const result = await query.limit(50).get();
      const last = result.docs.at(-1);
      return {
        tabs: result.docs
          .filter((doc) => doc.data().status === "closed")
          .map((doc) => ({
            ...viewTab(doc.data(), actor),
            tableId: doc.data().tableId,
            tableName: doc.data().tableName,
          })),
        cursor:
          result.docs.length === 50
            ? { closedAt: last.data().closedAt, id: last.id }
            : null,
      };
    }
    if (action === "menu") {
      const [products, categories] = await Promise.all([
        db
          .collection(`${base}/products`)
          .where("available", "==", true)
          .orderBy("__name__")
          .limit(200)
          .get(),
        db.collection(`${base}/categories`).orderBy("name").limit(100).get(),
      ]);
      const names = new Map(
        categories.docs
          .filter((doc) => doc.data().storeId === actor.storeId)
          .map((doc) => [doc.id, doc.data().name]),
      );
      return {
        products: products.docs
          .filter(
            (doc) =>
              doc.data().storeId === actor.storeId &&
              names.has(doc.data().categoryId),
          )
          .map((doc) => {
            const p = doc.data();
            return {
              id: doc.id,
              name: p.name,
              description: p.description,
              price: p.priceCents,
              category: names.get(p.categoryId),
              requiresCustomization:
                p.customization?.groups?.some((group) => group.min > 0) ||
                !!p.customization?.division,
            };
          }),
      };
    }
    const allowed = [
      "createTable",
      "archiveTable",
      "open",
      "cancelEmpty",
      "send",
      "serve",
      "requestBill",
      "discount",
      "payment",
      "voidPayment",
      "close",
      "clean",
      "setPermissions",
    ];
    if (
      !allowed.includes(action) ||
      typeof input.requestId !== "string" ||
      !/^[a-zA-Z0-9_-]{8,80}$/.test(input.requestId)
    )
      fail(
        "invalid-argument",
        "Operação inválida. Atualize e tente novamente.",
      );
    if (
      !["createTable", "setPermissions"].includes(action) &&
      !validId(input.tableId)
    )
      fail("invalid-argument", "Mesa inválida.");
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");
    const operation = db.doc(
      `${base}/salonOperations/${actor.uid}_${input.requestId}`,
    );
    return db.runTransaction(async (tx) => {
      const checked = await guard(tx, actor),
        current = checked.actor,
        store = checked.store;
      const saved = (await tx.get(operation)).data();
      if (saved) {
        if (saved.fingerprint !== fingerprint)
          fail(
            "already-exists",
            "Esta operação já foi usada com outros dados. Atualize a tela.",
          );
        return saved.result;
      }
      const ownerOnly = () => {
        if (current.role !== "owner")
          fail(
            "permission-denied",
            "Somente o proprietário pode executar esta ação.",
          );
      };
      const waiterOnly = () => {
        if (!["owner", "waiter"].includes(current.role))
          fail(
            "permission-denied",
            "Esta ação é reservada ao garçom ou proprietário.",
          );
      };
      const cashier = () => {
        if (!permission(current, "receivePayments"))
          fail(
            "permission-denied",
            "Seu acesso não permite registrar pagamentos ou encerrar contas.",
          );
      };
      const finish = (result) => {
        tx.set(operation, {
          fingerprint,
          action,
          result,
          actorUid: current.uid,
          actorRole: current.role,
          createdAt: timestamp(),
        });
        tx.set(db.doc(`${base}/salonAudit/${current.uid}_${input.requestId}`), {
          action,
          tableId: input.tableId || null,
          tabId: input.tabId || null,
          actorUid: current.uid,
          actorRole: current.role,
          amountCents: input.amountCents ?? null,
          reason: clean(input.reason, 200),
          createdAt: timestamp(),
        });
        return result;
      };
      if (action === "setPermissions") {
        ownerOnly();
        if (
          !validId(input.employeeId) ||
          typeof input.receivePayments !== "boolean" ||
          typeof input.discounts !== "boolean"
        )
          fail("invalid-argument", "Confira as permissões.");
        const employeeRef = db.doc(`${base}/employees/${input.employeeId}`),
          employee = (await tx.get(employeeRef)).data();
        if (
          !employee ||
          employee.storeId !== current.storeId ||
          !employee.active ||
          !["manager", "attendant"].includes(employee.role) ||
          !validId(employee.uid) ||
          employee.uid === current.storeId
        )
          fail(
            "failed-precondition",
            "Escolha um atendente ou gerente ativo com acesso já liberado.",
          );
        const mappingRef = db.doc(`salonAccounts/${employee.uid}`),
          mapping = (await tx.get(mappingRef)).data();
        if (
          mapping &&
          (mapping.storeId !== current.storeId ||
            mapping.employeeId !== input.employeeId)
        )
          fail(
            "failed-precondition",
            "Este acesso já está vinculado a outro cadastro.",
          );
        tx.set(mappingRef, {
          storeId: current.storeId,
          employeeId: input.employeeId,
        });
        tx.update(employeeRef, {
          salonPermissions: {
            receivePayments: input.receivePayments,
            discounts: input.discounts,
          },
          updatedAt: timestamp(),
        });
        return finish({ ok: true });
      }
      if (action === "createTable") {
        ownerOnly();
        const name = clean(input.name, 40);
        if (name.length < 1 || name !== input.name?.trim())
          fail(
            "invalid-argument",
            "Informe um nome de até 40 caracteres para a mesa.",
          );
        const nameKey = createHash("sha256")
          .update(
            name
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/\s+/g, " "),
          )
          .digest("hex");
        const nameRef = db.doc(`${base}/salonTableNames/${nameKey}`);
        if ((await tx.get(nameRef)).exists)
          fail("already-exists", "Já existe uma mesa com esse nome.");
        if ((store.salonTableCount || 0) >= 100)
          fail(
            "resource-exhausted",
            "O salão comporta até 100 mesas cadastradas.",
          );
        const tableId = `t-${input.requestId}`;
        tx.set(db.doc(`${base}/salonTables/${tableId}`), {
          name,
          nameKey,
          status: "available",
          enabled: true,
          guests: 0,
          tabId: null,
          createdAt: timestamp(),
          updatedAt: timestamp(),
        });
        tx.set(nameRef, { tableId });
        tx.update(root(current.storeId), {
          salonTableCount: (store.salonTableCount || 0) + 1,
        });
        return finish({ ok: true, tableId });
      }
      const tableRef = db.doc(`${base}/salonTables/${input.tableId}`),
        table = (await tx.get(tableRef)).data();
      if (!table || table.enabled !== true)
        fail("not-found", "Mesa não encontrada.");
      if (action === "archiveTable") {
        ownerOnly();
        if (table.status !== "available" || table.tabId)
          fail("failed-precondition", "Arquive somente mesas disponíveis.");
        tx.update(tableRef, { enabled: false, updatedAt: timestamp() });
        tx.delete(db.doc(`${base}/salonTableNames/${table.nameKey}`));
        tx.update(root(current.storeId), {
          salonTableCount: Math.max(0, (store.salonTableCount || 0) - 1),
        });
        return finish({ ok: true });
      }
      if (action === "open") {
        waiterOnly();
        if (
          table.status !== "available" ||
          table.tabId ||
          !Number.isInteger(input.guests) ||
          input.guests < 1 ||
          input.guests > 40
        )
          fail(
            "failed-precondition",
            "A mesa não está disponível ou a quantidade de pessoas é inválida.",
          );
        const tabId = `c-${input.requestId}`;
        tx.set(db.doc(`${base}/salonTabs/${tabId}`), {
          id: tabId,
          tableId: input.tableId,
          tableName: table.name,
          status: "open",
          guests: input.guests,
          lines: [],
          orderIds: [],
          payments: [],
          subtotalCents: 0,
          discountCents: 0,
          paidCents: 0,
          openedAt: now(),
          openedBy: current.uid,
        });
        tx.update(tableRef, {
          status: "occupied",
          tabId,
          guests: input.guests,
          updatedAt: timestamp(),
        });
        return finish({ ok: true, tabId });
      }
      if (
        typeof input.tabId !== "string" ||
        input.tabId !== table.tabId ||
        !validId(input.tabId)
      )
        fail(
          "failed-precondition",
          "A comanda mudou. Atualize antes de continuar.",
        );
      const tabRef = db.doc(`${base}/salonTabs/${table.tabId}`),
        tab = (await tx.get(tabRef)).data();
      if (!tab || tab.tableId !== input.tableId)
        fail("failed-precondition", "Comanda inválida.");
      if (action === "clean") {
        waiterOnly();
        if (table.status !== "awaiting_cleaning" || tab.status !== "closed")
          fail(
            "failed-precondition",
            "A conta precisa estar encerrada antes de liberar a mesa.",
          );
        tx.update(tableRef, {
          status: "available",
          tabId: null,
          guests: 0,
          updatedAt: timestamp(),
          lastTabId: tab.id,
        });
        for (const id of tab.orderIds)
          tx.update(db.doc(`${base}/orders/${id}`), { salonActive: false });
        tx.update(root(current.storeId), {
          salonActiveOrders: Math.max(
            0,
            (store.salonActiveOrders || 0) - tab.orderIds.length,
          ),
        });
        return finish({ ok: true });
      }
      if (action === "cancelEmpty") {
        waiterOnly();
        if (tab.status !== "open" || tab.orderIds.length || tab.payments.length)
          fail(
            "failed-precondition",
            "Só é possível cancelar a abertura de uma mesa sem pedidos.",
          );
        tx.update(tabRef, {
          status: "void",
          closedAt: now(),
          closedBy: current.uid,
        });
        tx.update(tableRef, {
          status: "available",
          tabId: null,
          guests: 0,
          updatedAt: timestamp(),
        });
        return finish({ ok: true });
      }
      if (action === "send") {
        waiterOnly();
        if (tab.status !== "open" || table.status !== "occupied")
          fail("failed-precondition", "Esta comanda não aceita novos pedidos.");
        if (
          !Array.isArray(input.items) ||
          input.items.length < 1 ||
          input.items.length > 20 ||
          input.items.some(
            (item) =>
              !validId(item.productId) ||
              !Number.isInteger(item.quantity) ||
              item.quantity < 1 ||
              item.quantity > 20,
          ) ||
          new Set(input.items.map((item) => item.productId)).size !==
            input.items.length ||
          (input.notes !== undefined &&
            (typeof input.notes !== "string" || input.notes.length > 500))
        )
          fail("invalid-argument", "Confira os produtos e as quantidades.");
        if (
          tab.lines.length + input.items.length > 200 ||
          tab.orderIds.length >= 50 ||
          (store.salonActiveOrders || 0) >= 500
        )
          fail(
            "resource-exhausted",
            "Limite de pedidos ativos atingido. Conclua os atendimentos pendentes.",
          );
        const products = await Promise.all(
          input.items.map((item) =>
            tx.get(db.doc(`${base}/products/${item.productId}`)),
          ),
        );
        const lines = products.map((doc, index) => {
          const p = doc.data();
          if (
            !p ||
            p.storeId !== current.storeId ||
            p.available !== true ||
            !cents(p.priceCents) ||
            p.priceCents < 1 ||
            typeof p.name !== "string" ||
            p.customization?.groups?.some((group) => group.min > 0) ||
            p.customization?.division
          )
            fail(
              "failed-precondition",
              "Um produto não está disponível ou exige personalização. Atualize o cardápio.",
            );
          return {
            productId: input.items[index].productId,
            name: clean(p.name),
            priceCents: p.priceCents,
            quantity: input.items[index].quantity,
          };
        });
        const categories = await Promise.all(
          products.map((doc) => {
            const categoryId = doc.data()?.categoryId;
            if (!validId(categoryId))
              fail(
                "failed-precondition",
                "Um produto não possui categoria válida.",
              );
            return tx.get(db.doc(`${base}/categories/${categoryId}`));
          }),
        );
        if (categories.some((doc) => doc.data()?.storeId !== current.storeId))
          fail(
            "failed-precondition",
            "Um produto não pertence ao cardápio desta loja.",
          );
        const total = lines.reduce(
          (sum, line) => sum + line.priceCents * line.quantity,
          0,
        );
        if (!cents(total + tab.subtotalCents))
          fail(
            "invalid-argument",
            "O total da comanda ultrapassa o limite permitido.",
          );
        const sequence = (store.salonOrderSequence || 0) + 1,
          orderId = `s-${sequence}`;
        const orderRef = db.doc(`${base}/orders/${orderId}`);
        if ((await tx.get(orderRef)).exists)
          fail(
            "failed-precondition",
            "A numeração dos pedidos precisa ser revisada pelo suporte.",
          );
        tx.set(orderRef, {
          storeId: current.storeId,
          source: "salon",
          salonActive: true,
          tableId: input.tableId,
          tableName: table.name,
          tabId: tab.id,
          customer: table.name,
          items: lines
            .map((line) => `${line.quantity} × ${line.name}`)
            .join(" · "),
          lines,
          total,
          status: "new",
          notes: clean(input.notes, 500),
          createdAt: timestamp(),
          createdAtMs: now(),
          createdBy: current.uid,
          updatedAt: timestamp(),
        });
        tx.update(tabRef, {
          lines: [...tab.lines, ...lines.map((line) => ({ ...line, orderId }))],
          orderIds: [...tab.orderIds, orderId],
          subtotalCents: tab.subtotalCents + total,
        });
        tx.update(root(current.storeId), {
          salonOrderSequence: sequence,
          salonActiveOrders: (store.salonActiveOrders || 0) + 1,
        });
        return finish({ ok: true, orderId });
      }
      if (action === "serve") {
        waiterOnly();
        if (
          !validId(input.orderId) ||
          !tab.orderIds.includes(input.orderId) ||
          tab.status !== "open"
        )
          fail("failed-precondition", "Pedido não disponível para servir.");
        const orderRef = db.doc(`${base}/orders/${input.orderId}`),
          order = (await tx.get(orderRef)).data();
        if (
          order?.storeId !== current.storeId ||
          order.tabId !== tab.id ||
          order.source !== "salon" ||
          order.status !== "delivery"
        )
          fail(
            "failed-precondition",
            "A cozinha ainda não marcou este pedido como pronto.",
          );
        tx.update(orderRef, {
          status: "done",
          servedAt: timestamp(),
          servedBy: current.uid,
          updatedAt: timestamp(),
        });
        return finish({ ok: true });
      }
      if (action === "requestBill") {
        waiterOnly();
        if (tab.status !== "open" || !tab.orderIds.length)
          fail(
            "failed-precondition",
            "Esta comanda não está aberta ou ainda não possui pedidos.",
          );
        const orders = await Promise.all(
          tab.orderIds.map((id) => tx.get(db.doc(`${base}/orders/${id}`))),
        );
        if (
          orders.some(
            (doc) =>
              !["done", "cancelled"].includes(doc.data()?.status) ||
              doc.data()?.tabId !== tab.id,
          )
        )
          fail(
            "failed-precondition",
            "Sirva os pedidos pendentes antes de solicitar a conta.",
          );
        tx.update(tabRef, {
          status: "requested",
          requestedAt: now(),
          requestedBy: current.uid,
        });
        tx.update(tableRef, {
          status: "bill_requested",
          updatedAt: timestamp(),
        });
        return finish({ ok: true });
      }
      if (tab.status !== "requested" || table.status !== "bill_requested")
        fail(
          "failed-precondition",
          "A conta ainda não foi solicitada ao caixa ou já foi encerrada.",
        );
      if (action === "discount") {
        if (!permission(current, "discounts"))
          fail(
            "permission-denied",
            "Seu acesso não permite aplicar descontos.",
          );
        if (
          !cents(input.amountCents) ||
          input.amountCents > tab.subtotalCents ||
          clean(input.reason, 200).length < 3 ||
          tab.payments.some((payment) => !payment.voided)
        )
          fail(
            "failed-precondition",
            "Confira o desconto e o motivo. Aplique descontos antes dos pagamentos.",
          );
        tx.update(tabRef, {
          discountCents: input.amountCents,
          discountReason: clean(input.reason, 200),
          discountBy: current.uid,
        });
        return finish({ ok: true });
      }
      cashier();
      if (action === "payment") {
        const remaining = tab.subtotalCents - tab.discountCents - tab.paidCents;
        if (
          !cents(input.amountCents) ||
          input.amountCents < 1 ||
          input.amountCents > remaining ||
          !["cash", "pix", "card"].includes(input.method) ||
          (input.payer !== undefined &&
            (typeof input.payer !== "string" || input.payer.length > 80)) ||
          tab.payments.length >= 100
        )
          fail(
            "invalid-argument",
            "Informe um valor válido até o saldo restante e a forma de pagamento.",
          );
        const payment = {
          id: input.requestId,
          amountCents: input.amountCents,
          method: input.method,
          payer: clean(input.payer, 80),
          recordedBy: current.uid,
          recordedAt: now(),
          voided: false,
        };
        tx.update(tabRef, {
          payments: [...tab.payments, payment],
          paidCents: tab.paidCents + input.amountCents,
        });
        return finish({ ok: true, paymentId: payment.id });
      }
      if (action === "voidPayment") {
        ownerOnly();
        if (!validId(input.paymentId) || clean(input.reason, 200).length < 3)
          fail(
            "invalid-argument",
            "Informe o registro e o motivo da anulação.",
          );
        const payment = tab.payments.find(
          (item) => item.id === input.paymentId,
        );
        if (!payment || payment.voided)
          fail(
            "failed-precondition",
            "Este registro já foi anulado ou não existe.",
          );
        tx.update(tabRef, {
          payments: tab.payments.map((item) =>
            item.id === payment.id
              ? {
                  ...item,
                  voided: true,
                  voidedAt: now(),
                  voidedBy: current.uid,
                  voidReason: clean(input.reason, 200),
                }
              : item,
          ),
          paidCents: tab.paidCents - payment.amountCents,
        });
        return finish({ ok: true });
      }
      if (action === "close") {
        if (tab.paidCents !== tab.subtotalCents - tab.discountCents)
          fail(
            "failed-precondition",
            "Quite o saldo restante antes de encerrar a conta.",
          );
        tx.update(tabRef, {
          status: "closed",
          closedAt: now(),
          closedBy: current.uid,
        });
        tx.update(tableRef, {
          status: "awaiting_cleaning",
          updatedAt: timestamp(),
        });
        return finish({ ok: true });
      }
      fail("invalid-argument", "Operação inválida.");
    });
  }
  return { handler };
}
exports.createSalon = createSalon;
