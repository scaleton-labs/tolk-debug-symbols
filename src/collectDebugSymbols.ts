import { TolkCompilerConfig } from '@ton/tolk-js';
import { DebugSymbols } from './types';
import { extractSymbolsFromSourceCode } from './extractSymbolsFromSourceCode';
import { extractSymbolsFromCompiler } from './extractSymbolsFromCompiler';

export async function collectDebugSymbols(
  config: TolkCompilerConfig,
): Promise<DebugSymbols> {
  const [symbolsFromCompiler, snapshot] =
    await extractSymbolsFromCompiler(config);

  const symbolsFromSourceCode = await extractSymbolsFromSourceCode(snapshot);

  return {
    ...symbolsFromCompiler,
    ...symbolsFromSourceCode,
  };
}
