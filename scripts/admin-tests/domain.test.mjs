import test from 'node:test'
import assert from 'node:assert/strict'
import { importTs } from './helpers.mjs'

test('matchesQuery ignores accents and casing across selected fields', async () => {
  const { matchesQuery } = await importTs('src/portal/admin/lib/filtering.ts')
  const record = { nombre: 'Logística Segura', ciudad: 'Manta' }
  assert.equal(matchesQuery(record, 'logistica', ['nombre', 'ciudad']), true)
  assert.equal(matchesQuery(record, 'QUITO', ['nombre', 'ciudad']), false)
})

test('filterByField treats Todos as no filter', async () => {
  const { filterByField } = await importTs('src/portal/admin/lib/filtering.ts')
  const rows = [{ estado: 'ACTIVO' }, { estado: 'INACTIVO' }]
  assert.equal(filterByField(rows, 'estado', 'Todos').length, 2)
  assert.deepEqual(filterByField(rows, 'estado', 'ACTIVO'), [{ estado: 'ACTIVO' }])
})

test('summarizePlans counts active plans and every assigned user', async () => {
  const { summarizePlans } = await importTs('src/portal/admin/lib/adminMetrics.ts')
  assert.deepEqual(summarizePlans([{ activo: true, users: 3 }, { activo: false, users: 2 }]), { active: 1, users: 5 })
})

test('filterSecurity combines severity and status filters with Todos', async () => {
  const { filterSecurity } = await importTs('src/portal/admin/lib/adminMetrics.ts')
  const rows = [{ gravedad: 'ALTA', estado: 'ABIERTA' }, { gravedad: 'BAJA', estado: 'RESUELTA' }]
  assert.deepEqual(filterSecurity(rows, 'Todos', 'ABIERTA'), [{ gravedad: 'ALTA', estado: 'ABIERTA' }])
})

test('createExcelHtml escapes text content before producing a table', async () => {
  const { createExcelHtml } = await importTs('src/portal/admin/lib/exportExcel.ts')
  const html = createExcelHtml('Usuarios & <todos>', ['Nombre'], [["A < B & 'C'"]])
  assert.match(html, /Usuarios &amp; &lt;todos&gt;/)
  assert.match(html, /A &lt; B &amp; &#039;C&#039;/)
  assert.match(html, /<table>/)
})

test('esUrlAdminPermitida accepts relative and explicitly safe document URLs only', async () => {
  const { esUrlAdminPermitida } = await importTs('src/portal/admin/lib/documentos.ts')
  for (const url of ['media/cv.pdf', '/assets/certificado.pdf', 'https://safe.ec/doc.pdf', 'http://localhost/file.pdf', 'blob:https://safe.ec/uuid']) assert.equal(esUrlAdminPermitida(url), true)
  for (const url of ['javascript:alert(1)', 'data:text/html,boom', '//externo.example/file.pdf', 'C:\\documento.pdf', '']) assert.equal(esUrlAdminPermitida(url), false)
})
