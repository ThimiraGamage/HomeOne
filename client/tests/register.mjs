// Test-only TS/TSX loader using the repository's existing TypeScript compiler.
import { registerHooks } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL && !/\.[a-z]+$/i.test(specifier)) {
      const candidate = new URL(specifier, context.parentURL)
      for (const extension of ['.ts', '.tsx']) {
        if (existsSync(fileURLToPath(candidate) + extension)) return { url: candidate.href + extension, shortCircuit: true }
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (/\.css$/.test(url)) return { format: 'module', source: '', shortCircuit: true }
    if (/\.tsx?$/.test(url)) {
      const source = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        fileName: fileURLToPath(url),
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX, verbatimModuleSyntax: true },
      }).outputText
      return { format: 'module', source, shortCircuit: true }
    }
    return nextLoad(url, context)
  },
})
