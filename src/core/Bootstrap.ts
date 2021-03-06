/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-03-14 13:49:44
 */
// tslint:disable-next-line: no-import-side-effect
import "reflect-metadata";
import * as helper from "think_lib";
import * as logger from "think_logger";
import { INJECT_TAG, COMPONENT_SCAN, CONFIGUATION_SCAN } from "./Constants";
import { IOCContainer } from "./Container";
import { Loader } from "../util/Loader";
import { Router } from "./Router";
import { Koatty } from '../Koatty';
const pkg = require("../../package.json");

/**
 * execute event as async
 *
 * @param {Koatty} app
 * @param {string} eventName
 */
const asyncEvent = async function (app: Koatty, eventName: string) {
    try {
        const ls: any[] = app.listeners(eventName);
        for (const func of ls) {
            if (helper.isFunction(func)) {
                await func();
            }
        }
        return;
    } catch (err) {
        logger.error(err);
    }
};

/**
 * execute bootstrap
 *
 * @param {*} target
 * @param {Function} bootFunc
 * @returns {Promise<void>}
 */
const executeBootstrap = async function (target: any, bootFunc: Function): Promise<void> {
    try {
        console.log("  ________    _       __   __ \n /_  __/ /_  (_)___  / /__/ /______  ____ _\n  / / / __ \\/ / __ \\/ //_/ //_/ __ \\/ __ `/\n / / / / / / / / / / ,< / /,</ /_/ / /_/ /\n/_/ /_/ /_/_/_/ /_/_/|_/_/ |_\\____/\\__,_/");
        console.log(`                     https://ThinkKoa.org/`);
        logger.custom("think", "", "====================================");
        logger.custom("think", "", "Bootstrap");

        const app = Reflect.construct(target, []);
        if (!(app instanceof Koatty)) {
            throw new Error(`class ${target.name} does not inherit from Koatty`);
        }

        // exec bootFunc
        if (helper.isFunction(bootFunc)) {
            logger.custom("think", "", "Execute bootFunc ...");
            await bootFunc(app);
        }

        logger.custom("think", "", "ComponentScan ...");
        let componentMetas = [];
        const componentMeta = IOCContainer.getClassMetadata(INJECT_TAG, COMPONENT_SCAN, target);
        if (componentMeta) {
            if (!helper.isArray(componentMeta)) {
                componentMetas.push(componentMeta);
            } else {
                componentMetas = componentMeta;
            }
        }
        if (componentMetas.length < 1) {
            componentMetas = [app.app_path];
        }
        // configuationMetas
        const configuationMeta = IOCContainer.getClassMetadata(INJECT_TAG, CONFIGUATION_SCAN, target);
        let configuationMetas = [];
        if (configuationMeta) {
            if (helper.isArray(configuationMeta)) {
                configuationMetas = configuationMeta;
            } else {
                configuationMetas.push(configuationMeta);
            }
        }
        // ComponentScan
        const exSet = new Set();
        Loader.loadDirectory(componentMetas, "", function (fileName: string, target: any, fpath: string) {
            if (target[fileName] && helper.isClass(target[fileName])) {
                if (exSet.has(fileName)) {
                    throw new Error(`A same name class already exists. Please modify the \`${fpath}\`'s class name and file name.`);
                }
                exSet.add(fileName);
            }
        }, [...configuationMetas, `!${target.name || ".no"}.ts`]);
        exSet.clear();

        logger.custom("think", "", "LoadConfiguation ...");
        Loader.loadConfigs(app, configuationMetas);
        //Contriner
        IOCContainer.setApp(app);
        helper.define(app, "Container", IOCContainer);

        logger.custom("think", "", "LoadMiddlewares ...");
        await Loader.loadMiddlewares(app, IOCContainer);

        //Emit app ready
        logger.custom("think", "", "Emit App Ready ...");
        // app.emit("appReady");
        await asyncEvent(app, "appReady");

        logger.custom("think", "", "LoadComponents ...");
        Loader.loadComponents(app, IOCContainer);

        logger.custom("think", "", "LoadServices ...");
        Loader.loadServices(app, IOCContainer);

        logger.custom("think", "", "LoadControllers ...");
        Loader.loadControllers(app, IOCContainer);

        //Emit app lazy loading
        logger.custom("think", "", "Emit App Started ...");
        // app.emit("appStart");
        await asyncEvent(app, "appStart");

        logger.custom("think", "", "LoadRouters ...");
        const routerConf = app.config(undefined, "router") || {};
        const router = new Router(app, IOCContainer, routerConf);
        router.loadRouter();

        logger.custom("think", "", "====================================");
        //Start app
        IOCContainer.setApp(app);
        logger.custom("think", "", "Listening ...");
        const port = app.config("app_port");
        const hostname = app.config("app_hostname") || "";

        app.listen({ port, hostname }, function () {
            logger.custom("think", "", `Nodejs Version: ${process.version}`);
            logger.custom("think", "", `${pkg.name} Version: v${pkg.version}`);
            logger.custom("think", "", `App Enviroment: ${app.app_debug ? "debug mode" : "production mode"}`);
            logger.custom("think", "", `Server running at http://${hostname || "localhost"}:${port}/`);
            logger.custom("think", "", "====================================");
            // tslint:disable-next-line: no-unused-expression
            app.app_debug && logger.warn(`Running in debug mode, please modify the app_debug value to false when production env.`);
        });
    } catch (err) {
        logger.error(err);
        process.exit();
    }
};

/**
 * Bootstrap appliction
 *
 * @export
 * @param {Function} [bootFunc] 
 * @returns {ClassDecorator}
 */
export function Bootstrap(bootFunc?: Function): ClassDecorator {
    return function (target: any) {
        executeBootstrap(target, bootFunc);
    };
}


/**
 * Define project scan path
 *
 * @export
 * @param {(string | string[])} [scanPath]
 * @returns {ClassDecorator}
 */
export function ComponentScan(scanPath?: string | string[]): ClassDecorator {
    logger.custom("think", "", "ComponentScan");

    return (target: any) => {
        scanPath = scanPath || "";
        IOCContainer.saveClassMetadata(INJECT_TAG, COMPONENT_SCAN, scanPath, target);
    };
}

/**
 * Define project configuration scan path
 *
 * @export
 * @param {(string | string[])} [scanPath]
 * @returns {ClassDecorator}
 */
export function ConfiguationScan(scanPath?: string | string[]): ClassDecorator {
    logger.custom("think", "", "ConfiguationScan");

    return (target: any) => {
        scanPath = scanPath || "";
        IOCContainer.saveClassMetadata(INJECT_TAG, CONFIGUATION_SCAN, scanPath, target);
    };
}
