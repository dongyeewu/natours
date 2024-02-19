const express = require('express');
const router = express.Router();
const metrics = require('./../utils/metrics');
router.route('/').get(metrics.metricsM);
module.exports = router;

module.exports = function(){
    d
};