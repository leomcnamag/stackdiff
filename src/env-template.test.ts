import { findPlaceholders, renderTemplate, renderEnvTemplate, renderStageTemplates } from './env-template';

describe('findPlaceholders', () => {
  it('finds single placeholder', () => {
    expect(findPlaceholders('hello {{NAME}}')).toEqual(['NAME']);
  });

  it('finds multiple unique placeholders', () => {
    expect(findPlaceholders('{{A}}_{{B}}_{{A}}')).toEqual(['A', 'B']);
  });

  it('returns empty array when no placeholders', () => {
    expect(findPlaceholders('no placeholders here')).toEqual([]);
  });
});

describe('renderTemplate', () => {
  it('substitutes known keys', () => {
    const { value, missing } = renderTemplate('http://{{HOST}}:{{PORT}}', { HOST: 'localhost', PORT: '3000' });
    expect(value).toBe('http://localhost:3000');
    expect(missing).toEqual([]);
  });

  it('leaves unknown keys and reports them as missing', () => {
    const { value, missing } = renderTemplate('{{UNKNOWN}}_val', {});
    expect(value).toBe('{{UNKNOWN}}_val');
    expect(missing).toContain('UNKNOWN');
  });

  it('does not duplicate missing entries', () => {
    const { missing } = renderTemplate('{{X}}-{{X}}', {});
    expect(missing.filter(m => m === 'X').length).toBe(1);
  });
});

describe('renderEnvTemplate', () => {
  it('renders self-referential env map', () => {
    const env = { BASE_URL: 'http://{{HOST}}', HOST: 'example.com' };
    const { rendered, missing, substitutions } = renderEnvTemplate(env);
    expect(rendered['BASE_URL']).toBe('http://example.com');
    expect(missing).toEqual([]);
    expect(substitutions).toBe(1);
  });

  it('reports missing variables', () => {
    const env = { URL: 'http://{{MISSING_HOST}}' };
    const { missing } = renderEnvTemplate(env);
    expect(missing).toContain('MISSING_HOST');
  });

  it('merges external context with higher priority', () => {
    const env = { VAL: '{{KEY}}' };
    const { rendered } = renderEnvTemplate(env, { KEY: 'from-context' });
    expect(rendered['VAL']).toBe('from-context');
  });

  it('counts substitutions correctly', () => {
    const env = { A: '{{X}}', B: 'static', C: '{{X}}-{{Y}}' };
    const { substitutions } = renderEnvTemplate(env, { X: '1', Y: '2' });
    expect(substitutions).toBe(2);
  });
});

describe('renderStageTemplates', () => {
  it('renders templates across stages', () => {
    const stages = {
      dev: { URL: 'http://{{HOST}}', HOST: 'dev.local' },
      prod: { URL: 'http://{{HOST}}', HOST: 'prod.example.com' },
    };
    const results = renderStageTemplates(stages);
    expect(results['dev'].rendered['URL']).toBe('http://dev.local');
    expect(results['prod'].rendered['URL']).toBe('http://prod.example.com');
  });

  it('applies shared context to all stages', () => {
    const stages = { dev: { MSG: '{{GREETING}} dev' } };
    const results = renderStageTemplates(stages, { GREETING: 'Hello' });
    expect(results['dev'].rendered['MSG']).toBe('Hello dev');
  });
});
