/**
 * Unit tests for ResumePreview parseContent function
 * Testing the ALL CAPS name parsing fix
 */

import { parseContent } from './ResumePreview';

describe('parseContent - Name Parsing Tests', () => {
  
  // Test 1: ALL CAPS name should be parsed correctly
  test('should parse ALL CAPS name correctly (e.g., MARIA NIKITA)', () => {
    const resumeText = `MARIA NIKITA
Senior AEM Developer
maria.nikita@email.com | +1 (555) 123-4567

PROFESSIONAL SUMMARY
Experienced developer with 8+ years of expertise.

WORK EXPERIENCE
Senior Developer | TechCorp | 2020 - Present
• Led development of enterprise solutions`;

    const result = parseContent(resumeText);
    
    expect(result.name).toBe('MARIA NIKITA');
    expect(result.name).not.toBe('Your Name');
    expect(result.name).not.toBe('');
  });

  // Test 2: Mixed case name should be parsed correctly
  test('should parse mixed case name correctly (e.g., Maria Nikita)', () => {
    const resumeText = `Maria Nikita
Senior AEM Developer
maria.nikita@email.com | +1 (555) 123-4567

PROFESSIONAL SUMMARY
Experienced developer with 8+ years of expertise.`;

    const result = parseContent(resumeText);
    
    expect(result.name).toBe('Maria Nikita');
  });

  // Test 3: Job title should be parsed correctly
  test('should parse job title correctly', () => {
    const resumeText = `MARIA NIKITA
Senior AEM Developer
maria.nikita@email.com

PROFESSIONAL SUMMARY
Experienced developer.`;

    const result = parseContent(resumeText);
    
    expect(result.title).toBe('Senior AEM Developer');
  });

  // Test 4: Contact information should be parsed correctly
  test('should parse contact information correctly', () => {
    const resumeText = `John Smith
Software Engineer
john@email.com | +1 (555) 123-4567 | linkedin.com/in/johnsmith

PROFESSIONAL SUMMARY
Experienced developer.`;

    const result = parseContent(resumeText);
    
    expect(result.contact).toContain('@');
  });

  // Test 5: Section headers should NOT be treated as names
  test('should NOT treat section headers as names', () => {
    const resumeText = `PROFESSIONAL SUMMARY
Experienced developer with 8+ years of expertise.

WORK EXPERIENCE
Senior Developer | TechCorp | 2020 - Present`;

    const result = parseContent(resumeText);
    
    // Name should be empty or not be a section header
    expect(result.name).not.toBe('PROFESSIONAL SUMMARY');
    expect(result.name).not.toBe('WORK EXPERIENCE');
  });

  // Test 6: ALL CAPS name with section keywords should be handled
  test('should distinguish ALL CAPS name from section headers', () => {
    const resumeText = `JOHN SMITH
Senior Developer
john@email.com

SUMMARY
Experienced developer.

EXPERIENCE
Developer | Company | 2020 - Present`;

    const result = parseContent(resumeText);
    
    expect(result.name).toBe('JOHN SMITH');
    expect(result.sections.length).toBeGreaterThan(0);
  });

  // Test 7: Single word ALL CAPS name
  test('should parse single word ALL CAPS name', () => {
    const resumeText = `MADONNA
Singer and Performer
madonna@email.com

PROFESSIONAL SUMMARY
World-renowned performer.`;

    const result = parseContent(resumeText);
    
    expect(result.name).toBe('MADONNA');
  });

  // Test 8: Three word ALL CAPS name
  test('should parse three word ALL CAPS name', () => {
    const resumeText = `MARIA ELENA RODRIGUEZ
Software Engineer
maria@email.com

PROFESSIONAL SUMMARY
Experienced developer.`;

    const result = parseContent(resumeText);
    
    expect(result.name).toBe('MARIA ELENA RODRIGUEZ');
  });

  // Test 9: Empty text should return empty values
  test('should handle empty text', () => {
    const result = parseContent('');
    
    expect(result.name).toBe('');
    expect(result.contact).toBe('');
    expect(result.sections).toEqual([]);
  });

  // Test 10: Null text should return empty values
  test('should handle null text', () => {
    const result = parseContent(null);
    
    expect(result.name).toBe('');
    expect(result.contact).toBe('');
    expect(result.sections).toEqual([]);
  });
});
