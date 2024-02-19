const AppError = require('../utils/appError.js');

const handleCastErrorDB = err => {   
    const message = `Involid ${err.path} : ${err.value}`;
    return new AppError(message, 400);    
}

const handleDuplicateFieldDB = err => { 
    const value = err.keyValue.name;
    const message = `Duplicate field value entered: ${value}. please use another value`;
    return new AppError(message, 400); 
}

const handleValidationFieldDB = err => { 
    const value = Object.values(err.errors).map(el=>el.message);
    const message = `Invalid input data: ${value.join('; ')}`;
    return new AppError(message, 400); 
}

const handleJsonWebToken = err => {     
    return new AppError('Invailed token. please login again', 401);    
}

const handleTokenExpiredError = err => {
    return new AppError('Your token has expired! Please log in again', 401);    
}

const sendErrorDev = (req, res, err)=>{
    
    if(req.originalUrl.startsWith('/api')){
        res.status(err.statusCode).json({
            status:err.status,
            error:err,
            msg:err.message,
            stack:err.stack
        });       
    }else{
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg : err.message,
        });
    }        
}

const sendErrorProd = (req, res, err)=>{
    console.log(err)
    // API
    if(req.originalUrl.startsWith('/api')){
        // Operational we trust err
        if(err.isOperational){
            res.status(err.statusCode).json({
                status:err.status,
                msg:err.message
            });
        // Programming we don't trust err      
        }else{
            // 1. log
            console.error(err);
            
            // 2. send error to client
            res.status(500).json({
                status:'error',
                msg:'some thing went wrong'
            })
            
        }   
    }
    // WEB
    else{
        // Operational we trust err
        if(err.isOperational){
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong',
                status:err.status,
                msg:err.message
            });           
        // Programming we don't trust err      
        }else{          
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong',                
                msg:'please try again leter'
            });   
        }   
    }
    
}

module.exports = (err,req,res,next)=>{
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(req, res, err);
    }else if(process.env.NODE_ENV === 'product'){
        console.log(err.message)
        // let error = { ...err };
        let error = JSON.parse(JSON.stringify(err));    
        error.message = err.message || 'please try again leter';  
        console.log(error.message)
        if(error.name === 'CastError'){
            error = handleCastErrorDB(error);
        }
        if(error.code === 11000){
            error = handleDuplicateFieldDB(error);
        }        
        if(error.name === 'ValidationError'){
            error = handleValidationFieldDB(error);
        }        
        if(error.name === 'JsonWebTokenError'){
            error = handleJsonWebToken(error);
        }
        if(error.name === 'TokenExpiredError'){
            error = handleTokenExpiredError(error);
        }
        
        
        sendErrorProd(req, res, error);
    }   
}