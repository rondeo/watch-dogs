webpackJsonp([1],{

/***/ "../../../../../src async recursive":
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	throw new Error("Cannot find module '" + req + "'.");
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = "../../../../../src async recursive";

/***/ }),

/***/ "../../../../../src/app/about/about.component.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/about/about.component.html":
/***/ (function(module, exports) {

module.exports = "<h3>About Component</h3>\r\n<p>This is the about component!</p>"

/***/ }),

/***/ "../../../../../src/app/about/about.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AboutComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var AboutComponent = (function () {
    function AboutComponent() {
    }
    return AboutComponent;
}());
AboutComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'about',
        styles: [__webpack_require__("../../../../../src/app/about/about.component.css")],
        template: __webpack_require__("../../../../../src/app/about/about.component.html")
    })
], AboutComponent);

//# sourceMappingURL=about.component.js.map

/***/ }),

/***/ "../../../../../src/app/app.component.html":
/***/ (function(module, exports) {

module.exports = "<diV>\r\n    {{menu | async}}\r\n    <md-sidenav-container >\r\n        <md-sidenav #sidenav>\r\n            <md-list>\r\n                <a md-list-item routerLink='/ss-main'>ShapeShift Selected</a>\r\n            </md-list>\r\n\r\n        </md-sidenav>\r\n\r\n        <div>\r\n            <div (click)=\"sidenav.open()\" class=\"fa fa-bars\">  </div>\r\n        </div>\r\n        <router-outlet></router-outlet>\r\n    </md-sidenav-container>\r\n</diV>"

/***/ }),

/***/ "../../../../../src/app/app.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/@angular/router.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

//import {AuthHttp} from './libs/angular2-jwt';


var AppComponent = (function () {
    function AppComponent(http, router) {
        this.http = http;
        this.router = router;
        this.title = 'app works!';
    }
    AppComponent.prototype.ngOnInit = function () {
        /*   this.http.authError.subscribe((err:any)=>{
             console.warn(err);
             this.router.navigateByUrl('/login');
           });
       */
        /*this.menu = this.http.get('http://localhost:8090/api/menu/1').map(res=>{
    
          console.log(res.json().menu);
          return res.json().menu;
        })*/
    };
    return AppComponent;
}());
AppComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'app-root',
        template: __webpack_require__("../../../../../src/app/app.component.html")
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_2__angular_http__["b" /* Http */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__angular_http__["b" /* Http */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */]) === "function" && _b || Object])
], AppComponent);

var _a, _b;
//# sourceMappingURL=app.component.js.map

/***/ }),

