/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-01-19 15:41:30
 */
export default {
    /*app config*/
    app_port: 3000, // 监听端口
    app_hostname: "", // Hostname
    encoding: "utf-8", //输出数据的编码

    logs: true, //是否存储日志
    logs_path: process.env.ROOT_PATH + "/logs", //存储日志文件目录
    logs_level: ["info", "warn", "error"] //日志存储级别, "info", "warn", "error", "success" or custom type
};