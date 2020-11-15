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
        unLikeScream,
        deleteScream
    } = require('./handlers/screams');
const {
        logIn,
        signUp, 
        uploadImage,
        addUserDetails,
        getAuthenticatedUser,
        getUserDetail,
        markNotificationRead,
    } = require('./handlers/users');

// SCREAM ROUTES
app.get('/scream', getAllScreams);
app.post('/scream', FirebaseAuth, postScreams);
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', FirebaseAuth, deleteScream);
app.post('/scream/:screamId/like', FirebaseAuth, likeScream);
app.post('/scream/:screamId/unlike', FirebaseAuth, unLikeScream);
app.post('/scream/:screamId/comment', FirebaseAuth, commentOnScream);

// USER ROUTES
app.get('/user', FirebaseAuth, getAuthenticatedUser); 
app.post('/user', FirebaseAuth, addUserDetails); 

// SIGN UP ROUTES
app.post('/signup', signUp);
app.post('/login', logIn);

// USER ROUTES
app.post('/user/upload-profile-image', FirebaseAuth, uploadImage);
app.get('/user/:handle', getUserDetail);
app.post('/notifications', FirebaseAuth, markNotificationRead);

exports.api = functions.region('asia-southeast2').https.onRequest(app);

// TRIGGER
// Create Notification on Like
exports.createNotificationOnLike = functions.region('asia-southeast2').firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then((doc) => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        craetedAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        read: false,
                        type: 'like',
                        screamId: doc.id,
                    });
                }
                return;
            })
            .catch((err) => {console.error(err)});
});

// Unlike Notificatoin
// Key concept is not send the notification when another user unlike a scream
exports.deleteNotificationOnUnlike = functions.region('asia-southeast2').firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        return db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch((err) => {console.error(err)});
})

// Create Notification on Comment
exports.createNotificationOnComment = functions.region('asia-southeast2').firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then((doc) => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        craetedAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        read: false,
                        type: 'comments',
                        screamId: doc.id,
                    })
                }
                return;
            })
            .catch((err) => {console.error(err)})
})

exports.onUserImageChange = functions.region('asia-southeast2').firestore.document('/users/{userId}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());

    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('image has changed');
      let batch = db.batch();
      return db
        .collection('screams')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onScreamDeleted = functions.region('asia-southeast2').firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();

        return db.collection('comments')
            .where('screamId', '==', screamId)
            .get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                })
                return db.collection('likes')
                    .where('screamId', '==', screamId)
                    .get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                })
                return db.collection('notifications')
                    .where('screamId', '==', screamId)
                    .get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                })
                return batch.commit();
            })
            .catch(err => {
                console.error(err);
            })
})