/***/ "../../../../../src/app/app.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__("../../../platform-browser/@angular/platform-browser.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__("../../../forms/@angular/forms.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_router__ = __webpack_require__("../../../router/@angular/router.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__app_routes__ = __webpack_require__("../../../../../src/app/app.routes.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__app_component__ = __webpack_require__("../../../../../src/app/app.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_rxjs_add_operator_map__ = __webpack_require__("../../../../rxjs/add/operator/map.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_rxjs_add_operator_map___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_7_rxjs_add_operator_map__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_rxjs_add_operator_toPromise__ = __webpack_require__("../../../../rxjs/add/operator/toPromise.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_rxjs_add_operator_toPromise___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_8_rxjs_add_operator_toPromise__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9_rxjs_add_observable_throw__ = __webpack_require__("../../../../rxjs/add/observable/throw.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9_rxjs_add_observable_throw___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_9_rxjs_add_observable_throw__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10_rxjs_operator_publishLast__ = __webpack_require__("../../../../rxjs/operator/publishLast.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10_rxjs_operator_publishLast___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_10_rxjs_operator_publishLast__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__about_about_component__ = __webpack_require__("../../../../../src/app/about/about.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__home_home_component__ = __webpack_require__("../../../../../src/app/home/home.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__github_repo_browser_repo_browser_component__ = __webpack_require__("../../../../../src/app/github/repo-browser/repo-browser.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__github_repo_list_repo_list_component__ = __webpack_require__("../../../../../src/app/github/repo-list/repo-list.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__github_repo_detail_repo_detail_component__ = __webpack_require__("../../../../../src/app/github/repo-detail/repo-detail.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__contact_contact_component__ = __webpack_require__("../../../../../src/app/contact/contact.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__github_shared_github_service__ = __webpack_require__("../../../../../src/app/github/shared/github.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__login_login_main_component__ = __webpack_require__("../../../../../src/app/login/login-main.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__login_login_service__ = __webpack_require__("../../../../../src/app/login/login.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_20__home_home_service__ = __webpack_require__("../../../../../src/app/home/home.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_21__ss_browse_ss_browse_module__ = __webpack_require__("../../../../../src/app/ss-browse/ss-browse.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_22__material_app_module__ = __webpack_require__("../../../../../src/app/material-app.module.ts");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};







//import { TestComponent } from '../../arch/test/test.component';




//import {AuthHttp, AuthModule, provideAuth, AuthConfig} from './libs/angular2-jwt';









//import {BrowserAnimationsModule} from '@angular/platform-browser/animations';



var AppModule = (function () {
    function AppModule() {
    }
    return AppModule;
}());
AppModule = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__angular_core__["b" /* NgModule */])({
        declarations: [
            __WEBPACK_IMPORTED_MODULE_6__app_component__["a" /* AppComponent */],
            // TestComponent,
            __WEBPACK_IMPORTED_MODULE_11__about_about_component__["a" /* AboutComponent */],
            __WEBPACK_IMPORTED_MODULE_13__github_repo_browser_repo_browser_component__["a" /* RepoBrowserComponent */],
            __WEBPACK_IMPORTED_MODULE_14__github_repo_list_repo_list_component__["a" /* RepoListComponent */],
            __WEBPACK_IMPORTED_MODULE_15__github_repo_detail_repo_detail_component__["a" /* RepoDetailComponent */],
            __WEBPACK_IMPORTED_MODULE_12__home_home_component__["a" /* HomeComponent */],
            __WEBPACK_IMPORTED_MODULE_16__contact_contact_component__["a" /* ContactComponent */],
            __WEBPACK_IMPORTED_MODULE_18__login_login_main_component__["a" /* LoginMain */]
        ],
        imports: [
            __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["a" /* BrowserModule */],
            __WEBPACK_IMPORTED_MODULE_2__angular_forms__["a" /* FormsModule */],
            __WEBPACK_IMPORTED_MODULE_2__angular_forms__["b" /* ReactiveFormsModule */],
            __WEBPACK_IMPORTED_MODULE_21__ss_browse_ss_browse_module__["a" /* SsBrowseModule */],
            __WEBPACK_IMPORTED_MODULE_22__material_app_module__["a" /* MaterialAppModule */],
            // MaterialModule,
            // BrowserAnimationsModule,
            __WEBPACK_IMPORTED_MODULE_3__angular_http__["a" /* HttpModule */],
            // AuthModule,
            __WEBPACK_IMPORTED_MODULE_4__angular_router__["a" /* RouterModule */].forRoot(__WEBPACK_IMPORTED_MODULE_5__app_routes__["a" /* rootRouterConfig */], { useHash: true })
        ],
        providers: [
            //AuthHttp,
            __WEBPACK_IMPORTED_MODULE_17__github_shared_github_service__["a" /* GithubService */],
            __WEBPACK_IMPORTED_MODULE_19__login_login_service__["a" /* LoginService */],
            __WEBPACK_IMPORTED_MODULE_20__home_home_service__["a" /* HomeService */]
            // provideAuth({
            // headerName: 'Authorization',
            //  headerPrefix: 'Bearer',
            //  tokenName: 'token',
            // tokenGetter: (() => localStorage.getItem('id_token')),
            //  globalHeaders: [{ 'Content-Type': 'application/json' }],
            // noJwtError: true
            // authError:(why:string)=>{ console.warn(why) }
            // })
        ],
        bootstrap: [__WEBPACK_IMPORTED_MODULE_6__app_component__["a" /* AppComponent */]]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map

/***/ }),

/***/ "../../../../../src/app/app.routes.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__about_about_component__ = __webpack_require__("../../../../../src/app/about/about.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__home_home_component__ = __webpack_require__("../../../../../src/app/home/home.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__github_repo_browser_repo_browser_component__ = __webpack_require__("../../../../../src/app/github/repo-browser/repo-browser.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__github_repo_list_repo_list_component__ = __webpack_require__("../../../../../src/app/github/repo-list/repo-list.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__github_repo_detail_repo_detail_component__ = __webpack_require__("../../../../../src/app/github/repo-detail/repo-detail.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__contact_contact_component__ = __webpack_require__("../../../../../src/app/contact/contact.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__login_login_main_component__ = __webpack_require__("../../../../../src/app/login/login-main.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__ss_browse_ss_main_ss_main_component__ = __webpack_require__("../../../../../src/app/ss-browse/ss-main/ss-main.component.ts");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return rootRouterConfig; });








var rootRouterConfig = [
    { path: '', redirectTo: 'ss-main', pathMatch: 'full' },
    { path: 'home', component: __WEBPACK_IMPORTED_MODULE_1__home_home_component__["a" /* HomeComponent */] },
    { path: 'login', component: __WEBPACK_IMPORTED_MODULE_6__login_login_main_component__["a" /* LoginMain */] },
    { path: 'about', component: __WEBPACK_IMPORTED_MODULE_0__about_about_component__["a" /* AboutComponent */] },
    { path: 'ss-main', component: __WEBPACK_IMPORTED_MODULE_7__ss_browse_ss_main_ss_main_component__["a" /* SsMainComponent */] },
    { path: 'github', component: __WEBPACK_IMPORTED_MODULE_2__github_repo_browser_repo_browser_component__["a" /* RepoBrowserComponent */],
        children: [
            { path: '', component: __WEBPACK_IMPORTED_MODULE_3__github_repo_list_repo_list_component__["a" /* RepoListComponent */] },
            { path: ':org', component: __WEBPACK_IMPORTED_MODULE_3__github_repo_list_repo_list_component__["a" /* RepoListComponent */],
                children: [
                    { path: '', component: __WEBPACK_IMPORTED_MODULE_4__github_repo_detail_repo_detail_component__["a" /* RepoDetailComponent */] },
                    { path: ':repo', component: __WEBPACK_IMPORTED_MODULE_4__github_repo_detail_repo_detail_component__["a" /* RepoDetailComponent */] }
                ]
            }
        ]
    },
    { path: 'contact', component: __WEBPACK_IMPORTED_MODULE_5__contact_contact_component__["a" /* ContactComponent */] }
];
//# sourceMappingURL=app.routes.js.map

/***/ }),

/***/ "../../../../../src/app/contact/contact-component.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".form-content {\r\n  width: 90%;\r\n  max-width: 600px;\r\n  margin: 0 auto;\r\n}\r\n.form-content .sd-form-control {\r\n  display: block;\r\n  margin-bottom: 10px;\r\n  width: 100%;\r\n  padding: 10px;\r\n}\r\n.form-content textarea.sd-form-control {\r\n  max-width: 100%;\r\n}\r\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/contact/contact.component.html":
/***/ (function(module, exports) {

module.exports = "<h2>Contact Reactive Form</h2>\r\n<form (ngSubmit)=\"submitForm()\" [formGroup]=\"contactForm\" novalidate>\r\n  <div class=\"form-content\">\r\n    <label>\r\n      Name:\r\n      <input type=\"text\" formControlName=\"name\" class=\"sd-form-control\" placeholder=\"Enter your name.\">\r\n    </label>\r\n    <label>\r\n      Email:\r\n      <input type=\"email\" formControlName=\"email\" class=\"sd-form-control\" placeholder=\"Enter your email.\">\r\n    </label>\r\n    <label>\r\n      Content:\r\n      <textarea formControlName=\"content\" class=\"sd-form-control\" placeholder=\"Content here.\"></textarea>\r\n    </label>\r\n    <div class=\"form-submit\">\r\n      <button type=\"submit\">Submit</button>\r\n    </div>\r\n  </div>\r\n</form>\r\n\r\n<div class=\"form-value\">\r\n  Form value:\r\n  <pre>\r\n    {{contactForm.value | json}}\r\n  </pre>\r\n  <p>\r\n    Status: {{contactForm.status}}\r\n  </p>\r\n  <p>\r\n    Valid: {{contactForm.valid}}\r\n  </p>\r\n  <p>Submit then open console to see full form.</p>\r\n</div>\r\n\r\n"

/***/ }),

/***/ "../../../../../src/app/contact/contact.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_forms__ = __webpack_require__("../../../forms/@angular/forms.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__forms_CustomValidators__ = __webpack_require__("../../../../../src/app/forms/CustomValidators.ts");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ContactComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var ContactComponent = (function () {
    function ContactComponent(formBuilder) {
        this.formBuilder = formBuilder;
    }
    ContactComponent.prototype.ngOnInit = function () {
        this.contactForm = this.formBuilder.group({
            name: ['', __WEBPACK_IMPORTED_MODULE_1__angular_forms__["h" /* Validators */].required],
            email: ['', [__WEBPACK_IMPORTED_MODULE_1__angular_forms__["h" /* Validators */].required, __WEBPACK_IMPORTED_MODULE_2__forms_CustomValidators__["a" /* default */].validateEmail]],
            content: ['', [__WEBPACK_IMPORTED_MODULE_1__angular_forms__["h" /* Validators */].required, __WEBPACK_IMPORTED_MODULE_1__angular_forms__["h" /* Validators */].minLength(10)]]
        });
    };
    ContactComponent.prototype.submitForm = function () {
        console.log(this.contactForm);
    };
    return ContactComponent;
}());
ContactComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'app-contact',
        template: __webpack_require__("../../../../../src/app/contact/contact.component.html"),
        styles: [__webpack_require__("../../../../../src/app/contact/contact-component.css")]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__angular_forms__["i" /* FormBuilder */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__angular_forms__["i" /* FormBuilder */]) === "function" && _a || Object])
], ContactComponent);

var _a;
//# sourceMappingURL=contact.component.js.map

/***/ }),

/***/ "../../../../../src/app/forms/CustomValidators.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var CustomValidators = (function () {
    function CustomValidators() {
    }
    /**
     * sample from http://blog.thoughtram.io/angular/2016/03/14/custom-validators-in-angular-2.html
     */
    CustomValidators.validateEmail = function (c) {
        var EMAIL_REGEXP = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        return EMAIL_REGEXP.test(c.value) ? null : {
            validateEmail: {
                valid: false
            }
        };
    };
    return CustomValidators;
}());
/* harmony default export */ __webpack_exports__["a"] = (CustomValidators);
//# sourceMappingURL=CustomValidators.js.map

