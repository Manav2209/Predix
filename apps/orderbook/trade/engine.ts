import { RedisManager } from "../redisManager";
import { TRADE_ADDED } from "../types/dbMsg";
import {
  CANCEL_ORDER,
  CREATE_EVENT,
  CREATE_ORDER,
  CREATE_USER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  type MessageFromAPI,
} from "../types/MessageFromApi";
import { eventIdToTitle, OrderBook, type Fill, type Order } from "./orderBook";

interface UserBalance {
  available: number;
  locked: number;
}

export class Engine {
  private orderBook: OrderBook[] = [];
  private balances: Map<string, UserBalance> = new Map();
  // TODO: Add functionality of locking the YES and NO assets also
  private positions: Map<string, Map<string, { YES: number; NO: number }>> =
    new Map();

  addOrderBook(orderBook: OrderBook) {
    this.orderBook.push(orderBook);
    console.log("Order book added", this.orderBook);
  }

  createUser(userId: string) {
    this.balances.set(userId, { available: 100, locked: 0 });
    this.positions.set(userId, new Map());
  }

  addUser(userId: string) {
    this.balances.set(userId, { available: 100, locked: 0 });
  }

  getBalance(userId: string) {
    return this.balances.get(userId);
  }

  process({
    message,
    clientId,
  }: {
    message: MessageFromAPI;
    clientId: string;
  }) {
    switch (message.type) {
      case CREATE_USER:
        this.createUser(message.data.userId);
        console.log("User created", this.balances, this.positions);
        RedisManager.getInstance().sendToApi(clientId, {
          type: "USER_CREATED",
          payload: {
            userId: message.data.userId,
            balance: this.balances.get(message.data.userId)!.available,
            positions: this.positions.get(message.data.userId)!,
          },
        });
        break;

      case CREATE_EVENT:
        try {
          console.log(`Message data:`, JSON.stringify(message.data, null, 2));
          // Event To title
          eventIdToTitle.set(message.data.eventId, message.data.title);

          console.log("Event ID to title mapping:", eventIdToTitle);

          // Pass eventId to OrderBook constructor
          const newOrderBook = new OrderBook(message.data.title , message.data.eventId, 0.5, 0.5);

          console.log("Creating new order book", newOrderBook);
          this.addOrderBook(newOrderBook);

          // Add initial market maker positions
          const platformUserId = "platform_market_maker";
          this.createUser(platformUserId);
          this.positions
            .get(platformUserId)!
            .set(message.data.title, { YES: 100, NO: 100 });

          // Create initial orders at current price (0.5)
          this.createOrder(
            message.data.eventId, // Use eventId instead of title
            0.5,
            100,
            "SELL",
            platformUserId,
            "YES"
          );

          this.createOrder(
            message.data.eventId, // Use eventId instead of title
            0.5,
            100,
            "SELL",
            platformUserId,
            "NO"
          );

          RedisManager.getInstance().sendToApi(clientId, {
            type: "EVENT_CREATED",
            payload: {
              
              eventId: message.data.eventId,
              expiresAt: message.data.expiresAt,
            },
          });
        } catch (error) {
          console.error("Error creating event:", error);
          throw error;
        }
        break;

      case CREATE_ORDER:
        try {
          console.log("Creating order", message.data);
          const { executedQty, fills, orderId } = this.createOrder(
            message.data.eventId, // This should be eventId
            Number(message.data.price),
            Number(message.data.quantity),
            message.data.side,
            message.data.userId,
            message.data.outcome
          );

          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_PLACED",
            payload: {
              orderId,
              executedQty,
              fills,
            },
          });
        } catch (error) {
          console.error("Error creating order:", error);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: "",
              executedQty: 0,
              remainingQty: 0,
            },
          });
          throw error;
        }
        break;

      case GET_OPEN_ORDERS:
        try {
          console.log("Getting open orders for user", message.data.userId);
          console.log("Message data", message.data);

          // Use eventId directly to find orderbook
          const orderBook = this.orderBook.find(
            (orderBook) => orderBook.eventId === message.data.eventId
          );
          
          console.log("Order book", orderBook);
          
          if (!orderBook) {
            throw new Error(`Order book not found for eventId: ${message.data.eventId}`);
          }

          const openOrders = orderBook.getOpenOrders(message.data.userId);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "OPEN_ORDERS",
            payload: openOrders,
          });
        } catch (error) {
          console.error("Error getting open orders:", error);
          throw error;
        }
        break;

      case GET_DEPTH:
        try {
          console.log("Message data", message.data);

          // Use eventId directly to find orderbook
          const orderBook = this.orderBook.find(
            (orderBook) => orderBook.eventId === message.data.eventId
          );

          if (!orderBook) {
            throw new Error(`Order book not found for eventId: ${message.data.eventId}`);
          }

          const depth = orderBook.getDepth();
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: {
              depth,
            },
          });
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: {
              depth: {
                YES: {
                  bids: [],
                  asks: [],
                },
                NO: {
                  bids: [],
                  asks: [],
                },
              },
            },
          });
        }
        break;

      case CANCEL_ORDER:
        try {
          const orderId = message.data.orderId;
          const cancelEventId = message.data.eventId; // This should be eventId
          
          // Use eventId to find orderbook
          const cancelOrderBook = this.orderBook.find(
            (orderBook) => orderBook.eventId === cancelEventId
          );
          
          if (!cancelOrderBook) {
            throw new Error(`Order book not found for eventId: ${cancelEventId}`);
          }

          const order = cancelOrderBook
            .getOpenOrders(message.data.userId)
            .find((order) => order.orderId === orderId);
            
          if (!order) {
            throw new Error("Order not found");
          }

          if (order.side === "BUY") {
            const price = cancelOrderBook.cancelBidOrder(order);
            if (price !== undefined) {
              this.balances.set(message.data.userId, {
                available:
                  this.balances.get(message.data.userId)!.available +
                  price * order.quantity,
                locked:
                  this.balances.get(message.data.userId)!.locked -
                  price * order.quantity,
              });
            }
          } else {
            const price = cancelOrderBook.cancelAskOrder(order);
            // TODO: Update the locked assets also
            // Need to unlock the YES/NO positions that were locked for this sell order
            const title = eventIdToTitle.get(cancelEventId);
            if (title && this.positions.has(message.data.userId)) {
              const userPositions = this.positions.get(message.data.userId)!;
              if (userPositions.has(title)) {
                const eventPositions = userPositions.get(title)!;
                eventPositions[order.outcome] += order.quantity;
                userPositions.set(title, eventPositions);
              }
            }
          }

          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: orderId,
              executedQty: 0,
              remainingQty: order.quantity,
            },
          });
        } catch (e) {
          console.log("Error while cancelling order", e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: message.data.orderId,
              executedQty: 0,
              remainingQty: 0,
            },
          });
        }
        break;
    }
  }

  createOrder(
    eventId: string, // Changed parameter name to be more clear
    price: number,
    quantity: number,
    side: "BUY" | "SELL",
    userId: string,
    outcome: "YES" | "NO"
  ) {
    
    
    // Use eventId to find orderbook
    const orderBook = this.orderBook.find(
      (orderBook) => orderBook.eventId === eventId
    );
    console.log("Order book for eventId", eventId, orderBook);

    if (!orderBook) {
      throw new Error(`Order book not found for eventId: ${eventId}`);
    }

    // Get title for position management
    // const title = eventIdToTitle.get(eventId);
    // if (!title) {
    //   throw new Error(`Title not found for eventId: ${eventId}`);
    // }

    this.checkAndLockFunds(userId, price, outcome, side, eventId, quantity);
    console.log(this.orderBook);
    const order: Order = {
      price,
      quantity,
      side,
      filled: 0,
      userId,
      outcome,
      orderId: Math.random().toString(36).substring(7),
    };

    const { executedQty, fills } = orderBook.addOrder(order);

    console.log("Fills", fills);
    console.log("orderBook after adding order", orderBook);
    
    this.updateBalances(fills, userId, eventId, outcome, side);

    // Add the WS calls and the DB calls here
    this.publishDepthUpdates(fills, eventId, outcome, side, userId);
    this.createTradeDB(fills, eventId, outcome, side, userId);
    this.publishWsTrades(fills, eventId, userId);

    return {
      executedQty,
      fills,
      orderId: order.orderId,
    };
  }

  publishWsTrades(fills: Fill[], eventId: string, userId: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().publishMessage(`trades@${eventId}`, {
        stream: `trades@${eventId}`,
        data: {
          e: "trade",
          price: fill.price.toString(),
          quantity: fill.quantity.toString(),
          timestamp: Date.now(),
          eventId,
          userId,
          outcome: fill.outcome,
          side: fill.side,
        },
      });
    });
  }

  createTradeDB(
    fills: Fill[],
    eventId: string,
    outcome: string,
    side: string,
    userId: string
  ) {
    fills.forEach((fill) => {
      console.log("Filling the trade DB", fill);
      RedisManager.getInstance().pushMessage({
        type: TRADE_ADDED,
        data: {
          id: fill.orderId,
          price: fill.price.toString(),
          quantity: fill.quantity.toString(),
          timestamp: Date.now(),
          eventId, // Use eventId instead of event
          userId,
          outcome: outcome as "YES" | "NO",
          side: side as "BUY" | "SELL",
        },
      });
    });
  }

  publishDepthUpdates(
    fills: Fill[],
    eventId: string,
    outcome: string,
    side: string,
    userId: string
  ) {
    // Use eventId to find orderbook
    const orderBook = this.orderBook.find(
      (orderBook) => orderBook.eventId === eventId
    );
    
    if (!orderBook) {
      throw new Error(`Order book not found for eventId: ${eventId}`);
    }

    // Get the CURRENT depth (after the trade has been processed)
    const depth = orderBook.getDepth();

    // Get all the price levels that were affected by the fills
    const affectedPrices = fills.map((f) => f.price.toString());

    console.log("Affected prices", affectedPrices);

    type DepthUpdates = {
      asks: { price: number; quantity: number }[];
      bids: { price: number; quantity: number }[];
    };
    
    let yesUpdates: DepthUpdates = { asks: [], bids: [] };
    let noUpdates: DepthUpdates = { asks: [], bids: [] };

    // Fixed logic: Send ALL current depth, not filtered
    yesUpdates = {
      asks: depth.YES.asks,
      bids: depth.YES.bids,
    };
    
    noUpdates = {
      asks: depth.NO.asks,
      bids: depth.NO.bids,
    };

    // Update the depth in Redis
    RedisManager.getInstance().publishMessage(`depth@${eventId}`, {
      stream: `depth@${eventId}`,
      data: {
        e: "depth",
        YES: {
          bids: yesUpdates.bids,
          asks: yesUpdates.asks,
        },
        NO: {
          bids: noUpdates.bids,
          asks: noUpdates.asks,
        },
      },
    });
  }

  updateBalances(
    fills: Fill[],
    userId: string,
    eventId: string, // This is the title/event name for position management
    outcome: "YES" | "NO",
    side: "BUY" | "SELL"
  ) {
    // Process each fill
    fills.forEach((fill) => {
      const fillAmount = fill.price * fill.quantity;

      // Handle the initiating user's balance
      if (side === "BUY") {
        // When buying, user's locked funds are converted to position value
        this.balances.set(userId, {
          available: this.balances.get(userId)!.available,
          locked: this.balances.get(userId)!.locked - fillAmount,
        });

        // Update positions for the buyer
        this.updatePosition(userId, eventId, outcome, fill.quantity);

        // Handle counterparty's balance - seller receives payment
        this.balances.set(fill.otherUserId, {
          available:
            this.balances.get(fill.otherUserId)!.available + fillAmount,
          locked: this.balances.get(fill.otherUserId)!.locked - fill.quantity,
        });

        // Update positions for the seller (counterparty)
        this.updatePosition(fill.otherUserId, eventId, outcome, -fill.quantity);
      } else {
        // SELL
        // When selling, user receives payment
        this.balances.set(userId, {
          available: this.balances.get(userId)!.available + fillAmount,
          locked: this.balances.get(userId)!.locked - fill.quantity,
        });

        // Update positions for the seller
        this.updatePosition(userId, eventId, outcome, -fill.quantity);

        // Handle counterparty's balance - buyer's locked funds are converted to position value
        this.balances.set(fill.otherUserId, {
          available: this.balances.get(fill.otherUserId)!.available,
          locked: this.balances.get(fill.otherUserId)!.locked - fillAmount,
        });

        // Update positions for the buyer (counterparty)
        this.updatePosition(fill.otherUserId, eventId, outcome, fill.quantity);
      }
    });
  }

  private updatePosition(
    userId: string,
    event: string,
    outcome: "YES" | "NO",
    quantity: number
  ) {
    // Initialize user's positions map if it doesn't exist
    if (!this.positions.has(userId)) {
      this.positions.set(userId, new Map());
    }

    // Initialize event map if it doesn't exist for this user
    const userPositions = this.positions.get(userId)!;
    if (!userPositions.has(event)) {
      userPositions.set(event, { YES: 0, NO: 0 });
    }

    // Update the specific outcome position
    const eventPositions = userPositions.get(event)!;
    eventPositions[outcome] += quantity;

    // Update the position in the map
    userPositions.set(event, eventPositions);
  }

  checkAndLockFunds(
    userId: string,
    price: number,
    outcome: "YES" | "NO",
    side: "BUY" | "SELL",
    eventId: string,
    quantity: number
  ) {
    try {
      if (side === "BUY") {
        if (!this.balances.has(userId)) {
          throw new Error("User not found");
        }
        if (this.balances.get(userId)?.available! < price * quantity) {
          console.log("Insufficient funds");
          return
        }
        this.balances.set(userId, {
          available: this.balances.get(userId)!.available - price * quantity,
          locked: this.balances.get(userId)!.locked + price * quantity,
        });
      } else {
        // Check if the order book has enough YES or NO volume
        const orderBook = this.orderBook.find(
          (orderBook) => orderBook.eventId === eventId
        );
        if (!orderBook) {
          throw new Error("Order book not found");
        }

        if (
          !this.positions.has(userId) ||
          !this.positions.get(userId)!.has(eventId)
        ) {
          throw new Error("No positions found for this event");
        }

        if (outcome === "YES") {
          if (this.positions.get(userId)!.get(eventId)!.YES < quantity) {
            throw new Error("Insufficient YES positions");
          }
          this.positions.get(userId)!.get(eventId)!.YES -= quantity;
        } else {
          if (this.positions.get(userId)!.get(eventId)!.NO < quantity) {
            throw new Error("Insufficient NO positions");
          }
          this.positions.get(userId)!.get(eventId)!.NO -= quantity;
        }
      }
    } catch (error) {
      console.error("Error in checkAndLockFunds:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}