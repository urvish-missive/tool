// Text with every "(Inferred)" turned into a small "Inferred" tag.
export default function Rich({ text }) {
  const parts = String(text ?? '').split(/\s*\(inferred\)/i)
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && (
        <>
          {' '}
          <span className="inf">Inferred</span>
        </>
      )}
    </span>
  ))
}

export function RichList({ items }) {
  return (
    <ul>
      {items.map((x, i) => (
        <li key={i}>
          <Rich text={x} />
        </li>
      ))}
    </ul>
  )
}
