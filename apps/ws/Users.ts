import { SUBSCRIBE, UNSUBSCRIBE, type IncomingMessage } from "./types/in";
import { SubscriptionManager } from "./SubscriptionManager";
import  type {OutgoingMessage} from"./types/out";


export class User {
  private id: string;
  private ws: WebSocket;

  //TODO : fix the type of ws
  
  constructor(id: string, ws: any) {
    this.id = id;
    this.ws = ws;
    this.addListener();
  }

  private subscriptions: string[] = [];

  private subscribe(subscription: string) {
    this.subscriptions.push(subscription);
  }

  private unsubscribe(subscription: string) {
    this.subscriptions = this.subscriptions.filter(
      (sub) => sub !== subscription
    );
  }

  emit(message: OutgoingMessage) {
    console.log("message", message);
    this.ws.send(JSON.stringify(message));
  }
  private addListener() {
    // @ts-ignore
    this.ws.on("message", (message: string) => {
      const parsedMessage: IncomingMessage = JSON.parse(message);
      if (parsedMessage.method === SUBSCRIBE) {
        parsedMessage.params.forEach((s) =>
          SubscriptionManager.getInstance().subscribe(this.id, s)
        );
      }

      if (parsedMessage.method === UNSUBSCRIBE) {
        parsedMessage.params.forEach((s) =>
          SubscriptionManager.getInstance().unsubscribe(
            this.id,
            parsedMessage.params[0]!
          )
        );
      }
    });
  }
}
