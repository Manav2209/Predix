export type MessageToEngine =
  | {
      type: typeof CREATE_USER;
      data: {
        userId: string;
      };
    }
  | {
      type: typeof CREATE_ORDER;
      data: {
        eventId: string;
        price: number;
        quantity: number;
        side: "BUY" | "SELL";
        userId: string;
        outcome: "YES" | "NO";
      };
    }
  | {
      type: typeof CANCEL_ORDER;
      data: {
        orderId: string;
        eventId: string;
      };
    }
  | {
      type: typeof GET_DEPTH;
      data: {
        eventId: string;
      };
    }
  | {
      type: typeof GET_OPEN_ORDERS;
      data: {
        eventId: string;
        userId: string;
      };
    }
  | {
      type: typeof CREATE_EVENT;
      data: {
        eventId: string;
        title: string;
        expiresAt: string;
      };
    };

export const CREATE_ORDER = "CREATE_ORDER";
export const CREATE_USER = "CREATE_USER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const CREATE_EVENT = "CREATE_EVENT";
export const ON_RAMP = "ON_RAMP";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";

export const GET_DEPTH = "GET_DEPTH";
