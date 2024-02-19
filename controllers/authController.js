const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError =  require('./../utils/appError');
// const sendMail =  require('./../utils/email');
const Email = require('./../utils/email');

const signToken = id => jwt.sign({id},process.env.JWT_SECRET,{
    expiresIn:process.env.JWT_EXPIRES_IN
})

const createSendToken = (user,statusCode,res) =>{
    const token = signToken(user._id);   
    
    const cookieOptions ={
        expires : new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),      
        httpOnly: true
    }
    
    if(process.env.NODE_ENV === "product"){
        cookieOptions.secure = true
    }
    
    user.password = undefined;
    
    res.cookie('jwt',token,cookieOptions)
    
    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user:user
        }
    });    
}

exports.signup = catchAsync( async (req,res,next)=>{
    // const newUser = await User.create(req.body);    
    const newUser = await User.create(
        {
            "name":req.body.name,
            "email":req.body.email,
            "passwordChangedAt":req.body.passwordChangedAt,
            //"role":req.body.role,
            "password":req.body.password,
            "passwordConfirm":req.body.passwordConfirm
        }
    )
    
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    
    await new Email(newUser, url).sendWelcome();    
    createSendToken(newUser,201,res);
    
    // const token = signToken(newUser._id);  
    // res.status(201).json({
    //     status:'success',
    //     token,
    //     data:{
    //         user:newUser
    //     }
    // });    
});

exports.login = catchAsync( async (req,res,next) => {
    const {email,password}=req.body;
    
    // 1) check email password
    if(email == null || password == null)
    {
        return next(new AppError('please enter the email and password',400));        
    }
    
    // 2) check correct
    const user = await User.findOne({email:email}).select('+password');  
    if(!user || !(await user.correctPassword(password,user.password)))
    {
        return next(new AppError('error email or password',401))
    }
    // 3) return token    
    createSendToken(user,200,res);
    
    // const token = signToken(user._id);   
    // res.status(200).json({
    //     status:'success',
    //     data:{
    //         token:token
    //     }
    // });
    
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly:true,
    });
    res.status(200).json({
        'status':'success'
    })
}

exports.protect = catchAsync(async (req,res,next)=>{
    console.log('protect');
    // 1) Getting token and check of it's there
    let token ;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }else if (req.cookies.jwt){
        token = req.cookies.jwt;
    }    
    
    if(!token){    
        return next(
            new AppError('your are not logged in! please log in to get access', 401)
        )
    }     
    // 2) Varification token
    const decode =  await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    
    // 3) Check if user still exists
    const freshUser = await User.findById(decode.id);
    if(!freshUser){       
        return next(
            new AppError('The Token belonging to this User is not longer exist', 401)
        )
    }
    // 4)
    if(freshUser.changedPasswordAfter(decode.iat)){
        return next(
            new AppError('User changed the password, please sign in again', 401)
        )        
    }   
    
    // console.log(req)
    
    // grant access to protected route
    req.user = freshUser;
    res.locals.user = freshUser;
    next();
    
});

// only
exports.isLoggedIn = catchAsync(async (req,res,next)=>{
    try{
        if (req.cookies){  
            if(req.cookies.jwt == 'logout'){
                return next();
            }
            if(req.cookies.jwt){
                const decode =  await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
                const currentUser = await User.findById(decode.id);       
                if(!currentUser){       
                    return next();
                }
                if(currentUser.changedPasswordAfter(decode.iat)){
                    return next();  
                }   
                
                // 若是都正確表示有個登入者
                res.locals.user = currentUser;
            }
        }  
    }catch(err){
        
    }
    
    next();    
});

exports.restrictTo =(...roles) =>{
    return (req,res,next) =>{   
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have the permission to do this',403));
        }        
        next();
    }
    
} 

exports.forgetPassword = catchAsync(async(req,res,next)=>{
    // 1) find user by email
    const user = await User.findOne({email:req.body.email});
    if(!user){
        return next(new AppError('There is no user with email',404));
    }
    // 2) generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave:false});
    // 3) send it to email   
    try{     
        const resetUrl = `http://${req.get('host')}/api/v1/users/resetRassword/${resetToken}`;  
        const message = `忘記密碼? 點及下方連結${resetUrl} 重新發送您的密碼，若沒有忘記可以忽略`;
        
        await new Email(user, resetUrl).sendPasswordReset();
        
        // await sendMail({
        //     email:user.email,
        //     subject:'Your password reset token (vaild for 10 min)',
        //     message
            
        // })  
        res.status(200).json({
            status:'success',
            msg: 'Token send to mail success'
        })
    }catch(err){
         user.passwordResetToken = undefined;
         user.passwordResetExpires = undefined;
         await user.save({validateBeforeSave:false});      
         next(new AppError('there was an error to send password reset token, please try again later'),500);
    }   
   
    // next();
});

exports.resetRassword = catchAsync(async(req,res,next)=>{
    // 1)) get user based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    
    const user = await User.findOne({
        passwordResetToken : hashedToken,
        passwordResetExpires :{$gt: Date.now()}
    });

    // 2) if token has not expired, and there is  user , set the password    
    if(!user){
        return next(new AppError('Token is invaild or has expired',400));        
    }    

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // 3) Update changedPasswordAt property for the User// do in the Model
    
    // 4) log the user in send JWT
    createSendToken(user,201,res);    
    
    // const token = signToken(user._id);       
    // res.status(201).json({
    //     status:'success',      
    //     data:{
    //         token:token  ,
    //         user:user
    //     }
    // });    
});

exports.updatePassword = catchAsync( async function(req,res,next){   
    
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
    
    
    // console.log(req.user)

    // // 1) get data   
    // const {id,passwordCurrent,password,passwordConfirm}=req.body;
    // console.log(id)
    // console.log(passwordCurrent)
    // console.log(password)
    // console.log(passwordConfirm)
    // if(id == null || password == null ||passwordConfirm == null)
    // {
    //     return next(new AppError('please enter the id and passwordCurrent and password and passwordConfirm',400));        
    // }
    
    // // 2) check password
    // if(password != passwordConfirm)
    // {
    //     return next(new AppError('password and passwordConfirm are not same',400))
    // }
    
    // const user = await User.findById(id).select('+password');   

    // if(!user || !(await user.correctPassword(passwordCurrent,user.password)))
    // {
    //     return next(new AppError('error id or passwordCurrent',401))
    // }   
    
    // // 3) reset password and give token
    // user.password = password;
    // user.passwordConfirm = passwordConfirm;
    // user.save();    
    
    // createSendToken(user,201,res);   
    // const token = signToken(user._id);   
    // res.status(201).json({
    //     status:'success',      
    //     data:{
    //         token:token  ,
    //         user:user
    //     }
    // });  
}) 