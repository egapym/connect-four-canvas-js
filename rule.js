(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function Rule() { }

    // Header -----------------------------------------------
    global.Rule = Rule;
    global.Rule.isFourInLine = isFourInLine;
    global.Rule.isFourInLineAndPosition = isFourInLineAndPosition;

    function isFourInLine(boardStatus, handX, turn) {
        cnt++;
        let lineCheckRL = 0, lineCheckRULD = 0, lineCheckLURD = 0;
        let handY = boardStatus.putHeight[handX] - 1;
        for (let i = -3; i <= 3; i++) {
            let X = handX + i;
            let Y = handY + i;
            if (Math.sign(X + 1) === 1 && X <= 11) {
                //左右
                if (boardStatus.map[handY][X] == turn) {
                    if (lineCheckRL === 3) {
                        return true;
                    }
                    lineCheckRL++;
                } else {
                    lineCheckRL = 0;
                }
                //左下～右上
                if ((Math.sign(Y + 1) === 1 && Y <= 11) && boardStatus.map[Y][X] == turn) {
                    if (lineCheckRULD === 3) {
                        return true;
                    }
                    lineCheckRULD++;
                } else {
                    lineCheckRULD = 0;
                }
                //左上～右下
                Y = handY + i * -1;
                if ((Math.sign(Y + 1) === 1 && Y <= 11) && boardStatus.map[Y][X] == turn) {
                    if (lineCheckLURD === 3) {
                        return true;
                    }
                    lineCheckLURD++;
                } else {
                    lineCheckLURD = 0;
                }
            }
        }

        //上下
        if (Math.sign(handY - 2) === 1 && boardStatus.map[handY][handX] == turn
            && boardStatus.map[handY - 1][handX] == turn
            && boardStatus.map[handY - 2][handX] == turn
            && boardStatus.map[handY - 3][handX] == turn) {
            return true;
        }

        return false;
    }

    function isFourInLineAndPosition(boardStatus, handX, turn) {
        let lineCheckRL = 0, lineCheckRULD = 0, lineCheckLURD = 0;
        let line = {
            position: {
                X: [],
                Y: [],
            }
        };
        let lineRL = {
            position: {
                X: [],
                Y: [],
            }
        };
        let lineRULD = {
            position: {
                X: [],
                Y: [],
            }
        };
        let lineLURD = {
            position: {
                X: [],
                Y: [],
            }
        };

        let isLined = false;
        let handY = boardStatus.putHeight[handX] - 1;

        for (let i = -3; i <= 3; i++) {
            let X = handX + i;
            let Y = handY + i;
            if (Math.sign(X + 1) === 1 && X <= 11) {
                //左右
                if (boardStatus.map[handY][X] == turn) {
                    lineCheckRL++;
                    if (lineCheckRL == 4) {
                        isLined = true;
                        for (let j = 0; j < 4; j++) {
                            line.position.X.push(X - j);
                            line.position.Y.push(handY);
                        }
                    } else if (lineCheckRL >= 5) {
                        line.position.X.push(X);
                        line.position.Y.push(handY);
                    }
                } else {
                    lineCheckRL = 0;
                }
                //左下～右上
                if ((Math.sign(Y + 1) === 1 && Y <= 11) && boardStatus.map[Y][X] == turn) {
                    lineCheckRULD++;
                    if (lineCheckRULD == 4) {
                        isLined = true;
                        for (let j = 0; j < 4; j++) {
                            line.position.X.push(X - j);
                            line.position.Y.push(Y - j);
                        }
                    } else if (lineCheckRULD >= 5) {
                        line.position.X.push(X);
                        line.position.Y.push(Y);
                    }
                } else {
                    lineCheckRULD = 0;
                }
                //左上～右下
                Y = handY + i * -1;
                if ((Math.sign(Y + 1) === 1 && Y <= 11) && boardStatus.map[handY + i * -1][X] == turn) {
                    lineCheckLURD++;
                    if (lineCheckLURD == 4) {
                        isLined = true;
                        for (let j = -3; j <= 0; j++) {
                            line.position.X.push(X + j);
                            line.position.Y.push(handY + i * -1 - j);
                        }
                    } else if (lineCheckLURD >= 5) {
                        line.position.X.push(X);
                        line.position.Y.push(handY + i * -1);
                    }
                } else {
                    lineCheckLURD = 0;
                }
            }
        }

        //上下
        if (handY - 3 >= 0 && boardStatus.map[handY][handX] == turn
            && boardStatus.map[handY - 1][handX] == turn
            && boardStatus.map[handY - 2][handX] == turn
            && boardStatus.map[handY - 3][handX] == turn) {
            isLined = true;
            line.position.X.push(handX);
            line.position.Y.push(handY);

            line.position.X.push(handX);
            line.position.Y.push(handY - 1);

            line.position.X.push(handX);
            line.position.Y.push(handY - 2);

            line.position.X.push(handX);
            line.position.Y.push(handY - 3);
        }
        return [isLined, line];
    }

})((this || 0).self || global);