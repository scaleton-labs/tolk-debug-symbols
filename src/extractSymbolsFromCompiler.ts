import { DebugSymbols } from './types';
import { runDebugTolkCompiler } from './tolkDebugCompiler';
import { Cell } from '@ton/core';
import { unpackDebugSymbols } from './unpackDebugSymbols';
import { TolkCompilerConfig, TolkResultSuccess } from '@ton/tolk-js';

export async function extractSymbolsFromCompiler(
  config: TolkCompilerConfig,
): Promise<
  [
    Pick<DebugSymbols, 'globals' | 'procedures'>,
    TolkResultSuccess['sourcesSnapshot'],
  ]
> {
  const result = await runDebugTolkCompiler(config);

  if (result.status === 'error') {
    throw new Error('Cannot compile contacts: ' + result.message);
  }

  const rootCell = Cell.fromBase64(result.codeBoc64);

  return [unpackDebugSymbols(rootCell), result.sourcesSnapshot];
}
