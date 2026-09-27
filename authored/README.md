# Shared rig artwork

The desktop app writes `rigs.json` here when you use **Save to bone & return**,
**Save rig to game**, or **Save definitions**. This includes rig sprites for each
facing, animation, joints, and other rig settings. Commit this file along with
your code changes and push it to transfer the artwork through GitHub.

After pulling on another computer, rebuild with `node scripts/package.cjs` (or
run the source app). Packaged executables are ignored by Git and do not update
when you pull. Builds include the shared rig file and load it over older local
rig settings. A packaged app inside this checkout also reads and saves directly
to this folder. A standalone copy outside a checkout saves to its local profile.

On the first run without a shared rig file, existing locally saved rigs migrate
into this folder. Existing local saves remain available as a backup. Character
saves and expedition progress are not included in this file.
