const increment = require("../index");

describe("increment", () => {
  it("increments 1", () => {
    expect(increment(1)).toEqual(2);
  });
  it("increments -2", () => {
    expect(increment(-2)).toEqual(-1);
  });
});