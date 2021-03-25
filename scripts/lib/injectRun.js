module.exports = ({ process, console }) => async func => {
  try {
    await func();
  } catch (e) {
    if (e.exitCode !== undefined) {
      // These are errors from assert and softAssert so just log the message.
      console.error(e.message);
      process.exitCode = e.exitCode;
    } else {
      // These are unexpected errors so log the whole error.
      console.error(e);
      process.exitCode = 1;
    }
  }
};