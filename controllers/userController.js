const User = require('../models/userModel.js');
const multer = require('multer');
const sharp = require('sharp');
const APIFeatures = require('../utils/apiFeatures.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const factory =require('./handleFactory.js');


// const multerstorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, 'public/img/users')
//     },
//     filename: function (req, file, cb) {
//       console.log('storage')
//       const ext = file.mimetype.split('/')[1];
//     //   const uniqueSuffix =  + '-' + Math.round(Math.random() * 1E9)
//       cb(null, `user-${req.user.id}-${Date.now().toString()}.${ext}`)
//     }
// })

const multerstorage = multer.memoryStorage();

const multerFilter = (req, file , cb) => {
    console.log('multerFilter')
    if (file.mimetype.startsWith('image')){
        cb(null, true);
    }else{
        cb(new AppError('Not an image ! plz upload only images', 400), false)
    }
} 

const upload = multer({
    storage: multerstorage,
    fileFilter: multerFilter,
});

const filterObject = (obj,...allowedFields) =>{
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)){
            newObj[el] = obj[el];
        }
    });
    return newObj;
}

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync( async (req, res, next) => {
    if (!req.file) {
       next(); 
    }
    
    req.file.filename =  `user-${req.user.id}-${Date.now().toString()}.jpeg`;
    
    await sharp(req.file.buffer)
        .resize(500,500)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/users/${req.file.filename}`);
    
    next();
});

exports.getMe = (req,res,next)=>{
    req.params.id = req.user.id;
    next();
}

exports.checkID =(req,res,next,val)=>{
    if(req.params.id * 1 > tours.length){
        return res.status(404).json({
            status:'false',
            msg:'invail ID'
        });        
    }
    next();
}

exports.updateMe = catchAsync( async (req,res,next)=>{
    console.log('updateMe')
    console.log(req.file);
    console.log(req.body);
    
    if (req.body.passWord || req.body.passWordComfirm) {
        return next(new AppError('this route is not for password update ,please use /updatePassword'));
    }
    
    const filteredBody = filterObject(req.body,'name','email');    
    
    if (req.file) {
        filteredBody.photo = req.file.filename;
    } 
    
    const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody,{
        new:true,
        runValidators:true
    });  
    
    res.status(200).json({
        status:"success",
        data:{
            user:updatedUser
        },       
    });
})

exports.deleteMe = catchAsync( async (req,res,next)=>{      
    
    const updatedUser = await User.findByIdAndUpdate(req.user.id,{"active":false},{
        new:true,
        runValidators:true
    });
        
    res.status(204).json({
        status:"success",
        data:null   
    });
});

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getUser = factory.getOne(User);
exports.getUsers = factory.getAll(User);

// exports.getUsers = catchAsync( async (req,res,next)=>{
//     const features = new APIFeatures(User.find(),req.query);
//     const users = await features.query;
     
//      res.status(200).json(
//          {
//              "status":"sucess",
//              "results":users.length,
//              "data":{
//                 users
//              }
//          }        
//      );
// });

// exports.createUser =(req,res)=>{
//     res.status(500).json({
//         "status":"fail",
//         "data": null
//     });
// }

// exports.getUser =(req,res)=>{
//     res.status(500).json({
//         "status":"fail",
//         "data": null
//     });
// }

// exports.updateUser =(req,res)=>{
//     res.status(500).json({
//         "status":"fail",
//         "data": null
//     });
// }
