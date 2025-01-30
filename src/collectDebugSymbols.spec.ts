import { TolkCompilerConfig } from '@ton/tolk-js';
import { collectDebugSymbols } from './collectDebugSymbols';

describe('collectDebugSymbols', () => {
  it('collects information about procedures and globals', async () => {
    const config: TolkCompilerConfig = {
      entrypointFileName: 'main.tolk',
      fsReadCallback: () => `
        global a: int;
        global b: cell;
        global c: slice;

        @inline
        fun throwInline() {
          throw 1;
        }

        @inline_ref
        fun throwInlineRef() {
          throw 2;
        }

        @method_id(88)
        fun throwGet() {
          throw 3;
        }

        fun onInternalMessage() {
          throw 4;
        }
      `,
    };

    const debugSymbols = await collectDebugSymbols(config);
    expect(debugSymbols).toMatchSnapshot();
  });

  it('collects information about constants', async () => {
    const config: TolkCompilerConfig = {
      entrypointFileName: 'main.fc',
      fsReadCallback: () => `
        const h: int = 0xBEEF;
        const k: int = 1000;
        const l: slice = "hello";
        const m: slice = "cafe"s;
        const n: slice = "Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF"a;
        const o: int = "ping"u;
        const p: int = "tranfser"h;
        const q: int = "tranfser"H;
        const r: int = "tranfser"c;

        // expressions aren't supported
        const i: int = -0xCAFE;
        const j: int = -1000;
        const s: int = k * j;

        get getConstants() {
          return (h, i, j, k, l, m, n, o, p, q, r);
        }

        fun onInternalMessage(inMsgBody: slice) {
          return ();
        }
      `,
    };

    const debugSymbols = await collectDebugSymbols(config);
    expect(debugSymbols).toMatchSnapshot();
  });

  it('works with empty functions', async () => {
    const config: TolkCompilerConfig = {
      entrypointFileName: 'main.fc',
      fsReadCallback: () => `
        fun main() {}
      `,
    };

    const debugSymbols = await collectDebugSymbols(config);
    expect(debugSymbols).toMatchSnapshot();
  });

  it('works with untyped constants', async () => {
    const config: TolkCompilerConfig = {
      entrypointFileName: 'main.fc',
      fsReadCallback: () => `
        const a = 1000;
        fun main() {}
      `,
    };

    const debugSymbols = await collectDebugSymbols(config);
    expect(debugSymbols).toMatchSnapshot();
  });
});
