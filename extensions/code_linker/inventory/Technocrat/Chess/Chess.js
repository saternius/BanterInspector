// Chess UI Extension
// Creates a draggable chess board window with interactive pieces

class ChessGame {
    constructor(ctx) {
        this.popup = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.ctx = ctx;

        // Chess game state
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];

        // Store original colors of 3D squares for restoration
        this.originalColors = {};

        // 3D piece management - 8x8 array storing entity UUIDs of 3D pieces
        // pieces3D[row][col] = entity UUID or null
        this.pieces3D = Array(8).fill(null).map(() => Array(8).fill(null));

        // Track captured pieces for organized positioning
        this.capturedWhitePieces = [];
        this.capturedBlackPieces = [];

        // Chess piece Unicode symbols
        this.pieces = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };
    }

    initializeBoard() {
        // Standard chess starting position
        const board = [];

        // Black pieces (top)
        board[0] = [
            { type: 'rook', color: 'black' },
            { type: 'knight', color: 'black' },
            { type: 'bishop', color: 'black' },
            { type: 'queen', color: 'black' },
            { type: 'king', color: 'black' },
            { type: 'bishop', color: 'black' },
            { type: 'knight', color: 'black' },
            { type: 'rook', color: 'black' }
        ];

        // Black pawns
        board[1] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' }));

        // Empty squares
        for (let i = 2; i < 6; i++) {
            board[i] = Array(8).fill(null);
        }

        // White pawns
        board[6] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' }));

        // White pieces (bottom)
        board[7] = [
            { type: 'rook', color: 'white' },
            { type: 'knight', color: 'white' },
            { type: 'bishop', color: 'white' },
            { type: 'queen', color: 'white' },
            { type: 'king', color: 'white' },
            { type: 'bishop', color: 'white' },
            { type: 'knight', color: 'white' },
            { type: 'rook', color: 'white' }
        ];

        return board;
    }

    async init() {
        this.createPopup();
        this.injectStyles();
        this.renderBoard();
        // Initialize 3D pieces and position them on the board
        await this.initialize3DPieces();
        return this.popup;
    }

    createPopup() {
        // Remove any existing popup first (singleton pattern)
        const existingPopup = document.getElementById('chess-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Also remove any orphaned child elements with IDs
        const orphanedBoard = document.getElementById('chess-board');
        if (orphanedBoard) {
            orphanedBoard.remove();
        }

        const orphanedMoveList = document.getElementById('move-list');
        if (orphanedMoveList) {
            orphanedMoveList.remove();
        }

        // Create popup container
        this.popup = document.createElement('div');
        this.popup.id = 'chess-popup';
        this.popup.className = 'chess-popup';
        this.popup.innerHTML = `
            <div class="chess-header">
                <span class="chess-title">♔ ${this.ctx._entity.name} Chess ♚</span>
                <button class="chess-close" title="Close">&times;</button>
            </div>
            <div class="chess-content">
                <div class="chess-game-area">
                    <div class="chess-board-container">
                        <div id="chess-board" class="chess-board"></div>
                    </div>
                    <div class="chess-info-panel">
                        <div class="chess-current-player">
                            <h3>Current Turn</h3>
                            <div class="player-indicator ${this.currentPlayer}">
                                <span class="player-piece">${this.currentPlayer === 'white' ? '♔' : '♚'}</span>
                                <span class="player-name">${this.currentPlayer.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="chess-controls">
                            <button class="chess-btn reset-btn">New Game</button>
                            <button class="chess-btn flip-btn">Flip Board</button>
                        </div>
                        <div class="chess-move-history">
                            <h3>Move History</h3>
                            <div id="move-list" class="move-list"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Position popup in center of screen initially
        this.popup.style.left = '50%';
        this.popup.style.top = '50%';
        this.popup.style.transform = 'translate(-50%, -50%)';

        // Add to document body
        document.body.appendChild(this.popup);

        // Set up event listeners
        this.setupEventListeners();
    }

    renderBoard() {
        const boardElement = this.popup ? this.popup.querySelector('#chess-board') : null;
        if (!boardElement) return;

        boardElement.innerHTML = '';

        // Create 64 squares
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                const isLight = (row + col) % 2 === 0;
                square.className = `chess-square ${isLight ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                // Add coordinate labels
                if (col === 0) {
                    const rankLabel = document.createElement('span');
                    rankLabel.className = 'rank-label';
                    rankLabel.textContent = 8 - row;
                    square.appendChild(rankLabel);
                }

                if (row === 7) {
                    const fileLabel = document.createElement('span');
                    fileLabel.className = 'file-label';
                    fileLabel.textContent = String.fromCharCode(97 + col); // a-h
                    square.appendChild(fileLabel);
                }

                // Add piece if present
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `chess-piece ${piece.color}`;
                    pieceElement.textContent = this.pieces[piece.color][piece.type];
                    square.appendChild(pieceElement);
                }

                // Add click handler
                square.addEventListener('click', (e) => this.handleSquareClick(row, col));

                boardElement.appendChild(square);
            }
        }
    }

    async handleSquareClick(row, col) {
        const clickedPiece = this.board[row][col];

        if (this.selectedSquare === null) {
            // No piece selected - try to select a piece
            if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                this.selectedSquare = { row, col };
                await this.highlightSquare(row, col, true);
                await this.showPossibleMoves(row, col);
            }
        } else {
            // Piece already selected - try to move
            const fromSquare = this.selectedSquare;

            if (fromSquare.row === row && fromSquare.col === col) {
                // Clicking the same square - deselect
                await this.clearHighlights();
                this.selectedSquare = null;
            } else if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                // Clicking another piece of same color - select it instead
                await this.clearHighlights();
                this.selectedSquare = { row, col };
                await this.highlightSquare(row, col, true);
                await this.showPossibleMoves(row, col);
            } else {
                // Try to move the piece
                if (this.isValidMove(fromSquare.row, fromSquare.col, row, col)) {
                    await this.makeMove(fromSquare.row, fromSquare.col, row, col);
                    await this.clearHighlights();
                    this.selectedSquare = null;
                    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                    this.updatePlayerIndicator();
                }
            }
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];

        // Can't capture own piece
        if (targetPiece && targetPiece.color === piece.color) {
            return false;
        }

        // Basic move validation (simplified - not full chess rules)
        const rowDiff = toRow - fromRow;
        const colDiff = Math.abs(toCol - fromCol);

        switch (piece.type) {
            case 'pawn':
                const direction = piece.color === 'white' ? -1 : 1;
                const startRow = piece.color === 'white' ? 6 : 1;

                // Forward move
                if (colDiff === 0 && !targetPiece) {
                    if (rowDiff === direction) return true;
                    if (fromRow === startRow && rowDiff === direction * 2 && !this.board[fromRow + direction][fromCol]) return true;
                }
                // Capture
                if (colDiff === 1 && rowDiff === direction && targetPiece) return true;
                return false;

            case 'rook':
                if (rowDiff === 0 || colDiff === 0) {
                    return this.isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;

            case 'knight':
                return (Math.abs(rowDiff) === 2 && colDiff === 1) || (Math.abs(rowDiff) === 1 && colDiff === 2);

            case 'bishop':
                if (Math.abs(rowDiff) === colDiff) {
                    return this.isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;

            case 'queen':
                if (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === colDiff) {
                    return this.isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;

            case 'king':
                return Math.abs(rowDiff) <= 1 && colDiff <= 1;

            default:
                return false;
        }
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;

        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol] !== null) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }

        return true;
    }

    async makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        // Make the move on the board
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Move the 3D piece to match
        await this.move3DPiece(fromRow, fromCol, toRow, toCol);

        // Record move in history
        const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece);
        this.moveHistory.push(moveNotation);
        this.updateMoveHistory();

        // Re-render the board
        this.renderBoard();
    }

    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured) {
        const files = 'abcdefgh';
        const from = files[fromCol] + (8 - fromRow);
        const to = files[toCol] + (8 - toRow);
        const pieceSymbol = piece.type === 'pawn' ? '' : piece.type[0].toUpperCase();
        const captureSymbol = captured ? 'x' : '';

        return `${pieceSymbol}${from}${captureSymbol}${to}`;
    }

    async showPossibleMoves(row, col) {
        // Highlight all valid moves for the selected piece
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    await this.highlightSquare(r, c, false, 'possible-move');
                }
            }
        }
    }

    async highlightSquare(row, col, selected = true, className = 'selected') {
        // Highlight 2D UI square
        if (!this.popup) return;
        const square = this.popup.querySelector(`.chess-square[data-row="${row}"][data-col="${col}"]`);
        if (square) {
            square.classList.add(className);
        }

        // Highlight 3D scene square
        const isPossibleMove = className === 'possible-move';
        await this.highlight3DSquare(row, col, isPossibleMove);
    }

    async clearHighlights() {
        // Clear 2D UI highlights
        if (!this.popup) return;
        this.popup.querySelectorAll('.chess-square').forEach(square => {
            square.classList.remove('selected', 'possible-move');
        });

        // Clear 3D scene highlights
        await this.clearAll3DHighlights();
    }

    // 3D Scene Square Methods
    get3DSquare(row, col) {
        // Get the 3D square entity from the scene using global SM
        const squareName = `Square_${row}_${col}`;
        const squarePath = `${this.ctx._entity.id}/${squareName}`;
        return SM.getEntityById(squarePath);
    }

    async highlight3DSquare(row, col, isPossibleMove = false) {
        const square3D = this.get3DSquare(row, col);
        if (!square3D) return;

        const material = square3D.getComponent("Material");
        if (!material) return;

        // Store original color if not already stored (color is stored as {x, y, z, w})
        const key = `${row}_${col}`;
        if (!this.originalColors[key]) {
            const origColor = material._bs._color;
            this.originalColors[key] = {r: origColor.x, g: origColor.y, b: origColor.z, a: origColor.w};
        }

        // Set highlight color - green for selected, lighter green for possible moves
        const highlightColor = isPossibleMove
            ? {r: 0.8, g: 0.8, b: 0.3, a: 1}  // Light green for possible moves
            : {r: 0.15, g: 0.68, b: 0.38, a: 1};  // Darker green for selected (#27ae60)

        // Use global SetComponentProp to change color
        await SetComponentProp(material.id, 'color', highlightColor, {context: 'script'});
    }

    async clear3DHighlight(row, col) {
        const square3D = this.get3DSquare(row, col);
        if (!square3D) return;

        const material = square3D.getComponent("Material");
        if (!material) return;

        // Restore original color
        const key = `${row}_${col}`;
        if (this.originalColors[key]) {
            await SetComponentProp(material.id, 'color', this.originalColors[key], {context: 'script'});
            delete this.originalColors[key];
        }
    }

    async clearAll3DHighlights() {
        // Restore all highlighted squares
        for (const key of Object.keys(this.originalColors)) {
            const [row, col] = key.split('_').map(Number);
            await this.clear3DHighlight(row, col);
        }
    }

    async resetAll3DSquareColors() {
        // Reset ALL squares to their original checkerboard colors
        // Light squares: #f0d9b5 (rgb: 240, 217, 181)
        // Dark squares: #b58863 (rgb: 181, 136, 99)
        const lightColor = {r: 0.941, g: 0.851, b: 0.710, a: 1};
        const darkColor = {r: 0.710, g: 0.533, b: 0.388, a: 1};

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square3D = this.get3DSquare(row, col);
                if (!square3D) continue;

                const material = square3D.getComponent("Material");
                if (!material) continue;

                // Determine if this is a light or dark square
                const isLight = (row + col) % 2 === 0;
                const color = isLight ? lightColor : darkColor;

                // Set the color
                await SetComponentProp(material.id, 'color', color, {context: 'script'});
            }
        }

        // Clear the originalColors map since we've reset everything
        this.originalColors = {};
    }

    async positionCapturedPiece(pieceUuid, color) {
        // Position captured pieces to the side of the board in an organized fashion
        // Captured white pieces go to the left (near black player)
        // Captured black pieces go to the right (near white player)
        // Arrange in a grid: 2 columns x 8 rows max

        const piecesContainer = SM.getEntityById(`${this.ctx._entity.id}/Pieces`);
        if (!piecesContainer) {
            console.warn("Pieces container not found for captured piece positioning");
            return;
        }

        const pieceEntity = SM.getEntityByUuid(pieceUuid);
        if (!pieceEntity) {
            console.warn(`Could not find piece entity with UUID ${pieceUuid}`);
            return;
        }

        // Add to appropriate captured list
        if (color === 'white') {
            this.capturedWhitePieces.push(pieceUuid);
        } else {
            this.capturedBlackPieces.push(pieceUuid);
        }

        // Reparent to Pieces container
        await MoveEntity(pieceEntity.id, piecesContainer.id, {context: 'script'});

        // Calculate position based on capture order
        const capturedList = color === 'white' ? this.capturedWhitePieces : this.capturedBlackPieces;
        const captureIndex = capturedList.length - 1;

        // Arrange in 2 columns
        const col = Math.floor(captureIndex / 8);  // 0 or 1
        const row = captureIndex % 8;               // 0-7

        // Board is roughly 8 units wide (8 squares)
        // Captured white pieces go LEFT (near black player), captured black pieces go RIGHT (near white player)
        const baseX = color === 'white' ? -5.0 : 5.0;  // Left for white, right for black
        const x = baseX + (col * 0.8) * (color === 'white' ? -1 : 1);  // Stack outward from board
        const y = 0.4;                   // Same height as pieces on board

        // White pieces stack downward (z decreasing), black pieces stack upward (z increasing)
        const z = color === 'white' ? 3.5 - (row * 1.0) : -3.5 + (row * 1.0);

        // Get entity again after reparenting (ID changes)
        const movedEntity = SM.getEntityByUuid(pieceUuid);
        if (movedEntity) {
            await SetEntityProp(movedEntity.id, "localPosition", {x, y, z}, {context: 'script'});
            console.log(`Positioned captured ${color} piece at (${x}, ${y}, ${z})`);
        }
    }

    // 3D Piece Management Methods
    async initialize3DPieces() {
        console.log("Initializing 3D pieces...");

        // Clear the pieces3D array
        this.pieces3D = Array(8).fill(null).map(() => Array(8).fill(null));

        // First, try to find pieces already positioned on squares (after a restart/reload)
        let foundOnSquares = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.get3DSquare(row, col);
                if (!square) continue;

                // Check if this square has any piece children
                if (square.children && square.children.length > 0) {
                    for (const child of square.children) {
                        const pieceInfo = this.parsePieceName(child.name);
                        if (pieceInfo) {
                            // Found a piece already on this square
                            const boardPiece = this.board[row][col];
                            // Verify it matches the expected piece on the board
                            if (boardPiece &&
                                boardPiece.type === pieceInfo.type &&
                                (boardPiece.color === pieceInfo.color || pieceInfo.color === 'unknown')) {
                                this.pieces3D[row][col] = child.uuid;
                                foundOnSquares++;
                                console.log(`Found ${pieceInfo.color} ${pieceInfo.type} already at ${row},${col}`);
                            }
                        }
                    }
                }
            }
        }

        console.log(`Found ${foundOnSquares} pieces already positioned on squares`);

        // Check if pieces are actually in correct positions
        let correctlyPositioned = true;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const expectedPiece = this.board[row][col];
                const actualPieceUuid = this.pieces3D[row][col];

                if (expectedPiece && !actualPieceUuid) {
                    // Expected a piece here but none found
                    correctlyPositioned = false;
                    break;
                } else if (!expectedPiece && actualPieceUuid) {
                    // Found a piece where there shouldn't be one
                    correctlyPositioned = false;
                    break;
                }
            }
            if (!correctlyPositioned) break;
        }

        // If all pieces are correctly positioned, we're done
        if (foundOnSquares >= 32 && correctlyPositioned) {
            console.log("All pieces already correctly positioned. Initialization complete.");
            return;
        } else if (foundOnSquares > 0 && !correctlyPositioned) {
            console.log("Pieces found but in wrong positions. Resetting to starting positions...");
            await this.reset3DPieces();
            return;
        }

        // Otherwise, check the Pieces container for unpositioned pieces
        const piecesContainer = SM.getEntityById(`${this.ctx._entity.id}/Pieces`);
        if (!piecesContainer) {
            console.warn("Pieces container not found at", `${this.ctx._entity.id}/Pieces`);
            if (foundOnSquares === 0) {
                console.warn("3D pieces will not be synchronized. Game will work in 2D only.");
            }
            return;
        }

        console.log("Found Pieces container with", piecesContainer.children.length, "unpositioned children");

        // Iterate through all children of Pieces - using for...of to support await
        for (const pieceEntity of piecesContainer.children) {
            console.log("Processing piece:", pieceEntity.name);
            // Parse piece name to determine type and color
            // Expected naming: "WhitePawn", "BlackRook", etc.
            const pieceName = pieceEntity.name;
            const pieceInfo = this.parsePieceName(pieceName);

            if (!pieceInfo) {
                console.warn(`Could not parse piece name: ${pieceName}`);
                continue;
            }

            console.log(`Parsed ${pieceName} as:`, pieceInfo);

            // Find the correct board position for this piece based on initial board state
            const position = this.findInitialPosition(pieceInfo.type, pieceInfo.color);

            if (!position) {
                console.warn(`Could not find initial position for ${pieceInfo.color} ${pieceInfo.type}`);
                continue;
            }

            if (position) {
                const {row, col} = position;
                this.pieces3D[row][col] = pieceEntity.uuid;

                // Reparent piece to the square
                const targetSquare = this.get3DSquare(row, col);
                if (targetSquare) {
                    await MoveEntity(pieceEntity.id, targetSquare.id, {context: 'script'});
                    // Get entity again with new ID after reparenting
                    const movedEntity = SM.getEntityByUuid(pieceEntity.uuid);
                    if (movedEntity) {
                        // Reset local position to center it on the square
                        await SetEntityProp(movedEntity.id, "localPosition", {x: 0, y: 0.4, z: 0}, {context: 'script'});
                    }
                }

                console.log(`Placed ${pieceInfo.color} ${pieceInfo.type} at ${row},${col} (UUID: ${pieceEntity.uuid})`);
            }
        }

        // Count how many pieces were successfully assigned
        let pieceCount = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.pieces3D[row][col] !== null) {
                    pieceCount++;
                }
            }
        }

        console.log(`3D pieces initialized: ${pieceCount}/32 pieces assigned`);
        if (pieceCount < 32) {
            console.warn(`Only ${pieceCount} pieces found. You need 32 pieces (16 white, 16 black) for full 3D synchronization.`);
            console.warn("Game will continue to work in 2D. Moves for pieces without 3D counterparts will be skipped in 3D.");
        }
    }

    parsePieceName(name) {
        // Parse names like "WhitePawn", "BlackRook", "ChessPawn", "ChessRook"
        const lower = name.toLowerCase();

        let color = null;
        let type = null;

        // Determine color
        if (lower.includes('white')) {
            color = 'white';
        } else if (lower.includes('black')) {
            color = 'black';
        }

        // Determine type
        if (lower.includes('pawn')) type = 'pawn';
        else if (lower.includes('rook')) type = 'rook';
        else if (lower.includes('knight')) type = 'knight';
        else if (lower.includes('bishop')) type = 'bishop';
        else if (lower.includes('queen')) type = 'queen';
        else if (lower.includes('king')) type = 'king';

        // If no color specified, try to infer from context or default
        // For now, if only type is found (like "ChessPawn"), we'll need to handle specially
        if (type && !color) {
            // This piece needs manual assignment
            return { type, color: 'unknown' };
        }

        return (type && color) ? { type, color } : null;
    }

    findInitialPosition(type, color) {
        // Find the first unassigned position in pieces3D that matches this piece in the board
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const boardPiece = this.board[row][col];

                // Check if this board position has the matching piece and isn't assigned yet
                if (boardPiece &&
                    boardPiece.type === type &&
                    (boardPiece.color === color || color === 'unknown') &&
                    this.pieces3D[row][col] === null) {

                    // Mark this position as being processed
                    return { row, col };
                }
            }
        }

        return null;
    }

    async move3DPiece(fromRow, fromCol, toRow, toCol) {
        const pieceUuid = this.pieces3D[fromRow][fromCol];

        if (!pieceUuid) {
            // No 3D piece at this position - this is okay, game continues in 2D only
            console.log(`No 3D piece at ${fromRow},${fromCol} - skipping 3D move (2D move still works)`);
            return;
        }

        // Get the piece entity by UUID (ID changes after reparenting)
        const pieceEntity = SM.getEntityByUuid(pieceUuid);
        if (!pieceEntity) {
            console.log(`Could not find entity with UUID ${pieceUuid} - 3D move skipped`);
            return;
        }

        // Get target square
        const targetSquare = this.get3DSquare(toRow, toCol);
        if (!targetSquare) {
            console.log(`Could not get square at ${toRow},${toCol} - 3D move skipped`);
            return;
        }

        // If there's a piece at the destination (capture), move it to the side
        const capturedPieceUuid = this.pieces3D[toRow][toCol];
        if (capturedPieceUuid) {
            console.log(`Capturing piece at ${toRow},${toCol}`);
            const capturedEntity = SM.getEntityByUuid(capturedPieceUuid);
            if (capturedEntity) {
                // Determine the color of the captured piece from the board state
                const capturedBoardPiece = this.board[toRow][toCol];
                const capturedColor = capturedBoardPiece ? capturedBoardPiece.color : 'white';

                // Position the captured piece to the side
                await this.positionCapturedPiece(capturedPieceUuid, capturedColor);
            }
        }

        // Move the piece by reparenting to the target square
        console.log(`Moving piece from ${fromRow},${fromCol} to ${toRow},${toCol}`);
        await MoveEntity(pieceEntity.id, targetSquare.id, {context: 'script'});

        // Get entity again with new ID after reparenting
        const movedEntity = SM.getEntityByUuid(pieceUuid);
        if (movedEntity) {
            // Reset local position to center on square
            await SetEntityProp(movedEntity.id, "localPosition", {x: 0, y: 0.4, z: 0}, {context: 'script'});
        }

        // Update pieces3D array
        this.pieces3D[toRow][toCol] = pieceUuid;
        this.pieces3D[fromRow][fromCol] = null;
    }

    async reset3DPieces() {
        // Reactivate all pieces and move them back to starting positions
        console.log("Resetting 3D pieces to starting positions");

        // Reset ALL square colors to original checkerboard pattern
        await this.resetAll3DSquareColors();

        // Define the correct starting positions for all pieces
        const startingPositions = {
            // Black pieces
            'BlackRook': {row: 0, col: 7},
            'BlackRook2': {row: 0, col: 0},
            'BlackKnight': {row: 0, col: 6},
            'BlackKnight2': {row: 0, col: 1},
            'BlackBishop': {row: 0, col: 5},
            'BlackBishop2': {row: 0, col: 2},
            'BlackQueen': {row: 0, col: 3},
            'BlackKing': {row: 0, col: 4},
            'BlackPawn': {row: 1, col: 7},
            'BlackPawn2': {row: 1, col: 6},
            'BlackPawn3': {row: 1, col: 5},
            'BlackPawn4': {row: 1, col: 4},
            'BlackPawn5': {row: 1, col: 3},
            'BlackPawn6': {row: 1, col: 2},
            'BlackPawn7': {row: 1, col: 1},
            'BlackPawn8': {row: 1, col: 0},
            // White pieces
            'WhiteRook': {row: 7, col: 7},
            'WhiteRook2': {row: 7, col: 0},
            'WhiteKnight': {row: 7, col: 6},
            'WhiteKnight2': {row: 7, col: 1},
            'WhiteBishop': {row: 7, col: 5},
            'WhiteBishop2': {row: 7, col: 2},
            'WhiteQueen': {row: 7, col: 3},
            'WhiteKing': {row: 7, col: 4},
            'WhitePawn': {row: 6, col: 7},
            'WhitePawn2': {row: 6, col: 6},
            'WhitePawn3': {row: 6, col: 5},
            'WhitePawn4': {row: 6, col: 4},
            'WhitePawn5': {row: 6, col: 3},
            'WhitePawn6': {row: 6, col: 2},
            'WhitePawn7': {row: 6, col: 1},
            'WhitePawn8': {row: 6, col: 0}
        };

        // Collect ALL pieces from everywhere (squares and Pieces container)
        const allPieces = [];

        // Collect from all squares
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.get3DSquare(row, col);
                if (square && square.children) {
                    for (const child of square.children) {
                        const pieceInfo = this.parsePieceName(child.name);
                        if (pieceInfo) {
                            allPieces.push(child);
                        }
                    }
                }
            }
        }

        // Also collect from Pieces container
        const piecesContainer = SM.getEntityById(`${this.ctx._entity.id}/Pieces`);
        if (piecesContainer && piecesContainer.children) {
            for (const child of piecesContainer.children) {
                allPieces.push(child);
            }
        }

        console.log(`Found ${allPieces.length} pieces to reset`);

        // Move each piece to its correct starting position
        for (const piece of allPieces) {
            // Reactivate piece
            const startPos = startingPositions[piece.name];
            if (startPos) {
                const targetSquare = this.get3DSquare(startPos.row, startPos.col);
                if (targetSquare) {
                    await MoveEntity(piece.id, targetSquare.id, {context: 'script'});
                    // Reset local position
                    const movedEntity = SM.getEntityByUuid(piece.uuid);
                    if (movedEntity) {
                        await SetEntityProp(movedEntity.id, "localPosition", {x: 0, y: 0.4, z: 0}, {context: 'script'});
                    }
                }
            }
        }

        // Re-initialize the pieces3D tracking array
        await this.initialize3DPieces();
    }

    updatePlayerIndicator() {
        const indicator = this.popup.querySelector('.player-indicator');
        if (indicator) {
            indicator.className = `player-indicator ${this.currentPlayer}`;
            indicator.innerHTML = `
                <span class="player-piece">${this.currentPlayer === 'white' ? '♔' : '♚'}</span>
                <span class="player-name">${this.currentPlayer.toUpperCase()}</span>
            `;
        }
    }

    updateMoveHistory() {
        const moveList = this.popup ? this.popup.querySelector('#move-list') : null;
        if (!moveList) return;

        moveList.innerHTML = '';
        this.moveHistory.forEach((move, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = 'move-item';

            if (index % 2 === 0) {
                const moveNumber = Math.floor(index / 2) + 1;
                moveElement.textContent = `${moveNumber}. ${move}`;
            } else {
                moveElement.textContent = `... ${move}`;
            }

            moveList.appendChild(moveElement);
        });

        // Auto-scroll to latest move
        moveList.scrollTop = moveList.scrollHeight;
    }

    async resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.capturedWhitePieces = [];
        this.capturedBlackPieces = [];
        await this.clearHighlights();  // Clear both 2D and 3D highlights
        // Reset 3D pieces to starting positions
        await this.reset3DPieces();
        this.renderBoard();
        this.updatePlayerIndicator();
        this.updateMoveHistory();
    }

    flipBoard() {
        const boardElement = this.popup ? this.popup.querySelector('#chess-board') : null;
        if (boardElement) {
            boardElement.classList.toggle('flipped');
        }
    }

    setupEventListeners() {
        const header = this.popup.querySelector('.chess-header');
        const closeBtn = this.popup.querySelector('.chess-close');
        const resetBtn = this.popup.querySelector('.reset-btn');
        const flipBtn = this.popup.querySelector('.flip-btn');

        // Dragging functionality
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('chess-close')) return;

            this.isDragging = true;

            // Get current position
            const rect = this.popup.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;

            // Remove transform for absolute positioning
            this.popup.style.transform = 'none';

            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;

            this.popup.style.left = `${x}px`;
            this.popup.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                header.style.cursor = 'grab';
            }
        });

        // Close button
        closeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.close();
        });

        // Reset button
        resetBtn.addEventListener('click', async () => {
            await this.resetGame();
        });

        // Flip board button
        flipBtn.addEventListener('click', () => {
            this.flipBoard();
        });
    }

    injectStyles() {
        if (document.getElementById('chess-styles')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'chess-styles';
        styleEl.textContent = `
            .chess-popup {
                position: fixed;
                width: 800px;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                border: 2px solid #1a252f;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .chess-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 18px;
                background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
                border-bottom: 2px solid #1a252f;
                border-radius: 10px 10px 0 0;
                cursor: grab;
                user-select: none;
            }

            .chess-title {
                color: #ecf0f1;
                font-size: 16px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            }

            .chess-close {
                background: transparent;
                border: none;
                color: #95a5a6;
                font-size: 28px;
                line-height: 1;
                cursor: pointer;
                padding: 0;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.3s;
            }

            .chess-close:hover {
                color: #e74c3c;
            }

            .chess-content {
                padding: 20px;
            }

            .chess-game-area {
                display: flex;
                gap: 20px;
            }

            .chess-board-container {
                position: relative;
                width: fit-content;
                height: fit-content;
            }

            .chess-board {
                display: grid;
                grid-template-columns: repeat(8, 60px);
                grid-template-rows: repeat(8, 60px);
                width: 487px;
                height: 487px;
                border: 3px solid #1a252f;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
                background: #1a252f;
                gap: 1px;
            }

            .chess-board.flipped {
                transform: rotate(180deg);
            }

            .chess-board.flipped .chess-piece,
            .chess-board.flipped .rank-label,
            .chess-board.flipped .file-label {
                transform: rotate(180deg);
            }

            .chess-square {
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                cursor: pointer;
                transition: all 0.2s;
            }

            .chess-square.light {
                background: #f0d9b5;
            }

            .chess-square.dark {
                background: #b58863;
            }

            .chess-square.selected {
                box-shadow: inset 0 0 0 3px #27ae60;
                background: #27ae60 !important;
            }

            .chess-square.possible-move::before {
                content: '';
                position: absolute;
                width: 20px;
                height: 20px;
                background: rgba(39, 174, 96, 0.5);
                border-radius: 50%;
            }

            .chess-square:hover {
                box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5);
            }

            .chess-piece {
                font-size: 44px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                cursor: pointer;
                user-select: none;
                z-index: 1;
            }

            .chess-piece.white {
                color: #fff;
                text-shadow: 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000;
            }

            .chess-piece.black {
                color: #2c3e50;
            }

            .rank-label, .file-label {
                position: absolute;
                font-size: 10px;
                font-weight: 600;
                color: #1a252f;
                opacity: 0.7;
            }

            .rank-label {
                top: 2px;
                left: 2px;
            }

            .file-label {
                bottom: 2px;
                right: 2px;
            }

            .chess-info-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 20px;
                color: #ecf0f1;
            }

            .chess-current-player h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #95a5a6;
            }

            .player-indicator {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                transition: all 0.3s;
            }

            .player-indicator.white {
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            }

            .player-indicator.black {
                box-shadow: 0 0 10px rgba(44, 62, 80, 0.5);
            }

            .player-piece {
                font-size: 32px;
            }

            .player-name {
                font-size: 18px;
                font-weight: 600;
            }

            .chess-controls {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .chess-btn {
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .chess-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
            }

            .chess-btn:active {
                transform: translateY(0);
            }

            .reset-btn {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            }

            .reset-btn:hover {
                box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
            }

            .chess-move-history {
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .chess-move-history h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #95a5a6;
            }

            .move-list {
                flex: 1;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
                padding: 10px;
                overflow-y: auto;
                max-height: 200px;
            }

            .move-item {
                padding: 3px 5px;
                font-size: 13px;
                font-family: 'Courier New', monospace;
                color: #ecf0f1;
            }

            .move-item:nth-child(even) {
                background: rgba(255, 255, 255, 0.05);
            }

            .move-list::-webkit-scrollbar {
                width: 6px;
            }

            .move-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
            }

            .move-list::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }

            .move-list::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(styleEl);
    }

    async close() {
        await this.clearAll3DHighlights();  // Clean up 3D highlights before closing
        if (this.popup && this.popup.parentNode) {
            this.popup.remove();
        }
    }

    async destroy() {
        await this.clearAll3DHighlights();  // Clean up 3D highlights
        await this.close();

        // Remove styles
        const styles = document.getElementById('chess-styles');
        if (styles && styles.parentNode) {
            styles.remove();
        }

        if (window.chessGameInstance) {
            delete window.chessGameInstance;
        }
    }
}

// Initialize extension
let chessGameInstance = null;
let popupElement = null;

this.default = {};

Object.entries(this.default).forEach(([key, val]) => {
    if (!this.vars[key]) this.vars[key] = val;
});

this.onStart = () => {
    console.log("Chess UI extension starting...");

    // Wrap async operations in an immediately invoked async function
    (async () => {
        try {
            // Singleton pattern: Destroy any existing instance first
            if (window.chessGameInstance) {
                console.log("Found existing Chess instance, destroying it...");
                await window.chessGameInstance.destroy();
                window.chessGameInstance = null;
            }

            // Also check for orphaned popups in the DOM
            const orphanedPopups = document.querySelectorAll('#chess-popup, .chess-popup');
            orphanedPopups.forEach(popup => {
                console.log("Removing orphaned chess popup from DOM");
                popup.remove();
            });

            // Create new instance
            chessGameInstance = new ChessGame(this);
            popupElement = await chessGameInstance.init();

            // Make instance globally accessible
            window.chessGameInstance = chessGameInstance;

            console.log("Chess UI initialized successfully");
        } catch (error) {
            console.error("Error initializing Chess UI:", error);
        }
    })();
};

this.onUpdate = () => {
    // No update logic needed
};

this.onDestroy = () => {
    console.log("Chess UI extension destroying...");
    if (chessGameInstance) {
        // Wrap async destroy in promise
        chessGameInstance.destroy().then(() => {
            chessGameInstance = null;
            popupElement = null;
        }).catch(error => {
            console.error("Error destroying Chess UI:", error);
        });
    }
};