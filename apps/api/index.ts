import express from "express";
import { 
    signupSchema,
    signinSchema,
    createEventSchema,
    createOrderSchema
} from "common";
import prismaClient from "db";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import { authMiddleware } from "./middleware";
import {
    CREATE_EVENT,
    CREATE_ORDER,
    CREATE_USER,
    GET_DEPTH,
    GET_OPEN_ORDERS,
    CANCEL_ORDER
    type MessageToEngine,
  } from "./types/types";
import { RedisManager } from "./RedisManager";
  

const app = express();
app.use(express.json());


app.post ('/signup' , async (req , res) => {

    const response = signupSchema.safeParse(req.body);
    if (!response.success) {
        res.status(400).json({ error: response.error.errors });
        return;
    }

    const { username, email, password } = response.data;

    const existedUser = await prismaClient.user.findUnique({
        where: {
            email,
        },
    });
    
    if(!existedUser) {
        res.status(400).json({ error: "User not found", success: false });
        return;
    }

    const hashedPassword = await hash(password , 10);

    const user = await prismaClient.user.create({
        data: {
            username,
            email,
            password : hashedPassword
        },
    });

    const messageToSend : MessageToEngine = {
        type: CREATE_USER,
        data: {
            userId: user.id,
        },
    }

    const response1 = await RedisManager.getInstance().sendAndAwait(messageToSend);

    if(!response1){
        res.status(400).json({ error: "Orderbook not responding", success: false });
        return;
    }


    res.status(201).json({ success: true, data: user })
    return;
});


app.post('/signin' , async (req , res) => {

    const data = signinSchema.safeParse(req.body);

    if (!data.success) {
        res.status(400).json({ error: data.error, success: false });
        return;
    }

    const { email, password } = data.data;

    const user = await prismaClient.user.findUnique({
        where: {
            email,
        },
    });
    
    if(!user) {
        res.status(400).json({ error: "User not found", success: false });
        return;
    }
    // check the password with the hashed password in the db
    const isPasswordValid = await hash(password, user.password);
    if (!isPasswordValid) {
        res.status(400).json({ error: "Invalid password", success: false });
        return;
    }
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.status(200).json({
        message: "User signed in successfully",
        user: {
            email,
            password
        }
    })
    return;
})
// To get events 
app.get("/events", async (req, res) => {

    const events = await prismaClient.event.findMany({
        where: {
        isActive: true,
        },
        orderBy: {
        expiresAt: "asc",
        },
    });

    if (!events || events.length === 0) {
        res.status(400).json({ error: "No active events found", success: false });
        return;
    }
    
    res.status(200).json({ success: true, data: events });
    return;
});

// To get a specific event by ID
app.get("/event/:eventId", async (req, res) => {
    const { eventId } = req.params;
  
    const event = await prismaClient.event.findUnique({
      where: { id: eventId },
    });
  
    if (!event) {
      res.status(400).json({ error: "Event not found", success: false });
      return;
    }
  
    res.status(200).json({ success: true, data: event });
    return;
  });
  

// To post a new event
app.post ('/event' , authMiddleware , async ( req , res) => {

    const response = createEventSchema.safeParse(req.body);
    if (!response.success) {
        res.status(400).json({ error: response.error.errors });
        return;
    }

    const { title , description, expiresAt, question, imageurl } = response.data;


    // save the event to the database
    
    const event = await prismaClient.event.create({
        data:{
            title,
            description,
            question,
            expiresAt,
            thumbnail: imageurl,
        }
    });

        const messageToSend: MessageToEngine = {
            type: CREATE_EVENT,
            data: {
            title,
            expiresAt: event.expiresAt.toISOString(),
            },
        };

        const response1 = await RedisManager.getInstance().sendAndAwait(messageToSend);

        console.log("Response from orderbooks:", response1);

    if (!response) {
        await prismaClient.event.delete({
            where: { id: event.id },
            });
        res.status(400).json({ error: "Orderbook not responding", success: false });
        return;
        }

    res.status(200).json({ success: true, data: event });
    return;
})

