import { ConstantDescriptor, DebugSymbols } from './types';
import { SourceEntry } from '@ton-community/func-js';
import Parser from 'web-tree-sitter';
import { loadFunC } from '@scaleton/tree-sitter-func';
import { sha256_sync } from '@ton/crypto';
import crc32 from 'buffer-crc32';
import { Address, beginCell } from '@ton/core';

export async function extractSymbolsFromSourceCode(
  snapshot: SourceEntry[],
): Promise<Pick<DebugSymbols, 'constants'>> {
  await Parser.init();
  const parser = new Parser();

  parser.setLanguage(await loadFunC());

  const { rootNode } = parser.parse(
    snapshot.map((entry) => entry.content).join('\n'),
  );

  const constants: ConstantDescriptor[] = [];

  for (const child of rootNode.children) {
    if (child.type === 'constant_declarations') {
      const constant_declaration = child.child(1)!;
      const type = constant_declaration.childForFieldName('type')!.text as
        | 'int'
        | 'slice';
      const name = constant_declaration.childForFieldName('name')!.text;
      const declaration = constant_declaration
        .childForFieldName('value')!
        .child(0)!.text;

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
          console.log('Not supported:', value);
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
