const functions = require('firebase-functions');
const app = require('express')();
const {FirebaseAuth} = require('./utility/firebase');

const {db} = require('./utility/admin');

// Import Dependencies
const {
        getAllScreams, 
        postScreams,
        getScream,
        commentOnScream,
        likeScream,
        unLikeScream
    } = require('./handlers/screams');
const {
        logIn,
        signUp, 
        uploadImage,
        addUserDetails,
        getAuthenticatedUser,
    } = require('./handlers/users');

// SCREAM ROUTES
app.get('/scream', getAllScreams);
app.post('/scream', FirebaseAuth, postScreams);
app.get('/scream/:screamId', getScream);
// TODO: delete scream
// TODO: like a scream
app.post('/scream/:screamId/like', FirebaseAuth, likeScream);
app.post('/scream/:screamId/unlike', FirebaseAuth, unLikeScream);
app.post('/scream/:screamId/comment', FirebaseAuth, commentOnScream);

// USER ROUTES
app.post('/user', FirebaseAuth, addUserDetails); 
app.get('/user', FirebaseAuth, getAuthenticatedUser); 

// SIGN UP ROUTES
app.post('/signup', signUp);
app.post('/login', logIn);

// USER ROUTES
app.post('/user/upload-profile-image', FirebaseAuth, uploadImage);

exports.api = functions.region('asia-southeast2').https.onRequest(app);