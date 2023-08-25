(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function Ai() { }

    // Header -----------------------------------------------
    global.Ai = Ai;
    global.Ai.thinkAI = thinkAI;
    global.Ai.putMap = putMap;
    global.Ai.excludeMap = excludeMap;
    global.Ai.canPutCeiling = canPutCeiling;
    global.Ai.isCeiling = isCeiling;
    global.Ai.checkReach = checkReach;
    global.Ai.checkDoubleReach = checkDoubleReach;
    global.Ai.checkContinuityReach = checkContinuityReach;
    global.Ai.searchRange = searchRange;
    global.Ai.montecarlo = montecarlo;
    //-------------------------------------

    function thinkAI(state, turn, depth, strParam) {
        let range = {
            handXStart: 0,
            handXEnd: 11
        };

        let toFixed;

        if (depth <= 8) {
            toFixed = 1;//深さ8なら少数第1位まで表示。深さが増えるごとに桁が1増える
        } else {
            toFixed = depth - 7;//深さ8なら少数第1位まで表示。深さが増えるごとに桁が1増える
        }

        //===============================自分のリーチが存在するかどうか
        let result_checkReach = checkReach(state.boardStatus, range, turn * -1);
        if (result_checkReach >= 0) {
            end(result_checkReach);
            return;
        }
        //==============================================================

        //===============================相手のリーチが存在するかどうか
        result_checkReach = checkReach(state.boardStatus, range, turn);
        if (result_checkReach >= 0) {
            end(result_checkReach);
            return;
        }
        //==============================================================

        //depth=1なら90%の確率でランダムに手を選択する、2なら80%,3なら70%...
        //         if (depth <= 7) {
        //             var num = Math.floor(Math.random() * 100 + 1);
        //             if (num >= depth * 10) {
        //                 depth = 0;
        //             }
        //         }

        //===============================depth = 0 の時、ランダムに手を選択する
        if (depth == 0) {
            end(Math.floor(Math.random() * 12));
            return;
        }
        //==============================================================

        // var result_checkDoubleReach = checkDoubleReach(state.boardStatus, range, turn);

        //===============================自分の連続リーチがあるかどうか
        let result_checkContinuityReach = checkContinuityReach(state.boardStatus, range, turn * -1);
        if (result_checkContinuityReach >= 0) {
            end(result_checkContinuityReach);
            return;
        }
        //==============================================================

        //===============================相手のWリーチがあるかどうか
        let result_checkDoubleReach = checkDoubleReach(state.boardStatus, range, turn);
        if (result_checkDoubleReach >= 0) {
            end(result_checkDoubleReach);
            return;
        }
        //==============================================================

        //===============================モンテカルロ木探索
        if (strParam == "montecarlo") {
            cnt = 0;
            console.log("MCTS processing...");
            console.time('Single Thread');
            let result_montecarlo = montecarlo(state.boardStatus, turn * -1);
            console.timeEnd('Single Thread');
            console.log('Best node: ' + result_montecarlo);
            console.log(cnt);
            end(result_montecarlo);
            return;
        }
        //==============================================================

        //===============================depth >= 1 の時、αβ法を用いる
        var common = {
            depth: depth,
            depth1EvalValues: [
                { column: 0, sc: null },
                { column: 1, sc: null },
                { column: 2, sc: null },
                { column: 3, sc: null },
                { column: 4, sc: null },
                { column: 5, sc: null },
                { column: 6, sc: null },
                { column: 7, sc: null },
                { column: 8, sc: null },
                { column: 9, sc: null },
                { column: 10, sc: null },
                { column: 11, sc: null }
            ],
            range: {
                handXStart: null,
                handXEnd: null
            },
            evalCount: 0
        };
        if (common.depth % 2 == 0) {//枝刈り（αβカット）最適化のため、浅い探索を探索を行う。深さが偶数の場合、深さを2に、奇数の場合、3にする
            var shallowDepth = 2;
            common.depth = 2;
        } else {
            var shallowDepth = 3;
            common.depth = 3;
        }
        //浅い探索
        var result_alphaBetaDepth2 = alphaBetaDepth2(state.boardStatus, turn * -1, shallowDepth, Infinity * turn * -1, Infinity * turn, state.lastPutHand, common);
        common.depth = depth;

        //得られた各列の評価値を昇順で並び替え
        common.depth1EvalValues.sort(function (a, b) {
            if (a.sc > b.sc) return -1;
            if (a.sc < b.sc) return 1;
            return 0;
        });

        for (var i = 0; i <= 11; i++) {
            state.boardStatus.canPutOrder[i] = common.depth1EvalValues[i].column;
        }
        common.depth1EvalValues = resetDepth1EvalValues(common.depth1EvalValues);

        //メイン探索をThread.jsライブラリを使用してマルチスレッド実行するため、データを渡すためのオブジェクトを作成
        var obj = {
            turn: turn * -1,
            depth: depth,
            a: 999999 * turn * -1,
            b: 999999 * turn,
            map: state.boardStatus.map,
            putHeight: state.boardStatus.putHeight,
            canPutOrder: state.boardStatus.canPutOrder,
            result: state.boardStatus.result,
            hand: {
                X: state.lastPutHand.X,
                Y: state.lastPutHand.Y
            },
            common: {
                depth: depth,
                depth1EvalValues: [
                    { column: 0, sc: null },
                    { column: 1, sc: null },
                    { column: 2, sc: null },
                    { column: 3, sc: null },
                    { column: 4, sc: null },
                    { column: 5, sc: null },
                    { column: 6, sc: null },
                    { column: 7, sc: null },
                    { column: 8, sc: null },
                    { column: 9, sc: null },
                    { column: 10, sc: null },
                    { column: 11, sc: null }
                ],
                range: {
                    handXStart: null,
                    handXEnd: null
                },
                evalCount: 0
            },
        }

        //マルチスレッドでαβ法実行
        var thread = new Thread(AiMultiThread.alphaBeta);
        thread.once(obj)
            .progress(function (i) {//進捗状況を返す
                bar.value = (i / Math.pow(12, depth) * 100);
                txt.value = bar.value.toFixed(toFixed);//深さ8なら少数第1位まで、深さが増えるごとに桁が1増える
            })
            .done(function (a) {
                state.boardStatus.result = a[0];//演算によって導き出された最善の手
                state.is_thinkAI_finished = true;//演算が終了したフラグ
                return;
            });

        //=============================== 内部関数
        function end(result) {
            state.boardStatus.result = result;
            state.is_thinkAI_finished = true;
            return;
        }
    }

    function alphaBetaDepth2(boardStatus, turn, depth, a, b, hand, common) {
        var best_score = turn * Infinity;
        var besthand;
        if (depth === 0) {
            best_score = evalValue(boardStatus.map, -1) - evalValue(boardStatus.map, 1);// turn=1がプレイヤー、-1がCPUであるため
            common.evalCount++;
            return [besthand, best_score];
        }
        var handX;
        for (var i = 0; i <= 11; i++) {
            handX = i;
            //既に天井で積めなかった場合
            if (!canPut(boardStatus, handX, turn)) {
                continue;
            }
            var boardStatus = putMap(boardStatus, handX, turn);
            var sc = alphaBetaDepth2(boardStatus, turn * -1, depth - 1, b, a, hand, common)[1];
            var boardStatus = excludeMap(boardStatus, handX);
            if (besthand === void 0) {
                best_score = sc;
                besthand = handX;
            }
            if (turn === 1 && sc < best_score) {
                best_score = sc;
                besthand = handX;
            } else if (turn === -1 && sc > best_score) {
                best_score = sc;
                besthand = handX;
            }
            if (depth == common.depth) {
                common.depth1EvalValues[i].sc = sc;
                if (i == 11) {
                    return [besthand, best_score, common.depth1EvalValues];
                }
            }
        }
        return [besthand, best_score];
    }

    //評価関数
    function evalValue(map, turn) {
        var i, j, evalValue = 0;
        //評価値
        var p1 = 1, //---o
            p2 = 1, //--o-
            p3 = 4, //--oo
            p4 = 1, //-o--
            p5 = 4, //-o-o
            p6 = 4, //-oo-
            p7 = 16, //-ooo
            p8 = 1, //o---
            p9 = 4, //o--o
            p10 = 4, //o-o-
            p11 = 16, //o-oo
            p12 = 4, //oo--
            p13 = 16, //oo-o
            p14 = 16, //ooo-
            p15 = 64; //oooo

        for (i = 0; i <= 8; i++) {
            for (j = 0; j <= 8; j++) {
                //---o
                //先手
                //右上～左下
                if (map[i][j] == 0 && map[i + 1][j + 1] == 0 && map[i + 2][j + 2] == 0 && map[i + 3][j + 3] == turn) {
                    evalValue = evalValue + p1;
                }
                //左上～右下
                if (map[i + 3][j] == 0 && map[i + 2][j + 1] == 0 && map[i + 1][j + 2] == 0 && map[i][j + 3] == turn) {
                    evalValue = evalValue + p1;
                }

                //--o-
                //先手
                //右上～左下
                if (map[i][j] == 0 && map[i + 1][j + 1] == 0 && map[i + 2][j + 2] == turn && map[i + 3][j + 3] == 0) {
                    evalValue = evalValue + p2;
                }
                //左上～右下
                if (map[i + 3][j] == 0 && map[i + 2][j + 1] == 0 && map[i + 1][j + 2] == turn && map[i][j + 3] == 0) {
                    evalValue = evalValue + p2;
                }

                //--oo
                //先手
                //右上～左下
                if (map[i][j] == 0 && map[i + 1][j + 1] == 0 && map[i + 2][j + 2] == turn && map[i + 3][j + 3] == turn) {
                    evalValue = evalValue + p3;
                }
                //左上～右下
                if (map[i + 3][j] == 0 && map[i + 2][j + 1] == 0 && map[i + 1][j + 2] == turn && map[i][j + 3] == turn) {
                    evalValue = evalValue + p3;
                }

                //-o--
                //先手
                //右上～左下
                if (map[i][j] == 0 && map[i + 1][j + 1] == turn && map[i + 2][j + 2] == 0 && map[i + 3][j + 3] == 0) {
                    evalValue = evalValue + p4;
                }
                //左上～右下
                if (map[i + 3][j] == 0 && map[i + 2][j + 1] == turn && map[i + 1][j + 2] == 0 && map[i][j + 3] == 0) {
                    evalValue = evalValue + p4;
                }

                //-o-o
                //先手
                //右上～左下
                if (map[i][j] == 0 && map[i + 1][j + 1] == turn && map[i + 2][j + 2] == 0 && map[i + 3][j + 3] == turn) {
                    evalValue = evalValue + p5;
                }
                //左上～右下
                if (map[i + 3][j] == 0 && map[i + 2][j + 1] == turn && map[i + 1][j + 2] == 0 && map[i][j + 3] == turn) {
                    evalValue = evalValue + p5;
                }

                //-oo-
                //先手
                //右上～左下
                if (map[i][j] == 0 && map[i + 1][j + 1] == turn && map[i + 2][j + 2] == turn && map[i + 3][j + 3] == 0) {
                    evalValue = evalValue + p6;
                }
                //左上～右下
                if (map[i + 3][j] == 0 && map[i + 2][j + 1] == turn && map[i + 1][j + 2] == turn && map[i][j + 3] == 0) {
                    evalValue = evalValue + p6;
                }

                //-ooo
                //先手
                //右上～左下
                if (map[i][j] == 0 && map[i + 1][j + 1] == turn && map[i + 2][j + 2] == turn && map[i + 3][j + 3] == turn) {
                    evalValue = evalValue + p7;
                }
                //左上～右下
                if (map[i + 3][j] == 0 && map[i + 2][j + 1] == turn && map[i + 1][j + 2] == turn && map[i][j + 3] == turn) {
                    evalValue = evalValue + p7;
                }

                //o---
                //先手
                //右上～左下
                if (map[i][j] == turn && map[i + 1][j + 1] == 0 && map[i + 2][j + 2] == 0 && map[i + 3][j + 3] == 0) {
                    evalValue = evalValue + p8;
                }
                //左上～右下
                if (map[i + 3][j] == turn && map[i + 2][j + 1] == 0 && map[i + 1][j + 2] == 0 && map[i][j + 3] == 0) {
                    evalValue = evalValue + p8;
                }

                //o--o
                //先手
                //右上～左下
                if (map[i][j] == turn && map[i + 1][j + 1] == 0 && map[i + 2][j + 2] == 0 && map[i + 3][j + 3] == turn) {
                    evalValue = evalValue + p9;
                }
                //左上～右下
                if (map[i + 3][j] == turn && map[i + 2][j + 1] == 0 && map[i + 1][j + 2] == 0 && map[i][j + 3] == turn) {
                    evalValue = evalValue + p9;
                }

                //o-o-
                //先手
                //右上～左下
                if (map[i][j] == turn && map[i + 1][j + 1] == 0 && map[i + 2][j + 2] == turn && map[i + 3][j + 3] == 0) {
                    evalValue = evalValue + p10;
                }
                //左上～右下
                if (map[i + 3][j] == turn && map[i + 2][j + 1] == 0 && map[i + 1][j + 2] == turn && map[i][j + 3] == 0) {
                    evalValue = evalValue + p10;
                }

                //o-oo
                //先手
                //右上～左下
                if (map[i][j] == turn && map[i + 1][j + 1] == 0 && map[i + 2][j + 2] == turn && map[i + 3][j + 3] == turn) {
                    evalValue = evalValue + p11;
                }
                //左上～右下
                if (map[i + 3][j] == turn && map[i + 2][j + 1] == 0 && map[i + 1][j + 2] == turn && map[i][j + 3] == turn) {
                    evalValue = evalValue + p11;
                }

                //oo--
                //先手
                //右上～左下
                if (map[i][j] == turn && map[i + 1][j + 1] == turn && map[i + 2][j + 2] == 0 && map[i + 3][j + 3] == 0) {
                    evalValue = evalValue + p12;
                }
                //左上～右下
                if (map[i + 3][j] == turn && map[i + 2][j + 1] == turn && map[i + 1][j + 2] == 0 && map[i][j + 3] == 0) {
                    evalValue = evalValue + p12;
                }

                //oo-o
                //先手
                //右上～左下
                if (map[i][j] == turn && map[i + 1][j + 1] == turn && map[i + 2][j + 2] == 0 && map[i + 3][j + 3] == turn) {
                    evalValue = evalValue + p13;
                }
                //左上～右下
                if (map[i + 3][j] == turn && map[i + 2][j + 1] == turn && map[i + 1][j + 2] == 0 && map[i][j + 3] == turn) {
                    evalValue = evalValue + p13;
                }

                //ooo-
                //先手
                //右上～左下
                if (map[i][j] == turn && map[i + 1][j + 1] == turn && map[i + 2][j + 2] == turn && map[i + 3][j + 3] == 0) {
                    evalValue = evalValue + p14;
                }
                //左上～右下
                if (map[i + 3][j] == turn && map[i + 2][j + 1] == turn && map[i + 1][j + 2] == turn && map[i][j + 3] == 0) {
                    evalValue = evalValue + p14;
                }

                //oooo
                //先手
                //右上～左下
                if (map[i][j] == turn && map[i + 1][j + 1] == turn && map[i + 2][j + 2] == turn && map[i + 3][j + 3] == turn) {
                    evalValue = evalValue + p15;
                }
                //左上～右下
                if (map[i + 3][j] == turn && map[i + 2][j + 1] == turn && map[i + 1][j + 2] == turn && map[i][j + 3] == turn) {
                    evalValue = evalValue + p15;
                }
            }
        }

        for (i = 0; i <= 8; i++) {
            for (j = 0; j <= 11; j++) {
                //縦
                if (map[i][j] == turn && map[i + 1][j] == 0 && map[i + 2][j] == 0 && map[i + 3][j] == 0) {
                    evalValue = evalValue + p8;
                }
                //縦
                if (map[i][j] == turn && map[i + 1][j] == turn && map[i + 2][j] == 0 && map[i + 3][j] == 0) {
                    evalValue = evalValue + p12;
                }
                //縦
                if (map[i][j] == turn && map[i + 1][j] == turn && map[i + 2][j] == turn && map[i + 3][j] == 0) {
                    evalValue = evalValue + p14;
                }
                //縦
                if (map[i][j] == turn && map[i + 1][j] == turn && map[i + 2][j] == turn && map[i + 3][j] == turn) {
                    evalValue = evalValue + p15;
                }
            }
        }

        for (i = 0; i <= 8; i++) {
            for (j = 0; j <= 8; j++) {
                //横
                if (map[i][j] == 0 && map[i][j + 1] == 0 && map[i][j + 2] == 0 && map[i][j + 3] == turn) {
                    evalValue = evalValue + p1;
                }
                //横
                if (map[i][j] == 0 && map[i][j + 1] == 0 && map[i][j + 2] == turn && map[i][j + 3] == 0) {
                    evalValue = evalValue + p2;
                }
                //横
                if (map[i][j] == 0 && map[i][j + 1] == 0 && map[i][j + 2] == turn && map[i][j + 3] == turn) {
                    evalValue = evalValue + p3;
                }
                //横
                if (map[i][j] == 0 && map[i][j + 1] == turn && map[i][j + 2] == 0 && map[i][j + 3] == 0) {
                    evalValue = evalValue + p4;
                }
                //横
                if (map[i][j] == 0 && map[i][j + 1] == turn && map[i][j + 2] == 0 && map[i][j + 3] == turn) {
                    evalValue = evalValue + p5;
                }
                //横
                if (map[i][j] == 0 && map[i][j + 1] == turn && map[i][j + 2] == turn && map[i][j + 3] == 0) {
                    evalValue = evalValue + p6;
                }
                //横
                if (map[i][j] == 0 && map[i][j + 1] == turn && map[i][j + 2] == turn && map[i][j + 3] == turn) {
                    evalValue = evalValue + p7;
                }
                //横
                if (map[i][j] == turn && map[i][j + 1] == 0 && map[i][j + 2] == 0 && map[i][j + 3] == 0) {
                    evalValue = evalValue + p8;
                }
                //横
                if (map[i][j] == turn && map[i][j + 1] == 0 && map[i][j + 2] == 0 && map[i][j + 3] == turn) {
                    evalValue = evalValue + p9;
                }
                //横
                if (map[i][j] == turn && map[i][j + 1] == 0 && map[i][j + 2] == turn && map[i][j + 3] == 0) {
                    evalValue = evalValue + p10;
                }
                //横
                if (map[i][j] == turn && map[i][j + 1] == 0 && map[i][j + 2] == turn && map[i][j + 3] == turn) {
                    evalValue = evalValue + p11;
                }
                //横
                if (map[i][j] == turn && map[i][j + 1] == turn && map[i][j + 2] == 0 && map[i][j + 3] == 0) {
                    evalValue = evalValue + p12;
                }
                //横
                if (map[i][j] == turn && map[i][j + 1] == turn && map[i][j + 2] == 0 && map[i][j + 3] == turn) {
                    evalValue = evalValue + p13;
                }
                //横
                if (map[i][j] == turn && map[i][j + 1] == turn && map[i][j + 2] == turn && map[i][j + 3] == 0) {
                    evalValue = evalValue + p14;
                }
                //横
                if (map[i][j] == turn && map[i][j + 1] == turn && map[i][j + 2] == turn && map[i][j + 3] == turn) {
                    evalValue = evalValue + p15;
                }
            }
        }
        return evalValue;
    }

    //駒を置いた盤面を返す
    function putMap(boardStatus, handX, turn) {
        boardStatus.putHeight[handX] += 1;//1積む
        boardStatus.map[boardStatus.putHeight[handX] - 1][handX] = turn;
        return boardStatus;
    }

    //駒を除いた盤面を返す
    function excludeMap(boardStatus, handX) {
        boardStatus.map[boardStatus.putHeight[handX] - 1][handX] = 0;
        boardStatus.putHeight[handX] -= 1;//1積む
        return boardStatus;
    }

    // 1つ駒を置き、4つ並ぶ場所があればその手を返す
    function checkReach(boardStatus, range, turn) {
        for (let handX = range.handXStart; handX <= range.handXEnd; handX++) {
            //既に天井で積めなかった場合
            if (!canPutCeiling(boardStatus, handX)) {
                continue;
            }
            boardStatus = putMap(boardStatus, handX, turn);
            if (Rule.isFourInLine(boardStatus, handX, turn)) {
                boardStatus = excludeMap(boardStatus, handX);
                return handX;
            }
            boardStatus = excludeMap(boardStatus, handX);
        }
        return -1;
    }

    // 初期化
    function resetDepth1EvalValues(depth1EvalValues) {
        return depth1EvalValues = [
            { column: 0, sc: null },
            { column: 1, sc: null },
            { column: 2, sc: null },
            { column: 3, sc: null },
            { column: 4, sc: null },
            { column: 5, sc: null },
            { column: 6, sc: null },
            { column: 7, sc: null },
            { column: 8, sc: null },
            { column: 9, sc: null },
            { column: 10, sc: null },
            { column: 11, sc: null },
        ];
    }

    // 駒を置いた場所から±3の範囲を返す
    function searchRange(handX) {
        return {
            handXStart: handX - 3 < 0 ? 0 : handX - 3,
            handXEnd: handX + 3 > 11 ? 11 : handX + 3,
        };
    }

    // 指定した列が天井で置けなければ false を返す
    function canPutCeiling(boardStatus, handX) {
        return boardStatus.putHeight[handX] == 12 ? false : true;
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
        if (Rule.isFourInLine(boardStatus, handX, turn * -1)) {
            boardStatus = excludeMap(boardStatus, handX);
            boardStatus = excludeMap(boardStatus, handX);
            return false;//空中リーチあり。置けない事が判明
        }
        //2つ置いた駒を取り除く
        boardStatus = excludeMap(boardStatus, handX);
        boardStatus = excludeMap(boardStatus, handX);
        return true;
    }

    // Wリーチがあるか
    function checkDoubleReach(boardStatus, range, turn) {
        for (let handX = range.handXStart; handX <= range.handXEnd; handX++) {
            //既に天井で積めなかった場合
            if (!canPut(boardStatus, handX, turn)) {
                continue;
            }
            boardStatus = putMap(boardStatus, handX, turn);
            let rangeD1 = searchRange(handX);
            let checkReachD1 = checkReach(boardStatus, rangeD1, turn);
            if (checkReachD1 == -1) { //プレイヤーがリーチしなかった
                boardStatus = excludeMap(boardStatus, handX);
                continue;
            }
            // プレイヤーがリーチしたのでCPUが防ぐ
            if (!canPutCeiling(boardStatus, checkReachD1)) { //天井かどうか
                boardStatus = excludeMap(boardStatus, handX);
                continue;
            }
            boardStatus = putMap(boardStatus, checkReachD1, turn * -1);
            if (checkReach(boardStatus, rangeD1, turn) >= 0) { //CPUが1手前でプレイヤーのリーチ防ぎ、かつプレイヤーがリーチしている
                boardStatus = excludeMap(boardStatus, checkReachD1);
                boardStatus = excludeMap(boardStatus, handX);
                return handX;
            }
            boardStatus = excludeMap(boardStatus, checkReachD1);
            boardStatus = excludeMap(boardStatus, handX);
        }

        return -1;
    }

    // 連続リーチがあるか
    function checkContinuityReach(boardStatus, range, turn) {
        for (let handX = range.handXStart; handX <= range.handXEnd; handX++) {
            // 置けない場合
            if (!canPut(boardStatus, handX, turn)) {
                continue;
            }
            boardStatus = putMap(boardStatus, handX, turn);
            //=========================
            //盤情報が格納された配列を表示
            // Debug.displayMap(boardStatus.map);
            //=========================
            let checkReachD1 = checkReach(boardStatus, range, turn);
            if (checkReachD1 == -1) {//自分がリーチしなかった
                boardStatus = excludeMap(boardStatus, handX);
                continue;
            }
            //自分がリーチしたのでCPUが防ぐ
            boardStatus = putMap(boardStatus, checkReachD1, turn * -1);
            let rangeD2 = searchRange(handX);
            let checkReachD2 = checkReach(boardStatus, rangeD2, turn * -1);
            // CPUが防いだらがCPUがリーチした
            if (checkReachD2 >= 0) {
                rangeD2.handXStart = checkReachD2;
                rangeD2.handXEnd = checkReachD2;
            }
            //=========================
            //盤情報が格納された配列を表示
            // Debug.displayMap(boardStatus.map);
            //=========================
            //CPUが1手前で自分のリーチ防ぎ、かつ自分がリーチしている
            if (checkReach(boardStatus, rangeD2, turn) >= 0) {
                boardStatus = excludeMap(boardStatus, checkReachD1);
                boardStatus = excludeMap(boardStatus, handX);
                return handX;//終了
            }
            //=============================再帰
            let result_checkContinuityReach = checkContinuityReach(boardStatus, rangeD2, turn);
            //=============================
            boardStatus = excludeMap(boardStatus, checkReachD1);
            boardStatus = excludeMap(boardStatus, handX);
            if (result_checkContinuityReach >= 0) {
                return handX;
            }
        }
        return -1;
    }

    //全ての列が天井まで積まれているか（trueなら引き分け）
    function isCeiling(boardStatus) {
        for (let i = 0; i <= 11; i++) {
            if (boardStatus.putHeight[i] != 12) {
                return false;//既に天井なので置けない
            }
        }
        return true;
    }

    // モンテカルロ木探索
    function montecarlo(boardStatus, turn) {
        let TotalPlayoutCount = 10; // 総プレイアウト数
        let LimitPlayoutCount = parseInt(document.montecarlo.LimitPlayoutCount.value, 10) + 10; // プレイアウトを打ち切る回数（総プレイアウト数）
        let threshold = document.montecarlo.threshold.value; // 現在のノードから枝を展開させるための閾値
        let result = [];
        for (let i = 0; i <= 11; i++) {
            result[i] = {
                win: 0, // 勝利数
                lose: 0, // 敗北数
                ucb: 100, // UCB値
                playoutCount: 0, // 現在のノードのプレイアウト回数
                nextNode: null, // 子ノード
                parentNode: null, // 親ノードへの参照
            }
        }
        let bestNode; // 最良と判断したノード
        let initTurn = turn; // 引数「turn」の初期値を格納
        let currentResult = result; // 現在選択されているノード
        let tempResult; // 一時的に現在のcurrentResultの参照を複製
        let won; // プレイアウトに勝利したプレイヤーが格納される。1ならプレイヤー、-1ならコンピュータ

        // 各オブジェクトの初期値を値渡しで格納
        let mapBeforePlayout = Util.objCopy(boardStatus.map);
        let putHeightBeforePlayout = Util.objCopy(boardStatus.putHeight);
        let resultBeforePlayout = Util.objCopy(result);

        for (let i = 0; i <= 11; i++) {
            // 積めなかった場合
            if (!canPut(boardStatus, i, turn)) {
                result[i].ucb = 0;
                continue;
            }
            // プレイアウト開始時の1手目
            boardStatus = putMap(boardStatus, i, turn);
            // 初めに各ノードで深さ1のプレイアウトを行う
            playout(result[i], boardStatus, i, turn * -1, turn);
            // プレイアウトの結果からUCBを算出する
            result[i].ucb = calcUcb(result[i], TotalPlayoutCount);
        }

        TotalPlayoutCount--;

        // 最も高いUCBのノードでプレイアウトを行う(全体でプレイアウトをplayoutCount回行ったら打ち切り)
        while (TotalPlayoutCount <= LimitPlayoutCount) {
            turn = initTurn;
            // 最も高いUCBのノードを選ぶ
            bestNode = calcBestUcbNode(currentResult, boardStatus, turn);
            boardStatus = putMap(boardStatus, bestNode, turn);
            if (currentResult[bestNode].nextNode == null) { // 現在のノードが子ノードである
                // プレイアウト開始
                playout(currentResult[bestNode], boardStatus, bestNode, turn * -1, turn);
                currentResult[bestNode].ucb = calcUcb(currentResult[bestNode], TotalPlayoutCount);
                // bestNodeのプレイアウト回数が閾値を超えた場合、子ノードを展開する
                if (currentResult[bestNode].playoutCount > threshold && currentResult[bestNode].nextNode == null) {
                    growTree(currentResult[bestNode], resultBeforePlayout);
                }
            } else { // 現在のノードが親ノードである場合
                tempResult = currentResult;
                let tempBest = bestNode; // 一時的に現在のbestNodeの値を複製
                while (currentResult[bestNode].nextNode != null) {
                    currentResult = currentResult[bestNode].nextNode;
                    let range = searchRange(bestNode);
                    // 4つ並ぶ
                    let result_checkReach = checkReach(boardStatus, range, turn * -1);
                    if (result_checkReach >= 0) {
                        bestNode = result_checkReach;
                        boardStatus = putMap(boardStatus, bestNode, turn * -1);
                        turn = turn * -1;
                        continue;
                    }
                    // 相手のリーチを防ぐ
                    result_checkReach = checkReach(boardStatus, range, turn);
                    if (result_checkReach >= 0) {
                        bestNode = result_checkReach;
                        boardStatus = putMap(boardStatus, bestNode, turn * -1);
                        turn = turn * -1;
                        continue;
                    }
                    // 連続リーチ
                    let result_checkContinuityReach = checkContinuityReach(boardStatus, range, turn * -1);
                    if (result_checkContinuityReach >= 0) {
                        bestNode = result_checkContinuityReach;
                        boardStatus = putMap(boardStatus, bestNode, turn * -1);
                        turn = turn * -1;
                        continue;
                    }
                    bestNode = calcBestUcbNode(currentResult, boardStatus, turn);
                    boardStatus = putMap(boardStatus, bestNode, turn * -1);
                    turn = turn * -1;
                }
                // プレイアウト開始
                playout(currentResult[bestNode], boardStatus, bestNode, turn * -1, turn);
                currentResult[bestNode].ucb = calcUcb(currentResult[bestNode], TotalPlayoutCount);
                tempResult = currentResult[bestNode];
                do {
                    if (turn == 1) {
                        won == -1 ? tempResult.parentNode.win++ : tempResult.parentNode.lose++;
                    } else {
                        won == 1 ? tempResult.parentNode.win++ : tempResult.parentNode.lose++;
                    }
                    tempResult.parentNode.playoutCount++;
                    tempResult.parentNode.ucb = calcUcb(tempResult.parentNode, TotalPlayoutCount);
                    tempResult = tempResult.parentNode;
                    turn = turn * -1;
                } while (tempResult.parentNode != null);
                // bestNodeのプレイアウト回数が閾値を超えた場合、節点を展開する
                if (currentResult[bestNode].playoutCount > threshold && currentResult[bestNode].nextNode == null) {
                    growTree(currentResult[bestNode], resultBeforePlayout);
                }
                currentResult = result;
            }
        }
        // 最もプレイアウト回数の多いノードを選ぶ
        bestNode = calcBestNode(result, initTurn);
        console.dir(result);
        return bestNode;

        // ================= 内部関数（クロージャ）
        function playout(result, boardStatus, node, turn, compareTurn) {
            let handX = node;
            let n = 0;
            let result_checkReach;

            TotalPlayoutCount++;
            result.playoutCount++;

            // 対局の勝敗が決定するまでループ（対局は最大144手で必ず終了する）
            while (1) {
                let range = searchRange(handX);
                // 4つ並んだ
                if (Math.sign(checkReach(boardStatus, range, turn) + 1) === 1) {
                    break;
                }
                // リーチを防ぐ
                result_checkReach = checkReach(boardStatus, range, turn * -1);
                if (Math.sign(result_checkReach + 1) === 1) {
                    handX = result_checkReach;
                    turn = turn * -1;
                    continue;
                }
                // 連続リーチ
                if (Math.sign(checkContinuityReach(boardStatus, range, turn) + 1) === 1) {
                    break;
                }
                // ランダムで手を選択する
                // ランダムで選んだ手が正常に置けるまで選択し続ける
                while (1) {
                    handX = Math.floor(Math.random() * 12);
                    if (canPut(boardStatus, handX, turn) == true) {
                        break;
                    }
                    n++;
                    if (n > 50) {
                        if (isCeiling(boardStatus)) {
                            won = turn;
                            turn == compareTurn ? result.win++ : result.lose++;
                            boardStatus.map = Util.objCopy(mapBeforePlayout);
                            boardStatus.putHeight = Util.objCopy(putHeightBeforePlayout);
                            return;
                        }
                        do {
                            handX = Math.floor(Math.random() * 12);
                        } while (canPutCeiling(boardStatus, handX) == false);
                        break;
                    }
                }

                n = 0;
                boardStatus = putMap(boardStatus, handX, turn);
                turn = turn * -1;
            }

            won = turn;
            turn == compareTurn ? result.win++ : result.lose++;

            // プレイアウト開始時の1手目の盤面に復元する
            boardStatus.map = Util.objCopy(mapBeforePlayout);
            boardStatus.putHeight = Util.objCopy(putHeightBeforePlayout);

            return;
        }

        //UCB値の算出
        function calcUcb(result, totalPlayoutCount) {
            let Pi;
            let Si = result.win + result.lose;
            let C = 0.55; //定数
            Pi = result.win / Si;
            return Pi + C * Math.sqrt(2 * Math.log(totalPlayoutCount) / Si);
        }

        // 最も高いUCBのノードを算出
        function calcBestUcbNode(result, boardStatus, turn) {
            let bestNode = -1;
            let bestUcb = -1;
            for (let i = 0; i <= 11; i++) {
                if (result[i].ucb > bestUcb && canPut(boardStatus, i, turn) == true) {
                    bestNode = i;
                    bestUcb = result[i].ucb;
                }
            }
            return bestNode;
        }

        // 最もプレイアウト回数の多いノードを算出
        function calcBestNode(result, turn) {
            let bestNode = 0;
            let bestN = result[0].playoutCount;
            for (let i = 1; i <= 11; i++) {
                if (result[i].playoutCount > bestN) {
                    bestNode = i;
                    bestN = result[i].playoutCount;
                }
            }
            return bestNode;
        }

        // 節点を展開する
        function growTree(result, resultBeforePlayout) {
            result.nextNode = Util.objCopy(resultBeforePlayout);
            //子ノードに親ノードを定義
            for (let i = 0; i <= 11; i++) {
                result.nextNode[i].parentNode = result;
            }
        }
    }

})((this || 0).self || global);