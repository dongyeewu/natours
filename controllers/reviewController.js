const Review = require('../models/ReviewModel');
const catchAsync = require('../utils/catchAsync.js');
const factory = require('./handleFactory.js');
// const APIFeatures = require('../utils/apiFeatures.js');
// const AppError = require('../utils/appError.js');


exports.setTourUserIds = catchAsync(async (req,res,next)=>{
    if(!req.body.tour) req.body.tour  = req.params.tourId;
    if(!req.body.user) req.body.user  = req.user.id;
    next();
});


exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.getReviews = factory.getAll(Review);

// exports.getReviews = catchAsync(async (req,res,next)=>{
//     let filter = {};
//     if(req.params.tourId) filter = {tour : req.params.tourId};
    
//     const review = await Review.find(filter);
//     // const features = new APIFeatures(Review.find(),req.query).filter().sort().limitFields().pagenation();
//     // const review = await features.query;
//     res.status(200).json(
//         {
//             "status":"sucess",
//             "results":review.length,
//             "data":{
//                 review
//             }
//         }      
//     );    
// });

// exports.getReview = catchAsync(async (req,res,next)=>{
//     const review = await Review.findById(req.params.id);
//     res.status(200).json(
//         {
//             "status":"sucess",   
//             "data":{
//                 review
//             }
//         }      
//     );    
// });

// exports.createReview = catchAsync(async (req,res,next)=>{
//     const body = req.body;
    
//     if(!req.body.tour) req.body.tour  = req.params.tourId;
//     if(!req.body.user) req.body.user  = req.user.id;
//     const review = await Review.create(body);   

//     res.status(201).json(
//         {
//             "status":"sucess",           
//             "data":{
//                 review
//             }
//         }      
//     );    
// });


// exports.updateReview = catchAsync(async (req,res,next)=>{
//     const review = await Review.findByIdAndUpdate(req.params.id, req.body,{
//         new:true,
//         runValidators:true,           
//     }); 
    
//     if(!review){
//         return next(new AppError('No review found',404));
//      }

//     res.status(201).json(
//         {
//             "status":"sucess",           
//             "data":{
//                 review
//             }
//         }      
//     );    
// });



// exports.deleteReview = catchAsync(async (req,res,next)=>{
//     const review = await Review.findByIdAndDelete(req.params.id); 
    
//     if(!review){
//         return next(new AppError('No review found',404));
//      }

//     res.status(204).json(
//         {
//             "status":"sucess",           
//             "data":null
//         }      
//     );    
// });