/***/ }),

/***/ "../../../../../src/app/github/repo-browser/repo-browser.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/@angular/router.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shared_github_service__ = __webpack_require__("../../../../../src/app/github/shared/github.service.ts");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return RepoBrowserComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var RepoBrowserComponent = (function () {
    function RepoBrowserComponent(router, github) {
        this.router = router;
        this.github = github;
    }
    RepoBrowserComponent.prototype.searchForOrg = function (orgName) {
        var _this = this;
        this.github.getOrg(orgName)
            .subscribe(function (_a) {
            var name = _a.name;
            console.log(name);
            _this.router.navigate(['/github', orgName]);
        });
    };
    return RepoBrowserComponent;
}());
RepoBrowserComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'repo-browser',
        template: "\n      <h3>GitHub Browser</h3>\n      <input type=\"text\" #repoName placeholder=\"Search Github Orgs\" value=\"angular\" />\n      <button (click)=\"searchForOrg(repoName.value)\">Search Orgs</button>\n      <router-outlet></router-outlet>  \n  "
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_2__shared_github_service__["a" /* GithubService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__shared_github_service__["a" /* GithubService */]) === "function" && _b || Object])
], RepoBrowserComponent);

var _a, _b;
//# sourceMappingURL=repo-browser.component.js.map

/***/ }),

/***/ "../../../../../src/app/github/repo-detail/repo-detail.component.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/github/repo-detail/repo-detail.component.html":
/***/ (function(module, exports) {

module.exports = "<h2>{{ repoDetails.full_name }}</h2>\r\n\r\n<pre>this.repoDetails = {{ repoDetails | json }}</pre>\r\n"

/***/ }),

/***/ "../../../../../src/app/github/repo-detail/repo-detail.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/@angular/router.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shared_github_service__ = __webpack_require__("../../../../../src/app/github/shared/github.service.ts");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return RepoDetailComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var RepoDetailComponent = (function () {
    function RepoDetailComponent(github, route) {
        this.github = github;
        this.route = route;
        this.repoDetails = {};
    }
    RepoDetailComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.route.params.subscribe(function (params) {
            _this.org = _this.route.snapshot.parent.params['org'];
            _this.repo = params['repo'] || '';
            if (_this.repo) {
                _this.github.getRepoForOrg(_this.org, _this.repo)
                    .subscribe(function (repoDetails) {
                    _this.repoDetails = repoDetails;
                });
            }
        });
    };
    return RepoDetailComponent;
}());
RepoDetailComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'repo-detail',
        styles: [__webpack_require__("../../../../../src/app/github/repo-detail/repo-detail.component.css")],
        template: __webpack_require__("../../../../../src/app/github/repo-detail/repo-detail.component.html")
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_2__shared_github_service__["a" /* GithubService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__shared_github_service__["a" /* GithubService */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* ActivatedRoute */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* ActivatedRoute */]) === "function" && _b || Object])
], RepoDetailComponent);

