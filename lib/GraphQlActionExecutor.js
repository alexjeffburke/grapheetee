import GraphQlActionQueue from "./GraphQlActionQueue";
import { GRAPHQL_QUERY, GRAPHQL_MUTATION } from "./GraphQlAction";

export default class GraphQlActionExecutor {
  constructor(graphQlNetworkInterface) {
    this.queue = new GraphQlActionQueue();
    this.network = graphQlNetworkInterface;

    this.running = false;
  }

  execute(action) {
    this.queue.push(action);
    this.queueNextTick();
  }

  runAction(action) {
    return this.network.request(action).then(
      res => {
        action.resolve(res);
      },
      err => {
        action.reject(err);
        // not rethrowing on purpose. the executor does not care for now :-)
      }
    );
  }

  runActions(actions) {
    return this.network.batchRequest(actions).then(
      res => {
        actions.forEach((action, i) => {
          action.resolve(res[i]);
        });
      },
      err => {
        actions.forEach(action => {
          action.reject(err);
        });
        // not rethrowing on purpose. the executor does not care for now :-)
      }
    );
  }

  queueNextTick() {
    setTimeout(() => this.tick(), 1);
  }

  tick() {
    if (this.running) {
      return;
    }

    this.running = true;
    let nextAction = this.queue.peek();

    if (!nextAction) {
      this.running = false;
      return;
    }

    if (nextAction.type === GRAPHQL_MUTATION) {
      return this.runAction(this.queue.shift()).then(() => {
        this.running = false;
        this.queueNextTick();
      });
    }

    const actions = [];

    while (nextAction && nextAction.type === GRAPHQL_QUERY) {
      actions.push(this.queue.shift());
      nextAction = this.queue.peek();
    }

    if (actions.length === 1) {
      return this.runAction(actions[0]).then(() => {
        this.running = false;
        this.queueNextTick();
      });
    }

    return this.runActions(actions).then(() => {
      this.running = false;
      this.queueNextTick();
    });
  }
}
