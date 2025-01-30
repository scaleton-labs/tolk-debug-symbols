import Parser from 'web-tree-sitter';
import { Address, beginCell } from '@ton/core';
import { TolkResultSuccess } from '@ton/tolk-js';
import { sha256_sync } from '@ton/crypto';
import crc32 from 'buffer-crc32';
import { ConstantDescriptor, DebugSymbols } from './types';

export async function createParser(): Promise<Parser> {
  await Parser.init();
  const parser = new Parser();
  parser.setLanguage(
    await Parser.Language.load(`${__dirname}/../tree-sitter-tolk.wasm`),
  );
  return parser;
}

export async function extractSymbolsFromSourceCode(
  snapshot: TolkResultSuccess['sourcesSnapshot'],
): Promise<Pick<DebugSymbols, 'constants'>> {
  const parser = await createParser();

  const { rootNode } = parser.parse(
    snapshot.map((entry) => entry.contents).join('\n'),
  );

  const constants: ConstantDescriptor[] = [];

  for (const node of rootNode.children) {
    if (node.type === 'constant_declaration') {
      const name = node.childForFieldName('name')!.text;
      const type = (node.childForFieldName('type')?.text ?? null) as 'int' | 'slice' | null;
      const declaration = node.childForFieldName('value')!.text;

      let value = declaration;

      if (type === 'int') {
        let matches;
        if ((matches = value.match(/^"([^"]+)"([Hhcu])$/))) {
          const mode = matches[2] as 'H' | 'h' | 'c' | 'u';

          if (mode === 'u') {
            // u - hex(...)
            value = BigInt(
              '0x' + Buffer.from(matches[1]).toString('hex'),
            ).toString();
          } else if (mode === 'h') {
            // h - sha256(...) - first 32 bits
            value = BigInt(
              '0x' + sha256_sync(matches[1]).subarray(0, 4).toString('hex'),
            ).toString();
          } else if (mode === 'H') {
            // H - sha256(...) - all 256 bits
            value = BigInt(
              '0x' + sha256_sync(matches[1]).toString('hex'),
            ).toString();
          } else if (mode === 'c') {
            // c - crc32(...)
            value = crc32(matches[1]).readUint32BE().toString();
          }
        } else if ((matches = value.match(/^-?(0x[0-9a-fA-F]+|[0-9]+)$/))) {
          const sign = value.startsWith('-') ? -1n : 1n;
          value = (BigInt(matches[1]) * sign).toString();
        } else {
          continue;
        }
      }

      if (type === 'slice') {
        let matches;
        if ((matches = value.match(/^"([^"]*)"a$/))) {
          // a - address
          try {
            value = beginCell()
              .storeAddress(Address.parse(matches[1]))
              .endCell()
              .toString()
              .toLowerCase();
          } catch (e) {
            console.log('Address not supported:', value);
            continue;
          }
        } else if ((matches = value.match(/^"([0-9a-fA-F]+)"s$/))) {
          // ascii string
          value = `x{${matches[1].toLowerCase()}}`;
        } else if ((matches = value.match(/^"([^"]*)"$/))) {
          // ascii string
          value = beginCell()
            .storeStringTail(matches[1])
            .endCell()
            .toString()
            .toLowerCase();
        } else {
          console.log('Not supported:', value);
          continue;
        }
      }

      constants.push({
        type,
        name,
        value,
        declaration,
      });
    }
  }

  return {
    constants,
  };
}
