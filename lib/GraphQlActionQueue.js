export default class GraphQlActionQueue {
  constructor() {
    this.queue = [];
  }

  push(action) {
    this.queue.push(action);
  }

  get length() {
    return this.queue.length;
  }

  peek() {
    return this.queue[0];
  }

  shift() {
    return this.queue.shift();
  }
}