var _a, _b;
//# sourceMappingURL=repo-detail.component.js.map

/***/ }),

/***/ "../../../../../src/app/github/repo-list/repo-list.component.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/github/repo-list/repo-list.component.html":
/***/ (function(module, exports) {

module.exports = "<h3>Repo list</h3>\r\n<ul>\r\n\t<li *ngFor=\"let repo of repos | async\">\r\n    <a [routerLink]=\"['/github', repo.owner.login, repo.name]\">\r\n      {{ repo.name }}\r\n    </a>\r\n  </li>\r\n</ul>\r\n\r\n<router-outlet></router-outlet>\r\n"

/***/ }),

/***/ "../../../../../src/app/github/repo-list/repo-list.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__shared_github_service__ = __webpack_require__("../../../../../src/app/github/shared/github.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_router__ = __webpack_require__("../../../router/@angular/router.es5.js");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return RepoListComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var RepoListComponent = (function () {
    function RepoListComponent(github, route) {
        this.github = github;
        this.route = route;
    }
    RepoListComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.route.params.subscribe(function (params) {
            _this.org = params['org'];
            if (_this.org) {
                _this.repos = _this.github.getReposForOrg(_this.org);
            }
        });
    };
    return RepoListComponent;
}());
RepoListComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'repo-list',
        styles: [__webpack_require__("../../../../../src/app/github/repo-list/repo-list.component.css")],
        template: __webpack_require__("../../../../../src/app/github/repo-list/repo-list.component.html"),
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__shared_github_service__["a" /* GithubService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__shared_github_service__["a" /* GithubService */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_2__angular_router__["c" /* ActivatedRoute */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__angular_router__["c" /* ActivatedRoute */]) === "function" && _b || Object])
], RepoListComponent);

var _a, _b;
//# sourceMappingURL=repo-list.component.js.map

/***/ }),

/***/ "../../../../../src/app/github/shared/github.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_add_operator_map__ = __webpack_require__("../../../../rxjs/add/operator/map.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_add_operator_map___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_rxjs_add_operator_map__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GithubService; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var GithubService = (function () {
    function GithubService(http) {
        this.http = http;
    }
    GithubService.prototype.getOrg = function (org) {
        return this.makeRequest("orgs/" + org);
    };
    GithubService.prototype.getReposForOrg = function (org) {
        return this.makeRequest("orgs/" + org + "/repos");
    };
    GithubService.prototype.getRepoForOrg = function (org, repo) {
        return this.makeRequest("repos/" + org + "/" + repo);
    };
    GithubService.prototype.makeRequest = function (path) {
        var params = new __WEBPACK_IMPORTED_MODULE_1__angular_http__["d" /* URLSearchParams */]();
        params.set('per_page', '100');
        var url = "https://api.github.com/" + path;
        return this.http.get(url, { search: params })
            .map(function (res) { return res.json(); });
    };
    return GithubService;
}());
GithubService = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Injectable */])(),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__angular_http__["b" /* Http */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__angular_http__["b" /* Http */]) === "function" && _a || Object])
], GithubService);

var _a;
//# sourceMappingURL=github.service.js.map

/***/ }),

/***/ "../../../../../src/app/home/home.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__home_service__ = __webpack_require__("../../../../../src/app/home/home.service.ts");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return HomeComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var HomeComponent = (function () {
    function HomeComponent(homeService) {
        this.homeService = homeService;
        this.posts = [];
    }
    HomeComponent.prototype.ngOnInit = function () {
        this.posts$ = this.homeService.getPosts();
        /* .subscribe(res=>{
          this.posts = res;
          console.log(res);
        },
        console.warn);*/
    };
    return HomeComponent;
}());
HomeComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'home',
        template: "\n  <div>\n      <h3>Home</h3>\n      <div>\n          Posts\n          <div>\n              <md-list>\n                <md-list-item *ngFor=\"let post of (posts$ | async)\">\n                    <md-icon md-list-icon class=\"fa fa-snowflake-o\"></md-icon>\n                    <md-icon md-list-avatar class=\"fa fa-area-chart\"></md-icon>\n                    <p md-line> {{ post.description }} </p>                                \n                </md-list-item>\n              </md-list>\n          </div>\n      </div>\n  </div>\n  "
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__home_service__["a" /* HomeService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__home_service__["a" /* HomeService */]) === "function" && _a || Object])
], HomeComponent);

var _a;
//# sourceMappingURL=home.component.js.map

/***/ }),

/***/ "../../../../../src/app/home/home.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_Observable__ = __webpack_require__("../../../../rxjs/Observable.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_Observable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_rxjs_Observable__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return HomeService; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

//import {AuthHttp, getToken, getTokenExpiredDate, tokenNotExpired} from '../../../arch/angular2-jwt';


/**
 * Created by Vlad on 4/3/2017.
 */
var HomeService = (function () {
    function HomeService(http) {
        this.http = http;
    }
    HomeService.prototype.getPosts = function () {
        //console.log(getTokenExpiredDate());
        // if(tokenNotExpired()){
        //  console.log(' not yet');
        //}
        //let decoded = getToken();
        // console.log(new Date(decoded.exp*1000).toLocaleString());
        var url = 'http://localhost:8090/api/posts';
        console.log(url);
        return this.http.get(url)
            .map(function (res) {
            var r = res.json().data;
            console.log(r);
            return r;
        })
            .catch(function (err) {
            return __WEBPACK_IMPORTED_MODULE_1_rxjs_Observable__["Observable"].throw(err);
        });
    };
    return HomeService;
}());
HomeService = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Injectable */])(),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_2__angular_http__["b" /* Http */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__angular_http__["b" /* Http */]) === "function" && _a || Object])
], HomeService);

