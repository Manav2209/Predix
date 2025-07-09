import express from "express";
import { 
    signupSchema,
    signinSchema,
    createEventSchema
} from "common";
import prismaClient from "db";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import { authMiddleware } from "./middleware";


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

    res.status(200).json({ success: true, data: event });
    return;
})


app.post('/order', authMiddleware, async (req, res) => {

    // Implement order creation logic here

    // Use req.user to access the authenticated user
    res.status(200).json({ message: "Order created successfully" });
});


app.listen(3000, () => {
  console.log("API Server is running on port 3000");
})