const { dropOldTables } = require("../src/db/migrations");

async function main() {
  console.log("Starting cleanup of old tables...");
  console.log("This will delete: config, teams, modification_history");
  console.log("Make sure you have migrated data to lb_* tables first!\n");
  
  try {
    await dropOldTables();
    console.log("\nCleanup completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("\nCleanup failed:", err);
    process.exit(1);
  }
}

main();