var _a;
//# sourceMappingURL=home.service.js.map

/***/ }),

/***/ "../../../../../src/app/login/login-main.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__login_service__ = __webpack_require__("../../../../../src/app/login/login.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__("../../../forms/@angular/forms.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_router__ = __webpack_require__("../../../router/@angular/router.es5.js");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return LoginMain; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/**
 * Created by Vlad on 4/3/2017.
 */




var LoginMain = (function () {
    function LoginMain(loginService, formBuilder, router) {
        this.loginService = loginService;
        this.formBuilder = formBuilder;
        this.router = router;
    }
    LoginMain.prototype.ngOnInit = function () {
        this.loginForm = this.formBuilder.group({
            username: ['john@doe.com', __WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* Validators */].compose([__WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* Validators */].required, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* Validators */].minLength(3), __WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* Validators */].maxLength(64)])],
            password: ['my password 2', __WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* Validators */].compose([__WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* Validators */].required, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* Validators */].minLength(3), __WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* Validators */].maxLength(32)])]
        });
    };
    LoginMain.prototype.login = function (email, password) {
        var _this = this;
        this.loginService.login(email, password)
            .subscribe(function () {
            alert('Login successful');
            _this.router.navigateByUrl('/home');
        }, console.error);
    };
    return LoginMain;
}());
LoginMain = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'login-main',
        template: "\n  <div>\n      <div>\n          <div>             \n              <form  [formGroup]=\"loginForm\" novalidate>\n                  <div>\n                    <md-input-container>\n                        <input #username mdInput  type=\"text\"  formControlName=\"username\"  placeholder=\"username\"  />\n                    </md-input-container>\n                  </div>\n                  <div>\n                      <md-input-container>\n                          <input #password mdInput type=\"password\"  formControlName=\"password\" placeholder=\"password\" required />\n                      </md-input-container>\n                  </div>\n                  <div>\n                      <button [disabled]=\"!loginForm.valid\" md-raised-button color=\"accent\" (click)=\"login(username.value, password.value)\" >Login</button>\n                  </div>\n                <div>\n                    \n                </div>\n              </form>            \n              \n          </div>\n      </div>\n  </div>\n  "
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__login_service__["a" /* LoginService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__login_service__["a" /* LoginService */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_2__angular_forms__["i" /* FormBuilder */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__angular_forms__["i" /* FormBuilder */]) === "function" && _b || Object, typeof (_c = typeof __WEBPACK_IMPORTED_MODULE_3__angular_router__["b" /* Router */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_3__angular_router__["b" /* Router */]) === "function" && _c || Object])
], LoginMain);

var _a, _b, _c;
//# sourceMappingURL=login-main.component.js.map

/***/ }),

/***/ "../../../../../src/app/login/login.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__ = __webpack_require__("../../../../rxjs/BehaviorSubject.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_operator_publishLast__ = __webpack_require__("../../../../rxjs/operator/publishLast.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_operator_publishLast___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_rxjs_operator_publishLast__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* unused harmony export User */
/* unused harmony export UNKNOWN_USER */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return LoginService; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/**
 * Created by Vlad on 4/3/2017.
 */


//import {Observable, BehaviorSubject} from "rxjs";


//import {AuthHttp, setToken} from '../libs/angular2-jwt';
var User = (function () {
    function User() {
    }
    return User;
}());

var UNKNOWN_USER = {
    firstName: 'Unknown'
};
var LoginService = (function () {
    function LoginService(http, auth) {
        this.http = http;
        this.auth = auth;
        this.subject = new __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__["BehaviorSubject"](UNKNOWN_USER);
        this.user$ = this.subject.asObservable();
    }
    LoginService.prototype.login = function (username, password) {
        var headers = new __WEBPACK_IMPORTED_MODULE_3__angular_http__["c" /* Headers */]();
        headers.append('Content-Type', 'application/json');
        var url = '/api/login';
        console.log(url);
        return this.http.post(url, { username: username, password: password, deviceId: 1 }, headers)
            .map(function (res) { return res.json().data; });
        ///.do(token => {
        //  return setToken(token);
        // })
        // .do(user => this.subject.next(user))
        // .publishLast().refCount();
    };
    return LoginService;
}());
LoginService = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Injectable */])(),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_3__angular_http__["b" /* Http */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_3__angular_http__["b" /* Http */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_3__angular_http__["b" /* Http */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_3__angular_http__["b" /* Http */]) === "function" && _b || Object])
], LoginService);

var _a, _b;
//# sourceMappingURL=login.service.js.map

/***/ }),

/***/ "../../../../../src/app/material-app.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_material__ = __webpack_require__("../../../material/@angular/material.es5.js");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MaterialAppModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Created by Vlad on 7/3/2017.
 */


var MaterialAppModule = (function () {
    function MaterialAppModule() {
    }
    return MaterialAppModule;
}());
MaterialAppModule = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
        imports: [
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["a" /* MdButtonModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["b" /* MdCardModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["c" /* MdCheckboxModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["d" /* MdDialogModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["e" /* MdGridListModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["f" /* MdInputModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["g" /* MdListModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["h" /* MdMenuModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["i" /* MdSidenavModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["j" /* MdSlideToggleModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["k" /* MdRadioModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["l" /* MdToolbarModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["m" /* MdTabsModule */]
        ],
        exports: [
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["a" /* MdButtonModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["b" /* MdCardModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["c" /* MdCheckboxModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["d" /* MdDialogModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["e" /* MdGridListModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["f" /* MdInputModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["g" /* MdListModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["h" /* MdMenuModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["i" /* MdSidenavModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["j" /* MdSlideToggleModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["k" /* MdRadioModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["l" /* MdToolbarModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_material__["m" /* MdTabsModule */]
        ]
    })
], MaterialAppModule);

