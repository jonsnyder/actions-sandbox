module.exports = ({ process, console }) => async func => {
  try {
    await func();
  } catch (e) {
    if (e.exitCode !== undefined) {
      // These are errors from assert and softAssert so just log the message.
      process.exitCode = e.exitCode;
      console.error(e.message);
    } else {
      // These are unexpected errors so log the whole error.
      process.exitCode = 1;
      console.error(e);
    }
  }
};