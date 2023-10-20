import { CompilerConfig } from '@ton-community/func-js';
import { collectDebugSymbols } from './collectDebugSymbols';

describe('collectDebugSymbols', () => {
  it('collects information about procedures and globals', async () => {
    const config: CompilerConfig = {
      targets: ['main.fc'],
      sources: {
        'main.fc': `
          global int a;
          global cell b;
          global slice c;

          () throw_inline() impure inline { throw(1); }
          () throw_inline_ref() impure inline_ref { throw(2); }
          () throw_get() method_id(88) { throw(3); }
          () recv_internal() { throw(4); }
        `,
      },
    };

    const debugSymbols = await collectDebugSymbols(config);
    expect(debugSymbols).toMatchSnapshot();
  });
});
