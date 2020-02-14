module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint'
	],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended"
	],
	parserOptions: {
		ecmaVersion: 9,
		sourceType: "module",
		ecmaFeatures: {
			impliedStrict: true
		}
	},
	rules: {
		indent: ["warn", "tab", { SwitchCase: 1, flatTernaryExpressions: true }],
		'linebreak-style': ["error", "unix"],
		quotes: ["warn", "single", {
			avoidEscape: true,
			allowTemplateLiterals: true
		}],
		semi: ["error", "always", {omitLastInOneLineBlock: true}],
		'no-cond-assign': ["error", "always"],
		'no-console': "off"
	}
}

