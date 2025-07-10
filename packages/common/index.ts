import {z} from 'zod';
import { email } from 'zod/v4';
import { de } from 'zod/v4/locales';

export const signupSchema = z.object({
    "username": z.string().min(1),
    "email": z.string().email(),
    "password": z.string().min(8),
});

export const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const createEventSchema = z.object({
    title : z.string(),
    description: z.string(),
    expiresAt : z.string(),
    question: z.string().optional(),
    imageurl: z.string()
});


export const createOrderSchema = z.object({
    eventId: z.string(),
    orderType: z.enum(["MARKET", "LIMIT"]),
    outcome: z.enum(["YES", "NO"]),
    side: z.enum(["BUY", "SELL"]),
    quantity: z.number().positive(),
    price: z.number().positive().optional(), 
});

export const cancelOrderSchema = z.object({
    orderId: z.string(),
});

export type SignupSchema = z.infer<typeof signupSchema>;
export type SigninSchema = z.infer<typeof signinSchema>;
export type CreateOrderSchema = z.infer<typeof createOrderSchema>;
export type CancelOrderSchema = z.infer<typeof cancelOrderSchema>;