//# sourceMappingURL=material-app.module.js.map

/***/ }),

/***/ "../../../../../src/app/models/SS-models.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return VOExchangeData; });
/**
 * Created by Vlad on 6/29/2017.
 */
var VOExchangeData = (function () {
    function VOExchangeData() {
    }
    return VOExchangeData;
}());

//# sourceMappingURL=SS-models.js.map

/***/ }),

/***/ "../../../../../src/app/ss-browse/all-coins-table/all-coins-table.component.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "table td{\r\n    border-bottom: 1px solid #ddd;\r\n}\r\n\r\ntable th{\r\n    cursor: pointer;\r\n}", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/ss-browse/all-coins-table/all-coins-table.component.html":
/***/ (function(module, exports) {

module.exports = "<div>\n    <table>\n        <tr>\n            <th (click)=\"onClickHeader('market_cap_usd')\">market cap usd</th>\n            <th (click)=\"onClickHeader('percent_change_1h')\">1h%</th>\n            <th (click)=\"onClickHeader('percent_change_24h')\" >24h%</th>\n            <th (click)=\"onClickHeader('percent_change_7d')\">7 days%</th>\n            <th (click)=\"onClickHeader('price_usd')\">$US</th>\n            <th (click)=\"onClickHeader('rank')\">Rank</th>\n            <th (click)=\"onClickHeader('symbol')\">Symbol</th>\n        </tr>\n\n\n        <tbody *ngFor=\"let item of modelCoins\">\n\n            <tr>\n                <td>{{item.market_cap_usd}}</td>\n                <td>{{item.percent_change_1h}}</td>\n                <td>{{item.percent_change_24h}}</td>\n                <td>{{item.percent_change_7d}}</td>\n                <td>{{item.price_usd}}</td>\n                <td>{{item.rank}}</td>\n                <td>{{item.symbol}}</td>\n                <td><input type=\"checkbox\"  (change)=\"onCoinSelected($event, item)\" [checked]=\"item.selected\"   name=\"selected\"/></td>\n                <td>{{item.name}}</td>\n\n            </tr>\n\n        </tbody>\n    </table>\n\n\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/ss-browse/all-coins-table/all-coins-table.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash__ = __webpack_require__("../../../../lodash/lodash.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_lodash__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AllCoinsTableComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var AllCoinsTableComponent = (function () {
    function AllCoinsTableComponent() {
        this.selectedCoinsNamesChange = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["F" /* EventEmitter */]();
        this.asc_desc = 'asc';
    }
    AllCoinsTableComponent.prototype.ngOnChanges = function (changes) {
        console.log(changes);
        this.modelCoins = changes.allCoins.currentValue; // _.reject(changes.allCoins,'selected')
        //this.doSomething(changes.categoryId.currentValue);
    };
    AllCoinsTableComponent.prototype.ngOnInit = function () {
    };
    AllCoinsTableComponent.prototype.changeStatus = function (coin) {
    };
    AllCoinsTableComponent.prototype.onCoinSelected = function (event, coin) {
        console.log(event.target.checked, coin);
        coin.selected = event.target.checked;
        var selectedCoinsNames = this.allCoins.reduce(function (result, item) {
            if (item.selected)
                result.push(item.symbol);
            return result;
        }, []);
        this.selectedCoinsNamesChange.emit(selectedCoinsNames);
    };
    AllCoinsTableComponent.prototype.onClickHeader = function (creteria) {
        console.log(creteria);
        if (this.creteria === creteria) {
            if (this.asc_desc === 'asc')
                this.asc_desc = 'desc';
            else
                this.asc_desc = 'asc';
        }
        else
            this.asc_desc = 'asc';
        console.log(this.asc_desc);
        this.modelCoins = __WEBPACK_IMPORTED_MODULE_1_lodash__["orderBy"](this.modelCoins, creteria, this.asc_desc);
        this.creteria = creteria;
    };
    return AllCoinsTableComponent;
}());
__decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["O" /* Input */])(),
    __metadata("design:type", Array)
], AllCoinsTableComponent.prototype, "allCoins", void 0);
__decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_5" /* Output */])(),
    __metadata("design:type", Object)
], AllCoinsTableComponent.prototype, "selectedCoinsNamesChange", void 0);
AllCoinsTableComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'app-all-coins-table',
        template: __webpack_require__("../../../../../src/app/ss-browse/all-coins-table/all-coins-table.component.html"),
        styles: [__webpack_require__("../../../../../src/app/ss-browse/all-coins-table/all-coins-table.component.css")]
    }),
    __metadata("design:paramtypes", [])
], AllCoinsTableComponent);

//# sourceMappingURL=all-coins-table.component.js.map

/***/ }),

