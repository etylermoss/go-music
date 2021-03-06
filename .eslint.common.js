module.exports = {
	"root": true,
	"parser": "@typescript-eslint/parser",
	"plugins": [
		"@typescript-eslint"
	],
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"parserOptions": {
		"ecmaVersion": 9,
		"sourceType": "module",
		"ecmaFeatures": {
			"impliedStrict": true
		}
	},
	"globals": {
		"RELEASE": "readonly",
		"DEVSERVER": "readonly"
	},
	"rules": {
		/* General */
		"comma-dangle": ["warn", "always-multiline"],
		"no-duplicate-imports": "off",
		"linebreak-style": ["error", "unix"],
		"no-cond-assign": ["error", "except-parens"],
		"no-console": "off",
		"semi": ["warn", "always", {
			"omitLastInOneLineBlock": true
		}],
		"indent": ["warn", "tab", {
			"SwitchCase": 1,
			"flatTernaryExpressions": true
		}],
		"quotes": ["warn", "single", {
			"avoidEscape": true,
			"allowTemplateLiterals": true
		}],
		"max-len": ["warn", {
			"code": 140,
			"comments": 75,
			"ignorePattern": "^\\s*//",
			"ignoreComments": true,
			"ignoreTrailingComments": false,
			"ignoreStrings": false
		}],
		"no-warning-comments": ["off", {
			"terms": [
				"todo",
				"fixme",
				"bug",
				"xxx"
			],
			"location": "start"
		}],
		/* Typescript */
		"@typescript-eslint/no-inferrable-types": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-var-requires": "off",
		"@typescript-eslint/camelcase": "off",
		"@typescript-eslint/class-name-casing": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/explicit-function-return-type": ["error", {
			"allowExpressions": true
		}],
		"@typescript-eslint/no-unused-vars": ["warn", {
			"argsIgnorePattern": "^_"
		}],
	}
}

