
export interface Order{
    price : number;
    quantity : number;
    side : 'BUY' | 'SELL';
    filled : number;
    userId : string;
    outcome: "YES" | "NO";
    orderId: string;

}

export interface Fill {
    price: number;
    quantity: number;
    side: 'BUY' | 'SELL';
    userId: string;
    outcome: "YES" | "NO";
    orderId: string;
    otherUserId: string;
    tradeId: number;

}
export const eventIdToTitle = new Map<string, string>();
export class OrderBook {
    YES_BIDS : Order[] = [];
    YES_ASKS : Order[] = [];
    NO_BIDS : Order[] = [];
    NO_ASKS : Order[] = [];

    currentYesPrice: number = 0;
    currentNoPrice: number = 0;
    currentYesVolume: number = 0;
    currentNoVolume: number = 0;
    lastTradeId: number = 0;
    lastTradeTime: number = 0;
    title: string;
    //Check if error comes:
    eventId: string;

    constructor(title: string , eventId : string , currentYesPrice: number = 0, currentNoPrice: number = 0) {
        this.eventId = eventId;
        this.title = title;
        this.currentYesPrice = currentYesPrice;
        this.currentNoPrice = currentNoPrice;
    }
    ticker() {
      return this.title;
    }

    addOrder(order: Order): { executedQty: number; fills: Fill[] } {
      if (order.side === "BUY") {
        const { executedQty, fills } = this.matchBuyOrder(order);
  
        if (executedQty == order.quantity) {
          return { executedQty, fills };
        }
        if (order.outcome === "YES") {
          this.YES_BIDS.push(order);
        } else {
          this.NO_BIDS.push(order);
        }
        return { executedQty, fills };
      } else {
        const { executedQty, fills } = this.matchSellOrder(order);
  
        if (executedQty == order.quantity) {
          return { executedQty, fills };
        }
        if (order.outcome === "YES") {
          this.YES_ASKS.push(order);
        } else {
          this.NO_ASKS.push(order);
        }
        return { executedQty, fills };
      }
    }
  
    matchBuyOrder(order: Order): { executedQty: number; fills: Fill[] } {    
      let fills: Fill[] = [];
      let executedQty = 0;
  
      if (order.outcome === "YES") {
          if (this.YES_ASKS.length === 0) {
              return { executedQty, fills };
          }
          
          for (let i = 0; i < this.YES_ASKS.length; i++) {
              if (
                  this.YES_ASKS[i]!.price <= order.price && executedQty < order.quantity 
              ) {
                  if (this.YES_ASKS[i]?.userId === order.userId) {
                      continue; // Skip self-trades
                  }
                  
                  const filledQty = Math.min(
                      this.YES_ASKS[i]!.quantity - this.YES_ASKS[i]!.filled, // Use remaining quantity
                      order.quantity - executedQty
                  );
                  
                  executedQty += filledQty;
                  this.YES_ASKS[i]!.filled += filledQty;
  
                  fills.push({
                      price: this.YES_ASKS[i]!.price,
                      quantity: filledQty,
                      tradeId: this.lastTradeId++,
                      otherUserId: this.YES_ASKS[i]!.userId,
                      userId: order.userId,
                      outcome: "YES",
                      orderId: this.YES_ASKS[i]!.orderId,
                      side: 'BUY'
                  });
              }
          }
  
          // Remove completely filled orders AND update remaining quantities
          for (let i = this.YES_ASKS.length - 1; i >= 0; i--) {
              if (this.YES_ASKS[i]!.quantity === this.YES_ASKS[i]!.filled) {
                  this.YES_ASKS.splice(i, 1);
              } else {
                  // Update the remaining quantity for partially filled orders
                  this.YES_ASKS[i]!.quantity = this.YES_ASKS[i]!.quantity - this.YES_ASKS[i]!.filled;
                  this.YES_ASKS[i]!.filled = 0; // Reset filled to 0 for the remaining quantity
              }
          }
  
          return { executedQty, fills };
      } else {
          if (this.NO_ASKS.length === 0) {
              return { executedQty, fills };
          }
          
          for (let i = 0; i < this.NO_ASKS.length; i++) {
              if (
                  this.NO_ASKS[i]!.price <= order.price && executedQty < order.quantity 
              ) {
                  if (this.NO_ASKS[i]?.userId === order.userId) {
                      continue; // Skip self-trades
                  }
                  
                  const filledQty = Math.min(
                      this.NO_ASKS[i]!.quantity - this.NO_ASKS[i]!.filled, // Use remaining quantity
                      order.quantity - executedQty
                  );
                  
                  executedQty += filledQty;
                  this.NO_ASKS[i]!.filled += filledQty;
  
                  fills.push({
                      price: this.NO_ASKS[i]!.price,
                      quantity: filledQty,
                      tradeId: this.lastTradeId++,
                      otherUserId: this.NO_ASKS[i]!.userId,
                      userId: order.userId,
                      outcome: "NO", // Fixed: should be NO, not YES
                      orderId: this.NO_ASKS[i]!.orderId,
                      side: 'BUY'
                  });
              }
          }
  
          // Remove completely filled orders AND update remaining quantities
          for (let i = this.NO_ASKS.length - 1; i >= 0; i--) {
              if (this.NO_ASKS[i]!.quantity === this.NO_ASKS[i]!.filled) {
                  this.NO_ASKS.splice(i, 1);
              } else {
                  // Update the remaining quantity for partially filled orders
                  this.NO_ASKS[i]!.quantity = this.NO_ASKS[i]!.quantity - this.NO_ASKS[i]!.filled;
                  this.NO_ASKS[i]!.filled = 0; // Reset filled to 0 for the remaining quantity
              }
          }
  
          return { executedQty, fills };
      }
  }
  
