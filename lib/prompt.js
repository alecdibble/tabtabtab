const inquirer = require('inquirer');
const path = require('path');
const debug = require('./utils/tabtabDebug')('tabtab:prompt');

/**
 * Asks user about SHELL and desired location.
 *
 * It is too difficult to check spawned SHELL, the user has to use chsh before
 * it is reflected in process.env.SHELL
 */
const prompt = (shellArg, applicationName) => {

  const ask = inquirer.createPromptModule();

  const questions = [
    {
      type: 'list',
      name: 'shell',
      message: 'Which shell do you use?',
      choices: ['bash', 'zsh', 'fish'],
      default: 'bash'
    }
  ];

  const locations = {
    bash: '~/.bashrc',
    zsh: '~/.zshrc',
    fish: '~/.config/fish/config.fish'
  };

  const finalAnswers = {};

  const firstStep = () => {
    if(shellArg && questions['choices'].includes(shellArg)) {
      return shellArg
    }
    else {
      return ask(questions)
    }
  }

  return firstStep()
    .then(answers => {
      const { shell } = answers;
      debug('answers', shell);

      const location = locations[shell];
      debug(`The autocompletion script will be installed to ${location} to support the ${shell} shell. This script enables the ${applicationName} package to offer tab autocomplete for all namespaces & commands.`);

      Object.assign(finalAnswers, { location, shell });
      return location;
    })
    .then(location =>
      ask({
        type: 'confirm',
        name: 'locationOK',
        message: `Would you like to install the ${applicationName} automcompletion script at ${location} or a custom path?`
      })
    )
    .then(answers => {
      const { locationOK } = answers;
      if (locationOK) {
        debug('location is ok, return', finalAnswers);
        return finalAnswers;
      }

      // otherwise, ask for specific **absolute** path
      return ask({
        name: 'userLocation',
        message: 'Please specifify the custom path to install the Nama automcompletion script ? Must be absolute.',
        validate: input => {
          debug('Validating input', input);
          return path.isAbsolute(input);
        }
      }).then(lastAnswer => {
        const { userLocation } = lastAnswer;
        console.log(`Very well, we will install using ${userLocation}`);
        Object.assign(finalAnswers, { location: userLocation });

        return finalAnswers;
      });
    });
};

module.exports = prompt;
