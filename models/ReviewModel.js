// 引用mongoose
const mongoose = require('mongoose');
const Tour = require('./tourModel');
const ReviewSchema = new mongoose.Schema(
    {
        review: {
          type: String,
          required: [true, 'Review can not be empty!']
        },
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        createdAt: {
          type: Date,
          default: Date.now
        },
        tour: {
          type: mongoose.Schema.ObjectId,
          ref: 'Tour',
          required: [true, 'Review must belong to a tour.']
        },
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: [true, 'Review must belong to a user']
        }
    },
    {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
    });

    
// ReviewSchema.index({tour:1,user:1},{unique:true});
// 創建Schema
// 增加 middleware
ReviewSchema.pre(/^find/,function(next){
  // this.populate({
  //     path:'tour',
  //     select: 'name'
  // })
  this.populate({
      path:'user',
      select: 'name photo'
  })
  console.log("populate");
  next();
});

ReviewSchema.statics.calcAverageRating = async function(tourId){
  console.log(tourId)
  const stats = await this.aggregate([
    {
      $match:{tour:tourId}
    },
    {
      $group:{
        _id:"$tour",
        nRating:{$sum:1},
        avgRating:{$avg:'$rating'}
      }
    }
  ]);
  
  await Tour.findByIdAndUpdate(tourId,{
    ratingsAverage:stats[0].avgRating,
    ratingsQuantity:stats[0].nRating
  });
  console.log(stats);  
}

ReviewSchema.post('save',function(next){
  console.log("this.tour")
  this.constructor.calcAverageRating(this.tour);
  // Review.calcAverageRating(this.tour);
});

const Review = mongoose.model('Review',ReviewSchema);
module.exports = Review;

// export 給他人使用