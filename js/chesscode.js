
import { Chess } from "./chess.js"

var board = null
var game = new Chess('Q5k1/5q2/p2p4/b1p1pr2/P7/6P1/4KP1R/8 b - - 3 38')
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'
var expectedMoves = [
  {from: "g8", to: "g7"},
  {from: "a8", to: "h8"},
  {from: "g7", to: "g6"},
  {from: "h8", to: "h6"}
]
var index = 0

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}

function onDragStart (source, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  removeGreySquares()

  // check to see if move is wrong
  if (source != expectedMoves[index].from || target != expectedMoves[index].to ) return 'snapback'
  // "Wrong move" graphic

  // make the move in the game
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })
  index += 1
  // Right move graphic

  // Opponent move
  makeOpponentMove()

  //if (move === null) return 'snapback'
  if (move === null ) return 'snapback'
}

function onMouseoverSquare (square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

function onSnapEnd () {
  board.position(game.fen())
}

function makeOpponentMove() {
  game.move(expectedMoves[index])
  setTimeout(function(){
    board.position(game.fen())
  }, 300);
  index += 1
}

var config = {
  draggable: true,
  position: 'Q5k1/5q2/p2p4/b1p1pr2/P7/6P1/4KP1R/8',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config)
makeOpponentMove()
