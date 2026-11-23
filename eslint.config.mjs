import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	{ ignores: ['out/', 'node_modules/', 'docker/lint/'] },
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		languageOptions: { globals: globals.node },
	},
	{
		files: ['webpack.config.js'],
		languageOptions: { sourceType: 'commonjs' },
		rules: { '@typescript-eslint/no-require-imports': 'off' },
	}
)
