# Contributing

The following guidelines must be followed by all contributors to this repository. Please review them carefully and do not hesitate to ask for help.

### Code of Conduct

* Review and test your code before submitting a pull request.
* Be kind and professional. Avoid assumptions; oversights happen.
* Be clear and concise when documenting code; focus on value.
* Don't commit commented code to the main repo (stash locally, if needed).

### Git Commit Guidelines

We follow precise rules for git commit message formatting. These rules make it easier to review commit logs and improve contextual understanding of code changes. This also allows us to auto-generate the CHANGELOG from commit messages.

Each commit message consists of a **header**, **body** and **footer**.

#### Header

The header is required and must not exceed 70 characters to ensure it is well-formatted in common git tools. It has a special format that includes a *type*, *scope* and *subject*:

Syntax:

```bash
<type>(<scope>): <subject>
```

#### Type

The *type* should always be lowercase as shown below.

##### Allowed `<type>` values:

* **feat** (new feature for the user)
* **fix** (bug fix for the user, not a fix to build scripts)
* **docs** (changes to documentation)
* **style** (formatting, missing semi colons, etc; no functional code change)
* **refactor** (refactoring production code, eg. renaming a variable)
* **test** (adding missing tests, refactoring tests; no production code change)
* **chore** (updating build/env/packages, etc; no production code change)

#### Scope

The *scope* describes the affected code. The descriptor may be a route, component, feature, utility, etc. It should be one word or camelCased, if needed:

```bash
feat(transactions): added column for quantity
feat(BalanceModule): initial setup
```

The commit headers above work well if the commit affects many parts of a larger feature. If changes are more specific, it may be too broad. To better clarify specific scopes, you should use a `feature/scope` syntax:

```bash
fix(transaction/details): missing quantity field
```

The above syntax helps reduce verbosity in the _subject_. In comparison, consider the following example:

```bash
fix(transaction): missing quantity field in txn details
```

Another scenario for scope is using a `route/scope` (or `context/scope`) syntax. This would be useful when a commit only affects a particular instance of code that is used in multiple places.

*Example*: Transactions may be shown in multiple routes/contexts, but a bug affecting transaction actions may only exist under the "home" route, possibly related to other code. In such cases, you could use the following format:

```bash
fix(home/transactions): txn actions not working
```

This header makes it clear that the fix is limited in scope to transactions within the home route/context.

#### Subject

Short summary of the commit. Avoid redundancy and simplify wording in ways that do not compromise understanding.

Good:

```bash
$ git commit -m "fix(nav/link): incorrect URL for Travel"
```

Bad:

```bash
$ git commit -m "fix(nav): incorrect URL for Travel nav item :P"
```

> Note that the _Bad_ example results in a longer commit header. This is partly attributed to the scope not being more specific and personal expression tacked on the end.

**Note regarding subjects for bug fixes:**

Summarize _what is fixed_, rather than stating that it _is_ fixed. The _type_ ("fix") already specifies the state of the issue.

For example, don't do:

```bash
$ git commit -m "fix(nav): corrected Travel URL"
```

Instead, do:

```bash
$ git commit -m "fix(nav): broken URL for Travel"
```


#### Body and Footer (optional)

The body and footer should wrap at 80 characters.

The **body** describes the commit in more detail and should not be more than 1 paragraph (3-5 sentences). Details are important, but too much verbosity can inhibit understanding and productivity -- keep it clear and concise.

The **footer** should only reference Pull Requests or Issues associated with the commit.

For bug fixes that address open issues, the footer should be formatted like so:

```bash
Closes #17, #26
```
and for Pull Requests, use the format:

```bash
Related #37
```

If a commit is associated with issues and pull requests, use the following format:

```bash
Closes #17, #26
Related #37
```
> Issues should always be referenced before pull requests, as shown above.

#### Piecing It All Together

Below is an example of a full commit message that includes a header, body and footer:

```bash
refactor(nav/item): added prop (isActive)

NavItem now supports an "isActive" property. This property is used to control the styling of active navigation links.

Closes #21
```
