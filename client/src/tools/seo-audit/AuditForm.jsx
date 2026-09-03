import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { seoAuditSchema } from '../../schemas/seoAudit.schema'
import { normalizeUrl } from '../../utils/normalizeUrl'
import ModelSelector from '../shared/ModelSelector'
import useToolFields from '../../hooks/useToolFields'

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'India',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'Brazil',
  'Other',
]

export default function AuditForm({ onSubmit, isLoading }) {
  const { isFieldEnabled } = useToolFields('seo-audit')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(seoAuditSchema),
    defaultValues: {
      websiteUrl: '',
      targetKeyword: '',
      country: '',
      preferredProvider: 'openrouter',
    },
  })

  const onValid = (data) => {
    onSubmit({
      websiteUrl: normalizeUrl(data.websiteUrl),
      targetKeyword: data.targetKeyword || undefined,
      country: data.country || undefined,
      preferredProvider: data.preferredProvider,
    })
  }

  const fieldError = (name) => errors[name]?.message

  return (
    <form
      onSubmit={handleSubmit(onValid)}
      className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-5"
    >
      {/* Website URL */}
      <div>
        <label htmlFor="website-url" className="block text-sm font-semibold text-gray-900 mb-1">
          Website URL *
        </label>
        <input
          id="website-url"
          type="text"
          {...register('websiteUrl')}
          placeholder="example.com or https://example.com"
          className={`w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${fieldError('websiteUrl') ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300'}`}
        />
        {fieldError('websiteUrl') && (
          <p className="mt-1 text-xs text-red-600">{fieldError('websiteUrl')}</p>
        )}
      </div>

      {/* Target Keyword */}
      {isFieldEnabled('keyword') && (
        <div>
          <label htmlFor="audit-keyword" className="block text-sm font-semibold text-gray-900 mb-1">
            Target Keyword (optional)
          </label>
          <input
            id="audit-keyword"
            type="text"
            {...register('targetKeyword')}
            placeholder="e.g. enterprise SEO services"
            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${fieldError('targetKeyword') ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300'}`}
          />
          {fieldError('targetKeyword') && (
            <p className="mt-1 text-xs text-red-600">{fieldError('targetKeyword')}</p>
          )}
        </div>
      )}

      {/* Country + AI Model */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="audit-country" className="block text-sm font-semibold text-gray-900 mb-1">
            Country / Market (optional)
          </label>
          <select
            id="audit-country"
            {...register('country')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">Select country...</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Controller
          control={control}
          name="preferredProvider"
          render={({ field }) => <ModelSelector value={field.value} onChange={field.onChange} />}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#0C81F3]/25 hover:shadow-[#0C81F3]/40"
      >
        {isLoading ? 'Analyzing...' : 'Analyze My Website'}
      </button>
    </form>
  )
}