/***/ "../../../../../src/app/ss-browse/all-coins.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models_SS_models__ = __webpack_require__("../../../../../src/app/models/SS-models.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_BehaviorSubject__ = __webpack_require__("../../../../rxjs/BehaviorSubject.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_BehaviorSubject___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_rxjs_BehaviorSubject__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_Subject__ = __webpack_require__("../../../../rxjs/Subject.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_Subject___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_rxjs_Subject__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AllCoinsService; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var AllCoinsService = (function () {
    function AllCoinsService(http) {
        this.http = http;
        //private url='https://utils.jaxx.io/api/exchange/proxy';
        this.url = '/api/exchange/shapeshift/all-market';
        // sortedData:VOExchangeData[];
        // sortCreteria:string = 'rank';
        // selectedSortCreteria:string = 'rank'
        //$emitter:JQuery = $({});
        this.CHANGE = 'CHANGE';
        this.NEW_DATA = 'NEW_DATA';
        this.counter = 0;
        this.allCoinsSub = new __WEBPACK_IMPORTED_MODULE_3_rxjs_BehaviorSubject__["BehaviorSubject"]([]);
        this.allCoins$ = this.allCoinsSub.asObservable();
        this.counterSub = new __WEBPACK_IMPORTED_MODULE_4_rxjs_Subject__["Subject"]();
        this.counter$ = this.counterSub.asObservable();
    }
    AllCoinsService.prototype.start = function () {
        //setInterval(()=> this.loadData(),60000);
        this.loadData();
    };
    AllCoinsService.prototype.setData = function (data) {
        this.allCoins = data;
        console.log(data.length);
        this.counterSub.next(this.counter++);
        this.allCoinsSub.next(data);
    };
    AllCoinsService.prototype.loadData = function () {
        var _this = this;
        /* let str = localStorage.getItem('exchange');
         if(str){
           let data = JSON.parse(str);
          // console.log(data);
           if(data.exchange && (Date.now() - data.timestamp)< 100000 ) {
             this.setData(data.exchange.map(this.mapExchangeData));
             return;
           }
         }
     */
        this.http.get(this.url).map(function (res) {
            return res.json().map(_this.mapExchangeData);
        }).subscribe(function (result) {
            //localStorage.setItem('exchange',JSON.stringify(reports));
            /*let now = Date.now();
            let diff=  - (item.last_updated*1000);
            item.last_updated_date = Math.round(diff/1000/60)+ 'm';*/
            _this.setData(result);
        });
    };
    AllCoinsService.prototype.mapExchangeData = function (obj) {
        var data = new __WEBPACK_IMPORTED_MODULE_1__models_SS_models__["a" /* VOExchangeData */]();
        for (var str in obj)
            data[str] = isNaN(obj[str]) ? obj[str] : +obj[str];
        data.volume_usd_24h = +obj['24h_volume_usd'];
        delete data['24h_volume_usd'];
        return data;
    };
    return AllCoinsService;
}());
AllCoinsService = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Injectable */])(),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_2__angular_http__["b" /* Http */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__angular_http__["b" /* Http */]) === "function" && _a || Object])
], AllCoinsService);

var _a;
//# sourceMappingURL=all-coins.service.js.map

/***/ }),

/***/ "../../../../../src/app/ss-browse/selected-coins/selected-coins.component.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "table{\r\n    width: 100%;\r\n}\r\ntable td{\r\n    border-bottom: 1px solid #ddd;\r\n}\r\ntable th{\r\n    cursor: pointer;\r\n}", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/ss-browse/selected-coins/selected-coins.component.html":
/***/ (function(module, exports) {

module.exports = "<div>\n    <table>\n        <tr>\n            <th><button md-button (click)=\"onClickHeader('market_cap_usd')\">market cap usd</button></th>\n            <th><button md-button (click)=\"onClickHeader('percent_change_1h')\">1h%</button></th>\n            <th><button md-button (click)=\"onClickHeader('percent_change_24h')\" >24h%</button></th>\n            <th><button md-button (click)=\"onClickHeader('percent_change_7d')\">7 days%</button></th>\n            <th><button md-button (click)=\"onClickHeader('price_usd')\">$US</button></th>\n            <th><button md-button (click)=\"onClickHeader('rank')\">Rank</button></th>\n            <th><button md-button (click)=\"onClickHeader('symbol')\">Symbol</button></th>\n        </tr>\n\n        <tbody *ngFor=\"let item of modelCoins\">\n\n        <tr>\n            <td>{{item.market_cap_usd}}</td>\n            <td>{{item.percent_change_1h}}</td>\n            <td>{{item.percent_change_24h}}</td>\n            <td>{{item.percent_change_7d}}</td>\n            <td>{{item.price_usd}}</td>\n            <td>{{item.rank}}</td>\n            <td>{{item.symbol}}</td>\n            <td>{{item.name}}</td>\n        </tr>\n\n        </tbody>\n    </table>\n\n\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/ss-browse/selected-coins/selected-coins.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash__ = __webpack_require__("../../../../lodash/lodash.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_lodash__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SelectedCoinsComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var SelectedCoinsComponent = (function () {
    function SelectedCoinsComponent() {
        this.sortCreteria = 'rank';
        this.asc_desc = 'asc';
    }
    SelectedCoinsComponent.prototype.ngOnInit = function () {
    };
    SelectedCoinsComponent.prototype.onClickHeader = function (creteria) {
        console.log(creteria);
        if (this.sortCreteria === creteria) {
            if (this.asc_desc === 'asc')
                this.asc_desc = 'desc';
            else
                this.asc_desc = 'asc';
        }
        else
            this.asc_desc = 'asc';
        console.log(this.asc_desc);
        this.modelCoins = __WEBPACK_IMPORTED_MODULE_1_lodash__["orderBy"](this.modelCoins, creteria, this.asc_desc);
        this.sortCreteria = creteria;
    };
    return SelectedCoinsComponent;
}());
__decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["O" /* Input */])(),
    __metadata("design:type", Array)
], SelectedCoinsComponent.prototype, "modelCoins", void 0);
SelectedCoinsComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'app-selected-coins',
        template: __webpack_require__("../../../../../src/app/ss-browse/selected-coins/selected-coins.component.html"),
        styles: [__webpack_require__("../../../../../src/app/ss-browse/selected-coins/selected-coins.component.css")]
    }),
    __metadata("design:paramtypes", [])
], SelectedCoinsComponent);

//# sourceMappingURL=selected-coins.component.js.map

/***/ }),

