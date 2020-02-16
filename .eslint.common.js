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
	rules: {
		// General
		indent: ['warn', 'tab', {SwitchCase: 1, flatTernaryExpressions: true}],
		quotes: ['warn', 'single', {
			avoidEscape: true,
			allowTemplateLiterals: true
		}],
		semi: ['warn', 'always', {omitLastInOneLineBlock: true}],
		'linebreak-style': ['error', 'unix'],
		'no-cond-assign': ['error', 'always'],
		'no-console': 'off',
		// Typescript
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-explicit-any': 'off'
	}
}
