import * as os from "node:os";
import path from "node:path";
import type { SingleBar } from "cli-progress";
import type { SetOfBlocks } from "gettext-merger";
import type { Args } from "../types.js";

/**
 * Task runner for the extraction process.
 *
 * @param tasks - The tasks to run
 * @param destination - The destination
 * @param args - The command line arguments
 * @param progressBar
 */
export async function taskRunner(
	tasks: Promise<SetOfBlocks>[],
	destination: SetOfBlocks,
	args: Args,
	progressBar: SingleBar,
) {
	const messages = [];
	await Promise.allSettled(tasks)
		.then((strings) => {
			/**
			 * Return the strings that are not rejected (they are fulfilled)
			 */
			return strings
				.map((block) => block.status === "fulfilled" && block.value)
				.filter(Boolean) as SetOfBlocks[]; // remove nullish
		})
		.then((consolidated) => {
			/** Log the results */
			if (args.options?.silent !== true) {
				for (const result of consolidated) {
					if (result.blocks.length > 0) {
						/**
						 * Add the strings to the destination set
						 */
						destination.addArray(result.blocks);
						/* Log the results */
						messages.push(
							`✅ ${result.path} [${result.blocks.map((b) => b.msgid).join(", ")}]`,
						);
					} else messages.push(`❌ ${result.path} has no strings`);
				}
			}
		})
		.catch((err) => {
			return new Error(err);
		});

	progressBar.stop();

	console.log("\n🎉 Done!");
	console.log(
		`📝 Found ${Object.values(destination.blocks).length} translation strings in ${path.resolve(args.paths.cwd)}.`,
	);

	console.log(messages.join(os.EOL));

	return destination;
}
