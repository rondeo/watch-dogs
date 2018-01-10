"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var buildPersonData_1 = require("./buildPersonData");
var partialAddress = ["Street Name",
    "Street Number", "Po Box"];
var firstName = 'Kobe', lastName = 'Bryant';
var personData = {
    firstName: firstName,
    lastName: lastName
};
var address = partialAddress.concat(['Staples Center']);
console.log(buildPersonData_1.buildPersonData(personData, address));
//# sourceMappingURL=hello-world.js.map