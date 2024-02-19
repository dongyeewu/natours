// const express = require('express');
const client = require('prom-client');
const catchAsync = require('./../utils/catchAsync');
// const metricsApp = express();

const restResponseTimeHistory = new client.Histogram({
    name:'rest_response_time_duration_seconds',
    help:'Rest Api response time in seconds',
    labelNames: ['method','route','status'],
    buckets: [0.001, 0.005, 0.01 , 0.015, 0.05,0.01, 0.5, 1, 2 , 10]
});

const databaseResponseTimeHistory = new client.Histogram({
    name:'db_response_time_duration_seconds',
    help:'Database response time in seconds',
    labelNames: ['operation','success']
});

const guage = new client.Gauge({
    name: 'chatRoomCount',
    help: 'The metric provide the count of chatroom`s people',
    labelNames: ['chat_id']
  });

const startMetricsServer = fn => {
    
    console.log("startMetricsServer");
    const collectDefaultMetrics = client.collectDefaultMetrics;
    
    collectDefaultMetrics({ gcDurationBuckets: [0.01, 0.05, 0.1, 0.5, 1, 2] });
    // collectDefaultMetrics();
    
    // metricsApp.get('/metricsM',async(req,res)=>{
    //     res.set("Content-Type", client.register.contentType);
    //     return res.send(await client.register.metrics());
    // });
    // metricsApp.listen(8100,()=>{
    //     console.log('MetricsServer start at port 8100')
    // });
}

exports.metricsM = catchAsync(async(req, res)=>{
    res.set("Content-Type", client.register.contentType);
    return res.send(await client.register.metrics());
});

exports.startMetricsServer = startMetricsServer;
exports.restResponseTimeHistory = restResponseTimeHistory;
exports.databaseResponseTimeHistory = databaseResponseTimeHistory;
exports.guage = guage;
