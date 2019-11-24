import GraphQlActionExecutor from "./GraphQlActionExecutor";
import GraphQlNetworkInterface from "./GraphQlNetworkInterface";
import GraphQlAction from "./GraphQlAction";

export default class GraphQlClient {
  constructor(options) {
    this.graphQlNetworkInterface = new GraphQlNetworkInterface(options);
    this.actionExecutor = new GraphQlActionExecutor(
      this.graphQlNetworkInterface
    );
  }

  query(query, opts) {
    const action = GraphQlAction.query(query, opts);
    this.actionExecutor.execute(action);
    return action.getPromise();
  }

  mutate(query, opts) {
    const action = GraphQlAction.mutation(query, opts);
    this.actionExecutor.execute(action);
    return action.getPromise();
  }
}
