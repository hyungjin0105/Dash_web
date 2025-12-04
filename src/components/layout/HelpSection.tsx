import { useState } from 'react'
import clsx from 'clsx'

interface HelpSectionProps {
  eyebrow: string
  title: string
  description: string
  tips?: string[]
  imageUrls?: string[]
}

export const HelpSection = ({ eyebrow, title, description, tips = [], imageUrls = [] }: HelpSectionProps) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <section className={clsx('help-section', !isOpen && 'help-section--collapsed')}>
      <header>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button type="button" onClick={() => setIsOpen((prev) => !prev)}>
          {isOpen ? '도움말 숨기기' : '도움말 보기'}
        </button>
      </header>
      {isOpen && (
        <>
          {tips.length > 0 && (
            <ul className="pill-list">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
          {imageUrls.length > 0 && (
            <div className="help-section__images">
              {imageUrls.map((url) => (
                <img key={url} src={url} alt="도움말 예시" loading="lazy" />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