  matchSellOrder(order: Order): { executedQty: number; fills: Fill[] } {
    let fills: Fill[] = [];
    let executedQty = 0;

    if (order.outcome === "YES") {
        if (this.YES_BIDS.length === 0) {
            return { executedQty, fills };
        }
    
        for (let i = 0; i < this.YES_BIDS.length; i++) {
            if (this.YES_BIDS[i]!.userId === order.userId) {
                continue;
            }
            if (
                this.YES_BIDS[i]!.price >= order.price &&
                executedQty < order.quantity
            ) {
                const filledQty = Math.min(
                    this.YES_BIDS[i]!.quantity - this.YES_BIDS[i]!.filled, // Use remaining quantity
                    order.quantity - executedQty
                );
                executedQty += filledQty;
                this.YES_BIDS[i]!.filled += filledQty;
    
                fills.push({
                    price: this.YES_BIDS[i]!.price,
                    quantity: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.YES_BIDS[i]!.userId,
                    outcome: "YES",
                    orderId: order.orderId,
                    side: "SELL",
                    userId: order.userId,
                });
            }
        }
    
        // Remove completely filled orders AND update remaining quantities
        for (let i = this.YES_BIDS.length - 1; i >= 0; i--) {
            if (this.YES_BIDS[i]!.quantity === this.YES_BIDS[i]!.filled) {
                this.YES_BIDS.splice(i, 1);
            } else {
                // Update the remaining quantity for partially filled orders
                this.YES_BIDS[i]!.quantity = this.YES_BIDS[i]!.quantity - this.YES_BIDS[i]!.filled;
                this.YES_BIDS[i]!.filled = 0; // Reset filled to 0 for the remaining quantity
            }
        }
        return { executedQty, fills };
    } else {
        if (this.NO_BIDS.length === 0) {
            return { executedQty, fills };
        }
    
        for (let i = 0; i < this.NO_BIDS.length; i++) {
            if (this.NO_BIDS[i]!.userId === order.userId) {
                continue;
            }
            if (
                this.NO_BIDS[i]!.price >= order.price && // Fixed: should be >= for sell orders
                executedQty < order.quantity
            ) {
                const filledQty = Math.min(
                    this.NO_BIDS[i]!.quantity - this.NO_BIDS[i]!.filled, // Use remaining quantity
                    order.quantity - executedQty
                );
                executedQty += filledQty;
                this.NO_BIDS[i]!.filled += filledQty;
    
                fills.push({
                    price: this.NO_BIDS[i]!.price,
                    quantity: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.NO_BIDS[i]!.userId,
                    outcome: "NO",
                    orderId: order.orderId,
                    side: "SELL",
                    userId: order.userId,
                });
            }
        }
    
        // Remove completely filled orders AND update remaining quantities
        for (let i = this.NO_BIDS.length - 1; i >= 0; i--) {
            if (this.NO_BIDS[i]!.quantity === this.NO_BIDS[i]!.filled) {
                this.NO_BIDS.splice(i, 1);
            } else {
                // Update the remaining quantity for partially filled orders
                this.NO_BIDS[i]!.quantity = this.NO_BIDS[i]!.quantity - this.NO_BIDS[i]!.filled;
                this.NO_BIDS[i]!.filled = 0; // Reset filled to 0 for the remaining quantity
            }
        }
        return { executedQty, fills };
    }
} 

