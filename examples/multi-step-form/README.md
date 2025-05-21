# Creating a Multi-Part Form Easily with React-Router

This repository contains the source code for the tutorial article "Creating a Multi-Part Form Easily with React-Router (No Third-Party Libraries)". It demonstrates how to implement a multi-step form using only React Router's built-in capabilities, without relying on any additional form management libraries.

## Features

- Multi-step form implementation in React Router
- Manage form state between different steps
- Handle form navigation and validation
- Process and submit form data
- Includes mock data(for replicating db behaviour)
- No third-party form libraries required

## Interacting with the App

1. Clone it and run the development server:

    ```bash
    npm run dev
    ```

2. Pick any phone number from the "app/data/clients.json" file, on form part1.

3. Choose any values for fields in form part2.

4. Once the form is submitted, it will redirect you to record details page.

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

For a detailed explanation of how this implementation works, check out the full tutorial article: [Creating a Multi-Part Form Easily with React-Router (No Third-Party Libraries)](https://dev.to/azfar731/creating-a-multi-part-form-easily-with-react-router-no-third-party-libraries-203e)

## Preview

Open this example on StackBlitz:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/~/github.com/Azfar731/multi_part_form)