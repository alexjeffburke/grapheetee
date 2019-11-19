import expect from "unexpected";

import GraphQlActionQueue from "../lib/GraphQlActionQueue";

describe("GraphQlActionQueue", () => {
  let queue;
  beforeEach(() => {
    queue = new GraphQlActionQueue();
  });

  it("should push an action onto the queue", () => {
    queue.push("foo");

    expect(queue, "to satisfy", { queue: ["foo"] });
  });

  it("should have a length property", () => {
    expect(queue, "to satisfy", { length: 0 });
  });

  it("should increment the length property when an element is added", () => {
    queue.push("foo");
    expect(queue, "to satisfy", { length: 1 });
  });

  it("should increment the length property when two elements are added", () => {
    queue.push("foo");
    queue.push("foo");
    expect(queue, "to satisfy", { length: 2 });
  });

  it("should shift an element from the queue", () => {
    queue.push("foo");
    expect(queue.shift(), "to equal", "foo");
  });

  it("should remove the shifted element from the queue", () => {
    queue.push("foo");
    queue.shift();
    expect(queue, "to satisfy", {
      length: 0,
      queue: []
    });
  });

  it("should peek at the first element", () => {
    queue.push("foo");
    expect(queue.peek(), "to equal", "foo");
  });

  it("should not remove the peeked element from the queue", () => {
    queue.push("foo");
    queue.peek();
    expect(queue, "to satisfy", {
      length: 1,
      queue: ["foo"]
    });
  });

  it("should return undefined when peeking into an empty queue", () => {
    return expect(queue.peek(), "to be undefined");
  });
});
