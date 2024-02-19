const express = require('express');
const tourRouter = express.Router();
const tourController =require('../controllers/tourController.js');
const authController = require('../controllers/authController.js');
const reviewRouter =require('../routes/reviewRoutes.js');
// const reviewController = require('../controllers/reviewController.js');

// tourRouter.param('id',tourController.checkID);

tourRouter
   .route('/tours-with-in/:distance/center/:latlng/unit/:unit')
   .get(tourController.getToursWithIn);
//tours-with-in?distance=233&center=-40,45&unit=mi
//tours-with-in/distance/233/center/-40,45/unit/mi
tourRouter
   .route('/distances/:latlng/unit/:unit')
   .get(tourController.getDistances);


tourRouter
   .route('/top-5-cheap')
   .get(tourController.aliasTopTours,tourController.getTours);
   
tourRouter
   .route('/tour-stats')
   .get(tourController.getTourstate);

tourRouter
   .route('/monthly-plan/:year')
   .get(authController.protect,authController.restrictTo('admin','lead-guide','guide'),tourController.getMonthlyplan);

tourRouter
   .route('/')
   .get(tourController.getTours)
   .post(
      authController.protect,
      authController.restrictTo('admin','lead-guide'), 
      tourController.createTour);


tourRouter
   .route('/:id')
   .get(
      authController.protect,
      tourController.getTour)
   .patch(
      authController.protect,
      authController.restrictTo('admin','lead-guide'),
      tourController.uploadTourImages,
      tourController.resizeTourImages,
      tourController.updateTour)
   .delete(
      authController.protect,
      authController.restrictTo('admin','lead-guide'),
      tourController.deleteTour);
   
// tourRouter.route('/:tourId/reviews')
// .post(authController.protect,authController.restrictTo('user'),reviewController.createReview);

tourRouter.use('/:tourId/reviews',reviewRouter);
   
module.exports = tourRouter;