"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_ioc_1 = require("typescript-ioc");
const SettingSDK_1 = __importDefault(require("./SettingSDK"));
const _ = __importStar(require("lodash"));
const logger_1 = require("@project-sunbird/logger");
const SystemSDK_1 = __importDefault(require("./SystemSDK"));
const services_1 = require("@project-sunbird/ext-framework-server/services");
const uuid = require("uuid");
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const DataBaseSDK_1 = require("./DataBaseSDK");
/* @ClassLogger({
  logLevel: "debug",
  logTime: true
}) */
let DeviceSDK = class DeviceSDK {
    /* @ClassLogger({
      logLevel: "debug",
      logTime: true
    }) */
    constructor() {
        this.settingSDK = new SettingSDK_1.default('openrap-sunbirded-plugin');
        this.deviceRegistryV1APIPath = "/api/api-manager/v1/consumer/desktop_device/credential/register";
        this.deviceRegistryV2APIPath = "/api/api-manager/v2/consumer/desktop_device/credential/register";
    }
    initialize(config) {
        this.config = config;
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            var interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                let deviceId = yield this.systemSDK.getDeviceId();
                let deviceSpec = yield this.systemSDK.getDeviceInfo();
                let userDeclaredLocation = yield this.settingSDK.get('location').catch(err => logger_1.logger.error('Error while fetching user Location in registerDevice, error:', err.message));
                if (_.isEmpty(userDeclaredLocation)) {
                    return;
                }
                let body = {
                    id: process.env.APP_ID,
                    ver: process.env.APP_VERSION,
                    ts: new Date().toISOString(),
                    params: {
                        msgid: uuid.v4()
                    },
                    request: {
                        channel: process.env.CHANNEL,
                        producer: process.env.APP_ID,
                        dspec: deviceSpec,
                        userDeclaredLocation: {
                            state: _.get(userDeclaredLocation, 'state.name'),
                            district: _.get(userDeclaredLocation, 'city.name')
                        }
                    }
                };
                services_1.HTTPService.post(`${process.env.DEVICE_REGISTRY_URL}/${deviceId}`, body, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.apiKey}`
                    }
                })
                    .toPromise()
                    .then(data => {
                    logger_1.logger.info(`device registered successfully ${data.status}`);
                    clearInterval(interval);
                    this.getToken(deviceId);
                })
                    .catch(error => {
                    logger_1.logger.error(`Unable to sync device data: ${error.message}`);
                });
            }), 30000);
        });
    }
    getToken(deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            let did = deviceId || (yield this.systemSDK.getDeviceId());
            // Return API key if already exist
            if (this.apiKey) {
                logger_1.logger.info("Received token from local");
                return Promise.resolve(this.apiKey);
            }
            try {
                // Try to get it from DB, set in local and return
                let { api_key } = yield this.databaseSdk.getDoc("settings", "device_token");
                this.apiKey = api_key;
                logger_1.logger.info("Received token from Database");
                return Promise.resolve(this.apiKey);
            }
            catch (error) {
                // Try to get it from API, set in local and return
                if (_.get(this.config, 'key') && did) {
                    const options = {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${_.get(this.config, 'key')}`
                        },
                        body: {
                            id: "api.device.register",
                            ver: "1.0",
                            ts: Date.now(),
                            request: {
                                key: did
                            }
                        }
                    };
                    yield this.getBearerToken(options);
                }
                else {
                    throw Error(`Token or deviceID missing to register device ${did}`);
                }
            }
        });
    }
    getTokenFromFallBackURL(options, fallBackURL = '') {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info("Fetching API token from V1 api");
            const apiPath = fallBackURL || this.deviceRegistryV1APIPath;
            const { headers, body } = options;
            try {
                let response = yield axios_1.default.post(process.env.APP_BASE_URL + apiPath, body, { headers: headers });
                let apiKey = "";
                if (apiPath === this.deviceRegistryV1APIPath) {
                    let key = _.get(response, "data.result.key");
                    let secret = _.get(response, "data.result.secret");
                    apiKey = jsonwebtoken_1.default.sign({ iss: key }, secret, { algorithm: "HS256" });
                    logger_1.logger.info("Received token from V1 API");
                }
                else {
                    apiKey = _.get(response, "data.result.token");
                    logger_1.logger.info(`Received token from Fallback URL: ${fallBackURL}`);
                }
                yield this.databaseSdk
                    .upsertDoc("settings", "device_token", { api_key: apiKey })
                    .catch(err => {
                    logger_1.logger.error("while inserting the api key to the  database", err);
                });
                this.apiKey = apiKey;
                return this.apiKey;
            }
            catch (err) {
                logger_1.logger.error(`Error while registering the device status ${_.get(err, 'response.status')} data ${err}`);
                logger_1.logger.info("Resolving error with invalid api key");
                return Promise.resolve(this.apiKey);
            }
        });
    }
    getBearerToken(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info("Fetching API token from V2 api");
                const { headers, body } = options;
                let response = yield axios_1.default.post(process.env.APP_BASE_URL + this.deviceRegistryV2APIPath, body, { headers: headers });
                let apiKey = _.get(response, "data.result.token");
                if (!apiKey) {
                    logger_1.logger.info(`Token is not avialabe in V2: ${apiKey}`);
                    apiKey = yield this.getTokenFromFallBackURL(options);
                }
                yield this.databaseSdk
                    .upsertDoc("settings", "device_token", { api_key: apiKey })
                    .catch(err => {
                    logger_1.logger.error("while inserting the api key to the  database", err);
                });
                this.apiKey = apiKey;
                logger_1.logger.info("Received token from V2 API");
                return Promise.resolve(this.apiKey);
            }
            catch (err) {
                logger_1.logger.error(`Error while fetching V2 auth token with response code ${err.response.status} ||  ${err}`);
                if (err && err.response && err.response.status === 447) {
                    const responseHeaders = err.response.headers;
                    const fallBackUrl = responseHeaders ? responseHeaders['location'] : this.deviceRegistryV1APIPath;
                    logger_1.logger.debug(`Fetching AUTH TOKEN from fallback url ${fallBackUrl}`);
                    yield this.getTokenFromFallBackURL(options, fallBackUrl || this.deviceRegistryV1APIPath);
                }
                else {
                    yield this.getTokenFromFallBackURL(options);
                }
                return Promise.resolve(this.apiKey);
            }
        });
    }
};
__decorate([
    typescript_ioc_1.Inject,
    __metadata("design:type", SystemSDK_1.default)
], DeviceSDK.prototype, "systemSDK", void 0);
__decorate([
    typescript_ioc_1.Inject,
    __metadata("design:type", DataBaseSDK_1.DataBaseSDK)
], DeviceSDK.prototype, "databaseSdk", void 0);
DeviceSDK = __decorate([
    typescript_ioc_1.Singleton
], DeviceSDK);
exports.default = DeviceSDK;
