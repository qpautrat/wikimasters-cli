#!/usr/bin/env node
import { program } from "./program.js";
import { reportFailure } from "./session.js";

try {
  await program.parseAsync();
} catch (error) {
  reportFailure("wikimasters", error);
}
