// importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
// const Pusher = require('pusher');

import Pusher from 'pusher';
import cors from 'cors';

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1089523',
    key: '1bca08864f294c0a474c',
    secret: '9896575630fa8917ddc0',
    cluster: 'ap4',
    encrypted: true
});


// middleware
app.use(express.json());
app.use(cors())

// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });

// database config
const connection_url = "mongodb+srv://admin:bxzkXkvSVoCJY1uN@cluster0.9gqih.mongodb.net/chatapp?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection

db.once('open', () => {
    console.log('DB connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log("changed occured", change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else {
            console.log('Error triggering Pusher')
        }
    });
});

// ??

// Api Routes
app.get("/", (req, res) => res.status(200).send("Hey there, i am learning more"));

app.get('/messages/sync', (req, res) => {

    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post('/messages/new', (req, res) => {

    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

// Listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));