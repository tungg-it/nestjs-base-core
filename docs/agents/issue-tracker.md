# Issue tracker: Local Markdown

Issues and specifications for this repository live as Markdown files in **.scratch/**.

## Conventions

- One feature per directory: **.scratch/<feature-slug>/**
- The specification is **.scratch/<feature-slug>/spec.md**
- Implementation issues are one file per ticket at **.scratch/<feature-slug>/issues/<NN>-<slug>.md**, numbered from 01. Do not combine tickets into one file.
- Record triage state as a **Status:** line near the top of each issue file. See **triage-labels.md** for the role strings.
- Append comments and discussion under a **## Comments** heading at the end of the issue file.

## When a skill says "publish to the issue tracker"

Create the appropriate file under **.scratch/<feature-slug>/**, creating the directory when needed.

## When a skill says "fetch the relevant ticket"

Read the referenced local Markdown file. The user normally supplies its path or ticket number.

## Wayfinding operations

Used by the wayfinder skill. A map is a file with one child file per ticket.

- **Map:** **.scratch/<effort>/map.md**, containing Notes, Decisions-so-far, and Fog.
- **Child ticket:** **.scratch/<effort>/issues/NN-<slug>.md**, with **Type:** set to research, prototype, grilling, or task, and **Status:** set to claimed or resolved.
- **Blocking:** add **Blocked by: NN, NN** near the top. A ticket is unblocked when every referenced file is resolved.
- **Frontier:** scan for the first numbered ticket that is open, unblocked, and unclaimed.
- **Claim:** set **Status: claimed** before work begins.
- **Resolve:** append the answer under **## Answer**, set **Status: resolved**, then add a context pointer to the map's Decisions-so-far.
