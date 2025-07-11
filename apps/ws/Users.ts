import { SUBSCRIBE, UNSUBSCRIBE, type IncomingMessage } from "./types/in";
import { SubscriptionManager } from "./SubscriptionManager";
import { WebSocket } from "ws";

export class User {
  private id: string;
  private ws: WebSocket;

  constructor(id: string, ws: WebSocket) {
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

  emit(message: any) {
    this.ws.send(JSON.stringify(message));
  }
  private addListener() {
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
