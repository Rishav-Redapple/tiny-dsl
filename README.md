# tiny-dsl

A small script to make functions

## usage

```js
// start with defining tge function
defineCommand({ name: string, args: ["int", "int"], exec: ([a, b]) => a+b })
// then parse & execute the command
parseCommand(name: string, StringView)
```

### defineCommand

This is the function you use to create the function.

**params**

name (string) = The name of your function.
args (argType[]) where argType is "int" | "str" = Arguments your function will have and its type.
exec (Function | Async Function) = This is where you write the purpose of your function.

---

## Installation & Development
To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
