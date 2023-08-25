(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function AiMultiThread() { }

    // Header -----------------------------------------------
    global.AiMultiThread = AiMultiThread;
    global.AiMultiThread.alphaBeta = alphaBeta;
    global.AiMultiThread.montecarlo = montecarlo;

    //-------------------------------------

    function alphaBeta(obj) {

        var canPutColumn = obj.canPutOrder.concat();//配列コピー（参照渡しではなく、値渡し
        var best_score = obj.turn * 999999 * -1;
        var besthand;

        obj.common.range = searchRange(obj.hand.X);

        if (obj.depth == 0) {
                         best_score = evalValue(obj, -1) - evalValue(obj, 1);// turn=1がプレイヤー、-1がCPUであるため
            obj.common.evalCount++;
            return [besthand, best_score];
        }

        var pairReach = checkReach(obj, obj.common.range, obj.turn * -1);
        var myReach = checkReach(obj, obj.common.range, obj.turn);


        if (myReach >= 0) {
// best_score = evalValue(obj, -1) - evalValue(obj, 1);// turn=1がプレイヤー、-1がCPUであるため
            obj.common.evalCount = obj.common.evalCount + (Math.pow(12, obj.depth - 1) * 12);
            return [myReach, best_score];
        }

        var handX = 0;

        for (var i = 0; i < 12; i++) {
            handX = canPutColumn[i];
            obj.hand.X = handX;

            if (obj.depth >= obj.common.depth - 3) {
                notify(obj.common.evalCount);
            }

            if (pairReach >= 0 && pairReach != handX) {
                obj.common.evalCount = obj.common.evalCount + Math.pow(12, obj.depth - 1);
                continue;
            }

            //既に天井で積めなかった場合
            if (!canPut(obj, handX, obj.turn)) {
                obj.common.evalCount = obj.common.evalCount + Math.pow(12, obj.depth - 1);
                continue;
            }
            var boardStatus = putMap(obj, handX, obj.turn);

            obj.turn = obj.turn * -1;
            obj.depth = obj.depth - 1;
            var b_temp = obj.b;
            obj.b = obj.a;
            obj.a = b_temp;

            //==================再帰
            var sc = alphaBeta(obj)[1];
            //==================

            var boardStatus = excludeMap(obj, handX);

            obj.turn = obj.turn * -1;
            obj.depth = obj.depth + 1;
            obj.a = obj.b;
            obj.b = b_temp;

            if (besthand === void 0) {
                best_score = sc;
                besthand = handX;
            }
            if (obj.turn === 1 && sc < best_score) {
                best_score = sc;
                besthand = handX;
            } else if (obj.turn === -1 && sc > best_score) {
                best_score = sc;
                besthand = handX;
            }
            if (obj.turn === 1 && obj.a > best_score || obj.turn === -1 && obj.a < best_score) {
                obj.a = best_score;
            }
            if (obj.turn === 1 && obj.b >= best_score || obj.turn === -1 && obj.b <= best_score) {
                if (obj.depth == obj.common.depth - 1) {
                    obj.common.isCut = true;
                }
                obj.common.evalCount = obj.common.evalCount + (Math.pow(12, obj.depth - 1) * (11 - i));
                break;
            }
            if (obj.depth == obj.common.depth) {
                notify(obj.common.evalCount);
                if (!obj.common.isCut) {
                    obj.common.depth1EvalValues[canPutColumn[i]] = sc;//本来はcommon.depth1EvalValues[canPutColumn[i]].scだが、見やすさのため、あえて連想配列から配列にしている
                    obj.common.isCut = false;
                }
                if (i == 11) {
                    return [besthand, best_score, obj.common.depth1EvalValues, obj.common.evalCount];
                }
            }
        }
        notify(obj.common.evalCount);
        //置ける場所が1つも無かった場合
        if (typeof besthand === "undefined") {
            besthand = -1;
        }

        return [besthand, best_score, obj.common.depth1EvalValues, obj.common.evalCount];

        //=================================内部関数
        //コマを置いたら盤面を返す
        function putMap(boardStatus, handX, turn) {
            boardStatus.putHeight[handX] += 1;//1積む
            boardStatus.map[boardStatus.putHeight[handX] - 1][handX] = turn;

            return boardStatus;
        }

        //コマを除いた盤面を返す
        function excludeMap(boardStatus, handX) {
            boardStatus.map[boardStatus.putHeight[handX] - 1][handX] = 0;
            boardStatus.putHeight[handX] -= 1;//1積む

            return boardStatus;
        }

        //評価関数
        function evalValue(obj, turn) {

            var i, j, evalValue = 0;

        if (checkContinuityReach(obj, obj.common.range, turn) >= 0) {//連続リーチしている場合、リーチした方に99999点加点
evalValue + evalValue + 9999;
        }
            return evalValue;
        }

        function checkReach(boardStatus, range, turn) {
            var hand = {
                X: 0,
            };

            for (var x = range.handXStart; x <= range.handXEnd; x++) {

                hand.X = x;

                //既に天井で積めなかった場合
                if (!canPutCeiling(boardStatus, hand.X, turn)) {
                    continue;
                }

                boardStatus = putMap(boardStatus, hand.X, turn);
                if (isFourInLine(boardStatus, hand.X, turn)) {
                    boardStatus = excludeMap(boardStatus, hand.X);
                    return x;
                }
                boardStatus = excludeMap(boardStatus, hand.X);
            }
            return -1;
        }

        //コマを置いた場所から±3の範囲を返す
        function searchRange(handX) {
            var range = {
                handXStart: null,
                handXEnd: null
            };

            if (handX - 3 < 0) {
                range.handXStart = 0;
            } else {
                range.handXStart = handX - 3;
            }
            if (handX + 3 > 11) {
                range.handXEnd = 11;
            } else {
                range.handXEnd = handX + 3;
            }

            return range;
        }

        function canPutCeiling(boardStatus, handX) {
            if (boardStatus.putHeight[handX] == 12) {
                return false;//既に天井なので置けない
            }
            return true;
        }

        //指定した列に置けるか返す
        function canPut(boardStatus, handX, turn) {
            if (boardStatus.putHeight[handX] == 12) {
                return false;//既に天井なので置けない
            } else if (boardStatus.putHeight[handX] + 1 == 12) {
                return true;//一つ置いたら天井という事が判明した時点で終了
            }

            //2つ積む
            boardStatus = putMap(boardStatus, handX, turn);
            boardStatus = putMap(boardStatus, handX, turn * -1);

            if (isFourInLine(boardStatus, handX, turn * -1)) {
                boardStatus = excludeMap(boardStatus, handX);
                boardStatus = excludeMap(boardStatus, handX);
                return false;//空中リーチあり。置けない事が判明
            }
            //2つ置いたコマを取り除く
            boardStatus = excludeMap(boardStatus, handX);
            boardStatus = excludeMap(boardStatus, handX);

            return true;
        }

        function isFourInLine(boardStatus, handX, turn) {
            var lineCheckRL = 0, lineCheckRULD = 0, lineCheckLURD = 0;
            var handY = boardStatus.putHeight[handX] - 1;
            for (var i = -3; i <= 3; i++) {
                //左右
                if (boardStatus.map[handY][handX + i] == turn) {
                    lineCheckRL += 1;
                } else {
                    lineCheckRL = 0;
                }
                //右上～左下
                if ((handY + i >= 0 && handY + i <= 11) && boardStatus.map[handY + i][handX + i] == turn) {
                    lineCheckRULD += 1;
                } else {
                    lineCheckRULD = 0;
                }
                //左上～右下
                if ((handY + i >= 0 && handY + i <= 11) && boardStatus.map[handY + i][handX + i * -1] == turn) {
                    lineCheckLURD += 1;
                } else {
                    lineCheckLURD = 0;
                }

                if (lineCheckRL >= 4 || lineCheckRULD >= 4 || lineCheckLURD >= 4) {
                    return true;
                }
            }

            //上下
            if (handY - 3 >= 0 && boardStatus.map[handY][handX] == turn
                && boardStatus.map[handY - 1][handX] == turn
                && boardStatus.map[handY - 2][handX] == turn
                && boardStatus.map[handY - 3][handX] == turn) {
                return true;
            }

            return false;
        }

    //連続リーチ
    function checkContinuityReach(boardStatus, range, turn) {
        var handX;
        for (var x = range.handXStart; x <= range.handXEnd; x++) {
            handX = x;
            //既に天井で積めなかった場合
            if (!canPut(boardStatus, handX, turn)) {
                continue;
            }
            boardStatus = putMap(boardStatus, handX, turn);
            var rangeD1 = searchRange(handX);
            var checkReachD1 = checkReach(boardStatus, rangeD1, turn);
            if (checkReachD1 == -1) {//プレイヤーがリーチしなかった
                boardStatus = excludeMap(boardStatus, handX);
                continue;
            }
            //プレイヤーがリーチしたのでCPUが防ぐ
            if (!canPutCeiling(boardStatus, checkReachD1)) {//天井かどうか
                boardStatus = excludeMap(boardStatus, handX);
                continue;
            }
            boardStatus = putMap(boardStatus, checkReachD1, turn * -1);
            if (checkReach(boardStatus, rangeD1, turn) >= 0) {//CPUが1手前でプレイヤーのリーチ防ぎ、かつプレイヤーがリーチしている
                boardStatus = excludeMap(boardStatus, checkReachD1);
                boardStatus = excludeMap(boardStatus, handX);
                return handX;//終了
            }
            //=============================再帰
            var result_checkContinuityReach = checkContinuityReach(boardStatus, rangeD1, turn);
            //=============================
            boardStatus = excludeMap(boardStatus, checkReachD1);
            boardStatus = excludeMap(boardStatus, handX);
            if (result_checkContinuityReach >= 0) {
                return handX;
            }
        }
        return -1;
    }

        //========================================内部関数ここまで
    }

    //モンテカルロ木探索
    function montecarlo(obj) {
        var initPlayoutCount = 10000;
        var playoutCount = initPlayoutCount;
        var MapBeforePlayout = [];
        var TurnBeforePlayout = null;
        var PutHeightBeforePlayout = [];
        var chunkSize = obj.selectChunk_to - obj.selectChunk_from + 1;
        var result = [];
        for (let i = 0; i < chunkSize; i++) {
            result[i] = {
                win: 0,
                lose: 0,
            }
        }
for (i = obj.selectChunk_from; i <= obj.selectChunk_to; i++) {

            // 既に天井で積めなかった場合
            if (!canPut(obj, i, obj.turn)) {
                continue;
            }

            if(i == 4 || i == 7) {
                playoutCount = initPlayoutCount;
            } else {
                playoutCount = 10000;
            }

            // プレイアウト開始時の1手目
            obj = putMap(obj, i, obj.turn);
            MapBeforePlayout = JSON.parse(JSON.stringify(obj.map));
            PutHeightBeforePlayout = obj.putHeight.concat();
            TurnBeforePlayout = obj.turn;
            // プレイアウト上限
            while (playoutCount > 0) {
                playoutCount--;
//                 console.log(playoutCount);
                var handX = i;
                var current = handX % chunkSize;
                // 対局の勝敗が決定するまでループ（対局は最大144手で必ず終了する）
                while (1) {
                    var range = searchRange(handX);
                    // リーチを防ぐ
                    var result_checkReach = checkReach(obj, range, obj.turn * -1);
                    if (result_checkReach >= 0) {
                        handX = result_checkReach;
                        if (isCheckAndPut()) {
                            break;
                        }
                        obj.turn = obj.turn * -1;
                        continue;
                    }
                    // リーチを作る
                    var result_checkReach = checkReach(obj, range, obj.turn);
                    if (result_checkReach >= 0) {
                        handX = result_checkReach;
                        if (isCheckAndPut()) {
                            break;
                        }
                        obj.turn = obj.turn * -1;
                        continue;
                    }
                    // ランダムで手を選択する
                    // ランダムで選んだ手が正常に置けるまで選択し続ける
                    while (1) {
                        handX = Math.floor(Math.random() * 12);
                        if (canPutCeiling(obj, handX) == true) {
                            break;
                        }
                    }

                    if (isCheckAndPut()) {
                        break;
                    }
                    obj.turn = obj.turn * -1;
                }
                // プレイアウト開始時の1手目の盤面に復元する

                obj.map = JSON.parse(JSON.stringify(MapBeforePlayout));
                obj.putHeight = PutHeightBeforePlayout.concat();
                obj.turn = TurnBeforePlayout;
            }
            obj = excludeMap(obj, i);
}

        // 0~11ごとの勝率を計算、格納
        var playoutBest = 0;
        var playoutScore;
        for (let i = 0; i < chunkSize; i++) {
            if (result[i].win + result[i].lose != 0) {
                playoutScore = (result[i].win / (result[i].win + result[i].lose)) * 100;
                result[i].winPer = playoutScore;
            } else {
                result[i].winPer = 0;
            }
            if (playoutScore > playoutBest) {
                playoutBest = i;
            }
        }

        return [obj.currentChunk, result];

        //=================================内部関数(クロージャ)
        function isCheckAndPut() {
            // 駒を置く
            obj = putMap(obj, handX, obj.turn * -1);

            // 勝利判定
            if (isFourInLine(obj, handX, obj.turn * -1) == true) {
                if (obj.turn == 1) {
                    //コンピュータの敗北
                    result[current].lose++;
                } else {
                    //コンピュータの勝利
                    result[current].win++;
                }
                return true;
            }
            return false;
        }

        //コマを置いたら盤面を返す
        function putMap(boardStatus, handX, turn) {
            boardStatus.putHeight[handX] += 1;//1積む
            boardStatus.map[boardStatus.putHeight[handX] - 1][handX] = turn;

            return boardStatus;
        }

        //コマを除いた盤面を返す
        function excludeMap(boardStatus, handX) {
            boardStatus.map[boardStatus.putHeight[handX] - 1][handX] = 0;
            boardStatus.putHeight[handX] -= 1;//1積む

            return boardStatus;
        }

        function checkReach(boardStatus, range, turn) {
            var hand = {
                X: 0,
            };

            for (var x = range.handXStart; x <= range.handXEnd; x++) {

                hand.X = x;

                //既に天井で積めなかった場合
                if (!canPutCeiling(boardStatus, hand.X, turn)) {
                    continue;
                }

                boardStatus = putMap(boardStatus, hand.X, turn);
                if (isFourInLine(boardStatus, hand.X, turn)) {
                    boardStatus = excludeMap(boardStatus, hand.X);
                    return x;
                }
                boardStatus = excludeMap(boardStatus, hand.X);
            }
            return -1;
        }

        //コマを置いた場所から±3の範囲を返す
        function searchRange(handX) {
            var range = {
                handXStart: null,
                handXEnd: null
            };

            if (handX - 3 < 0) {
                range.handXStart = 0;
            } else {
                range.handXStart = handX - 3;
            }
            if (handX + 3 > 11) {
                range.handXEnd = 11;
            } else {
                range.handXEnd = handX + 3;
            }

            return range;
        }

        function canPutCeiling(boardStatus, handX) {
            if (boardStatus.putHeight[handX] == 12) {
                return false;//既に天井なので置けない
            }
            return true;
        }

//         //指定した列に置けるか返す
        function canPut(boardStatus, handX, turn) {
            if (boardStatus.putHeight[handX] == 12) {
                return false;//既に天井なので置けない
            } else if (boardStatus.putHeight[handX] + 1 == 12) {
                return true;//一つ置いたら天井という事が判明した時点で終了
            }

            //2つ積む
            boardStatus = putMap(boardStatus, handX, turn);
            boardStatus = putMap(boardStatus, handX, turn * -1);

            if (isFourInLine(boardStatus, handX, turn * -1)) {
                boardStatus = excludeMap(boardStatus, handX);
                boardStatus = excludeMap(boardStatus, handX);
                return false;//空中リーチあり。置けない事が判明
            }
            //2つ置いたコマを取り除く
            boardStatus = excludeMap(boardStatus, handX);
            boardStatus = excludeMap(boardStatus, handX);

            return true;
        }

    function isFourInLine(boardStatus, handX, turn) {
        var lineCheckRL = 0, lineCheckRULD = 0, lineCheckLURD = 0;
        var handY = boardStatus.putHeight[handX] - 1;
        for (var i = -3; i <= 3; i++) {
            //左右
            if (boardStatus.map[handY][handX + i] == turn) {
                lineCheckRL += 1;
            } else {
                lineCheckRL = 0;
            }
            //右上～左下
            if ((handY + i >= 0 && handY + i <= 11) && boardStatus.map[handY + i][handX + i] == turn) {
                lineCheckRULD += 1;
            } else {
                lineCheckRULD = 0;
            }
            //左上～右下
            if ((handY + i >= 0 && handY + i <= 11) && boardStatus.map[handY + i][handX + i * -1] == turn) {
                lineCheckLURD += 1;
            } else {
                lineCheckLURD = 0;
            }

            if (lineCheckRL >= 4 || lineCheckRULD >= 4 || lineCheckLURD >= 4) {
                return true;
            }
        }

        //上下
        if (handY - 3 >= 0 && boardStatus.map[handY][handX] == turn
            && boardStatus.map[handY - 1][handX] == turn
            && boardStatus.map[handY - 2][handX] == turn
            && boardStatus.map[handY - 3][handX] == turn) {
            return true;
        }

        return false;
    }
        //========================================内部関数ここまで
    }

})((this || 0).self || global);