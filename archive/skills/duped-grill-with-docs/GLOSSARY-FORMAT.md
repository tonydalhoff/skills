# GLOSSARY.md Format

## Structure

```md
# <Project Name> Glossary

<One or two sentences describing the project or domain this glossary covers.>

## Language

### <Term>
<A concise description of the term>
```

Optional term sections:

- `#### Examples`
- `#### Non-Examples`
- `#### Relationships`
- `#### Example dialogue`
- `#### Flagged ambiguities`

## Rules

- When multiple words name one concept, choose one term and list the rest as aliases to avoid.
- Treat significant capitalization as intentional and apply it consistently.
- Keep descriptions concise, domain-oriented, and free of implementation details.
- Sort term sections alphabetically.
- Use wikilinks such as `[[Customer]]` when a concept references another glossary term.
- Keep one `GLOSSARY.md` at the repository root and create it only when the first term is resolved.
