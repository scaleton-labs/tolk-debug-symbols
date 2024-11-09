# Tolk Debug Symbols

Collects debug symbols for:

- functions (original name, `method_id`, cell hash)
- globals (original name, index).

## Basic Usage

```typescript
import { TolkCompilerConfig } from '@ton/tolk-js';
import { collectDebugSymbols } from '@scaleton/tolk-debug-symbols';

const config: TolkCompilerConfig = {
  entrypoint: 'main.tolk',
  fsReadCallback: (path: string) => fs.readFileSync(path).toString(),
};

const debugSymbols = await collectDebugSymbols(config);
```

Output:

```json
{
  "constants": [
    {
      "declaration": "0xBEEF",
      "name": "h",
      "type": "int",
      "value": "48879"
    },
    {
      "declaration": "1000",
      "name": "k",
      "type": "int",
      "value": "1000"
    },
    {
      "declaration": "\"cafe\"s",
      "name": "m",
      "type": "slice",
      "value": "x{cafe}"
    }
  ],
  "globals": [
    {
      "index": 1,
      "name": "a"
    },
    {
      "index": 2,
      "name": "b"
    }
  ],
  "procedures": [
    {
      "cellHash": "a0eacc9676d4e13d5bade93200eee2734baf0ad2256df4ee1983c5e6ce29c388",
      "methodId": 0,
      "name": "main"
    },
    {
      "cellHash": "40956732df8dbebee9f697ef04dcfc498b671e7167ca2b898e85dbc737089012",
      "methodId": 78674,
      "name": "getConstants"
    }
  ]
}
```

## License

![MIT License](https://img.shields.io/badge/License-MIT-green)
