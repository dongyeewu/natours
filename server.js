const mongoose = require('mongoose');
const dotenv =require('dotenv');

// not for async
process.on('uncaughtException',err=>{
    // console.log(err.name,err.message);
    // console.log('uncaughtException');
    process.exit(1); 
});

dotenv.config({path:'./config.env'});
const app = require('./app.js');
const port = process.env.PORT ||8000;

const db = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)
// console.log(process.env);
mongoose.connect(db,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,   
    useUnifiedTopology: true
}).then(con=>{
    console.log('Connected to Database');
    // console.log(con.connections);
});

// const testTour = new Tour({
//     name:'dessert',
//     price:500
    
// });

// testTour.save().then((doc)=>{
//     console.log(doc);
// }).catch(err=>{
//     console.log("err message:",err);
// });

const server = app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
});

process.on('unhandledRejection',err => {
    console.log(err.name,err.message);
    console.log('unhandledRejection');
    server.close(()=>{
        process.exit(1);
    });   
})