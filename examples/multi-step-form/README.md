# Creating a Multi-Part Form Easily with React-Router

This repository contains the source code for the tutorial article "Creating a Multi-Part Form Easily with React-Router (No Third-Party Libraries)". It demonstrates how to implement a multi-step form using only React Router's built-in capabilities, without relying on any additional form management libraries.

## Features

- Multi-step form implementation in React Router
- Manage form state between different steps
- Handle form navigation and validation
- Process and submit form data
- Includes mock data(for replicating db behaviour)
- No third-party form libraries required

## Tech Stack

- React
- React Router
- TypeScript
- Vite

## Getting Started

1. Clone the repository:

```bash
git clone <your-repo-url>
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

## Project Structure

```
app/
├── routes/
│   ├── home.tsx                 # Home page
│   ├── record.tsx              # Record view
│   └── create_record/          # Multi-part form implementation
│       ├── form_part1.tsx      # First step of the form
│       ├── form_part2.tsx      # Second step of the form
│       └── route.tsx           # Form route configuration
├── data/                       # Mock data files
├── utils/                      # Utility functions and types
```

## Tutorial Article

For a detailed explanation of how this implementation works, check out the full tutorial article: [Creating a Multi-Part Form Easily with React-Router (No Third-Party Libraries)](article-url)

## Preview

Open this example on StackBlitz:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/~/github.com/Azfar731/multi_part_form)