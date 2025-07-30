const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/action', (req, res) => {
    res.json({
        move: 'UP',
        action: 'COLLECT'
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});