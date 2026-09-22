/** Remembers the last result of `compute` and reuses it while the inputs stay the same (by identity). */
export class LastResult<Args extends unknown[], Result> {
	private last: { args: Args; result: Result } | undefined;

	constructor(private readonly compute: (...args: Args) => Result) {}

	get(...args: Args): Result {
		const { last } = this;
		if (last && last.args.length === args.length && last.args.every((arg, i) => arg === args[i])) return last.result;
		const result = this.compute(...args);
		this.last = { args, result };
		return result;
	}
}
