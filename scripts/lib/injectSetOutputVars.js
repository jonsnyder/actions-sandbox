const assert = require("./assert");

module.exports = ({ handleProjectCardMove, handlePush, eventName, console }) => async () => {
  assert(eventName === "project_card" || eventName === "push", `Unknown event: ${eventName}.`);

  const handler = eventName === "project_card" ? handleProjectCardMove : handlePush;

  try {
    const { ref, inputs } = await handler();
    console.log("::set-output name=triggerWorkflow::true");
    console.log(`::set-output name=ref::${ref}`);
    console.log(`::set-output name=inputs::${JSON.stringify(inputs)}`);
  } catch (error) {
    console.log("::set-output name=triggerWorkflow::false");
    throw error;
  }
}