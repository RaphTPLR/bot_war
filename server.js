const express = require('express');
const app = express();
const port = 3000;
const BotAI = require('./BotAI');

app.use(express.json());

const botAI = new BotAI();

app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur de Bot War');
});

app.post('/action', (req, res) => {
    if (req.body.grid === undefined) {
        return res.json({ move: 'STAY', action: 'NONE' });
    }

    try {
        const receivedGrid = req.body.grid;
        console.log(receivedGrid);
        
        if (!receivedGrid) {
            return res.status(400).json({ error: 'Pas de grille reçue' });
        }
        
        const finalDecision = botAI.makeDecision(receivedGrid);
        
        res.json(finalDecision);
        
    } catch (error) {
        console.error('Erreur lors de la prise de décision:', error);
        res.json({ move: 'STAY', action: 'NONE' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Bot IA prêt à analyser la vraie grille !');
});