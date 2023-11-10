#!/usr/bin/env node

// ------------------------------------------------------------------------
// Usage:
// % node haiku.js -t "A story about a boy who grew up in London and moved to the US to get away from Maggie Thatcher"
// % node haiku.js -u https://almaer.com
// % node haiku.js -r
// ------------------------------------------------------------------------

import { program } from "commander";
import axios from "axios";
import OpenAI from "openai";

const client = new OpenAI();

// Define the print_haiku function for OpenAI Functions
function print_haiku(args) {
  console.log(args.haiku_text);
}

// Function to fetch text from a URL
async function fetchTextFromURL(url) {
  if (options.debug) {
    console.log("Getting text from");
  }

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching data from URL:", error);
    process.exit(1);
  }
}

// Function to generate and print a Haiku using OpenAI
async function generateHaiku(text) {
  const runner = client.beta.chat.completions.runTools({
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "user",
        content: `You are a GPT that is a creative writer specializing in haiku. Create a three line haiku using these rules from the following text:\n\n${text}\n`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "print_haiku",
          description: "Selects just the haiku from a given string",
          parameters: {
            type: "object",
            properties: {
              haiku_text: {
                type: "string",
                description: "The text of the haiku",
              },
            },
          },
          function: print_haiku,
          parse: JSON.parse,
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "print_haiku" },
    },
  });
  // .on("message", (msg) => console.log("msg", msg))
  // .on("functionCall", (functionCall) =>
  //   console.log("functionCall", functionCall)
  // )
  // .on("functionCallResult", (functionCallResult) =>
  //   console.log("functionCallResult", functionCallResult)
  // )
  // .on("content", (diff) => process.stdout.write(diff));

  // Start running!
  runner.finalChatCompletion();
}

// ------------------------------------------------------------------------
// MAIN
// ------------------------------------------------------------------------

// Define the CLI commands and options
program
  .option("-d, --debug", "Turn on debugging")
  .option("-t, --text <type>", "Text to refine into a Haiku")
  .option("-u, --url <type>", "URL to fetch text from and refine into a Haiku")
  .option("-r, --random", "Show a random haiku (default)");

if (
  !process.argv
    .slice(2)
    .some((arg) => ["-t", "--text", "-u", "--url"].includes(arg))
) {
  process.argv.push("-r"); // Add '-r' as a default argument
}

program.parse(process.argv);

const options = program.opts();

let text = "";

if (options.text) {
  text = options.text;
} else if (options.url) {
  text = await fetchTextFromURL(options.url);
} else {
  text = "A random but fun haiku that will make someone smile!";
}

generateHaiku(text);
