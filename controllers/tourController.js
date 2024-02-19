const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel.js');
const APIFeatures = require('../utils/apiFeatures.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const factory = require('./handleFactory.js');

// const catchAsync = fn => { 
//     return (req, res, next) => {
//         fn(req, res, next).catch(next);
//     };   
// }

const multerstorage = multer.memoryStorage();

const multerFilter = (req, file , cb) => {
    console.log('multerFilter')
    console.log(file)
    if (file.mimetype.startsWith('image')){
        cb(null, true);
    }else{
        cb(new AppError('Not an image ! plz upload only images', 400), false)
    }
} 

const tourUpload = multer({
    storage: multerstorage,
    fileFilter: multerFilter,
});

exports.uploadTourImages = tourUpload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3}    
]);

exports.resizeTourImages = catchAsync( async (req, res, next) => {
    console.log('req'); 
    console.log(req.files);
    
    if(!req.files.images || !req.files.imageCover) return next();
    
    req.body.imageCover = `tour-${req.params.id}-${Date.now().toString()}-cover.jpeg`;
    
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${req.body.imageCover}`);
    
    req.body.images = [];
    
    console.log('start Promise');
        
    await Promise.all(
        req.files.images.map( async (file, i) => {        
            const imageName = `tour-${req.params.id}-${Date.now().toString()}-${i+1}.jpeg`;
            console.log(imageName);
            await sharp(req.files.images[i].buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({quality:90})
                .toFile(`public/img/tours/${imageName}`);
            
            req.body.images.push(imageName);
        })
    );
        
    next();
});

// upload.single('image');
// upload.array(5);

exports.aliasTopTours = (req,res,next)=>{
    req.query.limit = '5';
    req.query.sort = 'price';
    req.query.fields = 'name,price,rating';
    next();
};

exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.createTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour,{path:'reviews',select:'-__v'});
exports.getTours = factory.getAll(Tour);

exports.getTourstate = catchAsync(async (req,res,next)=>{
    const states = await Tour.aggregate([
        {
            $match:{
                ratingsAverage:{'$gte':4.0}
            }
        },
        {
            $group:{
                _id:'$difficulty',
                num:{'$sum':1},
                numRated:{'$sum':'$ratingsQuantity'},                    
                avgRating:{'$avg':'$ratingsAverage'},
                avgPrice:{'$avg':'$price'},
                minPrice:{'$min':'$price'},
                maxPrice:{'$max':'$price'},
            }
        },
        // {
        //     $sort:{
        //         avgPrice:1
        //     }
        // },
        // {
        //     $match:{
        //         _id:{'$ne':'difficult'}
        //     }
        // }
    ]);
    res.status(200).json(
        {
            "status":"sucess",              
            "data":{
                states
            }
        }        
    );    
});

exports.getMonthlyplan = catchAsync(async (req,res,next)=>{
  
    const year = req.params.year * 1;
    
    const plan = await Tour.aggregate([
        {
            $unwind:'$startDates'
        },
        {
            $match:{
                startDates:{
                    $gte:new Date(`${year}-01-01`),
                    $lte:new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group:{
                _id:{
                    $month:'$startDates'
                },
                numTourStarts:{
                    $sum:1
                },
                tour:{
                    $push:'$name'
                }
            }
        },
        {
            $addFields:{
                month:'$_id'
            }
        },
        {
            $project:{
                _id:0
            }
        },
        {
            $sort:{
                numTourStarts:-1
            }
        },
        {
            $limit:10
        }
    ]);
    
    res.status(200).json({
        "status":"success",
        "data":{
            plan
        }        
    });      
});

exports.getToursWithIn = catchAsync( async (req,res,next)=>{
    //tours-with-in/distance/233/center/-40,45/unit/mi
    // 34.0206085,-118.7413734
    const {distance,latlng,unit} = req.params;
    console.log(distance,latlng,unit);
    const [lat,lng]= latlng.split(',');
    if(!lat||!lng){
      return next(new AppError('plz provide latitutr and longitude in format lat,lng'),400);        
    }
    const radius = unit === 'mi' ? distance/3963.2:distance/6378.1;
    
    console.log(distance,lat,lng,unit);
    const tours = await Tour.find({
        startLocation:{
            $geoWithin:{
                $centerSphere:[[lng,lat],radius]
            }
        }
        
    })
    
    res.status('200').json({
        status:'sucess',
        results:tours.length,
        data:{
            data:tours
        }
    });
});

exports.getDistances = catchAsync( async (req,res,next)=>{
    //distances/-40,45/unit/mi
    // 34.0206085,-118.7413734
    const {latlng,unit} = req.params;
    const [lat,lng]= latlng.split(',');
    if(!lat||!lng){
      return next(new AppError('plz provide latitutr and longitude in format lat,lng'),400);        
    }
    const multiplier = unit === 'mi' ? 0.000621371: 0.001;    
    const distance = await Tour.aggregate([
        {
            $geoNear:{
                near:{
                    type:'Point',
                    coordinates:[lng*1,lat*1]
                },
                distanceField:'distance',
                distanceMultiplier:multiplier
            }
        },
        {
            $project:{
                // 1顯示 , 0 不顯示
                distance:1,
                name:1,
                // _id:0
            }
        }
        
    ]);   
    
    res.status('200').json({
        status:'sucess',
        data:{
            data:distance
        }
    });
});


// exports.getTours = catchAsync( async (req, res, next)=>{
//     console.log(req.query);

//      // execute query //物件導向重修
//      const features = new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().pagenation();
//      const tours = await features.query;
     
//      res.status(200).json(
//          {
//              "status":"sucess",
//              "results":tours.length,
//              "data":{
//                  tours
//              }
//          }        
//      );
    
//     // try{       
//     //     // // 1.filter
//     //     // const queryObject = {...req.query};
//     //     // const exculdedFields = ['select', 'sort', 'page', 'limit', 'fields'];

//     //     // exculdedFields.forEach(el=>delete queryObject[el]); 
//     //     // // 2. advanced filtering
//     //     // let queryString = JSON.stringify(queryObject);
//     //     // queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

//     //     // let query = Tour.find(JSON.parse(queryString));
//     //     // // 3. sort
//     //     // if(req.query.sort){
//     //     //     let sortBy = req.query.sort.split(',').join(' ');
//     //     //     query = query.sort(sortBy);   
//     //     // }else{
//     //     //     query = query.sort('-createdAt');
//     //     // }
        
//     //     // // 4. fields limit
//     //     // if(req.query.fields){
//     //     //     let fields = req.query.fields.split(',').join(' ');
//     //     //     query = query.select(fields);   
//     //     // }else{
//     //     //     query = query.select('-__v');
//     //     // }
        
//     //     // // 5.pagination
//     //     // // skip掠過幾筆 limit限制幾筆資料
//     //     // const page = req.query.page * 1 || 1;
//     //     // const limit = req.query.limit * 1 || 100;   
//     //     // const skip = limit * (page - 1);
//     //     // query = query.skip(skip);        
//     //     // query = query.limit(limit);
        
//     //     // if(req.query.page){
//     //     //     const numTours =  await query.countDocuments();
//     //     //     if(skip > numTours){
//     //     //         throw new Error('this page not exist!');                
//     //     //     }        
//     //     // } 
        
//     //     // const tours = await Tour.find(query);
        
//     //     // const tours = await Tour.find()
//     //     //    .where('duration')
//     //     //    .equals(5)
//     //     //    .where('difficulty')
//     //     //    .equals('easy');
           
        
       
//     // }catch(err){
//     //     res.status(404).json(
//     //         {
//     //             "status":"fail",
//     //             "message":err.message
//     //         }        
//     //     );
//     // }
// });

// exports.getTour = catchAsync(async (req,res,next)=>{        
//     const id = req.params.id;      
//     const tour = await Tour.findById(id).populate('reviews');
//     // const tour = await Tour.findOne({_id:id});
//     // const tour = await Tour.findById(id).populate({
//     //    path:'guides' ,
//     //    select: '-__v -passwordChangedAt'
//     // })
    
    
//     if(!tour){
//         return next(new AppError('No tours found',404));
//      }
    
//     res.status(200).json({
//         "status":"success",
//         "data":{
//             tour
//         }
//     });        
// });

// exports.createTour = catchAsync( async (req, res, next)=>{       
    
//     const newTour = await Tour.create(req.body);    
        
//     res.status(201).json({
//         "status":"success",
//         "data":{
//             tour : newTour
//         }
//     });    
// })


    // try {
    //     const newTour = await Tour.create(req.body);        
    //     res.status(201).json({
    //         "status":"success",
    //         "data":{
    //             newTour
    //         }
    //     });
    // } catch(err){
    //     res.status(400).json({
    //         "status":"fail",
    //         "message":err.message
    //     })
    // }  

// exports.updateTour = catchAsync(async (req,res,next)=>{  

//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body,{
//         new:true,
//         runValidators:true,           
//     }); 
    
//     if(!tour){
//         return next(new AppError('No tours found',404));
//      }
    
//     res.status(201).json({
//         "status":"success",
//         "data":{
//             tour
//         },       
//     });
// })



// exports.deleteTour = catchAsync(async (req,res,next)=>{  
//     const tour = await Tour.findByIdAndDelete(req.params.id);           
//     if(!tour){     
//         return next(new AppError('No tours found',404));
//      }
    
//     res.status(204).json({
//         "status":"success",
//         "data":null        
//     });
// })

