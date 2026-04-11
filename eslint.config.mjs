import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import * as mdx from 'eslint-plugin-mdx'
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import yml from 'eslint-plugin-yml'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsonc from 'eslint-plugin-jsonc' // 引入 jsonc 插件
import format from 'eslint-plugin-format'
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    'dist',
    '.next',
    '**/node_modules/**',
    '**/pnpm-lock.yaml',
    'package-lock.json',
    '.agents',
  ]),

  // ----------- yml -----------
  ...yml.configs['flat/recommended'],

  // ----------- mdx -----------
  {
    ...mdx.flat,
    // optional, if you want to lint code blocks at the same
    processor: mdx.createRemarkProcessor({
      lintCodeBlocks: true,
      // optional, if you want to disable language mapper, set it to `false`
      // if you want to override the default language mapper inside, you can provide your own
      languageMapper: {},
      // optional, same as the `parserOptions.remarkConfigPath`, you have to specify it twice unfortunately
    }),
  },
  {
    ...mdx.flatCodeBlocks,
    rules: {
      ...mdx.flatCodeBlocks.rules,
      // if you want to override some rules for code blocks
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.mdx', '**/*.md'],
    plugins: {
      format,
    },
    rules: {
      // 2. 调用底层引擎自动处理 Markdown 文本的排版（去除多余空格等）
      'format/prettier': ['error', {
        parser: 'mdx',
        tabWidth: 2,
        singleQuote: true, // 尽量和你的 JS 保持一致
        endOfLine: 'auto',
      }],
      // 3. 防打架：在 MDX 文件中，把排版权全权交给 format，关闭容易冲突的 stylistic 规则
      '@stylistic/indent': 'off',
      '@stylistic/quotes': 'off',
      '@stylistic/semi': 'off',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/array-element-newline': 'off',
      '@stylistic/array-bracket-newline': 'off',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/jsx-quotes': 'off',
      '@stylistic/jsx-wrap-multilines': 'off',
    },
  },

  // ----------- json -----------
  ...jsonc.configs['flat/recommended-with-json'],
  ...jsonc.configs['flat/recommended-with-jsonc'],
  ...jsonc.configs['flat/recommended-with-json5'],
  {
    files: ['**/*.json', '**/*.json5', '**/*.jsonc'],
    rules: {
      // 保持与你 JS/TS 一致的排版风格
      'jsonc/indent': ['error', 2],
      'jsonc/quotes': ['error', 'double'], // JSON 规范必须使用双引号
      'jsonc/quote-props': ['error', 'always'],
      'jsonc/comma-dangle': ['error', 'never'], // 标准 JSON 不允许尾随逗号
      'jsonc/array-bracket-spacing': ['error', 'never'],
      'jsonc/object-curly-spacing': ['error', 'always'],
      'jsonc/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'jsonc/comma-style': ['error', 'last'],
    },
  },
  {
    files: ['**/*.{ts,js,jsx,cjs,mjs,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.next],
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylistic/jsx-wrap-multilines': [
        'error',
        {
          declaration: 'parens-new-line', // 变量声明时
          assignment: 'parens-new-line', // 赋值时
          return: 'parens-new-line', // return 返回时 (最常见)
          arrow: 'parens-new-line', // 箭头函数返回时
          condition: 'parens-new-line', // 三元运算符的条件中
          logical: 'parens-new-line', // 逻辑运算符中
          prop: 'parens-new-line', // 作为 props 传递时
        },
      ],

      // ----------- 数组 -----------
      '@stylistic/array-element-newline': ['error', 'consistent'],
      '@stylistic/array-bracket-newline': ['error', 'consistent'],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-empty-object-type': ['error', {
        allowInterfaces: 'with-single-extends',
      }],

      // ----------- 模板字符串 -----------
      'prefer-template': 'error',

      // ----------- jsx 属性排版相关规则 -----------
      // 1. 控制每行最多几个属性：当标签跨越多行时，强制每行只能有 1 个属性
      '@stylistic/jsx-max-props-per-line': ['error', { maximum: 1, when: 'multiline' }],
      // 2. 强制第一个属性换行：只要标签内有换行，第一个属性必须另起一行
      '@stylistic/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],
      // 3. 控制闭合标签 `>` 的位置：标签跨多行时，`>` 必须独立占一行，并且和开头的 `<` 对齐
      '@stylistic/jsx-closing-bracket-location': ['error', 'tag-aligned'],
      // 4. 控制属性的缩进（通常是 2 个空格，防止换行后缩进错乱）
      '@stylistic/jsx-indent-props': ['error', 2],


      // 1. 细化对象大括号的换行规则（精确覆盖普通对象、解构赋值、导入导出）
      '@stylistic/object-curly-newline': ['error', {
        ObjectExpression: { multiline: true, consistent: true }, // 普通对象
        ObjectPattern: { multiline: true, consistent: true }, // 解构赋值（如你的 props）
        ImportDeclaration: { multiline: true, consistent: true },
        ExportDeclaration: { multiline: true, consistent: true },
      }],

      // 2. 函数括号的换行规则：当参数内部有换行时，外部的括号也能保持一致
      '@stylistic/function-paren-newline': ['error', 'consistent'],



      // 强制 TypeScript 类型注解的冒号前后空格规范
      '@stylistic/type-annotation-spacing': ['error', {
        before: false, // 冒号前不要空格
        after: true, // 冒号后必须有空格
        overrides: {
          // 针对箭头函数的返回值类型，箭头前后都要有空格 =>
          arrow: {
            before: true,
            after: true,
          },
        },
      }],


      '@stylistic/space-in-parens': ['error', 'never'],

      // 控制 JSX 标签内前后的空格
      '@stylistic/jsx-tag-spacing': ['error', {
        closingSlash: 'never', // </ div> 这种闭合标签的斜杠前不要空格
        beforeSelfClosing: 'always', // <div /> 这种自闭合标签的 /> 前必须有空格
        afterOpening: 'never', // < div> 开始标签的 < 后面不要空格
        beforeClosing: 'never', // <div > 开始标签的 > 前面不要空格
      }],

      // 强制逗号后面必须有空格，前面不能有空格
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],


      // 强制对象字面量的冒号：前面无空格，后面有空格
      '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],


      // 强制没有子节点的组件或 HTML 标签自动转换为自闭合标签
      'react/self-closing-comp': ['error', {
        component: true,
        html: false,
      }],


      // 'no-restricted-imports': ['error', {
      //   patterns: [{
      //     group: ['./*', '../*'], // 拦截所有以 ./ 和 ../ 开头的导入
      //     message: '请使用 @/ 别名进行绝对路径导入，保持项目导入风格统一！',
      //   }],
      // }],
    },
  },
  {
    files: ['tests/**/*.{ts,js,jsx,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
