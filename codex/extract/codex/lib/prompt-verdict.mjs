// The prompt sweep's Jev question and its cache key. Verdicts live in
// work/prompt-candidate-verdicts.json under "v1:<candidate hash>" (openCache adds the Jev version).
import { ask } from "./jev-provider.mjs";

// Bump when the question changes; cached probabilities answer this wording only.
export const QUESTION_VERSION = "v1";
export const verdictKey = hash => `${QUESTION_VERSION}:${hash}`;
export const MODEL_FACING_QUESTION = {
  model_facing: {
    type: "noul",
    instructions: "Is `state.text` written to be sent to an AI language model as instructions or context (a system or developer prompt, a tool description, or a template the app fills in and sends to a model), rather than text shown to people (UI labels, onboarding or marketing copy, help and documentation, notifications, error messages, legal text) or code, SQL, markup or data? `state.file` is the bundle file it was found in.",
    criteria: {
      true: "Model-facing: it addresses the model (e.g. 'You are…', 'Do not…', 'Respond with…'), describes a tool or its parameters for the model, or frames context and rules for a model.",
      false: "Human-facing or not natural-language prose: UI or help text, docs, notifications, errors, code, SQL, markup, or data."
    }
  }
};

// The probability that `state.text` is model-facing. Throws JevUnavailableError after retries.
export async function modelFacing(config, state, options) {
  return (await ask(config, { state, questions: MODEL_FACING_QUESTION }, options)).answers.model_facing.noul;
}
