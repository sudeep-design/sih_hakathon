const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/chatApp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Mongoose schemas
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    phone: String,
    isOnline: Boolean
});
const User = mongoose.model('User', UserSchema);

const MessageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

const AlumniSchema = new mongoose.Schema({
    name: String
});
const Alumni = mongoose.model('Alumni', AlumniSchema); // Ensure the Alumni model is defined

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// API route to get all alumni names
app.get('/api/alumni/names', async (req, res) => {
    try {
        const alumni = await Alumni.find({}, 'name'); // Only retrieve the 'name' field
        res.json(alumni);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

let onlineUsers = {};

// Socket.io setup
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle new user joining
    socket.on('join chat', async ({ username }) => {
        onlineUsers[socket.id] = username;
        io.emit('update users', Object.values(onlineUsers));

        // Broadcast user joining
        socket.broadcast.emit('user joined', `${username} has joined the chat`);

        // Mark user as online in DB
        await User.updateOne({ username }, { isOnline: true });
    });

    // Handle sending a message
    socket.on('send message', async ({ sender, receiver, message }) => {
        const newMessage = new Message({ sender, receiver, message });
        await newMessage.save();
        io.emit('receive message', { sender, message });
    });

    // Handle creating a poll
    socket.on('create poll', (pollData) => {
        const poll = {
            id: Date.now(),
            question: pollData.question,
            options: pollData.options,
            votes: [0, 0]  // Initial votes
        };
        polls.push(poll);
        io.emit('new poll', poll);
    });

    // Handle voting in a poll
    socket.on('vote poll', ({ pollId, optionIndex }) => {
        const poll = polls.find(p => p.id === parseInt(pollId));
        if (poll) {
            poll.votes[optionIndex]++;
            io.emit('update poll', poll);
        }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        const username = onlineUsers[socket.id];
        delete onlineUsers[socket.id];
        io.emit('update users', Object.values(onlineUsers));

        // Mark user as offline in DB
        await User.updateOne({ username }, { isOnline: false });
        socket.broadcast.emit('user left', `${username} has left the chat`);
    });
});

const polls = [];

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
