import { CompilerConfig } from '@ton-community/func-js';
import { DebugSymbols } from './types';
import { extractSymbolsFromSourceCode } from './extractSymbolsFromSourceCode';
import { extractSymbolsFromCompiler } from './extractSymbolsFromCompiler';

export async function collectDebugSymbols(
  config: CompilerConfig,
): Promise<DebugSymbols> {
  const [symbolsFromCompiler, snapshot] =
    await extractSymbolsFromCompiler(config);

  const symbolsFromSourceCode = await extractSymbolsFromSourceCode(snapshot);

  return {
    ...symbolsFromCompiler,
    ...symbolsFromSourceCode,
  };
}
