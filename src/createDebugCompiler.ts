import { FuncCompiler } from '@ton-community/func-js';
import { object as latestObject } from '@ton-community/func-js-bin';
import { ASM_FIF_CONTENT } from './constants';

export function createDebugCompiler(): FuncCompiler {
  const originalCompiler = new FuncCompiler(latestObject) as any;

  return Object.assign(originalCompiler, {
    createModule: async () => {
      const module = await originalCompiler.module({
        wasmBinary: originalCompiler.wasmBinary,
      });

      module.FS.writeFile('/fiftlib/Asm.fif', ASM_FIF_CONTENT);

      return module;
    },
  });
}
