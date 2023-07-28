/*********IMPORTS*********/
const express = require('express');
const dotenv = require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const mongoose = require('mongoose');
const usersRouter = require('./routes/users');
const path = require('path');
/*************************/


/*****DB CONNECTIONS******/
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection;
db.once('open', () => console.log('Connected to DataBase!'));
/*************************/


/***MIDDLEWARE & ROUTES***/
app.use(express.json());
app.use('/api/users', usersRouter);
app.use(express.static(path.join(__dirname, '..frontend/build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/build/index')));
/*************************/
app.get('/', (req, res) => {
    res.send('Backend API');
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});