// To create an order
app.post('/order', authMiddleware, async (req, res) => {

    const response = createOrderSchema.safeParse(req.body);

    if (!response.success) {
        res.status(400).json({ error: response.error.errors });
        return;
    }
    const { eventId, orderType, outcome, side, quantity, price } = response.data;
    
    // Check if the event exists and is active
    const event = await prismaClient.event.findUnique({
    where: { id: eventId, isActive: true },
    });

    if (!event) {
    res.status(400).json({ error: "Event not found or not active", success: false });
    return;
    }

    if (orderType === "LIMIT" && !price) {
        res.status(400).json({ error: "Price is required for LIMIT orders", success: false });
        return;
    }

    const messageToSend: MessageToEngine = {
        type: CREATE_ORDER,
        data :{
            event: eventId,
            price: price || 0, // Use 0 for market orders
            quantity,
            side, // Assuming req.user is set by authMiddleware
            outcome,
            // @ts-ignore
            userId: req.user.id, // Use the authenticated user's ID
        }
    }

    const response1 = await RedisManager.getInstance().sendAndAwait(messageToSend);

    if (!response1) {
        res.status(400).json({ error: "Orderbook not responding", success: false });
        return;
    }


    // Use req.user to access the authenticated user
    res.status(200).json({ data: response1 });
});


//to get an orderbook for a specific event
app.get("/orderbook/:eventId",  authMiddleware ,async (req, res) => {
    const { eventId } = req.params;

    const event = await prismaClient.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        res.status(400).json({ error: "Event not found", success: false });
        return;
    }

    //fetch the orderbook entries for events
    const orderBook = await prismaClient.orderBookEntry.findMany({
        where: {
            eventId,
            order: {
                status: {
                in: ["PENDING", "PARTIAL"],
                },
        },
        },
        orderBy: [{ price: "asc" }, { timestamp: "asc" }],
    });

    const groupedOrderBook = {
    YES: {
        BUY: orderBook.filter(
            (entry) => entry.outcome === "YES" && entry.side === "BUY"
        ),
        SELL: orderBook.filter(
            (entry) => entry.outcome === "YES" && entry.side === "SELL"
        ),
    },
    NO: {
        BUY: orderBook.filter(
            (entry) => entry.outcome === "NO" && entry.side === "BUY"
        ),
        SELL: orderBook.filter(
            (entry) => entry.outcome === "NO" && entry.side === "SELL"
        ),
    },
    };

    // sending message to redis 
    //@ts-ignore
    const messageToSend: MessageToEngine = {
        type: GET_OPEN_ORDERS,
        data: {
            event: eventId,
            // @ts-ignore
            userId: req.user.id, // Use the authenticated user's ID
        },
    };

    const response = await RedisManager.getInstance().sendAndAwait(messageToSend);

    if (!response) {
        res.status(400).json({ error: "Orderbook not responding", success: false });
        return;
    }


    res.status(200).json({ success: true, data: response });
    return;
});

//to get depth for a specific event
app.get("/depth/:eventId", async (req, res) => {  
    
    const { eventId } = req.params;

    const event = await prismaClient.event.findUnique({
        where: { id: eventId },
    });
    if (!event) {
        res.status(400).json({ error: "Event not found", success: false });
        return;
    }

    const messageToSend: MessageToEngine = {
        type: GET_DEPTH,
        data: {
            event: eventId,
        },
    };

    const response = await RedisManager.getInstance().sendAndAwait(messageToSend);

    if (!response) {
        res.status(400).json({ error: "Orderbook not responding", success: false });
        return;
    }

    res.status(200).json({ success: true, data: response });
})

// to delet an order

app.delete('/order/:orderId', authMiddleware, async (req, res) => {
    const { orderId} = req.params;

    // Check if the order exists
    const order = await prismaClient.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        res.status(400).json({ error: "Order not found", success: false });
        return;
    }
    // Check if the user is authorized to cancel this order
    //@ts-ignore
    if (order.userId !== req.user.id) {
        res.status(403).json({ error: "You are not authorized to cancel this order", success: false });
        return;
    }



    // Send a message to Redis to cancel the order
    
    const messageToSend: MessageToEngine = {
        type: CANCEL_ORDER,
        data: {
            orderId: orderId!,      
            event: order.eventId
        },
    };

    const response = await RedisManager.getInstance().sendAndAwait(messageToSend);

    if (!response) {
        res.status(400).json({ error: "Orderbook not responding", success: false });
        return;
    }

    res.status(200).json({ success: true, data: response});

});
app.listen(3000, () => {
    console.log("API Server is running on port 3000");
})