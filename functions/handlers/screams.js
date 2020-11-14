const {db} = require('../utility/admin')

exports.getAllScreams = (req, res) => {
    db.collection('screams')
      .orderBy('createdAt', 'desc')
      .get()
      .then((data) => {
        let screams = [];
        data.forEach((doc) => {
          screams.push({
            screamId: doc.id,
            body: doc.data().body,
            userHandle: doc.data().userHandle,
            createdAt: doc.data().createdAt,
            commentCount: doc.data().commentCount,
            likeCount: doc.data().likeCount,
            userImage: doc.data().userImage
          });
        });
        return res.json(screams);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err.code });
      });
};

exports.postScreams = (req, res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({body: 'Body must not be empty'});
    }

    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString(),
        userImage: req.user.imageUrl,
        likeCount: 0,
        commentCount: 0,
    }

    db.collection('screams')
        .add(newScream)
        .then((doc) => {
          const resScream = newScream;
          resScream.screamId = doc.id;

          res.json({resScream});
        })
        .catch(err => {
            res.status(500).json({error: 'something went wrong !'});
            console.log(err);
        })
};

exports.getScream = (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Scream not found' });
      }

      screamData = doc.data();
      screamData.screamId = doc.id;
      return db.collection('comments')
            .orderBy('createdAt', 'desc')//DESCENDING
            .where('screamId', '==', req.params.screamId)
            .get();
    })
    .then(data => {
      screamData.comments = [];
      data.forEach((doc) => {
        screamData.comments.push(doc.data());
      })

      return res.json(screamData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });
};

exports.commentOnScream = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({error: "Must not be Empty"});
  }

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  };

  db.doc(`/screams/${req.params.screamId}`)
  .get()
  .then(doc => {
    if (!doc.exists) {
      return res.status(400).json("Scream Not Found");
    }

    return db.collection('comments').add(newComment);
  })
  .then(() => {
    res.json(newComment);
  })
  .catch(err => {
    console.error(err);
    return res.status(500).json({error: err.message});
  });

};

exports.likeScream = (req, res) => {
  const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
    .where('screamId', '==', req.params.screamId)
    .limit(1);

  const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  let screamData = {};
  console.log(screamDocument.get());
  screamDocument.get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
  
        return likeDocument.get();
      }
      else{
        return res.status(404).json({error: 'Scream data not found'});
      }
    })
    .then((data) => {
      if (data.empty) {
        return db.collection('likes').add({
          screamId: req.params.screamId,
          userHandle: req.user.handle
        })
        .then(() => {
          screamData.likeCount++
          return screamDocument.update({likeCount: screamData.likeCount});
        })
        .then(() => {
          return res.json(screamData);
        })
      }
      else{
        return res.status(400).json({error: 'scream already liked'});
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({error: err.code})
    });
}

exports.unLikeScream = (req, res) => {
  const likeDocument = db.collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('screamId', '==', req.params.screamId)
    .limit(1);

  const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  let screamData = {};

  screamDocument.get()
  .then((doc) => {
    if (doc.exists) {
      screamData = doc.data();
      screamData.screamId = doc.id;
 
      return likeDocument.get();
    }
    else{
      return res.status(404).json({error: 'Scream data not found'});
    }
  })
  .then((data) => {
    if (data.empty) {
      return res.status(400).json({error: 'scream not liked'});
    }
    else{
      return db.doc(`/likes/${data.doc[0].data().id}`).delete()
        .then(()=> {
          screamData.likeCount--;
          return screamDocument.update({likeCount: screamData.likeCount});
        })
        .then(()=>{
          res.json(screamData);
        })
    }
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({error: err.code})
  })
}