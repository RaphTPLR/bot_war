const express = require('express');
const app = express();
const port = 3000;
const BotAI = require('./BotAI');

app.use(express.json());

const botAI = new BotAI();
let lastDecision = { move: 'STAY', action: 'NONE' };

app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur de Bot War');
});

app.get('/action', (req, res) => {
    res.json(lastDecision);
});

app.post('/action', (req, res) => {
    if (!req.body || req.body.grid === undefined) {
        lastDecision = { move: 'STAY', action: 'NONE' };
        return res.json(lastDecision);
    }

    try {
        const receivedGrid = req.body.grid;
        console.log(receivedGrid);
        
        if (!receivedGrid) {
            return res.status(400).json({ error: 'Pas de grille reçue' });
        }
        
        const finalDecision = botAI.makeDecision(receivedGrid);
        lastDecision = finalDecision;
        
        res.json(finalDecision);
        
    } catch (error) {
        console.error('Erreur lors de la prise de décision:', error);
        lastDecision = { move: 'STAY', action: 'NONE' };
        res.json(lastDecision);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Bot IA prêt à analyser la vraie grille !');
});