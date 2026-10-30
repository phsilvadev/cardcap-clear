const { validateJob } = require("./receipt.cjs");
function createPrintQueue({ journal, save, print, confirmRetry }) {
  let chain = Promise.resolve();
  async function submit(input) {
    const job = validateJob(input);
    const key = `${job.storeId}:${job.id}`;
    const previous = journal[key];
    if (previous === "submitted") return { status: "submitted" };
    if (previous && job.retry !== true)
      throw new Error(
        "Uma tentativa anterior precisa ser revisada antes de reenviar.",
      );
    if (previous && !(await confirmRetry(job)))
      throw new Error("Reenvio não confirmado.");
    journal[key] = "started";
    save(journal);
    try {
      await print(job);
      journal[key] = "submitted";
      save(journal);
      return { status: "submitted" };
    } catch (error) {
      journal[key] = "uncertain";
      save(journal);
      throw error;
    }
  }
  return (input) => {
    const task = chain.then(() => submit(input));
    chain = task.catch(() => {});
    return task;
  };
}
module.exports = { createPrintQueue };
