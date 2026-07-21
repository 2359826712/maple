import { readFile } from 'node:fs/promises';

const versionPattern = /^[1-9][0-9]*$/;
const supportedProviders = new Set(['deepl', 'ollama', 'libretranslate']);
const supportedFields = new Set(['title', 'summary']);

export function validateProviderPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) return ['policy must be an object'];
  if (policy.schema_version !== 1) errors.push('unsupported provider policy schema version');
  if (typeof policy.routing_version !== 'string' || !versionPattern.test(policy.routing_version)) {
    errors.push('routing_version must be a positive integer string');
  }
  if (!policy.providers || typeof policy.providers !== 'object' || Array.isArray(policy.providers)) {
    errors.push('providers must be an object');
  } else {
    for (const [provider, configuration] of Object.entries(policy.providers)) {
      if (!supportedProviders.has(provider)) errors.push(`unsupported provider ${JSON.stringify(provider)}`);
      if (!Array.isArray(configuration?.required_environment)) {
        errors.push(`provider ${provider} must declare required_environment`);
      }
      if (!configuration?.model && !configuration?.model_environment) {
        errors.push(`provider ${provider} must declare model or model_environment`);
      }
    }
  }
  const evaluation = policy.evaluation;
  if (!Number.isInteger(evaluation?.sample_size) || evaluation.sample_size !== 5) {
    errors.push('evaluation sample_size must remain exactly 5');
  }
  if (evaluation?.target_language !== 'zh') errors.push('phase 2D evaluation target must be zh');
  if (!Array.isArray(evaluation?.providers) || evaluation.providers.length !== 3) {
    errors.push('evaluation must declare exactly three providers');
  } else if (new Set(evaluation.providers).size !== evaluation.providers.length) {
    errors.push('evaluation providers must be unique');
  } else {
    for (const provider of evaluation.providers) {
      if (!supportedProviders.has(provider)) errors.push(`unsupported evaluation provider ${provider}`);
      if (!policy.providers?.[provider]) errors.push(`evaluation provider ${provider} has no configuration`);
    }
  }
  if (!policy.modules || typeof policy.modules !== 'object' || Array.isArray(policy.modules)) {
    errors.push('modules must be an object');
  } else {
    for (const [module, fields] of Object.entries(policy.modules)) {
      if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
        errors.push(`module ${module} must declare field routes`);
        continue;
      }
      for (const [field, providers] of Object.entries(fields)) {
        if (!supportedFields.has(field)) errors.push(`module ${module} cannot route field ${field}`);
        if (!Array.isArray(providers) || !providers.length) {
          errors.push(`module ${module} field ${field} must declare providers`);
          continue;
        }
        if (new Set(providers).size !== providers.length) errors.push(`module ${module} field ${field} repeats providers`);
        for (const provider of providers) {
          if (!supportedProviders.has(provider)) errors.push(`module ${module} field ${field} uses ${provider}`);
        }
      }
    }
  }
  return errors;
}

export async function readProviderPolicy(policyPath) {
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  const errors = validateProviderPolicy(policy);
  if (errors.length) throw new Error(`invalid translation provider policy: ${errors.join('; ')}`);
  return policy;
}

export function providerModel(provider, policy, environment = process.env) {
  const configuration = policy.providers[provider];
  if (!configuration) throw new Error(`provider ${provider} is not configured by policy`);
  return configuration.model || environment[configuration.model_environment]?.trim() || 'unconfigured';
}

export function providerAvailability(provider, policy, environment = process.env) {
  const configuration = policy.providers[provider];
  if (!configuration) return { ready: false, missing: ['provider policy'] };
  const missing = configuration.required_environment.filter((name) => !environment[name]?.trim());
  return { ready: missing.length === 0, missing };
}

export function providersForFields({ module, fieldNames, policy }) {
  const routes = policy.modules[module];
  if (!routes) throw new Error(`no provider route for module ${JSON.stringify(module)}`);
  const ordered = policy.evaluation.providers;
  return ordered.filter((provider) => fieldNames.every((field) => routes[field]?.includes(provider)));
}
