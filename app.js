const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Mount backend routes
const backend = require('./src/backend');
app.use('/', backend);

app.listen(port, () => {
  console.log(`Game running at http://localhost:${port}`);
});