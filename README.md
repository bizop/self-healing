# Self-Healing JavaScript Code Generator

This JavaScript program generates, tests, and fixes code automatically with the help of OpenAI's GPT-3 model. It takes user instructions as input and generates code based on those instructions. It can also detect and fix errors, install missing modules, and run tests to ensure that the code works as expected. The project is designed to assist developers in speeding up their development process by automating repetitive and error-prone tasks.

## How It Works

The program consists of several functions that work together to achieve the desired outcome:

1. **generateCode(userInstructions)**: Takes user instructions as input and generates code using OpenAI's GPT-3 model.
2. **regenerateCode(userInstructions, code, error)**: Takes user instructions, existing code, and an error message as input and regenerates the code to fix the encountered error.
3. **generateTestCode(userInstructions, code)**: Generates test code based on the user instructions and the generated code.
4. **installMissingModule(moduleName)**: Installs missing npm modules if any are detected during code execution.
5. **runCode(code, skipErrorHistory = false, codeToRun = '')**: Executing the generated code and handling errors if they occur.

The main function of the program ties all these functions together in a loop that continues until the code is error-free and passes all tests.

## How to Use It

1. Install Node.js and set up your project with an `npm init` command.
2. Install the required npm packages: `axios`, `@openai/api`, and any other packages that may be required by the generated code.
3. Set up an OpenAI API key with the necessary permissions and add it to your environment variables.
4. In the main part of the program, provide the user instructions for the code you want to generate.
5. Run the program with `node selfHealing.js`. The program will generate code, run tests, and fix any errors until the code is error-free and passes all tests.

## Warning

The generated code may not always be perfect, and there might be some edge cases that the program doesn't handle. It's essential to review the generated code and test its functionality thoroughly before using it in a production environment.

Furthermore, this program automatically installs unvetted npm modules as required by the generated code. To mitigate potential security risks, it is strongly recommended that you run this program in a virtual environment or container, such as Docker, to isolate it from your main development environment.

Always review and verify the modules being installed and consider the potential security implications before incorporating the generated code into your projects.

## Credits

Created by [Nathan Wilbanks](https://twitter.com/NathanWilbanks_)
