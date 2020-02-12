const express = require('express');
const app = express();
const redis = require('redis');
const redisClient = redis.createClient();
const cache = require('express-redis-cache')();
const axios = require('axios');

// redisClient.on('error', function(error) {
//     console.log('Error Redis: ', error);
// })

app.get('/crash', (req, res) => {
    process.exit(1);    
});

app.get('/list-photos', cache.route({ expire: 100 }), async (req, res, next) => {
    try {
        const key = 'photos';
    
        const photos = await axios.get('https://jsonplaceholder.typicode.com/photos');
        return res.json({
            data: photos.data,
            source: 'api'
        });
    } catch (error) {
        console.error(error.message);
        return res.json({
            success: false,
            message: 'Oops, something went wrong.'
        })
    }
}); 

app.get('/photos', async (req, res, next) => {
    try {
        const key = 'photos';
        redisClient.get(key, async function(err, data) {
            if (err) {
                console.error(err.message);
                return res.json({
                    success: false,
                    message: 'Oops, something went wrong.'
                })
            }
            
            if(data) {
                return res.json({
                    data: JSON.parse(data),
                    source: 'redis'
                })
            }
            const photos = await axios.get('https://jsonplaceholder.typicode.com/photos');
            const expireTime = 100; // seconds
            redisClient.setex(key, expireTime, JSON.stringify(photos.data, null, 2));
            return res.json({
                data: photos.data,
                source: 'api'
            });
        })
    } catch (error) {
        console.error(error.message);
        return res.json({
            success: false,
            message: 'Oops, something went wrong.'
        })
    }
});

app.listen(3000, () => {
    console.log('Server start at port', 3000);
});

