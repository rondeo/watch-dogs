"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildPersonData(_a) {
    var firstName = _a.firstName, lastName = _a.lastName;
    var address = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        address[_i - 1] = arguments[_i];
    }
    return firstName + " " + lastName + " " + address;
}
exports.buildPersonData = buildPersonData;
//# sourceMappingURL=buildPersonData.js.map