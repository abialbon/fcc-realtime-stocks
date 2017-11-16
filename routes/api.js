const express= require('express');
const router = express.Router();
const request= require('superagent');

router.get('/:symbol', (req, res) => {
    let url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${req.params.symbol}&apikey=${process.env.ALPHA_KEY}`;
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