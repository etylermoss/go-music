module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint'
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended'
	],
	parserOptions: {
		ecmaVersion: 9,
		sourceType: 'module',
		ecmaFeatures: {
			impliedStrict: true
		}
	},
	globals: {
		'RELEASE': 'readonly',
		'DEVSERVER': 'readonly'
	},
	rules: {
		/* General */
		indent: ['warn', 'tab', {SwitchCase: 1, flatTernaryExpressions: true}],
		quotes: ['warn', 'single', {
			avoidEscape: true,
			allowTemplateLiterals: true
		}],
		semi: ['warn', 'always', {omitLastInOneLineBlock: true}],
		'no-duplicate-imports': 'warn',
		'linebreak-style': ['error', 'unix'],
		'no-cond-assign': ['error', 'always'],
		'no-console': 'off',
		"no-warning-comments": ['off', { "terms": ["todo", "fixme", "bug", "xxx"], "location": "start" }],
		/* Typescript */
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-var-requires': 'off',
		'@typescript-eslint/camelcase': ['warn', { allow: ['^SQL_', '^GQL_']}],
		'@typescript-eslint/class-name-casing': 'off'
	}
}

