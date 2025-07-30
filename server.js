const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

class BotAI {
    constructor() {
        this.priorities = {
            'has-trophy': 100,
            'has-point': 50,
            'empty': 1,
            'has-bomb': -1000,
            'has-bot': 0
        };
        
        this.directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    }
    
    parseGrid(gridHtml) {
        const grid = {};
        const botPosition = { x: 2, y: 2 };
        
        const cellRegex = /<div class="mini-cell([^"]*)" data-x="(\d+)" data-y="(\d+)"[^>]*>([^<]*)<\/div>/g;
        let match;
        
        while ((match = cellRegex.exec(gridHtml)) !== null) {
            const classes = match[1];
            const x = parseInt(match[2]);
            const y = parseInt(match[3]);
            const content = match[4];
            
            let cellType = 'empty';
            if (classes.includes('has-trophy')) {
                cellType = 'has-trophy';
            }
            else if (classes.includes('has-point')) {
                cellType = 'has-point';
            }
            else if (classes.includes('has-bomb')) {
                cellType = 'has-bomb';
            }
            else if (classes.includes('has-bot')) {
                cellType = 'has-bot';
                botPosition.x = x;
                botPosition.y = y;
            }
            
            if (!grid[y]) {
                grid[y] = {};
            }
            grid[y][x] = {
                type: cellType,
                content: content.trim(),
                x: x,
                y: y
            };
        }
        
        return { grid: grid, botPosition: botPosition };
    }
    
    analyzeEnvironment(grid, botPosition) {
        const adjacentCells = {};
        
        const moves = {
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 },
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 }
        };
        
        for (let i = 0; i < this.directions.length; i++) {
            const direction = this.directions[i];
            const move = moves[direction];
            
            const newX = botPosition.x + move.x;
            const newY = botPosition.y + move.y;
            
            // On vérifie si cette nouvelle position existe dans la grille
            if (grid[newY] && grid[newY][newX]) {
                adjacentCells[direction] = grid[newY][newX];
            } else {
                adjacentCells[direction] = {
                    type: 'out-of-bounds',
                    content: '🚫',
                    x: newX,
                    y: newY
                };
            }
        }
        
        const directionKeys = Object.keys(adjacentCells);
        for (let i = 0; i < directionKeys.length; i++) {
            const direction = directionKeys[i];
            const cell = adjacentCells[direction];
            console.log(`  ${direction}: ${cell.type} ${cell.content} à la position (${cell.x}, ${cell.y})`);
        }
        
        return adjacentCells;
    }
    
    evaluateMove(direction, cell) {
        let baseScore = this.priorities[cell.type];
        if (baseScore === undefined) {
            baseScore = 0;
        }
        
        if (cell.type === 'out-of-bounds') {
            baseScore = -500;
        }
        
        // Variation aléatoire pour éviter que le bot reste bloqué, évite UP -> DOWN -> UP -> DOWN à l'infini
        const randomVariation = (Math.random() - 0.5) * 2;
        const finalScore = baseScore + randomVariation;
        
        return finalScore;
    }
    
    determineAction(cell) {
        switch (cell.type) {
            case 'has-point':
            case 'has-trophy':
                return 'COLLECT';
            case 'has-bomb':
            case 'out-of-bounds': 
                return 'NONE';
            default:
                return 'NONE';
        }
    }
    
    makeDecision(gridHtml) {
        console.log('Le bot commence à réfléchir...');
        
        const parseResult = this.parseGrid(gridHtml);
        const grid = parseResult.grid;
        const botPosition = parseResult.botPosition;
        
        const environment = this.analyzeEnvironment(grid, botPosition);
        
        const allPossibleMoves = [];
        
        for (let i = 0; i < this.directions.length; i++) {
            const direction = this.directions[i];
            const cell = environment[direction];
            const score = this.evaluateMove(direction, cell);
            const action = this.determineAction(cell);
            
            allPossibleMoves.push({
                direction: direction,
                cell: cell,
                score: score,
                action: action
            });
        }
        
        allPossibleMoves.sort(function(moveA, moveB) {
            return moveB.score - moveA.score;
        });
        
        // Debug
        console.log('Voici tous les mouvements possibles (du meilleur au pire):');
        for (let i = 0; i < allPossibleMoves.length; i++) {
            const move = allPossibleMoves[i];
            const roundedScore = move.score.toFixed(1);
            console.log(`  ${move.direction}: ${move.cell.type} ${move.cell.content} (${roundedScore} points) -> ${move.action}`);
        }
        
        const bestMove = allPossibleMoves[0];
        console.log(`Décision finale: aller vers ${bestMove.direction} et faire ${bestMove.action}`);
        console.log('---');
        
        return {
            move: bestMove.direction,
            action: bestMove.action
        };
    }
}

const botAI = new BotAI();

app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur de Bot War');
});

app.get('/visualizer', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/action', (req, res) => {
    try {
        const receivedGrid = req.body.grid;
        
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
    console.log('🤖 Bot IA prêt à analyser la vraie grille !');
});