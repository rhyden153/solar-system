import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { NodeTypes, parse } from '@vue/compiler-dom'

const output = new URL('../.output/', import.meta.url)
assert.ok(!(await readdir(output)).includes('server'), 'Deployment must not require a runtime server')
const root = new URL('public/', output)
const document = parse(await readFile(new URL('index.html', root), 'utf8'))
const startupScripts = new Set()
function visit(node) {
  if (node.type === NodeTypes.ELEMENT) {
    const attributes = Object.fromEntries(node.props
      .filter(prop => prop.type === NodeTypes.ATTRIBUTE)
      .map(prop => [prop.name, prop.value?.content]))
    if (node.tag === 'script' && attributes.src) startupScripts.add(attributes.src)
    if (node.tag === 'link') {
      assert.notEqual(attributes.rel, 'prefetch', 'Mission chunks must not download speculatively')
      if (attributes.rel === 'modulepreload') startupScripts.add(attributes.href)
    }
  }
  for (const child of node.children ?? []) visit(child)
}
visit(document)
assert.ok(startupScripts.size > 0, 'Static HTML must load the browser application')
let startupBytes = 0
for (const asset of startupScripts) {
  assert.ok(asset.startsWith('/_nuxt/'), `Expected a local bundled asset: ${asset}`)
  startupBytes += (await stat(new URL(asset.slice(1), root))).size
}
assert.ok(startupBytes < 300_000, `Initial JavaScript must stay below 300 kB; found ${startupBytes} bytes`)
for (const file of ['404.html', 'favicon.ico', 'robots.txt']) {
  assert.ok((await stat(new URL(file, root))).isFile(), `Missing static file: ${file}`)
}
console.log(`Static deployment passed: no runtime server, no speculative downloads, ${startupBytes} bytes of startup JavaScript.`)
