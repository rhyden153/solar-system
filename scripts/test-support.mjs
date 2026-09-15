import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import ts from 'typescript'

const modules = new Map()
async function sourceUrl(source, base) {
  let script = stripTypeScriptTypes(source)
  const parsed = ts.createSourceFile(base.pathname, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const imports = []
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) imports.push({ literal: node.moduleSpecifier, dynamic: false })
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      imports.push({ literal: node.arguments[0], dynamic: true })
    }
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  for (const { literal, dynamic } of imports.sort((a, b) => b.literal.pos - a.literal.pos)) {
    if (!ts.isStringLiteral(literal)) throw new Error('Test loader requires literal module specifiers')
    const specifier = literal.text
    let replacement
    if (specifier.startsWith('.')) {
      const dependency = new URL(specifier, base)
      if (specifier.endsWith('.json')) replacement = `'${dependency.href}'${dynamic ? ", { with: { type: 'json' } }" : " with { type: 'json' }"}`
      else {
        if (!specifier.endsWith('.ts')) dependency.pathname += '.ts'
        replacement = `'${await moduleUrl(dependency)}'`
      }
    } else replacement = `'${import.meta.resolve(specifier)}'`
    script = script.slice(0, literal.getStart(parsed)) + replacement + script.slice(literal.end)
  }
  return `data:text/javascript;base64,${Buffer.from(script).toString('base64')}`
}
async function moduleUrl(file) {
  if (!modules.has(file.href)) modules.set(file.href, readFile(file, 'utf8').then(source => sourceUrl(source, file)))
  return modules.get(file.href)
}
export async function loadTsModule(file) { return import(await moduleUrl(file)) }
export async function loadLaboratory() {
  const { useLaboratory } = await loadTsModule(new URL('../app/composables/useLaboratory.ts', import.meta.url))
  return useLaboratory({ lifecycle: false })
}

// Compile isolated components with Vue's compiler instead of extracting script text.
export async function loadVueComponent(file) {
  const { parse, compileScript } = await import('@vue/compiler-sfc')
  const { descriptor } = parse(await readFile(file, 'utf8'), { filename: file.pathname })
  const { content } = compileScript(descriptor, { id: file.pathname, inlineTemplate: true })
  return (await import(await sourceUrl(content, file))).default
}
