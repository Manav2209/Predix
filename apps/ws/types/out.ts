export type DepthUpdateMessage = {
    type: "depth";
    data: {
      YES: {
        asks: any[];
        bids: any[];
      };
      NO: {
        asks: any[];
        bids: any[];
      };
    };
  };


  export type TradeMessage  ={
    type:'trade';
    data:{
      price: string;
      quantity: string;
      timestamp: number;
      eventId: string;
      userId: string;
      outcome: "YES" | "NO";
      side: "BUY" | "SELL";
    }
  }
  
  export type OutgoingMessage = DepthUpdateMessage | TradeMessage;