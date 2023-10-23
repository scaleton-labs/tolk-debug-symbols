import { CompilerConfig } from '@ton-community/func-js';
import { DebugSymbols } from './types';
import { createDebugCompiler } from './createDebugCompiler';
import { Cell } from '@ton/core';
import { unpackDebugSymbols } from './unpackDebugSymbols';

export async function extractSymbolsFromCompiler(
  config: CompilerConfig,
): Promise<Pick<DebugSymbols, 'globals' | 'procedures'>> {
  const compiler = createDebugCompiler();
  const result = await compiler.compileFunc(config);

  if (result.status === 'error') {
    throw new Error('Cannot compile contacts: ' + result.message);
  }

  const rootCell = Cell.fromBase64(result.codeBoc);

  return unpackDebugSymbols(rootCell);
}
