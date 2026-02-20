import { WS_URL } from "./config";

interface CallbackEntry {
  callback: (data: any) => void;
  id: string;
}

export class SignalingManager {
  private ws: WebSocket | null = null;
  private static instance: SignalingManager;
  private bufferedMessages: any[] = [];
  private callbacks: Record<string, CallbackEntry[]> = {};
  private tradeHistory: Record<string, any[]> = {};
  private initialized: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000; // 5 seconds

  private constructor() {
    this.init();
  }

  public static getInstance(): SignalingManager {
    if (!SignalingManager.instance) {
      SignalingManager.instance = new SignalingManager();
    }
    return SignalingManager.instance;
  }

  private init(): void {
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.initialized = true;
      this.reconnectAttempts = 0;
      this.bufferedMessages.forEach((message) => {
        this.ws?.send(JSON.stringify(message));
      });
      this.bufferedMessages = [];
      
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.initialized = false;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.init(), this.reconnectDelay);
      } else {
        console.error("Max reconnection attempts reached");
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.initialized = false;
    };

    this.ws.onmessage = (event) => {

      console.log("Raw WebSocket message:", event.data);
      try {
        const message = JSON.parse(event.data);
        console.log("Parsed message:", message);

        // Handle different possible message structures
        let type: string | undefined;
        if (message.data?.e) {
          type = message.data.e;
        } else if (message.event) {
          type = message.event;
        } else {
          console.error("Unknown message structure:", message);
          return;
        }

        console.log("Extracted type:", type);

        if (this.callbacks[type]) {
          this.callbacks[type].forEach(({ callback }) => {
            if (type === "depth") {
              const updatedYesBids = message.data?.YES?.bids || message.YES?.bids || [];
              const updatedYesAsks = message.data?.YES?.asks || message.YES?.asks || [];
              const updatedNoBids = message.data?.NO?.bids || message.NO?.bids || [];
              const updatedNoAsks = message.data?.NO?.asks || message.NO?.asks || [];
              callback({
                yesbids: updatedYesBids,
                yesasks: updatedYesAsks,
                nobids: updatedNoBids,
                noasks: updatedNoAsks,
              });
            } else if (type === "trade") {
              const tradeData = message.data || message;

              const eventId =
                tradeData.eventId ??
                tradeData.event_id ??
                tradeData.event;

              // store history
              if(eventId){

                this.tradeHistory[eventId] =
                  this.tradeHistory[eventId] || [];

                this.tradeHistory[eventId].unshift(tradeData);

                // limit history
                this.tradeHistory[eventId] =
                  this.tradeHistory[eventId].slice(0,100);

              }

              this.callbacks[type]?.forEach(({callback})=>{
                callback(tradeData);
                });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };
  }

  public sendMessage(message: any): void {
    console.log("Sending message:", message);
    if (!this.initialized || !this.ws) {
      this.bufferedMessages.push(message);
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  public registerCallback(type: string, callback: (data: any) => void, id: string): void {
    this.callbacks[type] = this.callbacks[type] || [];
    this.callbacks[type].push({ callback, id });
    console.log(`Registered callback for type: ${type}, id: ${id}`);
  }

  public getTradeHistory(eventId:string){
    return this.tradeHistory[eventId] || [];
  }

  public deRegisterCallback(type: string, id: string): void {
    if (this.callbacks[type]) {
      const index = this.callbacks[type].findIndex((entry) => entry.id === id);
      if (index !== -1) {
        this.callbacks[type].splice(index, 1);
        console.log(`Deregistered callback for type: ${type}, id: ${id}`);
      }
    }
  }
}
