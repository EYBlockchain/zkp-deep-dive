/**
@module
@author iAmMichaelConnor
@desc Trusted setup wrapper with command line prompts
*/

import { argv } from 'yargs';
import inquirer from 'inquirer';
import { generateZokratesFiles } from '@eyblockchain/nightlite';

/**
 * Trusted setup. Either compiles all directories in /proving-files/gm17, or a single directory using the -f flag.
 * Calls zokrates' compile, setup, and export-verifier on all (or a specified) directories in `/proving-files/gm17`.
 */
async function main() {
  // -f being the name of the .code file (i.e., 'ft-mint')
  const hashType = process.env.HASH_TYPE === 'mimc' ? 'MiMC' : 'SHA';
  console.log('Hash type is set to:', hashType);
  console.log(`${process.cwd()}/proving-files/gm17`);

  const { f } = argv;

  if (!f) {
    console.log(
      "The '-f' option has not been specified.\nThat's OK, we can go ahead and loop through every .zok file.\nHOWEVER, if you wanted to choose just one file, cancel this process, and instead use option -f (see the README-trusted-setup)",
    );
    console.log('Be warned, this could take up to an hour!');

    const carryOn = await inquirer.prompt([
      {
        type: 'yesno',
        name: 'continue',
        message: 'Continue?',
        choices: ['y', 'n'],
      },
    ]);
    if (carryOn.continue !== 'y') return;

    try {
      await generateZokratesFiles(`${process.cwd()}/proving-files/gm17`);
    } catch (err) {
      throw new Error(`Trusted setup failed: ${err}`);
    }
  } else {
    try {
      await generateZokratesFiles(`${process.cwd()}/proving-files/gm17`, f);
    } catch (err) {
      throw new Error(`Trusted setup failed: ${process.cwd()} ${err}`);
    }
  }
}

// RUN
main().catch(err => {
  console.log(err);
  process.exit(1);
});
