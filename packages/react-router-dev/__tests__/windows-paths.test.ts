// packages/react-router-dev/__tests__/windows-paths.test.ts
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";

describe("Windows path handling with spaces", () => {
  let tempDir: string;
  let tempFile: string;
  
  beforeAll(() => {
    // Create a test directory with spaces
    tempDir = path.join(os.tmpdir(), "react router test", "with spaces");
    tempFile = path.join(tempDir, "test-route.jsx");
    
    // Ensure the directory exists
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Write test JSX content
    fs.writeFileSync(tempFile, `
      export default function TestRoute() {
        return <div>Test Route</div>;
      }
    `);
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it("should fail to read file when path contains URI-encoded spaces", () => {
    // Simulate what happens in the vite plugin with encoded paths
    const encodedPath = encodeURIComponent(tempFile);
    
    // This demonstrates the current bug - encoded paths fail
    expect(() => {
      fs.readFileSync(encodedPath, "utf-8");
    }).toThrow(/ENOENT|no such file or directory/);
  });

  it("should successfully read file after decoding URI components", () => {
    // Simulate the fix
    const encodedPath = encodeURIComponent(tempFile);
    const decodedPath = decodeURIComponent(encodedPath);
    const normalizedPath = path.normalize(decodedPath);
    
    // This should work with the fix
    expect(() => {
      const content = fs.readFileSync(normalizedPath, "utf-8");
      expect(content).toContain("TestRoute");
    }).not.toThrow();
  });

  it("should decode URI components in Windows-style paths", () => {
    // Test the specific fix for Windows paths with spaces
    const windowsPath = "C:\\Program Files\\My App\\routes\\index.tsx";
    const encodedPath = encodeURIComponent(windowsPath);
    
    // Verify encoding happened
    expect(encodedPath).toContain("%20"); // space becomes %20
    expect(encodedPath).toContain("%5C"); // backslash becomes %5C
    
    // Verify decoding works
    const decodedPath = decodeURIComponent(encodedPath);
    const normalizedPath = path.normalize(decodedPath);
    
    expect(normalizedPath).toBe(windowsPath);
  });

  it("should handle the exact error scenario from KOVI HAIR issue", () => {
    // This recreates the exact scenario from the GitHub issue
    const koviPath = "D:\\KOVI HAIR\\kovi-dev\\app\\routes\\layout.jsx";
    const encodedPath = koviPath.replace(/\\/g, '%5C').replace(/ /g, '%20');
    
    // This is what currently fails
    expect(() => {
      fs.readFileSync(encodedPath, "utf-8");
    }).toThrow(/ENOENT/);
    
    // This is what should work with the fix
    const fixedPath = path.normalize(decodeURIComponent(encodedPath));
    expect(fixedPath).toBe(koviPath);
  });
});