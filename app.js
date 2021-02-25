const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const redisClient = redis.createClient();
const app = express();

app.use(express.json());

async function checkCache(req, res, next) {
  const { username } = req.params;
  const numberOfRepos = redisClient.get(username, (err, numberOfRepos) => {
    if (err) throw err;

    if (numberOfRepos !== null) {
      console.log('Took value from cache');
      res.json(Number(numberOfRepos));
    } else {
      next();
    }
  });
}

app.get('/repos/:username', checkCache, async (req, res) => {
  const { username } = req.params;

  try {
    const data = await fetch(`https://api.github.com/users/${username}`);
    const response = await data.json();
    // set data to redis with expiry time 3600 seconds
    redisClient.setex(username, 3600, response.public_repos);

    console.log('Took data by calling api');
    res.json(response.public_repos);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(4000, () => console.log('Server is up and running on port 4000'));
