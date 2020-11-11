const functions = require('firebase-functions');
const app = require('express')();
const {FirebaseAuth} = require('./utility/firebase');

const {db} = require('./utility/admin');

// Import Dependencies
const {
        getAllScreams, 
        postScreams
    } = require('./handlers/screams');
const {
        signUp, 
        logIn,
        uploadImage,
    } = require('./handlers/users');

// SCREAM ROUTES
app.get('/screams', getAllScreams);
app.post('/screams', FirebaseAuth, postScreams);

// SIGN UP ROUTES
app.post('/signup', signUp);
app.post('/login', logIn);

// USER ROUTES
app.post('/user/upload', uploadImage);

exports.api = functions.region('asia-southeast2').https.onRequest(app);

