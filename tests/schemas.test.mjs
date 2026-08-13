import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import Ajv2020 from 'ajv/dist/2020.js'

const json = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))

test('public evidence validates against its advertised Draft 2020-12 schemas', async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true, formats: {
    uri: (value) => URL.canParse(value),
    date: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
  } })
  const contracts = [
    ['public/capabilities.json', 'public/schemas/capabilities-v2.schema.json'],
    ['public/benchmarks.json', 'public/schemas/benchmarks-v2.schema.json'],
  ]

  for (const [documentPath, schemaPath] of contracts) {
    const [document, schema] = await Promise.all([json(documentPath), json(schemaPath)])
    const validate = ajv.compile(schema)
    assert.equal(validate(document), true, `${documentPath}: ${ajv.errorsText(validate.errors)}`)
    assert.equal(document.$schema, schema.$id)
  }
})
