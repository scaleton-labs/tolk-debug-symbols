import { CompilerConfig } from '@ton-community/func-js';
import { DebugSymbols } from './types';
import { extractSymbolsFromSourceCode } from './extractSymbolsFromSourceCode';
import { extractSymbolsFromCompiler } from './extractSymbolsFromCompiler';

export async function collectDebugSymbols(
  config: CompilerConfig,
): Promise<DebugSymbols> {
  const symbolsFromCompiler = await extractSymbolsFromCompiler(config);
  const symbolsFromSourceCode = await extractSymbolsFromSourceCode(config);

  return {
    ...symbolsFromCompiler,
    ...symbolsFromSourceCode,
  };
}
