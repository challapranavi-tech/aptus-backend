import { Container } from "@/components/ui";
import type { FAQ as FaqData } from "@/types";

interface FaqProps {
  data: FaqData;
}

export function Faq({ data }: FaqProps) {
  const items = data.items ?? [];

  return (
    <section className="aptus-faq" data-section="faq">
      <Container>
        {data.heading ? (
          <header className="aptus-faq__header">
            <h1 className="aptus-faq__title">{data.heading}</h1>
          </header>
        ) : null}

        <div className="aptus-faq__list">
          {items.map((item, index) => (
            <article key={item.id} className="aptus-faq__item">
              <h2 className="aptus-faq__question">
                <span className="aptus-faq__number">{index + 1}.</span> {item.question}
              </h2>
              <p className="aptus-faq__answer">{item.answer}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
