import express from "express";
import { signupSchema,
    signinSchema
 } from "common";
const app = express();
app.use(express.json());



app.post ('/signup' , (req , res) => {

    const response = signupSchema.safeParse(req.body);
    if (!response.success) {
        res.status(400).json({ error: response.error.errors });
        return;
    }

    const { username, email, password } = response.data;

    // save to db



    res.status(201).json({
        message: "User created successfully",
        user: {
            username,
            email,
            password
        }
        })
    return;
});


app.post('/signin' , (req , res) => {

    const data = signinSchema.safeParse(req.body);

    if (!data.success) {
        res.status(400).json({ error: data.error, success: false });
        return;
    }

    const { email, password } = data.data;
    // authenticate user with db

    res.status(200).json({
        message: "User signed in successfully",
        user: {
            email,
            password
        }
    })
    return;


})



app.listen(3000, () => {
  console.log("API Server is running on port 3000");
})