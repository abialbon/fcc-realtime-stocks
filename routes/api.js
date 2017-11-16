const express= require('express');
const router = express.Router();
const request= require('superagent');

// Cached DATA
const AAPL = require('../data/AAPL.json');
const GE = require('../data/GE.json');
const GOOGL = require('../data/GOOGL.json');
const MSFT = require('../data/MSFT.json');

// Cached test api
router.get('/test/:symbol', (req, res) => {
    switch (req.params.symbol) {
        case('AAPL'):
            res.send(formatData(AAPL));
            break;
        case('GE'):
            res.send(formatData(GE));
            break;
        case('GOOGL'):
            res.send(formatData(GOOGL));
            break;
        case('MSFT'):
            res.send(formatData(MSFT));
            break;
    }
});

router.get('/:symbol', (req, res) => {
    let url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${req.params.symbol}&apikey=${process.env.APLHA_KEY}`;
    request
        .get(url)
        .end((err, data) => {
            if (err) {
                res.send({ error: true });
                return;
            }
            if (!data.body) {
                res.send({ error: true });
                return;
            }
            res.send(formatData(data.body));
        })
});

function formatData(data) {
    return Object.keys(data['Time Series (Daily)']).map(x => {
        return {
            date: x,
            close: data['Time Series (Daily)'][x]['4. close']
        }
    });
}

module.exports = router;