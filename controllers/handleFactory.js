const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');
const APIFeatures = require('../utils/apiFeatures.js');
const metrics = require('../utils/metrics.js');


exports.deleteOne =  Model => catchAsync(async (req,res,next)=>{  
    const doc = await Model.findByIdAndDelete(req.params.id);           
    if(!doc){     
        return next(new AppError('No document found with that id',404));
     }
    
    res.status(204).json({
        "status":"success",
        "data":null        
    });
});

exports.updateOne =  Model => catchAsync(async (req,res,next)=>{  
    
    const metricsLables = {
        operation:'updateOne'
    }
    const timer = metrics.databaseResponseTimeHistory.startTimer();  
    
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body,{
        new:true,
        runValidators:true,           
    }); 
    
    if(!doc){         
        timer({...metricsLables,success:false});
        return next(new AppError('No document found',404));
    }
    timer({...metricsLables,success:true});
     
    res.status(201).json({
        "status":"success",
        "data":{
           data : doc
        },       
    });
});

exports.createOne = Model => catchAsync(async (req,res,next)=>{
   
    const doc = await Model.create(req.body);            
    res.status(201).json({
        "status":"success",
        "data":{
            data : doc
        }
    });    
});

exports.getOne = (Model,popOption) => catchAsync(async (req,res,next)=>{    
 
    let query = Model.findById(req.params.id);
    let successCount = 0;
    let errCount = 0;
    
    const guage = metrics.guage;     
   
    
    const metricsLables = {
        operation:'getOne'
    }
    const timer = metrics.databaseResponseTimeHistory.startTimer();  
    
    if(popOption) query = query.populate(popOption);
    const doc = await query; 
    
    if(!doc){
        errCount ++;
        timer({...metricsLables,success:false});
        guage.set({
            chat_id: 'ERROR'
          }, errCount);
        return next(new AppError('No document found',404));
    }
    successCount ++;
    guage.set({
        chat_id: 'SUCCESS'
      }, successCount);
    timer({...metricsLables,success:true});
    
    res.status(200).json({
        "status":"success",
        "data":{
            doc
        }
    });        
});

exports.getAll = Model =>catchAsync( async (req, res, next)=>{    

    // for review
    let filter = {};
    if(req.params.tourId) filter = {tour : req.params.tourId};
    const features = new APIFeatures(Model.find(filter),req.query).filter().sort().limitFields().pagenation();
    const doc = await features.query;
    // 測試效能用
    // const doc = await features.query.explain();
    
    res.status(200).json(
        {
            "status":"sucess",
            "results":doc.length,
            "data":{
                "data":doc            
            }
        }        
    );   
});