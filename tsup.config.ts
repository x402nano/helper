import { defineConfig } from 'tsup'

const baseConfig = {
  compilerOptions: {
    module: 'nodenext', // Or "node16" (equivalent in most cases)
    moduleResolution: 'nodenext', // This is the key change that enables proper ESM export resolution
    target: 'esnext', // Often paired with the above
    esModuleInterop: true, // Helpful for interoperability
    allowSyntheticDefaultImports: true,
  },
  entry: {
    index: 'src/typescript/index.ts',
  },
  dts: {
    resolve: true,
  },
  sourcemap: true,
  target: 'es2020',
}

export default defineConfig([
  {
    ...baseConfig,
    format: 'esm',
    outDir: 'dist/esm',
    clean: true,
  },
  {
    ...baseConfig,
    format: 'cjs',
    outDir: 'dist/cjs',
    clean: false,
  },
])
