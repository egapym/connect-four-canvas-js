(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function Images() { }

    // Header -----------------------------------------------
    global.Images = Images;
    global.Images.selectedImagePlayer = selectedImagePlayer;
    global.Images.selectedImageCPU = selectedImageCPU;
    global.Images.selectedPiece = selectedPiece;
    global.Images.selectedPieceOther = selectedPieceOther;

    function selectedImagePlayer(selectedNumber) {
        var image_player;

        switch (selectedNumber) {
            case 0: image_player = new createjs.Bitmap("./image/playerImg/player.png"); playerName = "プレイヤー"; break;
            default: image_player = new createjs.Bitmap("./image/playerImg/player.png"); playerName = "プレイヤー"; break;
        }

        return image_player;
    }

    function selectedImageCPU(selectedNumber) {
        return new createjs.Bitmap(CPUTextDataSet[selectedNumber].imgPath);
    }

    function selectedPiece(selectedNumber, turn, isAnimation, x, y) {
        var piece = new createjs.Shape();

        switch (selectedNumber) {
            case 0: //黒の駒
                if (isAnimation) {//アニメーションあり
                    piece.graphics.beginStroke("#000").setStrokeStyle(1).beginLinearGradientFill(["#1C1C1C", "#424242"], [0.1, 0.9], x + (CELL_SIZE / 10), -CELL_SIZE + (CELL_SIZE / 10), x + 25 + (CELL_SIZE / 10), -CELL_SIZE + 25 + (CELL_SIZE / 10))
                        .drawRoundRect(x + (CELL_SIZE / 10), -CELL_SIZE + (CELL_SIZE / 10), CELL_SIZE - (CELL_SIZE / 5), CELL_SIZE - (CELL_SIZE / 5), 5, 5);
                } else {
                    piece.graphics.beginStroke("#000").setStrokeStyle(1).beginLinearGradientFill(["#1C1C1C", "#424242"], [0.1, 0.9], x + (CELL_SIZE / 10), -CELL_SIZE + y + (CELL_SIZE / 10), x + 25 + (CELL_SIZE / 10), -CELL_SIZE + y + 25 + (CELL_SIZE / 10))
                        .drawRoundRect(x + (CELL_SIZE / 10), -CELL_SIZE + y + (CELL_SIZE / 10), CELL_SIZE - (CELL_SIZE / 5), CELL_SIZE - (CELL_SIZE / 5), 5, 5);
                }
                break;
            case 1: //白の駒
                if (isAnimation) {//アニメーションあり
                    piece.graphics.beginStroke("#000").setStrokeStyle(1).beginLinearGradientFill(["#BDBDBD", "#F2F2F2"], [0.1, 0.9], x + (CELL_SIZE / 10), -CELL_SIZE + (CELL_SIZE / 10), x + 25 + (CELL_SIZE / 10), -CELL_SIZE + 25 + (CELL_SIZE / 10))
                        .drawRoundRect(x + (CELL_SIZE / 10), -CELL_SIZE + (CELL_SIZE / 10), CELL_SIZE - (CELL_SIZE / 5), CELL_SIZE - (CELL_SIZE / 5), 5, 5);
                } else {
                    piece.graphics.beginStroke("#000").setStrokeStyle(1).beginLinearGradientFill(["#BDBDBD", "#F2F2F2"], [0.1, 0.9], x + (CELL_SIZE / 10), -CELL_SIZE + y + (CELL_SIZE / 10), x + 25 + (CELL_SIZE / 10), -CELL_SIZE + y + 25 + (CELL_SIZE / 10))
                        .drawRoundRect(x + (CELL_SIZE / 10), -CELL_SIZE + y + (CELL_SIZE / 10), CELL_SIZE - (CELL_SIZE / 5), CELL_SIZE - (CELL_SIZE / 5), 5, 5);
                }
                break;
            default: //両者白の駒
                if (isAnimation) {//アニメーションあり
                    piece.graphics.beginStroke("#000").setStrokeStyle(1).beginLinearGradientFill(["#BDBDBD", "#F2F2F2"], [0.1, 0.9], x + (CELL_SIZE / 10), -CELL_SIZE + (CELL_SIZE / 10), x + 25 + (CELL_SIZE / 10), -CELL_SIZE + 25 + (CELL_SIZE / 10))
                        .drawRoundRect(x + (CELL_SIZE / 10), -CELL_SIZE + (CELL_SIZE / 10), CELL_SIZE - (CELL_SIZE / 5), CELL_SIZE - (CELL_SIZE / 5), 5, 5);
                } else {
                    piece.graphics.beginStroke("#000").setStrokeStyle(1).beginLinearGradientFill(["#BDBDBD", "#F2F2F2"], [0.1, 0.9], x + (CELL_SIZE / 10), -CELL_SIZE + y + (CELL_SIZE / 10), x + 25 + (CELL_SIZE / 10), -CELL_SIZE + y + 25 + (CELL_SIZE / 10))
                        .drawRoundRect(x + (CELL_SIZE / 10), -CELL_SIZE + y + (CELL_SIZE / 10), CELL_SIZE - (CELL_SIZE / 5), CELL_SIZE - (CELL_SIZE / 5), 5, 5);
                }
                break;
        }

        if (selectedNumber >= 2) {
            if (turn == 1) {
                piece = Util.objCopy(pieceOtherPlayer);
            } else {
                piece = Util.objCopy(pieceOtherCPU);
            }
            piece.scaleX = CELL_SIZE / piece.image.width;
            piece.scaleY = CELL_SIZE / piece.image.height;

            if (isAnimation) {
                piece.x = x;
                piece.y = -CELL_SIZE;
            } else {
                piece.x = x;
                piece.y = -CELL_SIZE + y;
            }
        }

        return piece;
    }

    function selectedPieceOther(selectedNumber) {
        var piece = new createjs.Shape();

        switch (selectedNumber) {
            case 2: piece = new createjs.Bitmap("./image/piece/apple.png"); break;
            case 3: piece = new createjs.Bitmap("./image/piece/orange.png"); break;
            case 4: piece = new createjs.Bitmap("./image/piece/banana.png"); break;
            case 4: piece = new createjs.Bitmap("./image/piece/grape.png"); break;
            case 4: piece = new createjs.Bitmap("./image/piece/melon.png"); break;
            case 4: piece = new createjs.Bitmap("./image/piece/peach.png"); break;
            case 4: piece = new createjs.Bitmap("./image/piece/strawberry.png"); break;
            case 4: piece = new createjs.Bitmap("./image/piece/watermelon.png"); break;
            default: piece = new createjs.Bitmap("./image/piece/monster_chair.jpg"); break;
                break;
        }

        return piece;
    }

})((this || 0).self || global);