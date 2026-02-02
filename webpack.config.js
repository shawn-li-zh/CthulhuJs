let out = "/public/" + process.env.npm_lifecycle_event.split(" ")[1]

module.exports = {
    optimization: {
        minimize: true
    },
    entry: {
        //环境参数生成代码
        generator: "./src/generator.js",
        //修改指纹逻辑代码
        window: "./src/window.js",
        //测试代码-随机生成参数修改指纹环境
        randomTest: "./src/randomTest.js",
    },
    output: {
        filename: '[name].js',
        path: __dirname + out,
    },
    plugins: [],
    module: {}

}
