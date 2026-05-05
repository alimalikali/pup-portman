import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderTable } from '../../../src/ui/table.js'

test('renderTable: aligns columns to widest cell', () => {
  const out = renderTable(['A', 'BB'], [['1', '22'], ['333', '4']])
  const lines = out.split('\n')
  assert.equal(lines[0], 'A    BB')
  assert.equal(lines[1], '1    22')
  assert.equal(lines[2], '333  4')
})

test('renderTable: empty rows just prints header', () => {
  const out = renderTable(['A'], [])
  assert.equal(out, 'A')
})

test('renderTable: missing cells render as empty', () => {
  const out = renderTable(['A', 'B'], [['x']])
  assert.equal(out, 'A  B\nx')
})
