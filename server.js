const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const cors = require('cors');
const BotAI = require('./BotAI');

app.use(express.json());
app.use(cors());

const botAI = new BotAI();
let lastDecision = randomMove();

function randomMove() {
    const moves = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const randomIndex = Math.floor(Math.random() * moves.length);
    return {
        move: moves[randomIndex],
        action: 'COLLECT'
    };
}

app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur de Bot War');
});

app.get('/visualizer', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'front', 'index.html'));
});

app.get('/action', (req, res) => {
    res.json(lastDecision);
});

app.post('/action', (req, res) => {
    try {
        const receivedGrid = req.body.grid;
        
        if (!receivedGrid) {
            lastDecision = randomMove();
            return res.json(lastDecision);
        }
        
        const finalDecision = botAI.makeDecision(receivedGrid);
        lastDecision = finalDecision;
        
        res.json(finalDecision);
        
    } catch (error) {
        console.error('Erreur lors de la prise de décision:', error);
        lastDecision = randomMove();
        res.json(lastDecision);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Bot IA prêt à analyser la vraie grille !');
});