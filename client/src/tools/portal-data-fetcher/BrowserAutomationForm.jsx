export const BNI_SEARCH_URL = 'https://www.bniconnectglobal.com/web/dashboard/search'
export const initialBrowserConfig = () => ({
  automation: 'description',
  description: '',
  url: BNI_SEARCH_URL,
  loginUrl: '',
  username: '',
  password: '',
  usernameTarget: 'input[autocomplete="username"], input[name="username"], input[type="email"]',
  passwordTarget: 'input[type="password"]',
  loginTarget: 'button[type="submit"], input[type="submit"]',
  searchTarget: 'button:Search',
  readyTarget: '',
  rowSelector: 'table tbody tr',
  nextTarget: '',
  maxPages: 10,
  steps: [],
  filters: [],
  fields: [{ name: 'Record', selector: ':scope', attribute: '' }],
})
export function validateBrowserForm(config) {
  if (!config.username.trim() || !config.password)
    return 'Enter your BNI Connect username and password.'
  if (config.automation === 'description') {
    return config.description.trim().length < 10 || config.description.trim().length > 4000
      ? 'Describe the search, filters and fields you need in 10 to 4,000 characters.'
      : ''
  }
  if (!config.rowSelector.trim()) return 'Enter the CSS selector for one result row or member card.'
  if (
    !config.fields.length ||
    config.fields.some((field) => !field.name.trim() || !field.selector.trim())
  )
    return 'Add data fields with a name and a CSS selector inside each result row.'
  if (new Set(config.fields.map((field) => field.name.trim())).size !== config.fields.length)
    return 'Use a different name for each data field.'
  if ([...config.steps, ...config.filters].some((step) => !step.target.trim()))
    return 'Enter a page control for every step and filter, or remove unused rows.'
  return ''
}
export default function BrowserAutomationForm({ value, onChange, inputCls }) {
  const update = (key, next) => onChange({ ...value, [key]: next })
  const changeItem = (key, index, patch) =>
    update(
      key,
      value[key].map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  const removeItem = (key, index) =>
    update(
      key,
      value[key].filter((_, i) => i !== index)
    )
  const input = (key, label, placeholder = '', type = 'text') => (
    <label className="block space-y-1 text-sm font-semibold text-slate-700" key={key}>
      <span>{label}</span>
      <input
        type={type}
        value={value[key]}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
        onChange={(event) => update(key, event.target.value)}
        className={inputCls}
      />
    </label>
  )
  const steps = (key, title, description) => (
    <section className="space-y-3">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500">{description}</p>
      {value[key].map((step, index) => (
        <div key={index} className="grid sm:grid-cols-[110px_1fr_1fr_auto] gap-2">
          <select
            aria-label={`${title} ${index + 1} action`}
            value={step.action}
            className={inputCls}
            onChange={(event) => changeItem(key, index, { action: event.target.value })}
          >
            <option value="click">Click</option>
            <option value="fill">Type</option>
            <option value="select">Select</option>
            <option value="check">Check</option>
            <option value="wait">Wait for</option>
          </select>
          <input
            aria-label={`${title} ${index + 1} control`}
            value={step.target}
            placeholder="label:Country or CSS selector"
            onChange={(event) => changeItem(key, index, { target: event.target.value })}
            className={inputCls}
          />
          <input
            aria-label={`${title} ${index + 1} value`}
            value={step.value ?? ''}
            placeholder="Value / dropdown option text"
            disabled={!['fill', 'select'].includes(step.action)}
            onChange={(event) => changeItem(key, index, { value: event.target.value })}
            className={inputCls}
          />
          <button
            type="button"
            aria-label={`Remove ${title} ${index + 1}`}
            onClick={() => removeItem(key, index)}
            className="text-sm text-rose-600 px-2"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={value[key].length >= 30}
        className="text-sm font-semibold text-blue-600"
        onClick={() =>
          update(key, [
            ...value[key],
            { action: key === 'steps' ? 'click' : 'fill', target: '', value: '' },
          ])
        }
      >
        + Add {key === 'steps' ? 'step' : 'filter'}
      </button>
    </section>
  )
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm space-y-2 text-slate-700">
        <h2 className="font-bold text-slate-900">Search BNI Connect</h2>
        <p>
          Describe what you need. The assistant will inspect BNI Connect, apply your filters,
          search, and collect the requested fields for export.
        </p>
        <a
          href={BNI_SEARCH_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-blue-700 font-semibold underline"
        >
          Open BNI Connect search
        </a>
        <p className="text-xs">
          The assistant chooses the steps for you. If BNI asks for OTP or CAPTCHA, use a copied
          request from your logged-in browser.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {input('username', 'BNI Connect username')}
        {input('password', 'BNI Connect password', '', 'password')}
      </div>
      <p className="text-xs text-slate-500">
        Credentials are sent to this tool’s server for this run, used to log in to BNI, and kept out
        of saved results and logs. Each run closes its isolated browser. Use a trusted HTTPS
        deployment.
      </p>
      {value.automation === 'description' && (
        <section className="space-y-4">
          <label className="block space-y-2 text-sm font-semibold text-slate-700">
            <span>What data do you need?</span>
            <textarea
              value={value.description}
              rows={5}
              maxLength={4000}
              onChange={(event) => update('description', event.target.value)}
              className={inputCls}
              placeholder="Find software members in Canada. Include their names, companies, chapters, and websites."
            />
          </label>
          <p className="text-xs text-slate-500">
            Describe your search and filters in your own words. Add column names if you have a
            preference; otherwise the assistant collects useful member details visible in results.
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Example searches">
            {[
              [
                'Software in Canada',
                'Find software members in Canada. Collect their names, companies, chapters, and website links.',
              ],
              [
                'Telecom in South Africa',
                'Find telecom members in South Africa. Collect their names, companies, locations, and website links.',
              ],
            ].map(([label, description]) => (
              <button
                key={label}
                type="button"
                onClick={() => update('description', description)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Try: {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            BNI Connect is already selected. Login, filters, field selection, and pagination are
            automatic, within the run limits. Page text and structure are sent to the configured AI
            provider; your login credentials are excluded.
          </p>
        </section>
      )}
      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">
          Advanced settings (optional)
        </summary>
        <div className="space-y-5 pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {input('url', 'Search page URL')}
            {input(
              'loginUrl',
              'Login page URL (optional)',
              'Use if the search page does not redirect to login'
            )}
            <label className="block space-y-1 text-sm font-semibold text-slate-700">
              <span>Maximum result pages</span>
              <input
                type="number"
                min="1"
                max="50"
                value={value.maxPages}
                className={inputCls}
                onChange={(event) => update('maxPages', event.target.value)}
              />
            </label>
          </div>
          <p className="text-xs text-slate-500">
            One filtered search per run, up to 15 assistant actions and 95 seconds. The default page
            limit is 10. Use Bulk search for multiple combinations.
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Automation mode">
            {[
              ['description', 'Automatic'],
              ['manual', 'Manual configuration'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => update('automation', mode)}
                aria-pressed={value.automation === mode}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border ${value.automation === mode ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-slate-200 text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {value.automation === 'manual' && (
            <>
              {steps(
                'steps',
                'Navigation steps',
                'Run after login and opening the search page, in order. For example: click a member-search tab, then open advanced filters.'
              )}
              {steps(
                'filters',
                'Search and filters',
                'Use Type for keywords, Select for native dropdowns, or Click for custom dropdown options. Controls accept exact labels such as label:Country. All filters apply to one search.'
              )}
              <section className="space-y-3">
                <h3 className="font-bold text-slate-900">Data to collect</h3>
                <p className="text-xs text-slate-500">
                  Fields use CSS selectors inside each result row or card. :scope collects the whole
                  row. Add selectors for name, company, phone, email, or other fields your account
                  can see. Optional attributes extract href or another HTML attribute.
                </p>
                {input('rowSelector', 'Result row / member card CSS selector', 'table tbody tr')}
                {value.fields.map((field, index) => (
                  <div key={index} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
                    {['name', 'selector', 'attribute'].map((key) => (
                      <input
                        key={key}
                        aria-label={`Field ${index + 1} ${key}`}
                        value={field[key] || ''}
                        placeholder={
                          {
                            name: 'Column name',
                            selector: 'CSS selector, e.g. td:nth-child(1)',
                            attribute: 'Attribute (optional)',
                          }[key]
                        }
                        onChange={(event) =>
                          changeItem('fields', index, { [key]: event.target.value })
                        }
                        className={inputCls}
                      />
                    ))}
                    <button
                      type="button"
                      aria-label={`Remove field ${index + 1}`}
                      onClick={() => removeItem('fields', index)}
                      className="text-sm text-rose-600 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={value.fields.length >= 30}
                  className="text-sm font-semibold text-blue-600"
                  onClick={() =>
                    update('fields', [...value.fields, { name: '', selector: '', attribute: '' }])
                  }
                >
                  + Add field
                </button>
              </section>
              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="cursor-pointer text-sm font-bold text-slate-800">
                  Login controls, search button and pagination
                </summary>
                <p className="my-3 text-xs text-slate-500">
                  Controls accept CSS selectors or exact names: label:Username, button:Search,
                  link:Next, text:Advanced Search. Blank Search skips the final click. Next is
                  optional; max pages is capped at 50. Run limit: 95 seconds.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {input('usernameTarget', 'Username control')}
                  {input('passwordTarget', 'Password control')}
                  {input('loginTarget', 'Login button')}
                  {input('searchTarget', 'Search button')}
                  {input(
                    'readyTarget',
                    'Results-ready control (optional)',
                    'Selector visible after results load'
                  )}
                  {input('nextTarget', 'Next page control (optional)', 'button:Next')}
                </div>
              </details>
            </>
          )}
        </div>
      </details>
    </div>
  )
}
