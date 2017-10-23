export interface ParseOptions {
	comment?: RegExp | string | string[] | false
	delimiter?: string
	escape?: RegExp
	newlines?: RegExp | string | string[]
	resolve?: boolean | ((value: string) => any)
	section?: RegExp
	trim?: boolean
}

export default class Parser {

	static defaultOptions: ParseOptions = {
		comment: /[#;]/,
		delimiter: '=',
		escape: /\\(.)/g,
		newlines: /\r?\n/g,
		resolve: true,
		section: /^\[([^\]]*)\]$/,
		trim: true,
	}

	private options: ParseOptions
	private comment: RegExp | false
	private delimiter: RegExp
	private newlines: RegExp
	private parseResult: {}
	private currentSection: {}

	constructor(options: ParseOptions = {}) {
		this.resetConfiguration()
		this.configure(options)
	}

	public resetConfiguration() {
		this.options = { ...Parser.defaultOptions }
	}

	public configure(options: ParseOptions = {}) {
		Object.keys(options).forEach(key => {
			this.options[key] = options[key]
		})
		this.comment = this.commentToRegExp(this.options.comment)
		this.newlines = this.toRegExp(
			this.options.newlines,
			Parser.defaultOptions.newlines,
		)
	}

	public parse(contents?: string) {
		this.parseResult = {}
		this.currentSection = this.parseResult
		if (!contents) {
			return this.parseResult
		}
		contents
			.split(this.newlines)
			.forEach(this.parseLine.bind(this))
		return this.parseResult
	}

	private commentToRegExp(comment?: RegExp | string | string[] | false) {
		return (comment) ? this.toRegExp(comment, false) : false
	}

	private toRegExp<T>(value?: RegExp | string | string[], fallback?: T) {
		if (typeof value === 'string') {
			return new RegExp(`\\${value.split('').join('\\')}`)
		}
		if (Array.isArray(value)) {
			return new RegExp(`[${value.join('')}]`)
		}
		return value as RegExp || fallback
	}

	private parseLine(text: string) {
		const {
			options,
			parseResult,
		} = this
		if (options.trim) {
			text = text.trim()
		}
		if (this.comment && this.comment.test(text)) {
			[text] = text.split(this.comment, 1)
		}
		if (!text) {
			return;
		}
		// escape
		if (options.section) {
			const matches = options.section.exec(text)
			if (matches) {
				const key = matches[1] || ''
				this.currentSection = parseResult[key] = parseResult[key] || {}
				return
			}
		}
		if (options.delimiter) {
			const [key, ...values] = text.split(this.delimiter)
			this.currentSection[key] = this.resolveValue(
				values.join(options.delimiter)
			)
		}
	}

	private resolveValue(value: string) {
		if (this.options.resolve === true) {
			return parseValue(value)
		}
		if (this.options.resolve) {
			return this.options.resolve(value)
		}
		return value

		function parseValue(value: string) {
			try {
				return JSON.parse(value)
			} catch {
				return value
			}
		}
	}
}
