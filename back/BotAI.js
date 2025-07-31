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
    
    findAllPaths(grid, startPosition, maxDepth = 5) {
        const allPaths = [];
        
        for (let depth = 1; depth <= maxDepth; depth++) {
            console.log(`Exploration des chemins de profondeur ${depth}...`);
            const pathsAtDepth = this.findPathsAtDepth(grid, startPosition, depth);
            allPaths.push(...pathsAtDepth);
        }
        
        console.log(`Total de ${allPaths.length} chemins trouvés`);
        return allPaths;
    }
    
    findPathsAtDepth(grid, startPosition, targetDepth) {
        const paths = [];
        const queue = [{ position: startPosition, path: [] }];
        const moves = {
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 },
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 }
        };
        
        while (queue.length > 0) {
            const current = queue.shift();
            const pos = current.position;
            const path = current.path;
            
            if (path.length === targetDepth) {
                if (grid[pos.y] && grid[pos.y][pos.x]) {
                    const cell = grid[pos.y][pos.x];
                    if (cell.type === 'has-point' || cell.type === 'has-trophy') {
                        paths.push({
                            target: { x: pos.x, y: pos.y, type: cell.type, value: this.priorities[cell.type] },
                            path: path,
                            length: path.length,
                            totalValue: this.priorities[cell.type],
                            firstMove: path[0]
                        });
                    }
                }
                continue;
            }
            
            if (path.length < targetDepth) {
                for (let direction of this.directions) {
                    const move = moves[direction];
                    const newX = pos.x + move.x;
                    const newY = pos.y + move.y;
                    
                    if (grid[newY] && grid[newY][newX]) {
                        const cell = grid[newY][newX];
                        if (cell.type !== 'has-bomb' && cell.type !== 'has-bot') {
                            queue.push({
                                position: { x: newX, y: newY },
                                path: [...path, direction]
                            });
                        }
                    }
                }
            }
        }
        
        return paths;
    }
    
    getSafeDirections(grid, botPosition) {
        const safeDirections = [];
        const moves = {
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 },
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 }
        };
        
        for (let direction of this.directions) {
            const move = moves[direction];
            const newX = botPosition.x + move.x;
            const newY = botPosition.y + move.y;
            
            if (grid[newY] && grid[newY][newX]) {
                const cell = grid[newY][newX];
                
                if (cell.type !== 'has-bomb' && cell.type !== 'has-bot') {
                    safeDirections.push(direction);
                    console.log(`  ${direction}: ${cell.type} ${cell.content} -> SAFE`);
                } else {
                    console.log(`  ${direction}: ${cell.type} ${cell.content} -> DANGER`);
                }
            } else {
                console.log(`  ${direction}: out-of-bounds -> DANGER`);
            }
        }
        
        return safeDirections;
    }

    
    makeDecision(gridHtml) {
        console.log('Le bot commence à réfléchir...');
        
        const parseResult = this.parseGrid(gridHtml);
        const grid = parseResult.grid;
        const botPosition = parseResult.botPosition;
        
        const paths = this.findAllPaths(grid, botPosition, 5);
        
        if (paths.length > 0) {
            paths.sort((a, b) => {
                if (a.target.type !== b.target.type) {
                    return b.totalValue - a.totalValue;
                }
                return a.length - b.length;
            });
            
            console.log('Chemins trouvés (du meilleur au pire):');
            for (let i = 0; i < Math.min(paths.length, 10); i++) {
                const path = paths[i];
                console.log(`  ${path.target.type} en ${path.length} coups: ${path.path.join(' -> ')} (valeur: ${path.totalValue})`);
            }
            
            const bestPath = paths[0];
            const firstMove = bestPath.firstMove;
            
            const moves = {
                UP: { x: 0, y: -1 },
                DOWN: { x: 0, y: 1 },
                LEFT: { x: -1, y: 0 },
                RIGHT: { x: 1, y: 0 }
            };
            
            const move = moves[firstMove];
            const newX = botPosition.x + move.x;
            const newY = botPosition.y + move.y;
            const targetCell = grid[newY] && grid[newY][newX] ? grid[newY][newX] : null;
            
            let action = 'NONE';
            if (targetCell && (targetCell.type === 'has-point' || targetCell.type === 'has-trophy')) {
                action = 'COLLECT';
            }
            
            console.log(`Décision finale: suivre le chemin vers ${bestPath.target.type} -> premier mouvement: ${firstMove} avec action: ${action}`);
            console.log('---');
            
            return {
                move: firstMove,
                action: action
            };
        }
        
        console.log('Aucun chemin vers une cible trouvé, analyse des directions sûres...');
        const safeDirections = this.getSafeDirections(grid, botPosition);
        
        if (safeDirections.length > 0) {
            const randomDirection = safeDirections[Math.floor(Math.random() * safeDirections.length)];
            console.log(`Directions sûres: [${safeDirections.join(', ')}] -> Choix: ${randomDirection}`);
            return {
                move: randomDirection,
                action: 'COLLECT'
            };
        } else {
            console.log('Aucune direction sûre trouvée, rester immobile...');
            return {
                move: 'STAY',
                action: 'NONE'
            };
        }
    }
}

module.exports = BotAI;