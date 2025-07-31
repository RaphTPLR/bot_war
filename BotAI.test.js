const BotAI = require('./BotAI');

describe('BotAI', () => {
    let bot;

    beforeEach(() => {
        bot = new BotAI();
    });

    describe('Constructor', () => {
        test('should initialize with correct priorities', () => {
            expect(bot.priorities['has-trophy']).toBe(100);
            expect(bot.priorities['has-point']).toBe(50);
            expect(bot.priorities['empty']).toBe(1);
            expect(bot.priorities['has-bomb']).toBe(-1000);
            expect(bot.priorities['has-bot']).toBe(0);
        });

        test('should initialize with correct directions', () => {
            expect(bot.directions).toEqual(['UP', 'DOWN', 'LEFT', 'RIGHT']);
        });
    });

    describe('parseGrid', () => {
        test('should parse basic grid with bot', () => {
            const gridHtml = '<div class="mini-cell has-bot" data-x="2" data-y="2">🤖</div>';
            const result = bot.parseGrid(gridHtml);
            
            expect(result.botPosition).toEqual({ x: 2, y: 2 });
            expect(result.grid[2][2]).toEqual({
                type: 'has-bot',
                content: '🤖',
                x: 2,
                y: 2
            });
        });

        test('should parse grid with multiple cell types', () => {
            const gridHtml = `
                <div class="mini-cell has-bot" data-x="2" data-y="2">🤖</div>
                <div class="mini-cell has-trophy" data-x="3" data-y="2">🏆</div>
                <div class="mini-cell has-point" data-x="1" data-y="2">⭐</div>
                <div class="mini-cell has-bomb" data-x="2" data-y="1">💣</div>
                <div class="mini-cell empty" data-x="2" data-y="3"></div>
            `;
            const result = bot.parseGrid(gridHtml);
            
            expect(result.grid[2][2].type).toBe('has-bot');
            expect(result.grid[2][3].type).toBe('has-trophy');
            expect(result.grid[2][1].type).toBe('has-point');
            expect(result.grid[1][2].type).toBe('has-bomb');
            expect(result.grid[3][2].type).toBe('empty');
        });
    });

    describe('evaluateMove', () => {
        test('should return high score for trophy', () => {
            const cell = { type: 'has-trophy' };
            const score = bot.evaluateMove('RIGHT', cell);
            expect(score).toBeGreaterThan(99);
        });

        test('should return negative score for bomb', () => {
            const cell = { type: 'has-bomb' };
            const score = bot.evaluateMove('LEFT', cell);
            expect(score).toBeLessThan(-999);
        });

        test('should return very negative score for out-of-bounds', () => {
            const cell = { type: 'out-of-bounds' };
            const score = bot.evaluateMove('UP', cell);
            expect(score).toBeLessThan(-499);
        });
    });

    describe('determineAction', () => {
        test('should return COLLECT for trophy', () => {
            const cell = { type: 'has-trophy' };
            expect(bot.determineAction(cell)).toBe('COLLECT');
        });

        test('should return COLLECT for point', () => {
            const cell = { type: 'has-point' };
            expect(bot.determineAction(cell)).toBe('COLLECT');
        });

        test('should return NONE for bomb', () => {
            const cell = { type: 'has-bomb' };
            expect(bot.determineAction(cell)).toBe('NONE');
        });

        test('should return NONE for empty cell', () => {
            const cell = { type: 'empty' };
            expect(bot.determineAction(cell)).toBe('NONE');
        });

        test('should return NONE for out-of-bounds', () => {
            const cell = { type: 'out-of-bounds' };
            expect(bot.determineAction(cell)).toBe('NONE');
        });
    });

    describe('makeDecision', () => {
        test('should prefer trophy over point', () => {
            const gridHtml = `
                <div class="mini-cell has-point" data-x="2" data-y="1">⭐</div>
                <div class="mini-cell has-bot" data-x="2" data-y="2">🤖</div>
                <div class="mini-cell has-trophy" data-x="3" data-y="2">🏆</div>
                <div class="mini-cell empty" data-x="1" data-y="2"></div>
                <div class="mini-cell empty" data-x="2" data-y="3"></div>
            `;
            
            const decision = bot.makeDecision(gridHtml);
            expect(decision.move).toBe('RIGHT');
            expect(decision.action).toBe('COLLECT');
        });

        test('should avoid bombs', () => {
            const gridHtml = `
                <div class="mini-cell empty" data-x="2" data-y="1"></div>
                <div class="mini-cell has-bomb" data-x="1" data-y="2">💣</div>
                <div class="mini-cell has-bot" data-x="2" data-y="2">🤖</div>
                <div class="mini-cell has-point" data-x="3" data-y="2">⭐</div>
                <div class="mini-cell has-bomb" data-x="2" data-y="3">💣</div>
            `;
            
            const decision = bot.makeDecision(gridHtml);
            expect(decision.move).toBe('RIGHT');
            expect(decision.action).toBe('COLLECT');
        });

        test('should return valid move and action format', () => {
            const gridHtml = '<div class="mini-cell has-bot" data-x="2" data-y="2">🤖</div>';
            
            const decision = bot.makeDecision(gridHtml);
            expect(decision).toHaveProperty('move');
            expect(decision).toHaveProperty('action');
            expect(['UP', 'DOWN', 'LEFT', 'RIGHT']).toContain(decision.move);
            expect(['COLLECT', 'ATTACK', 'NONE']).toContain(decision.action);
        });
    });
}); 