/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

 import {Position} from "./model/Position.js"
 import {PositionAnimationsQueue} from "./view/PositionAnimationsQueue.js"
 import {EXTENSION_POINT} from "./model/Extension.js"
 import {ChessboardView} from "./view/ChessboardView.js"
 

export class ChessboardState {

    constructor() {
        this.position = new Position()
        this.orientation = undefined
        this.markers = []
        this.inputWhiteEnabled = false
        this.inputBlackEnabled = false
        this.inputEnabled = false
        this.squareSelectEnabled = false
        this.extensionPoints = {}
    }

    setPosition(fen, animated = false) {
        this.position = new Position(fen, animated)
    }

    movePiece(fromSquare, toSquare, animated = false) {
        const position = this._position.clone()
        position.animated = animated
        const piece = position.getPiece(fromSquare)
        if(!piece) {
            console.error("no piece on", fromSquare)
        }
        position.setPiece(fromSquare, undefined)
        position.setPiece(toSquare, piece)
        this._position = position
    }

    setPiece(square, piece, animated = false) {
        const position = this._position.clone()
        position.animated = animated
        position.setPiece(square, piece)
        this._position = position
    }

    addMarker(square, type) {
        this.markers.push({square: square, type: type})
    }

    removeMarkers(square = undefined, type = undefined) {
        if (!square && !type) {
            this.markers = []
        } else {
            this.markers = this.markers.filter((marker) => {
                if (!type) {
                    if (square === marker.square) {
                        return false
                    }
                } else if (!square) {
                    if (marker.type === type) {
                        return false
                    }
                } else if (marker.type === type && square === marker.square) {
                    return false
                }
                return true
            })
        }
    }

