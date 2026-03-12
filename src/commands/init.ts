import { Flags } from '@oclif/core';
import { BaseCommand } from '../base-command.js';
import { promptIfMissing, promptConfirm, slugify } from '../lib/prompts.js';

export default class Init extends BaseCommand {
  static description = 'Full setup wizard: register → verify → login → company → project → API key';

  static examples = [
    '$ memorykit init',
    '$ memorykit init --email user@example.com --password secret --gdpr-consent',
    '$ memorykit init --skip-register --email user@example.com --password secret',
    '$ memorykit init --email u@ex.com --password p --verification-code 123456 --company-name "Acme" --project-name "Main" --gdpr-consent --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    email: Flags.string({ description: 'Account email' }),
    password: Flags.string({ description: 'Account password' }),
    'verification-code': Flags.string({ description: '6-digit verification code' }),
    'company-name': Flags.string({ description: 'Company name' }),
    'company-slug': Flags.string({ description: 'Company URL slug (auto-generated from name)' }),
    'project-name': Flags.string({ description: 'Project name' }),
    'project-slug': Flags.string({ description: 'Project URL slug (auto-generated from name)' }),
    'apikey-name': Flags.string({ description: 'API key name', default: 'CLI Default' }),
    'gdpr-consent': Flags.boolean({ description: 'Accept GDPR data processing consent', default: false }),
    'skip-register': Flags.boolean({ description: 'Skip registration (login to existing account)', default: false }),
    'base-url': Flags.string({ description: 'API base URL override' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Init);
    const totalSteps = flags['skip-register'] ? 5 : 7;
    let step = 0;

    // Optional base URL override
    if (flags['base-url']) {
      this.configManager.set('baseUrl', flags['base-url']);
    }

    const dashboard = this.getDashboardClient();

    // Keep email/password for re-login step
    let userEmail: string;
    let userPassword: string;

    // --- Step 1: Register ---
    if (!flags['skip-register']) {
      step++;
      this.output.step(step, totalSteps, 'Register account');

      userEmail = await promptIfMissing(flags.email, { message: 'Email:' });
      userPassword = await promptIfMissing(flags.password, { message: 'Password:', type: 'password' });

      if (!flags['gdpr-consent']) {
        const consent = await promptConfirm(undefined, 'Accept GDPR data processing consent?');
        if (!consent) {
          this.error('GDPR consent is required to register.');
        }
      }

      const spinner = this.output.spinner('Registering...');
      await dashboard.register(userEmail, userPassword, true);
      spinner.stop();

      this.credentialsManager.update(this.profileName, { email: userEmail });

      // --- Step 2: Verify ---
      step++;
      this.output.step(step, totalSteps, 'Verify email');

      const code = await promptIfMissing(flags['verification-code'], {
        message: 'Verification code (check your email):',
      });

      const verifySpinner = this.output.spinner('Verifying...');
      await dashboard.verify(userEmail, code);
      verifySpinner.stop();

      // --- Step 3: Login ---
      step++;
      this.output.step(step, totalSteps, 'Login');

      const loginSpinner = this.output.spinner('Logging in...');
      const loginResult = await dashboard.login(userEmail, userPassword);
      loginSpinner.stop();

      this.credentialsManager.update(this.profileName, {
        accessToken: loginResult.access_token,
        refreshToken: loginResult.refresh_token,
        email: userEmail,
      });
    } else {
      // Skip register — just login
      step++;
      this.output.step(step, totalSteps, 'Login');

      userEmail = await promptIfMissing(flags.email, { message: 'Email:' });
      userPassword = await promptIfMissing(flags.password, { message: 'Password:', type: 'password' });

      const loginSpinner = this.output.spinner('Logging in...');
      const loginResult = await dashboard.login(userEmail, userPassword);
      loginSpinner.stop();

      this.credentialsManager.update(this.profileName, {
        accessToken: loginResult.access_token,
        refreshToken: loginResult.refresh_token,
        email: userEmail,
      });
    }

    // --- Create Company ---
    step++;
    this.output.step(step, totalSteps, 'Create company');

    const companyName = await promptIfMissing(flags['company-name'], { message: 'Company name:' });
    const companySlug = flags['company-slug'] ?? slugify(companyName);

    const companySpinner = this.output.spinner('Creating company...');
    const company = await dashboard.createCompany(companyName, companySlug);
    companySpinner.stop();

    this.credentialsManager.update(this.profileName, {
      companyId: company.id,
      companyName: company.name,
    });

    // --- Re-login (backend requires it to get company_id in JWT) ---
    step++;
    this.output.step(step, totalSteps, 'Refresh session');

    const reLoginSpinner = this.output.spinner('Refreshing session...');
    const refreshResult = await dashboard.login(userEmail, userPassword);
    reLoginSpinner.stop();

    this.credentialsManager.update(this.profileName, {
      accessToken: refreshResult.access_token,
      refreshToken: refreshResult.refresh_token,
    });

    // --- Create Project ---
    step++;
    this.output.step(step, totalSteps, 'Create project');

    const projectName = await promptIfMissing(flags['project-name'], { message: 'Project name:' });
    const projectSlug = flags['project-slug'] ?? slugify(projectName);

    const projectSpinner = this.output.spinner('Creating project...');
    const project = await dashboard.createProject(company.id, projectName, projectSlug);
    projectSpinner.stop();

    this.credentialsManager.update(this.profileName, {
      projectId: project.id,
      projectName: project.name,
    });

    // --- Create API Key ---
    step++;
    this.output.step(step, totalSteps, 'Create API key');

    const apikeyName = flags['apikey-name'] ?? 'CLI Default';
    const apikeySpinner = this.output.spinner('Creating API key...');
    const apiKey = await dashboard.createApiKey(company.id, project.id, apikeyName, ['read', 'write']);
    apikeySpinner.stop();

    this.credentialsManager.update(this.profileName, { apiKey: apiKey.api_key });

    // --- Done ---
    const summary = {
      email: userEmail,
      company: { id: company.id, name: company.name },
      project: { id: project.id, name: project.name },
      apiKey: apiKey.api_key,
      profile: this.profileName,
    };

    this.output.success(summary, [
      '',
      '  Setup complete!',
      '',
      `  Company:  ${company.name} (${company.id})`,
      `  Project:  ${project.name} (${project.id})`,
      `  API Key:  ${apiKey.api_key}`,
      `  Profile:  ${this.profileName}`,
      '',
      '  Next: memorykit memories create --content "Hello world"',
      '        memorykit memories search --query "What do you know?"',
      '',
    ].join('\n'));
  }
}