/***/ "../../../../../src/app/ss-browse/ss-browse.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common__ = __webpack_require__("../../../common/@angular/common.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ss_main_ss_main_component__ = __webpack_require__("../../../../../src/app/ss-browse/ss-main/ss-main.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__all_coins_service__ = __webpack_require__("../../../../../src/app/ss-browse/all-coins.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__all_coins_table_all_coins_table_component__ = __webpack_require__("../../../../../src/app/ss-browse/all-coins-table/all-coins-table.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__selected_coins_selected_coins_component__ = __webpack_require__("../../../../../src/app/ss-browse/selected-coins/selected-coins.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__material_app_module__ = __webpack_require__("../../../../../src/app/material-app.module.ts");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SsBrowseModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};







var SsBrowseModule = (function () {
    function SsBrowseModule() {
    }
    return SsBrowseModule;
}());
SsBrowseModule = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
        imports: [
            __WEBPACK_IMPORTED_MODULE_1__angular_common__["c" /* CommonModule */],
            __WEBPACK_IMPORTED_MODULE_6__material_app_module__["a" /* MaterialAppModule */]
        ],
        declarations: [__WEBPACK_IMPORTED_MODULE_2__ss_main_ss_main_component__["a" /* SsMainComponent */], __WEBPACK_IMPORTED_MODULE_4__all_coins_table_all_coins_table_component__["a" /* AllCoinsTableComponent */], __WEBPACK_IMPORTED_MODULE_5__selected_coins_selected_coins_component__["a" /* SelectedCoinsComponent */]],
        providers: [__WEBPACK_IMPORTED_MODULE_3__all_coins_service__["a" /* AllCoinsService */]]
    })
], SsBrowseModule);

//# sourceMappingURL=ss-browse.module.js.map

/***/ }),

/***/ "../../../../../src/app/ss-browse/ss-main/ss-main.component.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".fa.fa-close{\r\n    float: right;\r\n}", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/ss-browse/ss-main/ss-main.component.html":
/***/ (function(module, exports) {

module.exports = "<div>\n<div>\n\n    <button  md-raised-button (click)=\"onRefresh()\">Refresh</button>\n    <span>{{counter}}</span>\n    <button  md-button (click)=\"showAllCoins()\">All Coins</button>\n\n</div>\n    <hr/>\n\n    <app-selected-coins [modelCoins]=\"selectedCoins\"></app-selected-coins>\n    <div *ngIf=\"isAllcoins\">\n        <hr/>\n        <div class=\"fa fa-close\" (click)=\"onClose()\"></div>\n        <app-all-coins-table  [allCoins]=\"allCoins\" (selectedCoinsNamesChange)=\"onSelectChanged($event)\"></app-all-coins-table>\n    </div>\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/ss-browse/ss-main/ss-main.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__all_coins_service__ = __webpack_require__("../../../../../src/app/ss-browse/all-coins.service.ts");
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SsMainComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var SsMainComponent = (function () {
    function SsMainComponent(service) {
        this.service = service;
        this.counter = 0;
    }
    SsMainComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.service.marketsAr$.subscribe(function (res) {
            _this.markSelected(res);
            _this.allCoins = res;
            _this.populateSelected();
        });
        this.service.loadData();
        this.service.counter$.subscribe(function (res) { return _this.counter = res; });
    };
    SsMainComponent.prototype.showAllCoins = function () {
        if (this.isAllcoins)
            this.isAllcoins = false;
        else
            this.isAllcoins = true;
    };
    SsMainComponent.prototype.onClose = function () {
        this.isAllcoins = false;
    };
    SsMainComponent.prototype.getSelectedNames = function () {
        if (!this.selectedCoinsNames) {
            var str = localStorage.getItem('selectedCoinsNames');
            if (str)
                this.selectedCoinsNames = JSON.parse(str);
            else
                this.selectedCoinsNames = [];
        }
        return this.selectedCoinsNames;
    };
    SsMainComponent.prototype.saveSelectedNames = function (val) {
        this.selectedCoinsNames = val;
        localStorage.setItem('selectedCoinsNames', JSON.stringify(val));
    };
    SsMainComponent.prototype.markSelected = function (ar) {
        var selNames = this.getSelectedNames();
        ar.forEach(function (item) {
            item.selected = selNames.indexOf(item.symbol) !== -1;
        });
    };
    SsMainComponent.prototype.populateSelected = function () {
        var ar = [];
        var val = this.getSelectedNames();
        this.allCoins.forEach(function (item) {
            if (val.indexOf(item.symbol) !== -1)
                ar.push(item);
        });
        this.selectedCoins = ar;
    };
    SsMainComponent.prototype.onSelectChanged = function (val) {
        this.saveSelectedNames(val);
        this.populateSelected();
    };
    SsMainComponent.prototype.onRefresh = function () {
        this.service.loadData();
    };
    return SsMainComponent;
}());
SsMainComponent = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Component */])({
        selector: 'app-ss-main',
        template: __webpack_require__("../../../../../src/app/ss-browse/ss-main/ss-main.component.html"),
        styles: [__webpack_require__("../../../../../src/app/ss-browse/ss-main/ss-main.component.css")]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__all_coins_service__["a" /* AllCoinsService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__all_coins_service__["a" /* AllCoinsService */]) === "function" && _a || Object])
], SsMainComponent);

var _a;
//# sourceMappingURL=ss-main.component.js.map

/***/ }),

/***/ "../../../../../src/environments/environment.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return environment; });
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
// The file contents for the current environment will overwrite these during build.
var environment = {
    production: false
};
//# sourceMappingURL=environment.js.map

/***/ }),

/***/ "../../../../../src/main.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__ = __webpack_require__("../../../platform-browser-dynamic/@angular/platform-browser-dynamic.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__app_app_module__ = __webpack_require__("../../../../../src/app/app.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__environments_environment__ = __webpack_require__("../../../../../src/environments/environment.ts");




if (__WEBPACK_IMPORTED_MODULE_3__environments_environment__["a" /* environment */].production) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["a" /* enableProdMode */])();
}
__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_2__app_app_module__["a" /* AppModule */]);
//# sourceMappingURL=main.js.map

/***/ }),

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("../../../../../src/main.ts");


/***/ })

},[0]);
//# sourceMappingURL=main.bundle.js.map