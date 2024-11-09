// @ts-ignore
import wasmModule from '@ton/tolk-js/dist/tolkfiftlib.js';
// @ts-ignore
import wasmBase64 from '@ton/tolk-js/dist/tolkfiftlib.wasm.js';
// @ts-ignore
import stdlibContents from '@ton/tolk-js/dist/stdlib.tolk.js';
import { realpath } from '@ton/tolk-js/dist/path-utils';
import { TolkCompilerConfig } from '@ton/tolk-js';
import { ASM_FIF_CONTENT } from './constants';

let wasmBinary: Uint8Array | undefined = undefined;

type WasmModule = any;

export type TolkResultSuccess = {
  status: 'ok';
  fiftCode: string;
  codeBoc64: string;
  codeHashHex: string;
  stderr: string;
  sourcesSnapshot: { filename: string; contents: string }[];
};

export type TolkResultError = {
  status: 'error';
  message: string;
};

function copyToCStringAllocating(mod: WasmModule, inStr: string): any {
  const len = mod.lengthBytesUTF8(inStr) + 1;
  const ptr = mod._malloc(len);
  mod.stringToUTF8(inStr, ptr, len);
  return ptr;
}

function copyToCStringPtr(mod: WasmModule, inStr: string, destPtr: any): any {
  const allocated = copyToCStringAllocating(mod, inStr);
  mod.setValue(destPtr, allocated, '*');
  return allocated;
}

function copyFromCString(mod: WasmModule, inPtr: any): string {
  return mod.UTF8ToString(inPtr);
}

async function instantiateWasmModule() {
  if (wasmBinary === undefined) {
    wasmBinary = new Uint8Array(Buffer.from(wasmBase64, 'base64'));
  }

  const module = await wasmModule({ wasmBinary });

  module.FS.writeFile('/fiftlib/Asm.fif', ASM_FIF_CONTENT);

  return module;
}

export async function runDebugTolkCompiler(
  compilerConfig: TolkCompilerConfig,
): Promise<TolkResultSuccess | TolkResultError> {
  const mod = await instantiateWasmModule();
  const allocatedPointers = [];
  const sourcesSnapshot: TolkResultSuccess['sourcesSnapshot'] = [];

  // see tolk-wasm.cpp: typedef void (*WasmFsReadCallback)(int, char const*, char**, char**)
  const callbackPtr = mod.addFunction(function (
    kind: number,
    dataPtr: any,
    destContents: any,
    destError: any,
  ) {
    switch (
      kind // enum ReadCallback::Kind in C++
    ) {
      case 0: // realpath
        const relativeFilename = copyFromCString(mod, dataPtr);
        allocatedPointers.push(
          copyToCStringPtr(mod, realpath(relativeFilename), destContents),
        );
        break;
      case 1: // read file
        try {
          const filename = copyFromCString(mod, dataPtr); // already normalized (as returned above)
          if (filename.startsWith('@stdlib/')) {
            const stdlibKey = filename.endsWith('.tolk')
              ? filename
              : filename + '.tolk';
            if (!(stdlibKey in stdlibContents)) {
              allocatedPointers.push(
                copyToCStringPtr(mod, stdlibKey + ' not found', destError),
              );
            } else {
              allocatedPointers.push(
                copyToCStringPtr(mod, stdlibContents[stdlibKey], destContents),
              );
            }
          } else {
            const contents = compilerConfig.fsReadCallback(filename);
            sourcesSnapshot.push({ filename, contents });
            allocatedPointers.push(
              copyToCStringPtr(mod, contents, destContents),
            );
          }
        } catch (err: any) {
          allocatedPointers.push(
            copyToCStringPtr(mod, err.message || err.toString(), destError),
          );
        }
        break;
      default:
        allocatedPointers.push(
          copyToCStringPtr(mod, 'Unknown callback kind=' + kind, destError),
        );
        break;
    }
  }, 'viiii');

  const configStr = JSON.stringify({
    // undefined fields won't be present, defaults will be used, see tolk-wasm.cpp
    entrypointFileName: compilerConfig.entrypointFileName,
    optimizationLevel: compilerConfig.optimizationLevel,
    withStackComments: compilerConfig.withStackComments,
    experimentalOptions: compilerConfig.experimentalOptions,
  });

  const configStrPtr = copyToCStringAllocating(mod, configStr);
  allocatedPointers.push(configStrPtr);

  const resultPtr = mod._tolk_compile(configStrPtr, callbackPtr);
  allocatedPointers.push(resultPtr);
  const result: TolkResultSuccess | TolkResultError = JSON.parse(
    copyFromCString(mod, resultPtr),
  );

  allocatedPointers.forEach((ptr) => mod._free(ptr));
  mod.removeFunction(callbackPtr);

  return result.status === 'error' ? result : { ...result, sourcesSnapshot };
}
