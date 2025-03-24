const esbuild = require('esbuild');
const path = require('path');

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    minify: isProduction,
    sourcemap: !isProduction,
};

async function build() {
    if (isWatch) {
        console.log('watching...');
        const ctx = await esbuild.context(options);
        await ctx.watch();
    } else {
        console.log('building...');
        try {
            const result = await esbuild.build(options);
            if (result.errors.length > 0) {
                console.error('build failed:', result.errors);
                process.exit(1);
            }
            console.log('build succeeded');
        } catch (error) {
            console.error('build failed:', error);
            process.exit(1);
        }
    }
}

build(); 