import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const buildOptions = {
    entryPoints: ['js/bundle-entry.js'],
    bundle: true,
    outfile: 'dist/tippy.min.js',
    format: 'iife',
    minify: true,
    sourcemap: true,
    target: ['es2020'],
    // Keep CDN dependencies external - they're loaded by tippy-injector.js
    external: [],
    // Log build info
    logLevel: 'info',
};

async function build() {
    try {
        if (isWatch) {
            const ctx = await esbuild.context(buildOptions);
            await ctx.watch();
            console.log('Watching for changes...');
        } else {
            const result = await esbuild.build(buildOptions);
            console.log('Build complete!');
            if (result.metafile) {
                console.log(await esbuild.analyzeMetafile(result.metafile));
            }
        }
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