    getDepth() {
        let YES_BIDS: { [key: string]: number } = {};
        let YES_ASKS: { [key: string]: number } = {};
        let NO_BIDS: { [key: string]: number } = {};
        let NO_ASKS: { [key: string]: number } = {};
    
      
        for (let i = 0; i < this.YES_BIDS.length; i++) {
          const order = this.YES_BIDS[i];
          if (!YES_BIDS[order!.price]) {
            YES_BIDS[order!.price] = 0;
          }
          YES_BIDS[order!.price] += order!.quantity;
        }
    
        for (let i = 0; i < this.YES_ASKS.length; i++) {
          const order = this.YES_ASKS[i];
          if (!YES_ASKS[order!.price]) {
            YES_ASKS[order!.price] = 0;
          }
          YES_ASKS[order!.price] += order!.quantity;
        }
    
        for (let i = 0; i < this.NO_BIDS.length; i++) {
          const order = this.NO_BIDS[i];
          if (!NO_BIDS[order!.price]) {
            NO_BIDS[order!.price] = 0;
          }
          NO_BIDS[order!.price] += order!.quantity;
        }
    
        for (let i = 0; i < this.NO_ASKS.length; i++) {
          const order = this.NO_ASKS[i];
          if (!NO_ASKS[order!.price]) {
            NO_ASKS[order!.price] = 0;
          }
          NO_ASKS[order!.price] += order!.quantity;
        }
    
        const yesBids = Object.entries(YES_BIDS).map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity,
        }));
    
        const yesAsks = Object.entries(YES_ASKS).map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity,
        }));
    
        // Convert NO aggregated data to array format
        const noBids = Object.entries(NO_BIDS).map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity,
        }));
    
        const noAsks = Object.entries(NO_ASKS).map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity,
        }));
    
        yesBids.sort((a, b) => b.price - a.price);
        yesAsks.sort((a, b) => a.price - b.price);
        noBids.sort((a, b) => b.price - a.price);
        noAsks.sort((a, b) => a.price - b.price);
    
        return {
          YES: {
            bids: yesBids,
            asks: yesAsks,
          },
          NO: {
            bids: noBids,
            asks: noAsks,
          },
        };
      }
    
      getOpenOrders(userId: string): Order[] {
        const Yes_ASK_ORDERS = this.YES_ASKS.filter(
          (order) => order.userId === userId
        );
        const No_ASK_ORDERS = this.NO_ASKS.filter(
          (order) => order.userId === userId
        );
        const Yes_BID_ORDERS = this.YES_BIDS.filter(
          (order) => order.userId === userId
        );
        const No_BID_ORDERS = this.NO_BIDS.filter(
          (order) => order.userId === userId
        );
    
        return [
          ...Yes_ASK_ORDERS,
          ...No_ASK_ORDERS,
          ...Yes_BID_ORDERS,
          ...No_BID_ORDERS,
        ];
      }
    
      cancelBidOrder(order: Order) {
        if (order.outcome === "YES") {
          const index = this.YES_BIDS.findIndex((o) => o.orderId === order.orderId);
          if (index !== -1) {
            const price = this.YES_BIDS[index]!.price;
            this.YES_BIDS.splice(index, 1);
            return price;
          }
        } else {
          const index = this.NO_BIDS.findIndex((o) => o.orderId === order.orderId);
          if (index !== -1) {
            const price = this.NO_BIDS[index]!.price;
            this.NO_BIDS.splice(index, 1);
            return price;
          }
        }
      }
    
      cancelAskOrder(order: Order) {
        if (order.outcome === "YES") {
          const index = this.YES_ASKS.findIndex((o) => o.orderId === order.orderId);
          if (index !== -1) {
            const price = this.YES_ASKS[index]!.price;
            this.YES_ASKS.splice(index, 1);
            return price;
          }
        } else {
          const index = this.NO_ASKS.findIndex((o) => o.orderId === order.orderId);
          if (index !== -1) {
            const price = this.NO_ASKS[index]!.price;
            this.NO_ASKS.splice(index, 1);
            return price;
          }
        }
      }
}