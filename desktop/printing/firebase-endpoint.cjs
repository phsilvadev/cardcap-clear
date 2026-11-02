function tenantOrdersEndpoint(session, env = process.env) {
  const projectId = session.projectId || env.CARDAP_FIREBASE_PROJECT_ID;
  const region =
    session.functionsRegion ||
    env.CARDAP_FIREBASE_FUNCTIONS_REGION ||
    "southamerica-east1";
  if (
    typeof projectId !== "string" ||
    !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) ||
    typeof region !== "string" ||
    !/^[a-z]+-[a-z]+[0-9]+$/.test(region)
  )
    throw new Error(
      "Atualize o painel ou configure o projeto Firebase do aplicativo de impressão.",
    );
  if (
    env.CARDAP_FIREBASE_PROJECT_ID &&
    projectId !== env.CARDAP_FIREBASE_PROJECT_ID
  )
    throw new Error("O painel usa outro projeto Firebase.");
  return `https://${region}-${projectId}.cloudfunctions.net/tenantOrderOperations`;
}
module.exports = { tenantOrdersEndpoint };
