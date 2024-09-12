import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import cors from 'cors';
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

import dotenv from "dotenv";
import User from "./models/User.js";
import Todo from "./models/Todo.js";
const secret = '123'


mongoose.set('strictQuery', false);
await mongoose.connect('').then(() => console.log('MongoDB connected successfully!'))
    .catch((err) => console.error('MongoDB connection error:', err));



const app = express();
app.use(cookieParser());
app.use(bodyParser.json({extended:true}));
app.use(cors({
    credentials:true,
    origin: 'http://localhost:3000',
}));

app.get('/', (req, res) => {
    res.send('ok');
});

app.get('/user', (req, res) => {
    if (!req.cookies.token) {
        return res.json({});
    }
    const payload = jwt.verify(req.cookies.token, secret);
    User.findById(payload.id)
        .then(userInfo => {
            if (!userInfo) {
                return res.json({});
            }
            res.json({id:userInfo._id,email:userInfo.email});
        });

});

app.post('/register', (req, res) => {
    const {email,password} = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({password:hashedPassword,email});
    user.save().then(userInfo => {
        jwt.sign({id:userInfo._id,email:userInfo.email}, secret, (err,token) => {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.cookie('token', token).json({id:userInfo._id,email:userInfo.email});
            }
        });
    });
});

app.post('/login', (req, res) => {
    const {email,password} = req.body;
    User.findOne({email})
        .then(userInfo => {
            if (!userInfo) {
                return res.json({});
            }
            const passOk = bcrypt.compareSync(password, userInfo.password);
            if (passOk) {
                jwt.sign({id:userInfo._id,email},secret, (err,token) => {
                    if (err) {
                        console.log(err);
                        res.sendStatus(500);
                    } else {
                        res.cookie('token', token).json({id:userInfo._id,email:userInfo.email});
                    }
                });
            } else {
                res.sendStatus(401);
            }
        })
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').send();
});

app.get('/todos', async (req, res) => {
    try {
        // Verify the token
        const payload = jwt.verify(req.cookies.token, secret);

        // Fetch todos for the user
        const todos = await Todo.where({ user: new mongoose.Types.ObjectId(payload.id) }).find();

        // Send the todos as JSON response
        res.json(todos);
    } catch (err) {
        // Handle errors such as token verification failure or database issues
        res.status(500).json({ error: 'Failed to fetch todos', details: err.message });
    }
});


app.put('/todos', (req, res) => {
    const payload = jwt.verify(req.cookies.token, secret);
    const todo = new Todo({
        text:req.body.text,
        done:false,
        user:new mongoose.Types.ObjectId(payload.id),
        dueDate: req.body.dueDate,  // Include dueDate
        priority: req.body.priority // Include priority
    });
    todo.save().then(todo => {
        res.json(todo);
    })
});

app.post('/todos', (req,res) => {
    const payload = jwt.verify(req.cookies.token, secret);
    Todo.updateOne({
        _id:new mongoose.Types.ObjectId(req.body.id),
        user:new mongoose.Types.ObjectId(payload.id)
    }, {
        done:req.body.done,
        dueDate: req.body.dueDate,  // Update dueDate if provided
        priority: req.body.priority // Update priority if provided
    }).then(() => {
        res.sendStatus(200);
    });
});


app.post('/change-password', async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old password and new password are required' });
        }

        // Verify the token
        const payload = jwt.verify(req.cookies.token, secret);
        if (!payload) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Find the user
        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if old password is correct
        const passOk = bcrypt.compareSync(oldPassword, user.password);
        if (!passOk) {
            return res.status(401).json({ error: 'Old password is incorrect' });
        }

        // Hash the new password and update the user record
        const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to change password', details: err.message });
    }
});



app.listen(4000);