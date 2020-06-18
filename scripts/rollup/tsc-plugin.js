import { spawn } from 'child_process';
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(dirname, '../..');
const tscOutputDir = path.join(repoDir, '.tsc-output');

const extRe = /\.tsx?$/;

export default function tscPlugin({ build, watch } = {}) {
  let promise = Promise.resolve();

  if (build) {
    promise = new Promise(accept => {
      let proc = spawn('tsc', [], {
        stdio: 'inherit'
      });

      proc.on('exit', code => {
        if (code !== 0) throw new Error('tsc build failed');
        accept();
      });
    });
  }

  if (build && watch) {
    promise.then(() => {
      spawn('tsc', ['--watch', '--preserveWatchOutput'], {
        stdio: 'inherit'
      });
    });
  }

  return {
    name: 'tsc',
    buildStart() {
      return promise;
    },
    async resolveId(id, importer) {
      if (!importer) {
        // This is one of our entry points. Resolve the
        // id to the compiled file in the output dir.
        let outFile = id.replace(/^packages/, tscOutputDir);

        // Also, emit the d.ts file
        // TODO: Should we be doing this in buildStart instead to
        // avoid calling emitFile() each time this id is resolved?
        let dtsFile = outFile.replace(extRe, '.d.ts');
        let fileName = path.basename(dtsFile);
        let source = await fsp.readFile(dtsFile, { encoding: 'utf8' });
        this.emitFile({ type: 'asset', fileName, source });

        return outFile.replace(extRe, '.js');
      }

      return null;
    }
  };
}
