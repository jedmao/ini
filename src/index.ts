import Parser, { ParseOptions } from './Parser'

export {
	ParseOptions,
	Parser,
}

const parser = new Parser()

export function configure(options: ParseOptions = {}) {
	parser.configure(options)
}

export function resetConfiguration() {
	parser.resetConfiguration()
}

export function parse(contents?: string) {
	return parser.parse(contents)
}
