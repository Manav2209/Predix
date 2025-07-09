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

});

export const cancelOrderSchema = z.object({


});

