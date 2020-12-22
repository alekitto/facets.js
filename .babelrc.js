module.exports = {
    plugins: ['@babel/plugin-transform-runtime'],
    presets: [
        [
            '@babel/preset-env',
            {
                loose: true,
                bugfixes: true,
                modules: false
            }
        ]
    ]
};
