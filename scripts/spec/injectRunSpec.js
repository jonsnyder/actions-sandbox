const injectRun = require("../lib/injectRun");

describe("run", () => {
  let process;
  let console;
  let run;
  let func;

  beforeEach(() => {
    process = {};
    console = jasmine.createSpyObj("console", ["error"]);
    run = injectRun({ process, console });
    func = jasmine.createSpy("func")
  });

  it("runs a sync function", async () => {
    await run(func);
    expect(func).toHaveBeenCalledOnceWith();
  });

  it("runs an async function", async () => {
    func.and.returnValue(Promise.resolve());
    await run(func);
    expect(func).toHaveBeenCalledOnceWith();
  });

  it("handles sync errors with exitCodes", async () => {
    const error = new Error("myerror");
    error.exitCode = 42;
    func.and.throwError(error);
    await run(func);
    expect(process).toEqual({ exitCode: 42 });
    expect(console.error).toHaveBeenCalledOnceWith("myerror");
  });

  it("handles async errors with exitCodes", async () => {
    const error = new Error("myerror");
    error.exitCode = 42;
    func.and.returnValue(Promise.reject(error));
    await run(func);
    expect(process).toEqual({ exitCode: 42 });
    expect(console.error).toHaveBeenCalledOnceWith("myerror");
  });

  it("handles other errors", async () => {
    const error = new Error("myerror");
    func.and.returnValue(Promise.reject(error));
    await run(func);
    expect(process).toEqual({ exitCode: 1 });
    expect(console.error).toHaveBeenCalledOnceWith(error);
  });

});