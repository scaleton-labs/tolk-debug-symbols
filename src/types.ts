export type GlobalDescriptor = {
  index: number;
  name: string;
};

export type ProcedureDescriptor = {
  methodId: number;
  cellHash: string;
  name: string;
};

export type ConstantDescriptor = {
  type: 'int' | 'slice' | null;
  name: string;
  value: string;
  declaration: string;
};

export type DebugSymbols = {
  procedures: ProcedureDescriptor[];
  globals: GlobalDescriptor[];
  constants: ConstantDescriptor[];
};
