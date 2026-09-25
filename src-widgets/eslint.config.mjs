import config from '@iobroker/eslint-config';

// disable temporary the rule 'jsdoc/require-param' and enable 'jsdoc/require-jsdoc'
config.forEach(rule => {
    if (rule?.plugins?.jsdoc) {
        rule.rules['jsdoc/require-jsdoc'] = 'off';
        rule.rules['jsdoc/require-param'] = 'off';
    }
});

export default [
    ...config,
    {
        files: ['**/*.tsx', '**/*.ts'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        // disable temporary the rule 'jsdoc/require-param' and enable 'jsdoc/require-jsdoc'
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto',
                },
            ],
        },
    },
    {
        // Inside an ambient `declare module` the type-aware rules do not resolve the imports, so every
        // imported type looks like an error type to them. They would flag exactly the declarations that
        // `tsc` checks without a complaint.
        files: ['**/*.d.ts'],
        rules: {
            '@typescript-eslint/no-redundant-type-constituents': 'off',
        },
    },
    {
        ignores: ['.__mf__temp/**/*', 'build/**/*', 'node_modules/**/*', 'public/_socket/info.js'],
    },
];
