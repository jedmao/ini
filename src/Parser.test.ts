import test from 'ava';

import Parser from './Parser'

const parser = new Parser()

test.afterEach(() => {
	parser.resetConfiguration()
})

test('ignores a line that begins with a comment indicator', t => {
	['#a=b', ';c=d'].forEach(comment => {
		t.deepEqual(parser.parse(comment), {})
	})
});

test('ignores a line that begins with a custom comment indicator', t => {
	parser.configure({ comment: '$' })
	t.deepEqual(parser.parse('$a=b'), {})
	parser.configure({ comment: ['$', '//'] })
	t.deepEqual(parser.parse('$a=b\n//c=d'), {})
	parser.configure({ comment: /\*{2}/ })
	t.deepEqual(parser.parse('**a=b'), {})
	t.deepEqual(parser.parse('*a=b'), { '*a': 'b' })
})

test('ignores the portion of a line that follows a comment indicator', t => {
	parser.configure({ comment: '#' })
	t.deepEqual(parser.parse('a=b#c'), { a: 'b' })
})

test('supports progressive configurations', t => {
	const expected = { a: 'b' }
	t.notDeepEqual(parser.parse('a=bxz'), expected)
	parser.configure({ comment: /x/ })
	t.deepEqual(parser.parse('a=bxz'), expected)
	t.notDeepEqual(parser.parse('a:bxz'), expected)
	parser.configure({ delimiter: /:/ })
	t.deepEqual(parser.parse('a:bxz'), expected)
})

test('trims leading and trailing whitespaces, unless trim=false', t => {
	const input = '  a=b  '
	t.deepEqual(parser.parse(input), { a: 'b' })
	parser.configure({ trim: false })
	t.deepEqual(parser.parse(input), { '  a': 'b  ' })
})

test('preserves spaces inside keys and values', t => {
	t.deepEqual(parser.parse('a b=c d'), { 'a b': 'c d' })
})

test('preserves an escaped newline', t => {
	t.deepEqual(parser.parse('a=b\\nc\nd=e'), { a: 'b\\nc', d: 'e' })
})

test.only('preserves an escaped equal sign', t => {
	t.deepEqual(parser.parse('a=b=c'), { 'a': 'b=c' })
})

test('parses a string value', t => {
	t.deepEqual(parser.parse('a=b'), { a: 'b' })
})

test('resolves a numeric value, unless resolve=false', t => {
	const input = 'a=1'
	t.deepEqual(parser.parse(input), { a: 1 })
	parser.configure({ resolve: false })
	t.deepEqual(parser.parse(input), { a: '1' })
})

test('resolves a Boolean value, unless resolve=false', t => {
	const input = 'a=true'
	t.deepEqual(parser.parse(input), { a: true })
	parser.configure({ resolve: false })
	t.deepEqual(parser.parse(input), { a: 'true' })
})

test('resolves an array value, unless resolve=false', t => {
	const input = 'a=["b","c"]'
	t.deepEqual(parser.parse(input), { a: ['b', 'c'] })
	parser.configure({ resolve: false })
	t.deepEqual(parser.parse(input), { a: '["b","c"]' })
})

test('resolves with a custom function', t => {
	parser.configure({ resolve: (text) => text + 'z' })
	t.deepEqual(parser.parse('a=b'), { a: 'bz' })
})

test('parses a custom delimiter', t => {
	const expected = { a: 'b' }
	parser.configure({ delimiter: ':' })
	t.deepEqual(parser.parse('a:b'), expected)
	parser.configure({ delimiter: '::' })
	t.deepEqual(parser.parse('a::b'), expected)
})

test('parses a section', t => {
	t.deepEqual(parser.parse('[a]'), { a: {} })
})

test('parses a custom section', t => {
	parser.configure({ section: /^\<([^\]]*)\>$/ })
	t.deepEqual(parser.parse('<a>'), { a: {} })
})

test('parses a section with a declaration', t => {
	t.deepEqual(
		parser.parse([
			'[a]',
			'b=c',
		].join('\n')),
		{
			a: {
				b: 'c',
			},
		},
	)
})

test('parses 2 sections', t => {
	t.deepEqual(
		parser.parse([
			'[a]',
			'[b]',
		].join('\n')),
		{
			a: {},
			b: {},
		},
	)
})

test('parses 2 sections with 2 declarations each', t => {
	t.deepEqual(
		parser.parse([
			'[a]',
			'b=c',
			'd=e',
			'[f]',
			'g=h',
			'i=j',
		].join('\n')),
		{
			a: {
				b: 'c',
				d: 'e',
			},
			f: {
				g: 'h',
				i: 'j',
			},
		},
	)
})

test('extends a previously-declared section', t => {
	t.deepEqual(
		parser.parse([
			'[a]',
			'b=c',
			'[d]',
			'e=f',
			'[a]',
			'g=h',
		].join('\n')),
		{
			a: {
				b: 'c',
				g: 'h',
			},
			d: {
				e: 'f',
			},
		},
	)
})

test('parses a custom newline sequences', t => {
	parser.configure({ newlines: ['x', 'y'] })
	t.deepEqual(parser.parse('a=bxc=dye=f'), { a: 'b', c: 'd', e: 'f' })
})
