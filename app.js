const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitizer = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// const promMid = require('express-prometheus-middleware');

const appError = require('./utils/appError');
const errorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const responseTime = require('response-time');
const cookieParser = require('cookie-parser');

const metricRouter = require('./routes/metricRoutes');
const metrics = require('./utils/metrics.js');

// const restResponseTimeHistory = require('./utils/metrics.js');
// const databaseResponseTimeHistory = require('./utils/metrics.js');

// const restResponseTimeHistory = new client.Histogram({
//     name:'rest_response_time_duration_seconds',
//     help:'Rest Api response time in seconds',
//     labelName: ['method','route','status']
// });

// const databaseResponseTimeHistory = new client.Histogram({
//     name:'db_response_time_duration_seconds',
//     help:'Database response time in seconds',
//     labelName: ['operation','success']
// });

const app = express();

app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,'public')));

// app.use(helmet(
//     {
//         contentSecurityPolicy: {
//           directives: {
//             scriptSrc: ["'self'", "https://js.stripe.com"],
//             defaultSrc: ["'self'"],
//             connectSrc: ["'self'", 'http://127.0.0.1:8000', 'ws://127.0.0.1:54658/']
//           }
//         },
//     }
// ))

// middleware
app.use(express.json());
console.log(process.env.NODE_ENV);
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// app.use(promMid({
//     metricsPath: '/metrics',
//     collectDefaultMetrics: true,
//     requestDurationBuckets: [0.1, 0.5, 1, 1.5,2],
//     requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
//     responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
//     /**
//      * Uncomenting the `authenticate` callback will make the `metricsPath` route
//      * require authentication. This authentication callback can make a simple
//      * basic auth test, or even query a remote server to validate access.
//      * To access /metrics you could do:
//      * curl -X GET user:password@localhost:9091/metrics
//      */
//     // authenticate: req => req.headers.authorization === 'Basic dXNlcjpwYXNzd29yZA==',
//     /**
//      * Uncommenting the `extraMasks` config will use the list of regexes to
//      * reformat URL path names and replace the values found with a placeholder value
//     */
//     // extraMasks: [/..:..:..:..:..:../],
//     /**
//      * The prefix option will cause all metrics to have the given prefix.
//      * E.g.: `app_prefix_http_requests_total`
//      */
//     // prefix: 'app_prefix_',
//     /**
//      * Can add custom labels with customLabels and transformLabels options
//      */
//     // customLabels: ['contentType'],
//     // transformLabels(labels, req) {
//     //   // eslint-disable-next-line no-param-reassign
//     //   labels.contentType = req.headers['content-type'];
//     // },
//   }));

const limiter = rateLimit({
    max:100,
    windowMs: 60*60*1000,
    message:"too many request from this IP , plz try again one hour later"
});

app.use('/api',limiter);

app.use(express.json({limit:'10kb'}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());


app.use(mongoSanitizer());
app.use(xss());
app.use(hpp({
    whitelist:['duration',
               'ratingsQuantity',
               'ratingsAverage',
               'maxGroupSize',
               'difficulty',
               'price']
}));

app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    // 測試cookie 來的
    // console.log('cookies')
    // console.log(req.cookies);
    next();
});



//middle 會執行在任何rouate 之前
app.use((req,res,next)=>{
    console.log('go pass middle');
    next();
});

app.use((req,res,next)=>{
    req.requestTime1 = new Date().toISOString();
    next();
});

// app.use((req,res,next)=>{
//     console.log('passing');
//     next();    
// });

app.use((err,req,res,next)=>{
    console.log('passing err');
    next(err);    
});

app.use(responseTime((req,res,time)=>{  
    if(req?.route?.path){
        metrics.restResponseTimeHistory.observe({
            method:req.method,
            route:req.route.path,
            status:res.statusCode
        },time / 1000);
    }
}));



app.use('/',viewRouter);
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);
app.use('/api/v1/metric',metricRouter);
app.use('/api/v1/booking',bookingRouter);


app.all('*',(req,res,next)=>{
    
    // const error = new Error(`Can't find ${req.originalUrl}`);
    // error.status = 'fail';
    // error.statusCode = 404;
    // res.status(404).json({
    //     status:'fail',
    //     message:`Can't find ${req.originalUrl}`
    // });
    //會直接網友接收參數的middleware前進 若是
    // next(error);
    
    next(new appError(`Can't find ${req.originalUrl}`,404));
});



app.use(errorHandler);




try{
    metrics.startMetricsServer();
}catch(err){
    console.log('err');
    console.log(err);
}


app.get('/hello', (req, res) => {
    console.log('GET /hello');
    const { name = 'Anon' } = req.query;
    res.json({ message: `Hello, ${name}!` });
});

// app.listen(8100, () => {
//     console.log(`Example api is listening on http://localhost:${PORT}`);
//   });
// app.use((err,req,res,next)=>{
//     console.log('hrer')
//     err.statusCode = err.statusCode || 500;
//     err.status = err.status || 'error';
//     res.status(err.statusCode).json({
//         status:err.status,
//         message:err.message
//     });
// });




// app.get('/api/v1/tours',getTours);

// app.get('/api/v1/tours/:id',getTour);

// app.post('/api/v1/tours',createTour);

// app.patch('/api/v1/tours/:id',updateTour);

// app.delete('/api/v1/tours/:id',deleteTour);

// Rouater


// route






   
// app.get('/',(req,res)=>{
//     res.status(200).json({message:'get from the server side',app:'Natours'});
// });

// app.post('/',(req,res)=>{
//     res.status(200).json({message:'post from the server side',app:'Natours'});
// });

module.exports = app;