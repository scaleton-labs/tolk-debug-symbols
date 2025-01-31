import Parser from 'web-tree-sitter';
import { Address, beginCell } from '@ton/core';
import { TolkResultSuccess } from '@ton/tolk-js';
import { sha256_sync } from '@ton/crypto';
import crc32 from 'buffer-crc32';
import { ConstantDescriptor, DebugSymbols } from './types';
import { loadTolk } from '@tonkite/tree-sitter-tolk';

export async function createParser(): Promise<Parser> {
  await Parser.init();
  const parser = new Parser();
  parser.setLanguage(await loadTolk());
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
      const declaration = node.childForFieldName('value')!.text;

      let type: 'int' | 'slice' | null = null;
      let value = declaration;

      let matches;
      if ((matches = value.match(/^"([^"]+)"([Hhcu])$/))) {
        const mode = matches[2] as 'H' | 'h' | 'c' | 'u';

        if (mode === 'u') {
          // u - hex(...)
          value = BigInt(
            '0x' + Buffer.from(matches[1]).toString('hex'),
          ).toString();
          type = 'int';
        } else if (mode === 'h') {
          // h - sha256(...) - first 32 bits
          value = BigInt(
            '0x' + sha256_sync(matches[1]).subarray(0, 4).toString('hex'),
          ).toString();
          type = 'int';
        } else if (mode === 'H') {
          // H - sha256(...) - all 256 bits
          value = BigInt(
            '0x' + sha256_sync(matches[1]).toString('hex'),
          ).toString();
          type = 'int';
        } else if (mode === 'c') {
          // c - crc32(...)
          value = crc32(matches[1]).readUint32BE().toString();
          type = 'int';
        }
      } else if ((matches = value.match(/^-?(0x[0-9a-fA-F]+|[0-9]+)$/))) {
        const sign = value.startsWith('-') ? -1n : 1n;
        value = (BigInt(matches[1]) * sign).toString();
        type = 'int';
      } else if ((matches = value.match(/^"([^"]*)"a$/))) {
        // a - address
        try {
          value = beginCell()
            .storeAddress(Address.parse(matches[1]))
            .endCell()
            .toString()
            .toLowerCase();
          type = 'slice';
        } catch (e) {
          console.log('Address not supported:', value);
          continue;
        }
      } else if ((matches = value.match(/^"([0-9a-fA-F]+)"s$/))) {
        // ascii string
        value = `x{${matches[1].toLowerCase()}}`;
        type = 'slice';
      } else if ((matches = value.match(/^"([^"]*)"$/))) {
        // ascii string
        value = beginCell()
          .storeStringTail(matches[1])
          .endCell()
          .toString()
          .toLowerCase();
        type = 'slice';
      } else {
        continue;
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
