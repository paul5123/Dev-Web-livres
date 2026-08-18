const Book = require('../models/Book');
const fs = require('fs');



exports.createBook = (req, res, next) => {
   const bookObject = JSON.parse(req.body.book);
   delete bookObject._id;
   delete bookObject._userId;
   const book = new Book({
       ...bookObject,
       userId: req.auth.userId,
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
       ratings: [],
       averageRating: 0

   });
 
   book.save()
   .then(() => { res.status(201).json({message: 'Livre enregistré !'})})
   .catch(error => { res.status(400).json( { error })})
};

exports.createRatingsgBook = (req, res, next) => {
  const bookObject = req.body;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.ratings.some(rating => rating.userId === req.auth.userId)) {
        return res.status(403).json({ message: 'unauthorized request' });
      }
      if(bookObject.rating<0 || bookObject.rating>5) {
        return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5' });
      } 
      else {
        const newRating = {
          userId: req.auth.userId,
          grade: bookObject.rating
        };

        book.ratings.push(newRating);

        const totalRating = book.ratings.reduce((total, rating) => {
        return total + rating.grade;
        }, 0);

        book.averageRating = totalRating / book.ratings.length;

        book.save()
          .then(() => res.status(200).json(book))
          .catch(error => res.status(400).json({ error }));
      }
    })
    .catch(error => {
      res.status(400).json({ error });
    });
};

exports.modifyBook = (req, res, next) => {
   const bookObject = req.file ? {
       ...JSON.parse(req.body.book),
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
   } : { ...req.body };
 
   delete bookObject.userId;
   Book.findOne({_id: req.params.id})
       .then((book) => {
           if (book.userId != req.auth.userId) {
               res.status(403).json({ message : 'unauthorized request'});
           } else {
               Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
               .then(() => res.status(200).json({message : 'Livre modifié!'}))
               .catch(error => res.status(401).json({ error }));
           }
       })
       .catch((error) => {
           res.status(400).json({ error });
       });
};

exports.deleteBook = (req, res, next) => {
   Book.findOne({ _id: req.params.id})
       .then(book => {
           if (book.userId != req.auth.userId) {
               res.status(403).json({message: 'unauthorized request'});
           } else {
               const filename = book.imageUrl.split('/images/')[1];
               fs.unlink(`images/${filename}`, () => {
                   Book.deleteOne({_id: req.params.id})
                       .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                       .catch(error => res.status(401).json({ error }));
               });
           }
       })
       .catch( error => {
           res.status(500).json({ error });
       });
};

exports.getOneBook = (req, res, next)=>  {
  Book.findOne({_id: req.params.id})
    .then(book => res.status(200).json(book))
    .catch(error => res.status(400).json({error}));
}

exports.getAllBook =  (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({error}));
}

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};