    invokeExtensionPoints(name, data = {}) {
        const extensionPoints = this.extensionPoints[name]
        const dataCloned = Object.assign({}, data);
        dataCloned.extensionPoint = name
        if(extensionPoints) {
            for (const extensionPoint of extensionPoints) {
                setTimeout(() => {
                    extensionPoint(dataCloned)
                })
            }
        }
    }

}

 export const COLOR = {
     white: "w",
     black: "b"
 }
 export const INPUT_EVENT_TYPE = {
     moveStart: "moveStart",
     moveDone: "moveDone",
     moveCanceled: "moveCanceled"
 }
 export const SQUARE_SELECT_TYPE = {
     primary: "primary",
     secondary: "secondary"
 }
 export const BORDER_TYPE = {
     none: "none", // no border
     thin: "thin", // thin border
     frame: "frame" // wide border with coordinates in it
 }
 export const MARKER_TYPE = {
     frame: {class: "marker-frame", slice: "markerFrame"},
     square: {class: "marker-square", slice: "markerSquare"},
     badSquare: {class: "wrong-square", slice: "markerSquare"},
     goodSquare: {class: "correct-square", slice: "markerSquare"},
     dot: {class: "marker-dot", slice: "markerDot"},
     circle: {class: "marker-circle", slice: "markerCircle"}
 }
 export const PIECE = {
     wp: "wp", wb: "wb", wn: "wn", wr: "wr", wq: "wq", wk: "wk",
     bp: "bp", bb: "bb", bn: "bn", br: "br", bq: "bq", bk: "bk",
 }
 
 export class Chessboard {
 
     constructor(context, props = {}) {
         if (!context) {
             throw new Error("container element is " + context)
         }
         this.context = context
         this.id = (Math.random() + 1).toString(36).substring(2, 8)
         this.extensions = []
         let defaultProps = {
             position: "empty", // set as fen, "start" or "empty"
             orientation: COLOR.white, // white on bottom
             responsive: true, // resize the board automatically to the size of the context element
             animationDuration: 300, // pieces animation duration in milliseconds. Disable all animation with `0`.
             language: navigator.language.substring(0, 2).toLowerCase(), // supports "de" and "en" for now, used for pieces naming
             style: {
                 cssClass: "default", // set the css theme of the board, try "green", "blue" or "chess-club"
                 showCoordinates: true, // show ranks and files
                 borderType: BORDER_TYPE.none, // "thin" thin border, "frame" wide border with coordinates in it, "none" no border
                 aspectRatio: 1, // height/width of the board
                 moveFromMarker: MARKER_TYPE.frame, // the marker used to mark the start square
                 moveToMarker: MARKER_TYPE.frame, // the marker used to mark the square where the figure is moving to
             },
             sprite: {
                 url: "./assets/images/chessboard-sprite.svg", // pieces and markers are stored in a sprite file
                 size: 40, // the sprite tiles size, defaults to 40x40px
                 cache: true // cache the sprite
             },
             extensions: [ /* {class: ExtensionClass, props: { ... }} */ ] // add extensions here
         }
         this.props = {}
         Object.assign(this.props, defaultProps)
         Object.assign(this.props, props)
         this.props.sprite = defaultProps.sprite
         this.props.style = defaultProps.style
         if (props.sprite) {
             Object.assign(this.props.sprite, props.sprite)
         }
         if (props.style) {
             Object.assign(this.props.style, props.style)
         }
         if (props.extensions) {
             this.props.extensions = props.extensions
         }
         if (this.props.language !== "de" && this.props.language !== "en") {
             this.props.language = "en"
         }
 
         this.state = new ChessboardState()
         this.view = new ChessboardView(this)
         this.positionAnimationsQueue = new PositionAnimationsQueue(this)
         this.state.orientation = this.props.orientation
         this.view.redrawBoard()
         this.state.position = new Position(this.props.position)
         this.view.redrawPieces()
         // instantiate extensions
         for (const extensionData of this.props.extensions) {
             new extensionData.class(this, extensionData.props)
         }
     }
 
     // API //
 
     async setPiece(square, piece, animated = false) {
         const positionFrom = this.state.position.clone()
         this.state.position.setPiece(square, piece)
         this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
         return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.state.position.clone(), animated)
     }
 
     async movePiece(squareFrom, squareTo, animated = false) {
         const positionFrom = this.state.position.clone()
         this.state.position.movePiece(squareFrom, squareTo)
         this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
         return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.state.position.clone(), animated)
     }
 
     async setPosition(fen, animated = false) {
         const positionFrom = this.state.position.clone()
         this.state.position.setFen(fen)
         this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
         return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.state.position.clone(), animated)
     }
 
     async setOrientation(color, animated = false) {
         const position = this.state.position.clone()
         if (this.boardTurning) {
             console.log("setOrientation is only once in queue allowed")
             return
         }
         this.boardTurning = true
         this.state.invokeExtensionPoints(EXTENSION_POINT.boardChanged)
         return this.positionAnimationsQueue.enqueueTurnBoard(position, color, animated).then(() => {
             this.boardTurning = false
         })
     }
 
     getPiece(square) {
         return this.state.position.getPiece(square)
     }
 
     getPosition() {
         return this.state.position.getFen()
     }
 
     getOrientation() {
         return this.state.orientation
     }
 
     addMarker(square, type) {
         if (!type) {
             console.error("Error addMarker(), type is " + type)
         }
         this.state.addMarker(square, type)
         this.view.drawMarkers()
     }
 
     getMarkers(square = undefined, type = undefined) {
         const markersFound = []
         this.state.markers.forEach((marker) => {
             const markerSquare = marker.square
             if (!square && (!type || type === marker.type) ||
                 !type && square === markerSquare ||
                 type === marker.type && square === markerSquare) {
                 markersFound.push({square: marker.square, type: marker.type})
             }
         })
         return markersFound
     }
 
     removeMarkers(square = undefined, type = undefined) {
         this.state.removeMarkers(square, type)
         this.view.drawMarkers()
     }
 
     enableMoveInput(eventHandler, color = undefined) {
         this.view.enableMoveInput(eventHandler, color)
     }
 
     disableMoveInput() {
         this.view.disableMoveInput()
     }
 
     enableSquareSelect(eventHandler) {
         if (this.squareSelectListener) {
             console.warn("squareSelectListener already existing")
             return
         }
         this.squareSelectListener = function (e) {
             const square = e.target.getAttribute("data-square")
             if (e.type === "contextmenu") {
                 // disable context menu
                 e.preventDefault()
                 return
             }
             eventHandler({
                 chessboard: this,
                 type: e.button === 2 ? SQUARE_SELECT_TYPE.secondary : SQUARE_SELECT_TYPE.primary,
                 square: square
             })
         }
         this.context.addEventListener("contextmenu", this.squareSelectListener)
         this.context.addEventListener("mouseup", this.squareSelectListener)
         this.context.addEventListener("touchend", this.squareSelectListener)
         this.state.squareSelectEnabled = true
         this.view.visualizeInputState()
     }
 
     disableSquareSelect() {
         this.context.removeEventListener("contextmenu", this.squareSelectListener)
         this.context.removeEventListener("mouseup", this.squareSelectListener)
         this.context.removeEventListener("touchend", this.squareSelectListener)
         this.squareSelectListener = undefined
         this.state.squareSelectEnabled = false
         this.view.visualizeInputState()
     }
 
     destroy() {
         this.state.invokeExtensionPoints(EXTENSION_POINT.destroy)
         this.positionAnimationsQueue.destroy()
         this.view.destroy()
         this.view = undefined
         this.state = undefined
         if (this.squareSelectListener) {
             this.context.removeEventListener("contextmenu", this.squareSelectListener)
             this.context.removeEventListener("mouseup", this.squareSelectListener)
             this.context.removeEventListener("touchend", this.squareSelectListener)
         }
     }
 
 }
 