const { randomUUID } = require("node:crypto");
const MAX_BYTES = 2 * 1024 * 1024;
function decodeLogo(base64, contentType, HttpsError) {
  const fail = () => {
    throw new HttpsError(
      "invalid-argument",
      "Selecione uma imagem JPG, PNG ou WebP válida de até 2 MB.",
    );
  };
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(contentType) ||
    typeof base64 !== "string" ||
    base64.length > Math.ceil(MAX_BYTES / 3) * 4 ||
    base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
  )
    fail();
  const bytes = Buffer.from(base64, "base64");
  if (
    bytes.length < 12 ||
    bytes.length > MAX_BYTES ||
    bytes.toString("base64") !== base64
  )
    fail();
  const valid =
    contentType === "image/png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : contentType === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) fail();
  return bytes;
}
function createStoreLogoHandler({
  db,
  bucket,
  HttpsError,
  timestamp,
  uuid = randomUUID,
}) {
  const check = (tenant, uid) => {
    if (
      !tenant ||
      tenant.ownerUid !== uid ||
      !["configured", "active"].includes(tenant.status)
    )
      throw new HttpsError(
        "permission-denied",
        "Conclua o cadastro da loja e entre com a conta do proprietário.",
      );
  };
  return async (request) => {
    if (!request.auth)
      throw new HttpsError(
        "unauthenticated",
        "Entre com a conta do proprietário.",
      );
    const { storeId, base64, contentType, remove } = request.data ?? {};
    if (typeof storeId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(storeId))
      throw new HttpsError("invalid-argument", "Restaurante inválido.");
    if (request.auth.uid !== storeId)
      throw new HttpsError(
        "permission-denied",
        "Você não tem acesso a este restaurante.",
      );
    const ref = db.doc(`tenants/${storeId}`);
    check((await ref.get()).data(), storeId);
    let path = null;
    let url = null;
    if (remove !== true) {
      const bytes = decodeLogo(base64, contentType, HttpsError);
      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      }[contentType];
      path = `tenants/${storeId}/branding/${uuid()}.${extension}`;
      const token = uuid();
      await bucket
        .file(path)
        .save(bytes, {
          resumable: false,
          metadata: {
            contentType,
            cacheControl: "public, max-age=31536000, immutable",
            metadata: { firebaseStorageDownloadTokens: token },
          },
        });
      url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    }
    let previous;
    try {
      previous = await db.runTransaction(async (tx) => {
        const current = (await tx.get(ref)).data();
        check(current, storeId);
        tx.update(ref, {
          logoPath: path,
          logoUrl: url,
          updatedAt: timestamp(),
        });
        return current.logoPath;
      });
    } catch (error) {
      if (path)
        await bucket
          .file(path)
          .delete({ ignoreNotFound: true })
          .catch(() => {});
      throw error;
    }
    if (
      typeof previous === "string" &&
      previous !== path &&
      previous.startsWith(`tenants/${storeId}/branding/`) &&
      /\/[a-f0-9-]+\.(png|jpg|webp)$/.test(previous)
    )
      await bucket
        .file(previous)
        .delete({ ignoreNotFound: true })
        .catch(() => {});
    return { logoPath: path, logoUrl: url };
  };
}
module.exports = { createStoreLogoHandler, decodeLogo };
