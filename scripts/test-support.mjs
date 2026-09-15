import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const modules = new Map()
async function sourceUrl(source, base) {
  let script = stripTypeScriptTypes(source)
  for (const specifier of new Set([...script.matchAll(/from ['"]([^'"]+)['"]/g)].map(match => match[1]))) {
    let replacement
    if (specifier.startsWith('.')) {
      const dependency = new URL(specifier, base)
      if (specifier.endsWith('.json')) replacement = `'${dependency.href}' with { type: 'json' }`
      else {
        if (!specifier.endsWith('.ts')) dependency.pathname += '.ts'
        replacement = `'${await moduleUrl(dependency)}'`
      }
    } else replacement = `'${import.meta.resolve(specifier)}'`
    script = script.replaceAll(`from '${specifier}'`, `from ${replacement}`).replaceAll(`from "${specifier}"`, `from ${replacement}`)
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
