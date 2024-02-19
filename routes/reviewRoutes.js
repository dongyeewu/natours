const express = require('express');
const reviewController =require('../controllers/reviewController.js');
const authController = require('../controllers/authController.js');
const Router = express.Router({mergeParams:true});

Router.use(authController.protect);

Router.route('/')
.get(reviewController.getReviews)
.post(authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview)

Router.route('/:id')
.get(reviewController.getReview)
.patch(authController.restrictTo('user'),reviewController.updateReview)
.delete(authController.restrictTo('user','admin'),reviewController.deleteReview)



module.exports = Router;