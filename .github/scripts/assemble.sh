#!/usr/bin/env bash
set -euo pipefail

mkdir -p src/core src/render src/ui
cat .deploy/plain/simulation.part-* > src/core/simulation.ts
cat .deploy/plain/world.part-* > src/render/world.ts
cat .deploy/plain/interface.part-* > src/ui/interface.ts
cat .deploy/plain/styles.part-* > src/styles.css

printf 'Assembled source files:\n'
wc -c src/core/simulation.ts src/render/world.ts src/ui/interface.ts src/styles.css
