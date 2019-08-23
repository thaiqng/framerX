"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OutdatedPackage;
(function (OutdatedPackage) {
    function fromTableRow(row) {
        return {
            name: row[0],
            current: row[1],
            wanted: row[2],
            latest: row[3],
            type: row[4],
        };
    }
    OutdatedPackage.fromTableRow = fromTableRow;
})(OutdatedPackage = exports.OutdatedPackage || (exports.OutdatedPackage = {}));
