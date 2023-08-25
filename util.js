(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function Util() { }

    // Header -----------------------------------------------
    global.Util = Util;
    global.Util.objCopy = objCopy;

    function objCopy(obj) {
        return $.extend(true, {}, obj);
    }

})((this || 0).self || global);