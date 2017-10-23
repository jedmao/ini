import test from 'ava';

import {
	configure,
	parse,
	resetConfiguration,
} from './'

test.afterEach(resetConfiguration)

test('supports progressive configurations', t => {
	const expected = { a: 'b' }
	t.notDeepEqual(parse('a=bxz'), expected)
	configure({ comment: /x/ })
	t.deepEqual(parse('a=bxz'), expected)
	t.notDeepEqual(parse('a:bxz'), expected)
	configure({ delimiter: /:/ })
	t.deepEqual(parse('a:bxz'), expected)
})
