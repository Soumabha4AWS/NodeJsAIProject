const { queryOpenAI } = require("./openaiConnectModule");

const testPrompt = "Explain gpt-4o-mini model in one line";

queryOpenAI(testPrompt)
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error("Error:", error);
  });