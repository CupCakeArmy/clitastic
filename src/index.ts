import 'colors'
import readline from 'readline'
import Timeout = NodeJS.Timeout

export const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time * 1000))

type CLIWriterStream = NodeJS.ReadWriteStream


export class Writer {
	private rl: readline.Interface
	private readonly output: CLIWriterStream
	private readonly input: CLIWriterStream
	private lines: number = 1

	constructor(initial?: string, output: CLIWriterStream = process.stdout, input: CLIWriterStream = process.stdin) {
		this.output = output
		this.input = input
		this.rl = this.create()

		if (initial)
			this.update(initial)
	}

	replaceAll(data?: string): this {
		readline.moveCursor(this.output, 0, -(this.lines -1 ))
		readline.cursorTo(this.output, 0)
		readline.clearScreenDown(this.output)
		this.update(data)
		return this
	}

	replaceLn(data?: string): this {
		readline.clearLine(this.output, 0)
		readline.cursorTo(this.output, 0)
		this.lines--
		this.update(data)
		return this
	}

	append(data?: string): this {
		this.update(data)
		return this
	}

	appendLn(data?: string): this {
		this.append('\n' + (data || ''))
		return this
	}

	done(data?: string) {
		if (data)
			this.replaceLn(data)
		this.append('\n')
		this.rl.close()
		// console.log('lines', this.lines)
	}

	private create() {
		return readline.createInterface({
			input: this.input,
			output: this.output,
		})
	}

	private update(data?: string) {
		if (!data) return
		this.lines += data.split(/\r\n|\r|\n/).length - 1
		this.rl.write(data)
	}
}


export class Spinner {
	private readonly chars: string[]
	private readonly speed: number
	private readonly writer: Writer
	private readonly timeout: Timeout
	private counter: number = 0

	constructor(chars: string | string[] = '◝◞◟◜', speed: number = 100) {
		this.chars = Array.isArray(chars) ? chars : chars.split('')
		this.speed = speed
		this.writer = new Writer(this.getNextChar())
		this.timeout = setInterval(() => {
			this.update()
		}, speed)
	}

	done() {
		this.writer.done()
		clearInterval(this.timeout)
	}

	private getNextChar(): string {
		const c = this.chars[this.counter]
		this.counter = (this.counter + 1) % this.chars.length
		return c
	}

	private update() {
		this.writer.replaceLn(this.getNextChar())
	}
}


export class List {
	static readonly DefaultIcon: string = '○'
	private readonly writer: Writer
	private icon: string | string[]
	private items: any[]

	constructor(items: any[], icon: string | string[] = List.DefaultIcon) {
		this.writer = new Writer()
		this.items = items
		this.icon = icon

		this.render()
	}

	update(items: any[], icon: string | string[] = List.DefaultIcon): this {
		this.items = items
		this.icon = icon
		this.render()
		return this
	}

	done() {
		this.writer.done()
	}

	private render() {
		this.writer.replaceAll()
		let first = true
		for (let i = 0; i < this.items.length; ++i) {
			const text = `${Array.isArray(this.icon) ? this.icon[i] : this.icon} ${String(this.items[i])}`
			if (first) {
				this.writer.append(text)
				first = false
			} else
				this.writer.appendLn(text)
		}
		// this.writer.appendLn()
	}
}