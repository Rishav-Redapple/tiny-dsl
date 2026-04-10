import { isAlpha } from "./string-utils";
import StringView from "./string-view";

export type Command = {
  name: string;
  args: string[];
  exec: (args: any[]) => Promise<any> | any | AsyncGenerator<any, any, any>;
}


class TinyDsl {
  private commands: Record<string, Command> = {};
  private name = "";

  constructor() { }

  defineCommand(command: Command) {
    if (this.commands[command.name])
      throw new Error(`function ${command.name}() already declared`);
    this.commands[command.name] = command;
  }

  parse<T>(name: string, s: string): T {
    this.name = name;
    const sv = new StringView(s);
    const cmd = this.fnLookup(sv);
    const args = this.argparse(sv, cmd);
    const out = this.execute(cmd, args);
    return out as T;
  }

  async *parseAsync<T>(name: string, s: string): AsyncGenerator<any, T, any> {
    this.name = name;
    const sv = new StringView(s);
    const cmd = this.fnLookup(sv);
    const args = this.argparse(sv, cmd);
    const out = this.execute(cmd, args);

    if (typeof out == "object" && Symbol.asyncIterator in out) {
      const iter: AsyncIterator<any, T, any> = out[Symbol.asyncIterator]();

      while (true) {
        const { value, done } = await iter.next();
        if (done) return value;
        yield value;
      }
    }

    return Promise.resolve(out) as T;
  }

  async stream<T>(data: AsyncGenerator<any, T, any>, callback: (t: T) => void) {
    if (!(Symbol.asyncIterator in data))
      throw new Error("data is not streamable");
    while (true) {
      const { done, value } = await data.next();
      callback(value);
      if (done) break;
    }
  }

  private fnLookup(sv: StringView): Command {
    const cmd = this.commands[this.name];
    if (!cmd) throw new Error(`unknown function "${this.name}"`);

    sv.trim();
    const fnName = sv.consumeUntil(ch => !isAlpha(ch));
    if (fnName != this.name)
      throw new Error(`expected function ${this.name}(). got ${fnName}()`);

    sv.skipMust("(");
    sv.trim();

    return cmd;
  }

  private argparse(sv: StringView, cmd: Command) {
    const args: any[] = [];
    cmd.args.forEach((typ, i) => {
      let valRaw = "";

      if (i < cmd.args.length - 1) {
        valRaw = sv.consumeUntil(",");
        sv.skipMust(",");
      } else {
        valRaw = sv.consumeUntil(")");
        sv.skipMust(")");
      }

      const _sv = new StringView(valRaw);
      _sv.trimEnd();
      const val = _sv.toString();

      switch (typ) {
        case "int":
          const n = Number(val);
          if (Number.isNaN(n)) throw new SyntaxError(`expected a number. got "${val}"`);
          args.push(n);
          break;

        case "str":
          args.push(val);
          break;

        default: throw new TypeError(`unknown type: "${typ}"`);
      }
    });
    return args;
  }

  private execute(cmd: Command, args: any[]) {
    return cmd.exec(args);
  }
}

export default TinyDsl;
