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
    fetchGridAndDecide()
        .then(decision => {
            lastDecision = decision;
            res.json(decision);
        })
        .catch(error => {
            console.error('Erreur lors de la récupération de la grille:', error);
            lastDecision = randomMove();
            res.json(lastDecision);
        });
});

async function fetchGridAndDecide() {
    try {
        console.log('Récupération de la grille depuis https://bot.gogokodo.com/...');
        
        const response = await fetch('https://bot.gogokodo.com/');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        console.log('Grille récupérée avec succès');
        
        const decision = botAI.makeDecision(html);
        
        return decision;
        
    } catch (error) {
        console.error('Erreur lors de la récupération:', error.message);
        throw error;
    }
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Bot IA prêt à analyser la vraie grille !');
});