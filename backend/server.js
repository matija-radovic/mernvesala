const express = require('express');
require('dotenv').config();
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 5000;
const mongoose = require('mongoose');
const usersRouter = require('./routes/users');

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;


db.once('open', () => console.log('Connected to DataBase!'));

app.use(express.json());
app.use('/api/users', usersRouter);



server.listen(port, () => {
  console.clear();
  console.log(`Fruits app listening on port ${port}`);
});
module.exports = { arr };