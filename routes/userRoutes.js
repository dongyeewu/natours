
const express = require('express');
const userRouter = express.Router();
const userController =require('./../controllers/userController.js');
const authController =require('./../controllers/authController.js');
const reviewController = require('./../controllers/reviewController.js');

// const upload = multer({dest: 'public/img/users'})

userRouter.route('/signup')
   .post(authController.signup);
userRouter.route('/login')
   .post(authController.login);
userRouter.route('/logout')
   .get(authController.logout);
   
userRouter.route('/forgetPassword')
   .post(authController.forgetPassword);
userRouter.route('/resetRassword/:token')
   .patch(authController.resetRassword);
   
// 建立使用者保護確認身分  
userRouter.use(authController.protect);  

userRouter.get('/me',userController.getMe,userController.getUser);  
userRouter.patch(
   '/updateMe',   
   userController.uploadUserPhoto,
   userController.resizeUserPhoto,
   userController.updateMe);
userRouter.delete('/deleteMe',userController.deleteMe);
userRouter.route('/updatePassword').patch(authController.updatePassword); 



   
userRouter.route('/:tourId/reviews')
.post(authController.restrictTo('users'),reviewController.createReview);

//只有管理者可以使用
userRouter.use(authController.restrictTo('admin'));

userRouter.route('/')
.get(userController.getUsers)
// .post(userController.createUser)

userRouter.route('/:id')
.get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser);


module.exports = userRouter;