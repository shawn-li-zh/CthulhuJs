module.exports = {
    presets: [["@babel/preset-env", {
        targets: {
            "chrome": "66",
        },
        corejs: 2,//新版本需要指定核⼼库版本
        useBuiltIns: "usage"//按需注⼊
    }]],
    "plugins": [
        [
            "@babel/plugin-transform-runtime",  //可转换没有对应关系的代码
            {
                "absoluteRuntime": false,
                "corejs": 2,//false:全局注入，会污染全局环境；2：不会污染全局环境
                "helpers": true,
                "regenerator": true,
                "useESModules": false
            }
        ]
    ]
};

